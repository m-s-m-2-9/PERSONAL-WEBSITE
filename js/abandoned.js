/* ═══════════════════════════════════════════════════════════
   abandoned.js — Ruins Easter Egg
   
   ARCHITECTURE (solves the scrolling problem):
   ─────────────────────────────────────────────
   The vine canvas is injected as the FIRST CHILD of the
   currently active .page element with:
     position: absolute; top:0; left:0; z-index:-1
     height = page.scrollHeight  (full scrollable height)
   
   Because .page is position:fixed + overflow-y:auto,
   the absolute canvas scrolls WITH the page content.
   z-index:-1 inside .page's stacking context puts it
   BEHIND all text, buttons, photos — site is 100% usable.
   
   Vine coordinates are in page-scroll space (not viewport),
   so vines anchored to a button stay next to that button
   no matter where the user scrolls.
   
   Crack canvas stays position:fixed (viewport cracks).
═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ─── TIMING ─── */
  const IDLE_MS      = 10 * 1000;  /* 10 min idle → enter ruin */
  const SPAWN_MS     =  5 * 60 * 1000;  /* 5 min to fully spawn all vines */
  const RESTORE_MS   =  5 * 60 * 1000;  /* 5 min gradual ungrow after activity */

  /* ─── VINE GROWTH PARAMS ─── */
  const MAX_VINES     = 10;
  const VINE_GAP_MS   = Math.floor(SPAWN_MS / MAX_VINES); /* ~21s between spawns */
  const STEP_PX       = 2;      /* px grown per tick */
  const TICK_MS       = window.innerWidth < 768 ? 80 : 40;     /* ms between growth ticks (~25fps) */
  const LEAF_EVERY    = 8;      /* steps between leaf attempts */
  const FLOWER_EVERY  = 24;     /* steps between flower attempts */

  /* ─── MOSS ─── */
  const MOSS_DELAY_MS = 45000;  /* start moss 45s into ruin */
  const MAX_MOSS      = 14;
  const MOSS_GAP_MS   = (SPAWN_MS - MOSS_DELAY_MS) / MAX_MOSS;

  /* ─── STATE ─── */
  let ruinMode    = false;
  let restoring   = false;
  let ruinStart   = 0;
  let restoreStart= 0;
  let idleTimer   = null;
  let spawnTimer  = null;
  let mossTimer   = null;
  let growInterval= null;
  let rafId       = null;
   let lastScrollTop = 0;

  const vines      = [];
  const mossSpots  = [];
  const cracks     = [];

  /* ─── CANVAS REFS ─── */
  let vineCanvas = null;
  let vineCtx    = null;
  let crackCanvas= null;
  let crackCtx   = null;
  let currentPage= null;  /* the .page element the vine canvas lives in */

  /* ─── DOM REFS ─── */
  let overlay    = null;
  let restoreBtn = null;

  /* ─── BOOKKEEPING ─── */
  let spawnCount = 0;
  let anchorsPool= [];

  /* ═══════════════════════════════════════════════
     FLOWER PALETTE (theme-aware)
  ═══════════════════════════════════════════════ */
  const PALETTES = {
    dark:   [{ p:'#4d7fff', c:'#cce' }, { p:'#8833ee', c:'#edd' }, { p:'#2299dd', c:'#cef' }],
    light:  [{ p:'#ff9bcc', c:'#fff' }, { p:'#ffbb44', c:'#ffe' }, { p:'#ee6699', c:'#fee' }],
    slate:  [{ p:'#7799bb', c:'#ddf' }, { p:'#99bbcc', c:'#eff' }, { p:'#7788aa', c:'#eef' }],
    forest: [{ p:'#ddcc00', c:'#ffd' }, { p:'#ff8800', c:'#ffe' }, { p:'#eeaa00', c:'#ffd' }],
  };
  function getPalette() {
    const t = document.documentElement.getAttribute('data-theme') || 'dark';
    return PALETTES[t] || PALETTES.dark;
  }

  /* ═══════════════════════════════════════════════
     MATH HELPERS
  ═══════════════════════════════════════════════ */
  const TAU = Math.PI * 2;
  function rng(lo, hi) { return lo + Math.random() * (hi - lo); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function easeOut(t) { const u = 1 - t; return 1 - u * u; }
  function easeIn(t) { return t * t; }
  function easeInOut(t) { return t < 0.5 ? 2*t*t : 1-(Math.pow(-2*t+2,2))/2; }

  /* ═══════════════════════════════════════════════
     ANCHOR DISCOVERY
     Returns positions in PAGE-SCROLL SPACE
     (absolute coordinates within the scrollable page),
     NOT viewport coordinates.
     Vines start FROM element edges, growing outward.
  ═══════════════════════════════════════════════ */
  const SELECTORS = [
    '#nav', '.nav-logo', '.nav-links a',
    '.hero-photo-wrap', '.hero-name .word',
    '.scroll-indicator',
    '.btn', '.btn-accent',
    '.game-card', '.album-card', '.belief-card',
    '.profile-item', '.list-item', '.skill-item',
    '.year-node', '.section-title', '.section-label',
    '.resume-entry', '.resume-section-title',
    '.about-photo-wrap', '.testimonial-card',
    '.footer',
  ];

  function getPageScrollCoords(el, pageEl) {
    /* Get element rect relative to the page's scroll coordinate system */
    const r  = el.getBoundingClientRect();
    const pr = pageEl.getBoundingClientRect();
    return {
      top:    r.top    - pr.top  + pageEl.scrollTop,
      left:   r.left   - pr.left,
      right:  r.right  - pr.left,
      bottom: r.bottom - pr.top  + pageEl.scrollTop,
      width:  r.width,
      height: r.height,
    };
  }

  function discoverAnchors(pageEl) {
    const W = pageEl.clientWidth;
    const H = pageEl.scrollHeight;
    const anchors = [];

    SELECTORS.forEach(sel => {
      try {
        pageEl.querySelectorAll(sel).forEach(el => {
          const r = getPageScrollCoords(el, pageEl);
          if (r.width < 8 || r.height < 8) return;
          if (r.right < 0 || r.bottom < 0) return;
          if (r.left > W + 20 || r.top > H + 20) return;

          /* BOTTOM edge — vine grows downward then curves up */
          anchors.push({
            x: rng(r.left + 8, r.right - 8),
            y: r.bottom,
            side: 'bottom',
          });
          /* LEFT edge */
          if (Math.random() > 0.5) {
            anchors.push({
              x: r.left,
              y: rng(r.top + 4, r.bottom - 4),
              side: 'left',
            });
          }
          /* RIGHT edge */
          if (Math.random() > 0.5) {
            anchors.push({
              x: r.right,
              y: rng(r.top + 4, r.bottom - 4),
              side: 'right',
            });
          }
        });
      } catch(e) {}
    });

    /* Fallback corners */
    if (anchors.length < 3) {
      anchors.push(
        { x: 0, y: 0, side: 'corner' },
        { x: W, y: 0, side: 'corner' },
        { x: 0, y: H * 0.3, side: 'corner' },
        { x: W, y: H * 0.6, side: 'corner' }
      );
    }

    /* Shuffle */
    for (let i = anchors.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [anchors[i], anchors[j]] = [anchors[j], anchors[i]];
    }
    return anchors;
  }

  /* ═══════════════════════════════════════════════
     VINE FACTORY
  ═══════════════════════════════════════════════ */
  function makeVine(anchor, idx) {
    /* Initial angle based on which edge we're growing from */
    let initAngle;
    switch (anchor.side) {
      case 'bottom':
        /* Start going slightly down, then gravity bias pulls upward */
        initAngle = rng(-0.3, 0.3);
        break;
      case 'left':
        initAngle = rng(-0.4, 0.4) + TAU * 0.95; /* leftward */
        break;
      case 'right':
        initAngle = rng(-0.3, 0.3) + TAU * 0.05; /* rightward then curves */
        break;
      default:
        initAngle = rng(0, TAU);
    }

    const palette = getPalette();
    const col = palette[idx % palette.length];

    return {
      pts:          [{ x: anchor.x, y: anchor.y }],
      angle:        initAngle,
      momentum:     0,
      maxSteps:     Math.floor(rng(60, 220)),
      step:         0,
      done:         false,
      /* Appearance */
      alpha:        0,           /* 0→0.88 fade-in over first few seconds */
      thick:        rng(1.1, 2.2),
      col,
      /* Children */
      leaves:       [],
      flowers:      [],
      sinceLeaf:    0,
      sinceFlower:  0,
      leafCount:    0,
      /* Restore state */
      restoring:    false,
      restoreStart: 0,
      startAlpha:   0,           /* alpha when restore began */
    };
  }

  /* One growth step for a vine */
  function stepVine(v) {
    if (v.done || v.restoring) return;
    if (v.step >= v.maxSteps) { v.done = true; return; }

    /* Organic drift with upward gravity bias */
    const drift   = (Math.random() - 0.5) * 0.24;
   const gravity = -0.012 + Math.sin(v.step * 0.05) * 0.01;
    v.momentum    = v.momentum * 0.80 + drift * 0.20;
    v.angle      += v.momentum + gravity;

    /* Clamp: allow mostly upward/sideways growth */
    v.angle = clamp(v.angle, -Math.PI * 1.05, Math.PI * 0.50);

    const last = v.pts[v.pts.length - 1];
    const nx = last.x + Math.cos(v.angle) * STEP_PX;
    const ny = last.y + Math.sin(v.angle) * STEP_PX;

    /* Keep within page bounds (with slack) */
    if (!vineCanvas) return;
    const W = vineCanvas.width, H = vineCanvas.height;
    v.pts.push({ x: clamp(nx, -60, W + 60), y: clamp(ny, -60, H + 60) });
    v.step++;
    v.sinceLeaf++;
   

    /* Leaf attempt */
    if (v.sinceLeaf >= LEAF_EVERY && v.step > 4 && Math.random() > 0.32) {
      addLeaf(v);
    }
    /* Flower attempt */
    if (v.leafCount >= 2 && Math.random() > 0.965) {
  addFlower(v);
}
  }

  function addLeaf(v) {
    const i    = v.pts.length - 1;
    const p    = v.pts[i];
    const prev = v.pts[Math.max(0, i - 4)];
    const stemAng = Math.atan2(p.y - prev.y, p.x - prev.x);
    const side    = v.leafCount % 2 === 0 ? 1 : -1;
    const leafAng = stemAng + (Math.PI / 2) * side + rng(-0.3, 0.3);
    v.leaves.push({
      x: p.x, y: p.y,
      angle: leafAng,
      t: 0,
      growMs: rng(2500, 5500),
      size: rng(7, 15),
      side,
      /* restore */
      restoring: false,
      restoreStart: 0,
      startT: 0,
    });
    v.leafCount++;
  }

  function addFlower(v) {
    const p = v.pts[v.pts.length - 1];
    v.flowers.push({
      x: p.x, y: p.y,
      t: 0,
      growMs: rng(4000, 8500),
      petals: Math.floor(rng(4, 7)),
      radius: rng(4, 8),
      col: v.col,
      rotOff: Math.random() * TAU,
      /* restore */
      restoring: false,
      restoreStart: 0,
      startT: 0,
    });
  }

  /* ═══════════════════════════════════════════════
     DRAW ROUTINES
     All coordinates are page-scroll space
  ═══════════════════════════════════════════════ */

  /* Draw tapered vine stem */
  function drawStem(ctx, v, alpha) {
    if (v.pts.length < 2 || alpha < 0.01) return;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = alpha;

    for (let i = 1; i < v.pts.length; i++) {
      const t  = i / v.maxSteps;
      const w  = Math.max(0.4, v.thick * (1 - t * 0.62));
      /* Colour darkens slightly toward tip */
      const r0 = Math.floor(lerp(14, 20, t));
      const g0 = Math.floor(lerp(34, 58, t));
      const b0 = Math.floor(lerp(8,  18, t));
      ctx.beginPath();
      ctx.moveTo(v.pts[i - 1].x, v.pts[i - 1].y);
      ctx.lineTo(v.pts[i].x, v.pts[i].y);
      ctx.strokeStyle = `rgb(${r0},${g0},${b0})`;
      ctx.lineWidth   = w;
      ctx.stroke();
    }
    ctx.restore();
  }

  /* Draw leaf as bezier teardrop */
  function drawLeaf(ctx, lf, alpha) {
    const progress = clamp(lf.t / lf.growMs, 0, 1);
    if (progress < 0.02 || alpha < 0.01) return;

    const s    = lf.size * easeOut(progress);
    const a    = lf.angle;
    const nx   = Math.cos(a), ny = Math.sin(a);
    const tx   = lf.x + nx * s, ty = lf.y + ny * s;
    const px2  = -ny, py2 = nx;
    const w    = s * 0.44;
    const mx   = lf.x + nx * s * 0.52;
    const my   = lf.y + ny * s * 0.52;
    const l1x  = mx + px2 * w, l1y = my + py2 * w;
    const r1x  = mx - px2 * w, r1y = my - py2 * w;

    ctx.save();
    ctx.globalAlpha = alpha * Math.min(1, lf.t / 700);

    /* Leaf fill gradient */
    const grad = ctx.createLinearGradient(lf.x, lf.y, tx, ty);
    grad.addColorStop(0,    '#1b4409');
    grad.addColorStop(0.4,  '#286514');
    grad.addColorStop(1,    '#35801d');
    ctx.fillStyle   = grad;
    ctx.strokeStyle = '#122e06';
    ctx.lineWidth   = 0.4;

    ctx.beginPath();
    ctx.moveTo(lf.x, lf.y);
    ctx.bezierCurveTo(l1x, l1y, tx, ty, tx, ty);
    ctx.bezierCurveTo(tx, ty, r1x, r1y, lf.x, lf.y);
    ctx.fill();
    ctx.stroke();

    /* Midrib */
    if (progress > 0.18) {
      const ve = Math.min(1, (progress - 0.18) * 1.5);
      ctx.beginPath();
      ctx.moveTo(lf.x, lf.y);
      ctx.lineTo(lf.x + nx * s * ve, lf.y + ny * s * ve);
      ctx.strokeStyle = 'rgba(10, 42, 4, 0.42)';
      ctx.lineWidth   = 0.3;
      ctx.stroke();
    }

    /* Side veins */
    if (progress > 0.5) {
      const vf = (progress - 0.5) * 2;
      for (let vi = 0; vi < 3; vi++) {
        const vt   = (vi + 1) / 4;
        const vx0  = lf.x + nx * s * vt;
        const vy0  = lf.y + ny * s * vt;
        const vLen = w * 0.55 * (1 - vt) * vf;
        ctx.beginPath();
        ctx.moveTo(vx0, vy0);
        ctx.lineTo(vx0 + px2 * lf.side * vLen, vy0 + py2 * lf.side * vLen);
        ctx.strokeStyle = 'rgba(10, 42, 4, 0.22)';
        ctx.lineWidth   = 0.25;
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  /* Draw tiny realistic flower — petals bloom one by one */
  function drawFlower(ctx, fl, alpha) {
    const prog = clamp(fl.t / fl.growMs, 0, 1);
    if (prog < 0.04 || alpha < 0.01) return;

    const r   = fl.radius * easeOut(prog);
    const n   = fl.petals;
    const col = fl.col;

    ctx.save();
    ctx.globalAlpha = alpha * Math.min(1, fl.t / 1100);

    /* Open petals sequentially */
    const openCount = Math.min(n, Math.ceil(n * easeInOut(prog) * 1.3));
    for (let i = 0; i < openCount; i++) {
      const pp  = clamp((prog * n * 1.2 - i) / 1, 0, 1);
      if (pp < 0.02) continue;

      const ang = (i / n) * TAU + fl.rotOff;
      const pr  = r * easeOut(pp);
      const px2 = fl.x + Math.cos(ang) * pr;
      const py2 = fl.y + Math.sin(ang) * pr;

      ctx.save();
      ctx.translate(px2, py2);
      ctx.rotate(ang + Math.PI / 2);
      ctx.scale(1, 0.52);

      const petalR = pr * 0.56 * easeOut(pp);
      /* Radial gradient for petal depth */
      const pg = ctx.createRadialGradient(0, -petalR * 0.28, 0, 0, 0, petalR);
      pg.addColorStop(0,   col.p + 'ff');
      pg.addColorStop(0.6, col.p + 'cc');
      pg.addColorStop(1,   col.p + '55');
      ctx.fillStyle   = pg;
      ctx.globalAlpha = ctx.globalAlpha; /* inherit */
      ctx.beginPath();
      ctx.arc(0, 0, petalR, 0, TAU);
      ctx.fill();

      /* Petal edge */
      ctx.strokeStyle = 'rgba(0,0,0,0.08)';
      ctx.lineWidth   = 0.3;
      ctx.stroke();

      /* Highlight vein */
      ctx.beginPath();
      ctx.moveTo(0, -petalR * 0.8);
      ctx.lineTo(0,  petalR * 0.8);
      ctx.strokeStyle = 'rgba(255,255,255,0.16)';
      ctx.lineWidth   = 0.22;
      ctx.stroke();

      ctx.restore();
    }

    /* Centre disc */
    if (prog > 0.4) {
      const cp     = easeOut(clamp((prog - 0.4) / 0.6, 0, 1));
      const centR  = r * 0.30 * cp;
      ctx.beginPath();
      ctx.arc(fl.x, fl.y, centR, 0, TAU);
      ctx.fillStyle   = col.c;
      ctx.globalAlpha = alpha * cp;
      ctx.fill();

      /* Stamen dots */
      if (cp > 0.6) {
        const sn = Math.floor(n * 0.9);
        for (let si = 0; si < sn; si++) {
          const sa = (si / sn) * TAU;
          const sd = centR * 0.6;
          ctx.beginPath();
          ctx.arc(fl.x + Math.cos(sa)*sd, fl.y + Math.sin(sa)*sd, 0.65, 0, TAU);
          ctx.fillStyle   = '#ffe988';
          ctx.globalAlpha = alpha * cp * 0.88;
          ctx.fill();
        }
      }
    }

    ctx.restore();
  }

  /* Draw a moss patch: organic blob of green-brown */
  function drawMoss(ctx, ms, alpha) {
    const progress = clamp(ms.t / ms.growMs, 0, 1);
    if (progress < 0.02 || alpha < 0.01) return;

    const r = ms.radius * easeOut(progress);
    ctx.save();
    ctx.globalAlpha = alpha * 0.5 * Math.min(1, ms.t / 2000);

    /* Layered blobs to look like organic moss */
    for (let layer = 0; layer < 3; layer++) {
      const lScale = (1 - layer * 0.15);
      const lx = ms.x + Math.cos(layer * 2.1) * r * 0.18;
      const ly = ms.y + Math.sin(layer * 2.1) * r * 0.12;
      const lr = r * lScale;

      const mg = ctx.createRadialGradient(lx, ly, 0, lx, ly, lr);
      const g1 = Math.floor(lerp(38, 65, layer / 2));
      const g2 = Math.floor(lerp(22, 40, layer / 2));
      mg.addColorStop(0,    `rgba(18,${g1},10,0.55)`);
      mg.addColorStop(0.55, `rgba(14,${g2}, 8,0.38)`);
      mg.addColorStop(1,    `rgba( 8, 20, 4,0.00)`);

      /* Irregular blob via ellipses at random angles */
      for (let k = 0; k < 5; k++) {
        const ka  = ms.angleOffsets[k] + layer * 0.8;
        const kd  = lr * (0.35 + ms.distOffsets[k] * 0.35);
        const krx = lr * (0.35 + ms.scaleOffsets[k * 2]   * 0.30);
        const kry = lr * (0.22 + ms.scaleOffsets[k * 2 + 1]* 0.22);
        ctx.save();
        ctx.translate(lx + Math.cos(ka)*kd, ly + Math.sin(ka)*kd);
        ctx.rotate(ka);
        ctx.scale(1, kry / krx);
        ctx.beginPath();
        ctx.arc(0, 0, krx, 0, TAU);
        ctx.fillStyle = mg;
        ctx.fill();
        ctx.restore();
      }
    }

    /* Tiny moss texture dots */
    if (progress > 0.55) {
      const dotCount = Math.floor(r * 2.2);
      ctx.globalAlpha = alpha * 0.28 * Math.min(1, (progress - 0.55) * 2.5);
      for (let d = 0; d < dotCount; d++) {
        const da = ms.dotAngles[d % ms.dotAngles.length];
        const dd = ms.dotDists[d % ms.dotDists.length] * r * 0.88;
        ctx.beginPath();
        ctx.arc(ms.x + Math.cos(da)*dd, ms.y + Math.sin(da)*dd, 0.7, 0, TAU);
        ctx.fillStyle = '#1a3d0a';
        ctx.fill();
      }
    }

    ctx.restore();
  }

  /* ═══════════════════════════════════════════════
     CRACK SYSTEM (fixed canvas, viewport coords)
  ═══════════════════════════════════════════════ */
  function buildCracks() {
    cracks.length = 0;
    const W = window.innerWidth;
    const H = window.innerHeight;

    /* Each corner: 2–3 primary fractures */
    const corners = [
      { x: 0, y: 0,   bx:  1,   by:  1  },
      { x: W, y: 0,   bx: -1,   by:  1  },
      { x: 0, y: H,   bx:  1,   by: -1  },
      { x: W, y: H,   bx: -1,   by: -1  },
    ];

    corners.forEach((c, ci) => {
      const count = 2 + Math.floor(Math.random() * 2);
      for (let m = 0; m < count; m++) {
        const fanSpread  = rng(-0.5, 0.5);
        const baseAngle  = Math.atan2(c.by, c.bx) + fanSpread;
        walkCrack(c.x, c.y, baseAngle, 0, W, H);
      }
    });
  }

  function walkCrack(sx, sy, angle, depth, W, H) {
    if (depth > 2) return;
    const len  = rng(45, 150) * (1 - depth * 0.3);
    const segs = Math.floor(rng(10, 20));
    const pts  = [{ x: sx, y: sy }];
    let cx = sx, cy = sy, a = angle;

    for (let s = 0; s < segs; s++) {
      /* Mostly straight with small drift; occasional sharp kink */
      a += (Math.random() - 0.5) * 0.28;
      if (Math.random() > 0.80) a += (Math.random() > 0.5 ? 1 : -1) * rng(0.3, 0.7);

      const d = (len / segs) * rng(0.6, 1.4);
      cx = clamp(cx + Math.cos(a) * d, -30, W + 30);
      cy = clamp(cy + Math.sin(a) * d, -30, H + 30);
      pts.push({ x: cx, y: cy });

      /* Branch */
      if (depth < 1 && Math.random() > 0.78) {
        const ba = a + (Math.random() > 0.5 ? 1 : -1) * rng(0.45, 1.05);
        walkCrack(cx, cy, ba, depth + 1, W, H);
      }
    }

    cracks.push({
      pts,
      baseOp: rng(0.16, 0.40) * (1 - depth * 0.10),
      width:  rng(0.35, 0.80) * (1 - depth * 0.18),
      /* crack grows in as progress 0→1 over time */
      progress: 0,
    });
  }

  function renderCracks(elapsed, restoreElapsed) {
    if (!crackCtx) return;
    const W = crackCanvas.width, H = crackCanvas.height;
    crackCtx.clearRect(0, 0, W, H);

    /* Cracks start growing at 50s into ruin mode */
    const crackStartDelay = 50000;
    const crackWindow     = SPAWN_MS * 0.65;

    cracks.forEach(cr => {
      let targetProg, alpha;

      if (ruinMode) {
        const crackElapsed = Math.max(0, elapsed - crackStartDelay);
        targetProg = clamp(crackElapsed / crackWindow, 0, 1);
        alpha      = clamp(crackElapsed / 8000, 0, 1);
      } else {
        /* restoring — fade out */
        targetProg = 1;
        alpha      = clamp(1 - restoreElapsed / RESTORE_MS, 0, 1);
      }

      /* Lerp crack progress for smooth growth */
      cr.progress = lerp(cr.progress, targetProg, 0.012);

      const drawCount = Math.max(2, Math.floor((cr.pts.length - 1) * cr.progress) + 1);
      if (drawCount < 2 || alpha < 0.01) return;

      crackCtx.save();
      crackCtx.lineCap    = 'round';
      crackCtx.lineJoin   = 'round';
      crackCtx.globalAlpha= alpha * cr.baseOp;

      crackCtx.beginPath();
      crackCtx.moveTo(cr.pts[0].x, cr.pts[0].y);
      const jitter = 0.6;

for (let i = 1; i < drawCount; i++) {
  crackCtx.lineTo(
    cr.pts[i].x + (Math.random() - 0.5) * jitter,
    cr.pts[i].y + (Math.random() - 0.5) * jitter
  );
}
      /* Main fracture line — blue-grey stone colour */
      crackCtx.strokeStyle = 'rgba(158,175,195,0.92)';
      crackCtx.lineWidth   = cr.width;
      crackCtx.stroke();

      /* Bright highlight (one edge of crack) */
      crackCtx.globalAlpha = alpha * cr.baseOp * 0.32;
      crackCtx.strokeStyle = 'rgba(230,242,252,0.9)';
      crackCtx.lineWidth   = cr.width * 0.32;
      crackCtx.stroke();

      /* Shadow (opposite edge — gives 3-D depth) */
      crackCtx.globalAlpha = alpha * cr.baseOp * 0.38;
      crackCtx.strokeStyle = 'rgba(30,40,52,0.8)';
      crackCtx.lineWidth   = cr.width * 0.38;
      crackCtx.stroke();

      crackCtx.restore();
    });
  }

  /* ═══════════════════════════════════════════════
     MAIN RAF RENDER LOOP
  ═══════════════════════════════════════════════ */
  let lastTs = 0;

  function renderLoop(ts) {
    rafId = requestAnimationFrame(renderLoop);
    const dt = Math.min(ts - lastTs, 80);
    lastTs   = ts;

    const elapsed        = ruinMode  ? (Date.now() - ruinStart)   : 0;
    const restoreElapsed = restoring ? (Date.now() - restoreStart) : 0;

    /* ── Vine canvas ── */
    if (vineCtx && vineCanvas) {
      vineCtx.clearRect(0, 0, vineCanvas.width, vineCanvas.height);

     vines.forEach(v => {

  vines.forEach(v => {
  if (!currentPage) return;

  const viewTop = currentPage.scrollTop;
  const viewBottom = viewTop + currentPage.clientHeight;

  const firstPoint = v.pts[0];
  if (!firstPoint) return;

  // Skip off-screen vines
  if (firstPoint.y < viewTop - 200 || firstPoint.y > viewBottom + 200) return;
        drawStem(vineCtx, v, v.alpha);

        /* Update and draw leaves */
        v.leaves.forEach(lf => {
          if (lf.restoring) {
            const le2 = Date.now() - lf.restoreStart;
            lf.t = lf.startT * (1 - easeIn(clamp(le2 / (RESTORE_MS * 0.8), 0, 1)));
          } else if (lf.t < lf.growMs) {
            lf.t += dt;
          }
          drawLeaf(vineCtx, lf, v.alpha);
        });

        /* Update and draw flowers */
        v.flowers.forEach(fl => {
          if (fl.restoring) {
            const fe2 = Date.now() - fl.restoreStart;
            fl.t = fl.startT * (1 - easeIn(clamp(fe2 / (RESTORE_MS * 0.7), 0, 1)));
          } else if (fl.t < fl.growMs) {
            fl.t += dt;
          }
          drawFlower(vineCtx, fl, v.alpha);
        });
      });

      /* Update and draw moss */
      mossSpots.forEach(ms => {
        if (ms.restoring) {
          const me2 = Date.now() - ms.restoreStart;
          ms.t = ms.startT * (1 - easeIn(clamp(me2 / (RESTORE_MS * 0.9), 0, 1)));
        } else if (ms.t < ms.growMs) {
          ms.t += dt;
        }
        /* Moss alpha follows ruin/restore */
        let mAlpha;
        if (!restoring) {
          mAlpha = clamp(elapsed / 30000, 0, 0.92);
        } else {
          mAlpha = clamp(1 - restoreElapsed / RESTORE_MS, 0, 0.92) * 0.92;
        }
        drawMoss(vineCtx, ms, mAlpha);
      });

      /* Remove fully faded vines */
      for (let i = vines.length - 1; i >= 0; i--) {
        if (vines[i].restoring && vines[i].alpha < 0.005) {
          vines.splice(i, 1);
        }
      }
    }

    /* ── Crack canvas ── */
    if (crackCtx && (ruinMode || restoring)) {
      renderCracks(elapsed, restoreElapsed);
    } else if (crackCtx && !ruinMode && !restoring && cracks.length > 0) {
      crackCtx.clearRect(0, 0, crackCanvas.width, crackCanvas.height);
    }

    /* Check if fully restored */
    if (restoring && vines.length === 0 && (!crackCtx)) {
      restoring = false;
      hideRestoreButton();
    }
    if (restoring && vines.length === 0) {
      const allDone = !cracks.some(c => c.progress > 0.02);
      if (allDone || Date.now() - restoreStart > RESTORE_MS + 2000) {
        restoring = false;
        hideRestoreButton();
        if (crackCtx) crackCtx.clearRect(0, 0, crackCanvas.width, crackCanvas.height);
      }
    }
  }

  /* ═══════════════════════════════════════════════
     CANVAS MANAGEMENT
  ═══════════════════════════════════════════════ */
  function ensureVineCanvas() {
    /* Find active page */
    const pg = document.querySelector('.page.active');
    if (!pg) return;

    /* If we already have a canvas in this exact page, just update height */
    if (vineCanvas && currentPage === pg) {
      /* Update height in case page content changed */
      const newH = pg.scrollHeight;
      if (vineCanvas.height !== newH) {
        vineCanvas.height = newH;
      }
      return;
    }

    /* Remove old canvas if it's in a different page */
    if (vineCanvas && vineCanvas.parentNode) {
      vineCanvas.parentNode.removeChild(vineCanvas);
    }

    /* Create new canvas inside this page */
    vineCanvas = document.createElement('canvas');
    vineCanvas.className = 'ruins-vine-canvas';
    /* Explicit inline styles override everything */
    vineCanvas.style.cssText = `
      position: relative;
      top: 0;
      left: 0;
      width: 100%;
     z-index: -1;
pointer-events: none;

    vineCanvas.width  = pg.clientWidth  || window.innerWidth;
    vineCanvas.height = pg.scrollHeight || window.innerHeight;
    vineCtx = vineCanvas.getContext('2d');

    /* Insert as FIRST child so it's behind all other children */
    pg.insertBefore(vineCanvas, pg.firstChild);
    currentPage = pg;
  }

  function ensureCrackCanvas() {
    if (crackCanvas && crackCanvas.parentNode) return;
    crackCanvas = document.createElement('canvas');
    crackCanvas.className = 'ruins-crack-canvas';
    crackCanvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 11;
    `;
    crackCanvas.width  = window.innerWidth;
    crackCanvas.height = window.innerHeight;
    crackCtx = crackCanvas.getContext('2d');
    document.body.appendChild(crackCanvas);
  }

  /* ═══════════════════════════════════════════════
     MOSS FACTORY
  ═══════════════════════════════════════════════ */
  function makeMossSpot(pageEl) {
  const anchors = discoverAnchors(pageEl);
  const a = anchors[Math.floor(Math.random() * anchors.length)];

  const angleOffsets = Array.from({ length: 5 }, () => Math.random() * TAU);
  const distOffsets  = Array.from({ length: 5 }, () => Math.random());
  const scaleOffsets = Array.from({ length: 10 }, () => Math.random());
  const dotCount     = 60;
  const dotAngles    = Array.from({ length: dotCount }, () => Math.random() * TAU);
  const dotDists     = Array.from({ length: dotCount }, () => Math.random());

  return {
    x: a.x + (Math.random() - 0.5) * 40,
    y: a.y + (Math.random() - 0.5) * 40,
    radius: rng(14, 42),
    t: 0,
    growMs: rng(20000, 60000),
    angleOffsets, distOffsets, scaleOffsets,
    dotAngles, dotDists,
    restoring: false,
    restoreStart: 0,
    startT: 0,
  };
}

const a = anchors[Math.floor(Math.random() * anchors.length)];

/* slight offset so it's not perfectly on element */
const x = a.x + rng(-12, 12);
const y = a.y + rng(-12, 12);

    /* Pre-compute random offsets so drawing is deterministic each frame */
    const angleOffsets = Array.from({ length: 5 }, () => Math.random() * TAU);
    const distOffsets  = Array.from({ length: 5 }, () => Math.random());
    const scaleOffsets = Array.from({ length: 10 }, () => Math.random());
    const dotCount     = 60;
    const dotAngles    = Array.from({ length: dotCount }, () => Math.random() * TAU);
    const dotDists     = Array.from({ length: dotCount }, () => Math.random());

    return {
      x: x,
y: y,
      radius: rng(10, 30) * (Math.random() > 0.7 ? 1.8 : 1),
      t: 0,
      growMs: rng(20000, 60000),
      angleOffsets, distOffsets, scaleOffsets,
      dotAngles, dotDists,
      restoring: false,
      restoreStart: 0,
      startT: 0,
    };
  }

  /* ═══════════════════════════════════════════════
     OVERLAY + RESTORE BUTTON
  ═══════════════════════════════════════════════ */
  function showOverlay() {
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.className = 'ruins-overlay';
    document.body.appendChild(overlay);
    requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('visible')));
  }

  function hideOverlay() {
    if (!overlay) return;
    const el = overlay; overlay = null;
    el.classList.remove('visible');
    setTimeout(() => { if (el.parentNode) el.remove(); }, 18000);
  }

  /* Restore button appears after 28s, stays until fully clean */
  let btnPollId = null;

  function showRestoreButton() {
    setTimeout(() => {
      if (!ruinMode || restoreBtn) return;
      restoreBtn = document.createElement('button');
      restoreBtn.className = 'ruins-restore-btn';
      restoreBtn.innerHTML =
        '<span class="ruins-restore-line"></span>' +
        '<span class="ruins-restore-text">Restore</span>' +
        '<span class="ruins-restore-line"></span>';
      restoreBtn.addEventListener('click', restoreInstant);
      document.body.appendChild(restoreBtn);
      requestAnimationFrame(() => requestAnimationFrame(() => restoreBtn.classList.add('visible')));
    }, 28000);
  }

  function hideRestoreButton() {
    clearInterval(btnPollId);
    if (!restoreBtn) return;
    const btn = restoreBtn; restoreBtn = null;
    btn.classList.remove('visible');
    btn.classList.add('hiding');
    setTimeout(() => { if (btn.parentNode) btn.remove(); }, 900);
  }

  /* Poll: hide button only after ALL vines are fully gone */
  function pollForFullCleanup() {
    clearInterval(btnPollId);
    btnPollId = setInterval(() => {
      const allGone = vines.length === 0 && !ruinMode;
      const cracksGone = cracks.every(c => c.progress < 0.02) ||
                         Date.now() - restoreStart > RESTORE_MS + 3000;
      if (allGone && cracksGone && !ruinMode) {
        clearInterval(btnPollId);
        hideRestoreButton();
        restoring = false;
        if (crackCtx) crackCtx.clearRect(0, 0, crackCanvas.width, crackCanvas.height);
      }
    }, 2500);
  }

  /* ═══════════════════════════════════════════════
     ENTER / EXIT RUIN MODE
  ═══════════════════════════════════════════════ */
  function enterRuinMode() {
    if (ruinMode) return;
    ruinMode   = true;
    restoring  = false;
    ruinStart  = Date.now();
    spawnCount = 0;

    /* Setup canvases */
    ensureVineCanvas();
    ensureCrackCanvas();

    if (!vineCanvas || !currentPage) return;

    /* Discover anchors in page-scroll coordinates */
    anchorsPool = discoverAnchors(currentPage);

    /* Build crack geometry */
    buildCracks();

    showOverlay();
    showRestoreButton();

    /* Spawn first vine immediately */
    spawnVine();
    spawnTimer = setInterval(spawnVine, VINE_GAP_MS);

    /* Start moss after delay */
    mossTimer = setInterval(() => {
      if (!ruinMode || mossSpots.length >= MAX_MOSS) { clearInterval(mossTimer); return; }
      if (vineCanvas && currentPage) mossSpots.push(makeMossSpot(currentPage));
    }, MOSS_GAP_MS);
    setTimeout(() => {
      clearInterval(mossTimer);
      if (!ruinMode) return;
      mossTimer = setInterval(() => {
        if (!ruinMode || mossSpots.length >= MAX_MOSS) { clearInterval(mossTimer); return; }
        if (vineCanvas && currentPage) mossSpots.push(makeMossSpot(currentPage));
      }, MOSS_GAP_MS);
    }, MOSS_DELAY_MS);

    /* Start growth tick */
    clearInterval(growInterval);
    growInterval = setInterval(() => {
      if (!ruinMode) { clearInterval(growInterval); return; }
      vines.forEach(v => stepVine(v));
    }, TICK_MS);
  }

  function spawnVine() {
    if (!ruinMode || spawnCount >= MAX_VINES || !vineCanvas || !currentPage) {
      clearInterval(spawnTimer); return;
    }
    if (anchorsPool.length === 0) anchorsPool = discoverAnchors(currentPage);
    const anchor = anchorsPool[spawnCount % anchorsPool.length];
    vines.push(makeVine(anchor, spawnCount));
    spawnCount++;
  }

  /* Gradual restore — triggered by any user activity */
  function beginRestore() {
    if (!ruinMode) return;
    ruinMode      = false;
    restoring     = true;
    restoreStart  = now + Math.random() * 800;

    clearInterval(spawnTimer);
    clearInterval(growInterval);
    clearInterval(mossTimer);

    const now = Date.now();

    /* Mark all vines as restoring */
    vines.forEach(v => {
      v.restoring   = true;
v.restoreStart= now + Math.random() * 800; // stagger
v.startAlpha  = v.alpha * (0.8 + Math.random() * 0.2);
      v.leaves.forEach(lf => { lf.restoring = true; lf.restoreStart = now; lf.startT = lf.t; });
      v.flowers.forEach(fl => { fl.restoring = true; fl.restoreStart = now; fl.startT = fl.t; });
    });

    mossSpots.forEach(ms => { ms.restoring = true; ms.restoreStart = now; ms.startT = ms.t; });

    hideOverlay();
    pollForFullCleanup();  /* button stays until everything is gone */
  }

  /* Instant restore — restore button click */
  function restoreInstant() {
    ruinMode  = false;
    restoring = false;

    clearInterval(spawnTimer);
    clearInterval(growInterval);
    clearInterval(mossTimer);
    clearInterval(btnPollId);

    vines.length = 0;
    mossSpots.length = 0;
    cracks.forEach(c => { c.progress = 0; });

    if (vineCtx && vineCanvas) vineCtx.clearRect(0, 0, vineCanvas.width, vineCanvas.height);
    if (crackCtx && crackCanvas) crackCtx.clearRect(0, 0, crackCanvas.width, crackCanvas.height);

    hideOverlay();
    hideRestoreButton();
    resetIdle();
  }

  /* ═══════════════════════════════════════════════
     IDLE DETECTION
  ═══════════════════════════════════════════════ */
  function resetIdle() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(enterRuinMode, IDLE_MS);
  }

  function onActivity() {
    if (ruinMode) beginRestore();
    if (!restoring) resetIdle();
 document.addEventListener('scroll', () => {
  if (!currentPage) return;

  const delta = currentPage.scrollTop - lastScrollTop;
  lastScrollTop = currentPage.scrollTop;

  vines.forEach(v => {
    v.angle += delta * 0.0008;
  });
}, { passive: true });
}

document.addEventListener('scroll', () => {
  if (!currentPage) return;

  const delta = currentPage.scrollTop - lastScrollTop;
  lastScrollTop = currentPage.scrollTop;

  vines.forEach(v => {
    v.angle += delta * 0.0008;
  });
}, { passive: true });
  const EVTS = ['mousemove','mousedown','keydown','touchstart','touchmove','scroll','wheel','click'];
  EVTS.forEach(ev => document.addEventListener(ev, onActivity, { passive: true }));

  /* ═══════════════════════════════════════════════
     PAGE CHANGE HANDLING
     When user navigates, move canvas to new active page
  ═══════════════════════════════════════════════ */
  const pageObserver = new MutationObserver(() => {
    const pg = document.querySelector('.page.active');
    if (pg && pg !== currentPage && ruinMode) {
      /* Page changed while ruin mode active — update canvas */
      if (vineCanvas && vineCanvas.parentNode) {
        vineCanvas.parentNode.removeChild(vineCanvas);
      }
      vineCanvas = null; vineCtx = null; currentPage = null;
      ensureVineCanvas();
      if (vineCanvas && currentPage) {
        anchorsPool = discoverAnchors(currentPage);
        mossSpots.forEach(ms => {
          const newPos = makeMossSpot(currentPage);
          ms.x = newPos.x; ms.y = newPos.y;
        });
      }
    }
  });
  pageObserver.observe(document.body, { subtree: true, attributeFilter: ['class'] });

  /* ═══════════════════════════════════════════════
     INIT
  ═══════════════════════════════════════════════ */
  ensureCrackCanvas();  /* pre-create crack canvas */
  rafId = requestAnimationFrame(renderLoop);
  resetIdle();

  /* Handle resize */
  window.addEventListener('resize', () => {
    if (crackCanvas) {
      crackCanvas.width  = window.innerWidth;
      crackCanvas.height = window.innerHeight;
    }
    if (vineCanvas && currentPage) {
      vineCanvas.width  = currentPage.clientWidth;
      vineCanvas.height = currentPage.scrollHeight;
    }
    if (ruinMode) buildCracks();
  });

})();
