/* ═══════════════════════════════════════════════════════════
   abandoned.js — Ruins Easter Egg
   
   HOW IT WORKS:
   - Two <canvas> layers sit fixed, pointer-events:none
     so the entire site remains fully usable
   - Vine canvas: drawn with Canvas 2D API, vines grow
     organically from DOM element EDGES (not centres)
   - Crack canvas: stone hairline fractures from corners
   - Everything is drawn with code — zero external images
   
   TIMING:
   - 10 min idle → enter ruin mode
   - 5 min to fully spawn vines + cracks
   - On any activity → gradual 5-min restore
   - Restore button → instant cleanup
═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ─── TIMING (ms) ─── */
  const IDLE_MS    = 10 * 1000;   /* 10 min */
  const SPAWN_MS   =  5 * 60 * 1000;   /* 5 min to fully spawn */
  const RESTORE_MS =  5 * 60 * 1000;   /* 5 min gradual restore */

  /* ─── VINE PARAMS ─── */
  const MAX_VINES       = 16;
  const VINE_SPAWN_GAP  = Math.floor(SPAWN_MS / MAX_VINES);  /* ~18.75 s */
  const STEP_PX         = 2.5;   /* px per growth step */
  const TICK_MS         = 32;    /* growth tick interval (~30fps) */
  const LEAF_THRESHOLD  = 7;     /* steps between leaf attempts */
  const FLOWER_THRESHOLD= 22;    /* steps between flower attempts */

  /* ─── STATE ─── */
  let ruinMode   = false;
  let restoring  = false;
  let ruinStart  = 0;
  let idleTimer  = null;
  let spawnTimer = null;
  let growTick   = null;
  let rafId      = null;
  let dirty      = false;   /* flag: redraw needed */

  const vines  = [];
  const cracks = [];

  /* ─── CANVASES ─── */
  let vC = null, vX = null;   /* vine canvas / context */
  let cC = null, cX = null;   /* crack canvas / context */

  /* ─── DOM ─── */
  let overlay    = null;
  let restoreBtn = null;

  /* ─── FLOWER THEME PALETTES ─── */
  const PALETTE = {
    dark:   [
      { p: '#5577ff', c: '#cce' },
      { p: '#8833ee', c: '#eec' },
      { p: '#2299ff', c: '#cef' },
    ],
    light:  [
      { p: '#ffaacc', c: '#ffe' },
      { p: '#ffbb44', c: '#fff' },
      { p: '#ee6699', c: '#fee' },
    ],
    slate:  [
      { p: '#7799bb', c: '#ddf' },
      { p: '#99bbcc', c: '#eff' },
      { p: '#88aacc', c: '#eef' },
    ],
    forest: [
      { p: '#ddcc00', c: '#ffd' },
      { p: '#ff8800', c: '#ffe' },
      { p: '#eeaa00', c: '#ffe' },
    ],
  };
  function palette() {
    const t = document.documentElement.getAttribute('data-theme') || 'dark';
    return PALETTE[t] || PALETTE.dark;
  }

  /* ─── MATHS ─── */
  const TAU = Math.PI * 2;
  function rng(lo, hi) { return lo + Math.random() * (hi - lo); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 2); }
  function easeInOut(t) { return t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t+2,2)/2; }

  /* ════════════════════════════════════════════════
     ANCHOR DISCOVERY
     Finds edge points of visible DOM elements.
     Vines start FROM these edges, growing outward
     (away from element, not into it).
  ════════════════════════════════════════════════ */
  const SELECTORS = [
    /* Nav items — vines grow downward from nav bar */
    '#nav',
    '.nav-links a',
    /* Hero */
    '.hero-photo-wrap',
    '.hero-name .word',
    '.scroll-indicator',
    /* Buttons throughout site */
    '.btn',
    '.btn-accent',
    '.game-play-btn',
    '.game-modal-close',
    /* Cards and list items */
    '.game-card',
    '.album-card',
    '.belief-card',
    '.profile-item',
    '.list-item',
    '.testimonial-card',
    '.skill-item',
    /* Headings */
    '.section-title',
    '.section-label',
    '.resume-name',
    '.resume-section-title',
    '.bday-title',
    /* About photo */
    '.about-photo-wrap',
    /* Timeline nodes */
    '.year-node',
    '.year-detail-header',
    /* Inputs */
    '.gate-input-wrap',
    '.inline-password-form',
    /* Footer */
    '.footer',
  ];

  function pickAngle(r, side) {
    /* Return an angle that grows AWAY from the element */
    switch (side) {
      case 'top':    return rng(-TAU/2 - 0.4, -TAU/2 + 0.4);  /* upward */
      case 'bottom': return rng(-0.45, 0.45);                   /* downward (but gravity pulls up so net = up-ish) */
      case 'left':   return rng(TAU * 0.62, TAU * 0.88);        /* leftward */
      case 'right':  return rng(TAU * 0.12, TAU * 0.38);        /* rightward */
      default:       return rng(0, TAU);
    }
  }

  function discoverAnchors() {
    const result = [];
    const W = window.innerWidth, H = window.innerHeight;

    SELECTORS.forEach(sel => {
      try {
        document.querySelectorAll(sel).forEach(el => {
          /* Skip hidden elements */
          if (!el.getBoundingClientRect) return;
          const r = el.getBoundingClientRect();
          if (r.width < 6 || r.height < 6) return;
          if (r.right < -40 || r.bottom < -40) return;
          if (r.left > W + 40 || r.top > H + 40) return;

          /* Bottom edge — most common spawn point for downward-hanging vines */
          result.push({
            x: rng(r.left + 6, r.right - 6),
            y: r.bottom,
            initAngle: rng(-0.35, 0.35),  /* mostly downward; gravity bends upward */
            weight: 1.2,
          });

          /* Left edge — less common */
          if (Math.random() > 0.55) {
            result.push({
              x: r.left,
              y: rng(r.top + 4, r.bottom - 4),
              initAngle: rng(TAU * 0.62, TAU * 0.88),
              weight: 0.9,
            });
          }

          /* Right edge */
          if (Math.random() > 0.55) {
            result.push({
              x: r.right,
              y: rng(r.top + 4, r.bottom - 4),
              initAngle: rng(TAU * 0.12, TAU * 0.38),
              weight: 0.9,
            });
          }
        });
      } catch(e) {}
    });

    /* Fallback: viewport corners if nothing found */
    if (result.length < 4) {
      result.push(
        { x: 0, y: 0,  initAngle: rng(0.1, 0.7),  weight: 1 },
        { x: W, y: 0,  initAngle: rng(2.5, 3.1),   weight: 1 },
        { x: 0, y: H,  initAngle: rng(-0.7, -0.1), weight: 1 },
        { x: W, y: H,  initAngle: rng(-3.1, -2.5), weight: 1 }
      );
    }

    return result;
  }

  /* ════════════════════════════════════════════════
     VINE OBJECT
  ════════════════════════════════════════════════ */
  function makeVine(anchor, idx) {
    const cols = palette();
    const col  = cols[idx % cols.length];
    return {
      pts:     [{ x: anchor.x, y: anchor.y }],
      angle:   anchor.initAngle,
      momentum:0,
      /* How far to grow */
      maxSteps: Math.floor(rng(55, 200)),
      step:     0,
      /* Visual */
      alpha:   0,
      dying:   false,
      col,
      thick:   rng(1.2, 2.4) * (anchor.weight || 1),
      /* Children */
      leaves:  [],
      flowers: [],
      sinceLeaf:   0,
      sinceFlower: 0,
      leafCount:   0,
      done:    false,
    };
  }

  /* ── One growth step ── */
  function stepVine(v) {
    if (v.done || v.pts.length === 0) return;
    if (v.step >= v.maxSteps) { v.done = true; return; }

    /* Organic walk: small random drift + upward gravity bias
       so vines naturally arc upward/sideways */
    const drift    = (Math.random() - 0.5) * 0.22;
    const gravityUp= -0.014;             /* bias upward */
    v.momentum     = v.momentum * 0.78 + drift * 0.22;
    v.angle       += v.momentum + gravityUp;

    /* Allow vines to hang downward a bit at first,
       then curve up — clamp loosely */
    v.angle = clamp(v.angle, -Math.PI * 1.1, Math.PI * 0.55);

    const last = v.pts[v.pts.length - 1];
    v.pts.push({
      x: last.x + Math.cos(v.angle) * STEP_PX,
      y: last.y + Math.sin(v.angle) * STEP_PX,
    });
    v.step++;
    v.sinceLeaf++;
    v.sinceFlower++;

    /* Leaf attempt */
    if (v.sinceLeaf >= LEAF_THRESHOLD && v.step > 5) {
      if (Math.random() > 0.28) {
        addLeaf(v);
        v.sinceLeaf = 0;
      }
    }

    /* Flower attempt (only after a few leaves) */
    if (v.sinceFlower >= FLOWER_THRESHOLD && v.leafCount >= 2) {
      if (Math.random() > 0.40) {
        addFlower(v);
        v.sinceFlower = 0;
      }
    }

    dirty = true;
  }

  /* ── Add leaf at current tip ── */
  function addLeaf(v) {
    const i   = v.pts.length - 1;
    const p   = v.pts[i];
    const prv = v.pts[Math.max(0, i - 4)];
    const stemAng = Math.atan2(p.y - prv.y, p.x - prv.x);
    const side    = v.leafCount % 2 === 0 ? 1 : -1;
    const leafAng = stemAng + (Math.PI / 2) * side + rng(-0.28, 0.28);
    v.leaves.push({
      x: p.x, y: p.y,
      angle: leafAng,
      t: 0,
      growMs: rng(2200, 4800),
      size:   rng(7, 15),
      side,
    });
    v.leafCount++;
  }

  /* ── Add flower at current tip ── */
  function addFlower(v) {
    const p = v.pts[v.pts.length - 1];
    v.flowers.push({
      x: p.x, y: p.y,
      t: 0,
      growMs: rng(3500, 7500),
      petals: Math.floor(rng(4, 7)),
      radius: rng(4, 9),
      col:    v.col,
      rotOff: Math.random() * TAU,
    });
  }

  /* ════════════════════════════════════════════════
     DRAW — all on canvas, no DOM manipulation
  ════════════════════════════════════════════════ */

  /* Draw one leaf as a filled bezier teardrop */
  function drawLeaf(ctx, lf, parentAlpha, dt) {
    lf.t = Math.min(lf.t + dt, lf.growMs);
    const progress = easeOut(lf.t / lf.growMs);
    if (progress < 0.02) return;

    const s   = lf.size * progress;
    const a   = lf.angle;
    const nx  = Math.cos(a), ny = Math.sin(a);
    const tx  = lf.x + nx * s;
    const ty  = lf.y + ny * s;
    /* perpendicular for leaf width */
    const px2 = -ny, py2 = nx;
    const w   = s * 0.44;
    const mx  = lf.x + nx * s * 0.52;
    const my  = lf.y + ny * s * 0.52;
    const l1x = mx + px2 * w, l1y = my + py2 * w;
    const r1x = mx - px2 * w, r1y = my - py2 * w;

    ctx.save();
    ctx.globalAlpha = parentAlpha * Math.min(1, lf.t / 600);

    /* Fill */
    const g = ctx.createLinearGradient(lf.x, lf.y, tx, ty);
    g.addColorStop(0,   '#1e4a0e');
    g.addColorStop(0.45,'#2d6918');
    g.addColorStop(1,   '#3d8522');
    ctx.fillStyle   = g;
    ctx.strokeStyle = '#153a09';
    ctx.lineWidth   = 0.45;
    ctx.beginPath();
    ctx.moveTo(lf.x, lf.y);
    ctx.bezierCurveTo(l1x, l1y, tx, ty, tx, ty);
    ctx.bezierCurveTo(tx, ty, r1x, r1y, lf.x, lf.y);
    ctx.fill();
    ctx.stroke();

    /* Midrib vein */
    if (progress > 0.18) {
      const vEnd = Math.min(1, (progress - 0.18) * 1.5);
      ctx.beginPath();
      ctx.moveTo(lf.x, lf.y);
      ctx.lineTo(lf.x + nx * s * vEnd, lf.y + ny * s * vEnd);
      ctx.strokeStyle = 'rgba(12,45,5,0.38)';
      ctx.lineWidth   = 0.32;
      ctx.stroke();
    }

    /* Secondary veins — subtle */
    if (progress > 0.5) {
      const vfrac = (progress - 0.5) * 2;
      const vCount = 3;
      for (let vi = 0; vi < vCount; vi++) {
        const vt  = (vi + 1) / (vCount + 1);
        const vx0 = lf.x + nx * s * vt;
        const vy0 = lf.y + ny * s * vt;
        const vLen = w * 0.65 * (1 - vt) * vfrac;
        ctx.beginPath();
        ctx.moveTo(vx0, vy0);
        ctx.lineTo(vx0 + px2 * lf.side * vLen, vy0 + py2 * lf.side * vLen);
        ctx.strokeStyle = 'rgba(12,45,5,0.22)';
        ctx.lineWidth   = 0.25;
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  /* Draw one flower — petals open one by one */
  function drawFlower(ctx, fl, parentAlpha, dt) {
    fl.t = Math.min(fl.t + dt, fl.growMs);
    const prog = easeInOut(fl.t / fl.growMs);
    if (prog < 0.04) return;

    const r   = fl.radius * prog;
    const n   = fl.petals;
    const col = fl.col;

    ctx.save();
    ctx.globalAlpha = parentAlpha * Math.min(1, fl.t / 900);

    /* Each petal opens sequentially */
    const petalsOpen = Math.min(n, Math.ceil(n * prog * 1.4));
    for (let i = 0; i < petalsOpen; i++) {
      const pp  = clamp((prog * n * 1.3 - i) / 1, 0, 1);
      if (pp < 0.01) continue;
      const ang = (i / n) * TAU + fl.rotOff;
      const pr  = r * easeOut(pp);
      const px2 = fl.x + Math.cos(ang) * pr;
      const py2 = fl.y + Math.sin(ang) * pr;

      ctx.save();
      ctx.translate(px2, py2);
      ctx.rotate(ang + Math.PI / 2);
      ctx.scale(1, 0.52);

      const petalR = pr * 0.58 * easeOut(pp);
      const pg = ctx.createRadialGradient(0, -petalR*0.3, 0, 0, 0, petalR);
      pg.addColorStop(0,   col.p);
      pg.addColorStop(0.65,col.p);
      pg.addColorStop(1,   col.p + '44');
      ctx.beginPath();
      ctx.arc(0, 0, petalR, 0, TAU);
      ctx.fillStyle = pg;
      ctx.globalAlpha *= 0.88;
      ctx.fill();

      /* Petal edge */
      ctx.strokeStyle = 'rgba(0,0,0,0.10)';
      ctx.lineWidth   = 0.3;
      ctx.stroke();

      /* Petal vein */
      ctx.beginPath();
      ctx.moveTo(0, -petalR * 0.82);
      ctx.lineTo(0,  petalR * 0.82);
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth   = 0.25;
      ctx.stroke();

      ctx.restore();
    }

    /* Centre disc */
    if (prog > 0.45) {
      const cp    = easeOut(clamp((prog - 0.45) / 0.55, 0, 1));
      const centR = r * 0.32 * cp;
      ctx.beginPath();
      ctx.arc(fl.x, fl.y, centR, 0, TAU);
      ctx.fillStyle = col.c;
      ctx.globalAlpha = parentAlpha * cp;
      ctx.fill();

      /* Stamen dots */
      if (cp > 0.5) {
        const sCount = Math.floor(n * 0.8);
        for (let si = 0; si < sCount; si++) {
          const sa = (si / sCount) * TAU;
          const sd = centR * 0.58;
          ctx.beginPath();
          ctx.arc(
            fl.x + Math.cos(sa) * sd,
            fl.y + Math.sin(sa) * sd,
            0.7, 0, TAU
          );
          ctx.fillStyle = '#ffee88';
          ctx.globalAlpha = parentAlpha * cp * 0.85;
          ctx.fill();
        }
      }
    }

    ctx.restore();
  }

  /* Draw vine stem (tapered, coloured by depth) */
  function drawStem(ctx, v) {
    if (v.pts.length < 2) return;
    ctx.save();
    ctx.lineCap  = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = v.alpha;

    for (let i = 1; i < v.pts.length; i++) {
      const t  = i / v.maxSteps;
      /* Taper: thicker at root, thinner at tip */
      const w  = Math.max(0.45, v.thick * (1 - t * 0.6));
      /* Colour: dark at root → slightly lighter at tip */
      const gr = Math.floor(lerp(18, 46, t));
      const gg = Math.floor(lerp(36, 82, t));
      const gb = Math.floor(lerp(10, 22, t));

      ctx.beginPath();
      ctx.moveTo(v.pts[i-1].x, v.pts[i-1].y);
      ctx.lineTo(v.pts[i].x,   v.pts[i].y);
      ctx.strokeStyle = `rgb(${gr},${gg},${gb})`;
      ctx.lineWidth   = w;
      ctx.stroke();
    }

    ctx.restore();
  }

  /* ════════════════════════════════════════════════
     CRACK SYSTEM
     Stone fracture look: irregular wandering lines
     from corners, NOT radial spider webs.
  ════════════════════════════════════════════════ */
  function buildCracks() {
    cracks.length = 0;
    const W = window.innerWidth, H = window.innerHeight;

    /* Each corner spawns 2–3 wandering primary fractures */
    const corners = [
      { x: 0, y: 0,  ax: 0.7,  ay: 0.7  },
      { x: W, y: 0,  ax:-0.7,  ay: 0.7  },
      { x: 0, y: H,  ax: 0.7,  ay:-0.7  },
      { x: W, y: H,  ax:-0.7,  ay:-0.7  },
    ];

    corners.forEach((c, ci) => {
      const mainCount = 2 + Math.floor(Math.random() * 2);
      for (let m = 0; m < mainCount; m++) {
        const spread   = rng(-0.45, 0.45);
        const baseAngle= Math.atan2(c.ay, c.ax) + spread;
        walkCrack(c.x, c.y, baseAngle, 0, ci * 100 + m * 10);
      }
    });
  }

  function walkCrack(sx, sy, angle, depth, seedBase) {
    if (depth > 2) return;
    const W = window.innerWidth, H = window.innerHeight;

    /* Length: shorter for deeper branches */
    const len  = rng(50, 160) * (1 - depth * 0.28);
    const segs = Math.floor(rng(10, 22));
    const pts  = [{ x: sx, y: sy }];
    let cx = sx, cy = sy, a = angle;

    for (let s = 0; s < segs; s++) {
      /* Stone crack character: mostly straight with occasional kink */
      const drift = (Math.random() - 0.5) * 0.3;
      if (Math.random() > 0.78) {
        /* Sharp kink — realistic crack direction change */
        a += (Math.random() > 0.5 ? 1 : -1) * rng(0.35, 0.75);
      }
      a += drift;

      const d = (len / segs) * rng(0.55, 1.45);
      cx = clamp(cx + Math.cos(a) * d, -30, W + 30);
      cy = clamp(cy + Math.sin(a) * d, -30, H + 30);
      pts.push({ x: cx, y: cy });

      /* Secondary branch */
      if (depth < 1 && Math.random() > 0.76) {
        const branchA = a + (Math.random() > 0.5 ? 1 : -1) * rng(0.5, 1.1);
        walkCrack(cx, cy, branchA, depth + 1, Math.random() * 9999 | 0);
      }
    }

    const baseOpacity = rng(0.18, 0.42) * (1 - depth * 0.1);

    cracks.push({
      pts,
      baseOpacity,
      width:  rng(0.35, 0.85) * (1 - depth * 0.18),
      alpha:  0,    /* current draw alpha — animated in render */
      dying:  false,
      dyingStart: 0,
    });
  }

  /* Render crack canvas */
  function renderCracks(elapsed) {
    if (!cX) return;
    cX.clearRect(0, 0, cC.width, cC.height);

    cracks.forEach(cr => {
      /* Progress along this crack's path depends on global elapsed */
      let drawProg, lineAlpha;

      if (cr.dying) {
        const dyingElapsed = Date.now() - cr.dyingStart;
        lineAlpha  = Math.max(0, 1 - dyingElapsed / RESTORE_MS);
        drawProg   = 1;
      } else {
        /* Grow in over first 60% of SPAWN_MS */
        const crackWindow = SPAWN_MS * 0.6;
        lineAlpha  = clamp(elapsed / (SPAWN_MS * 0.12), 0, 1);
        drawProg   = clamp(elapsed / crackWindow, 0, 1);
      }

      if (lineAlpha < 0.01) return;

      const pts = cr.pts;
      if (pts.length < 2) return;

      const drawCount = Math.max(2, Math.floor((pts.length - 1) * drawProg) + 1);

      cX.save();
      cX.globalAlpha = lineAlpha * cr.baseOpacity;
      cX.lineCap     = 'round';
      cX.lineJoin    = 'round';
      cX.lineWidth   = cr.width;

      /* Main crack line — slight blue-grey stone colour */
      cX.beginPath();
      cX.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < drawCount; i++) {
        cX.lineTo(pts[i].x, pts[i].y);
      }
      cX.strokeStyle = 'rgba(168,182,198,0.9)';
      cX.stroke();

      /* Bright highlight (inner edge of crack) */
      cX.globalAlpha = lineAlpha * cr.baseOpacity * 0.28;
      cX.lineWidth   = cr.width * 0.35;
      cX.strokeStyle = 'rgba(235,245,255,0.9)';
      cX.stroke();

      /* Dark shadow (opposite edge) — gives 3D depth */
      cX.globalAlpha = lineAlpha * cr.baseOpacity * 0.35;
      cX.lineWidth   = cr.width * 0.4;
      cX.strokeStyle = 'rgba(40,50,60,0.7)';
      cX.stroke();

      cX.restore();
    });
  }

  /* ════════════════════════════════════════════════
     MAIN RAF LOOP
  ════════════════════════════════════════════════ */
  let lastRaf = 0;

  function renderLoop(ts) {
    rafId = requestAnimationFrame(renderLoop);

    const dt      = Math.min(ts - lastRaf, 80);  /* cap at 80ms for tab-switch */
    lastRaf       = ts;
    const elapsed = ruinMode ? (Date.now() - ruinStart) : 0;

    /* ── Vine canvas ── */
    if (vX && (dirty || vines.some(v => !v.done || v.leaves.length || v.flowers.length))) {
      vX.clearRect(0, 0, vC.width, vC.height);

      vines.forEach(v => {
        /* Fade in */
        if (!v.dying) {
          v.alpha = Math.min(0.90, v.alpha + 0.003);
        } else {
          /* Gradual fade out over RESTORE_MS */
          v.alpha = Math.max(0, v.alpha - (dt / RESTORE_MS));
        }

        if (v.alpha < 0.01) return;

        drawStem(vX, v);

        v.leaves.forEach(lf => {
          if (v.dying) lf.t = Math.max(0, lf.t - dt * 2.5);
          drawLeaf(vX, lf, v.alpha, v.dying ? 0 : dt);
        });

        v.flowers.forEach(fl => {
          if (v.dying) fl.t = Math.max(0, fl.t - dt * 3);
          drawFlower(vX, fl, v.alpha, v.dying ? 0 : dt);
        });
      });

      /* Remove fully faded vines */
      for (let i = vines.length - 1; i >= 0; i--) {
        if (vines[i].dying && vines[i].alpha <= 0.01) vines.splice(i, 1);
      }

      dirty = false;
    }

    /* ── Crack canvas ── */
    if (cX && (ruinMode || cracks.some(c => c.dying))) {
      renderCracks(elapsed);
    }
  }

  /* ════════════════════════════════════════════════
     GROWTH TICK (separate interval, not RAF)
  ════════════════════════════════════════════════ */
  function startGrowthTick() {
    clearInterval(growTick);
    growTick = setInterval(() => {
      if (!ruinMode) { clearInterval(growTick); return; }
      vines.forEach(v => { if (!v.done && !v.dying) stepVine(v); });
    }, TICK_MS);
  }

  /* ════════════════════════════════════════════════
     SETUP / TEARDOWN
  ════════════════════════════════════════════════ */
  function initCanvases() {
    const W = window.innerWidth, H = window.innerHeight;
    if (!vC) {
      vC = document.createElement('canvas');
      vC.className  = 'ruins-vine-canvas';
      vC.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:10;';
      document.body.appendChild(vC);
      vX = vC.getContext('2d');
    }
    if (!cC) {
      cC = document.createElement('canvas');
      cC.className  = 'ruins-crack-canvas';
      cC.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:11;';
      document.body.appendChild(cC);
      cX = cC.getContext('2d');
    }
    vC.width  = cC.width  = W;
    vC.height = cC.height = H;
  }

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
    setTimeout(() => { if (el.parentNode) el.remove(); }, 14000);
  }

  /* Restore button stays until ALL vines are gone */
  function showRestoreButton() {
    /* Delayed so button doesn't pop up immediately at ruin start */
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

  function pollAndHideRestoreButton() {
    /* Poll until vines are all gone, then slide the button away */
    const id = setInterval(() => {
      if (vines.length === 0) {
        clearInterval(id);
        if (restoreBtn) {
          restoreBtn.classList.remove('visible');
          restoreBtn.classList.add('hiding');
          setTimeout(() => {
            if (restoreBtn && restoreBtn.parentNode) restoreBtn.remove();
            restoreBtn = null;
          }, 1000);
        }
      }
    }, 3000);
  }

  /* ════════════════════════════════════════════════
     ENTER / EXIT
  ════════════════════════════════════════════════ */
  let anchors = [];
  let spawnIndex = 0;

  function enterRuinMode() {
    if (ruinMode) return;
    ruinMode   = true;
    restoring  = false;
    ruinStart  = Date.now();
    spawnIndex = 0;

    document.documentElement.classList.add('ruins-active');
    initCanvases();

    /* Discover anchors once at start */
    anchors = discoverAnchors();
    /* Shuffle */
    for (let i = anchors.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [anchors[i], anchors[j]] = [anchors[j], anchors[i]];
    }

    /* Build crack geometry */
    buildCracks();

    showOverlay();
    showRestoreButton();

    /* Spawn first vine immediately */
    spawnVine();
    spawnTimer = setInterval(spawnVine, VINE_SPAWN_GAP);

    /* Growth ticker */
    startGrowthTick();
  }

  function spawnVine() {
    if (!ruinMode || spawnIndex >= MAX_VINES || anchors.length === 0) {
      clearInterval(spawnTimer);
      return;
    }
    const anchor = anchors[spawnIndex % anchors.length];
    vines.push(makeVine(anchor, spawnIndex));
    spawnIndex++;
    dirty = true;
  }

  function beginRestore() {
    if (!ruinMode) return;
    ruinMode = false; restoring = true;
    document.documentElement.classList.remove('ruins-active');

    clearInterval(spawnTimer);
    clearInterval(growTick);

    /* Mark everything as dying */
    vines.forEach(v => { v.dying = true; });
    const now = Date.now();
    cracks.forEach(cr => { cr.dying = true; cr.dyingStart = now; });

    hideOverlay();
    pollAndHideRestoreButton();

    setTimeout(() => { restoring = false; resetIdle(); }, RESTORE_MS + 5000);
  }

  function restoreInstant() {
    ruinMode = false; restoring = false;
    document.documentElement.classList.remove('ruins-active');

    clearInterval(spawnTimer);
    clearInterval(growTick);

    /* Snap-clear */
    vines.forEach(v => { v.dying = true; v.alpha = 0; });
    cracks.forEach(cr => { cr.alpha = 0; cr.dying = true; cr.dyingStart = 0; });

    if (vX) vX.clearRect(0, 0, vC.width, vC.height);
    if (cX) cX.clearRect(0, 0, cC.width, cC.height);

    vines.length = 0;

    hideOverlay();

    /* Hide button immediately */
    if (restoreBtn) {
      restoreBtn.classList.remove('visible');
      restoreBtn.classList.add('hiding');
      setTimeout(() => {
        if (restoreBtn && restoreBtn.parentNode) restoreBtn.remove();
        restoreBtn = null;
      }, 900);
    }

    resetIdle();
  }

  /* ════════════════════════════════════════════════
     IDLE DETECTION
  ════════════════════════════════════════════════ */
  function resetIdle() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(enterRuinMode, IDLE_MS);
  }

  function onActivity() {
    if (ruinMode)  beginRestore();
    if (!restoring) resetIdle();
  }

  ['mousemove','mousedown','keydown','touchstart','touchmove','scroll','wheel','click']
    .forEach(ev => document.addEventListener(ev, onActivity, { passive: true }));

  /* ── Start ── */
  initCanvases();          /* create canvases immediately */
  rafId = requestAnimationFrame(renderLoop);  /* start loop */
  resetIdle();             /* begin idle countdown */

  /* Resize */
  window.addEventListener('resize', () => {
    if (vC) { vC.width = window.innerWidth; vC.height = window.innerHeight; }
    if (cC) { cC.width = window.innerWidth; cC.height = window.innerHeight; }
    if (ruinMode) { buildCracks(); }
  });

})();
