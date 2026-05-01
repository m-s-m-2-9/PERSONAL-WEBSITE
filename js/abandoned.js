/* ═══════════════════════════════════════════════════════════
   abandoned.js — Ruins Easter Egg
   Canvas-based. Everything drawn in a single RAF loop.
   Vines grow FROM anchor elements, never OVER content.
   Leaves bloom from the vine stem itself as it grows.
   Flowers open petal-by-petal after leaves appear.
   Cracks = real stone hairline fractures, not spider webs.
   IDLE: 10 min trigger. 5 min spawn. 5 min restore.
═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── TIMING (ms) ── */
  const IDLE_TRIGGER    = 10 * 1000;
  const SPAWN_DURATION  =  5 * 60 * 1000;
  const RESTORE_DURATION=  5 * 60 * 1000;

  /* ── VINE PARAMS ── */
  const MAX_VINES       = 14;
  const VINE_SPAWN_GAP  = SPAWN_DURATION / MAX_VINES;  /* ~21s between vines */
  const SEG_PX          = 3;    /* px per vine segment */
  const SEG_RATE        = 38;   /* ms per segment tick */
  const LEAF_EVERY      = 8;    /* segments between leaf attempts */
  const FLOWER_EVERY    = 22;   /* segments between flower attempts */

  /* ── STATE ── */
  let ruinMode  = false;
  let restoring = false;
  let ruinStart = 0;
  let idleTimer = null;
  let vineTimer = null;
  let segTimer  = null;
  let rafId     = null;
  let globalAlpha = 0; /* 0→1 as ruins spawn, 1→0 as restoring */

  const vines      = [];
  const cracks     = [];
  const mossPatches= [];
  let crackLevel   = 0;  /* 0→1 */
  let crackStarted = false;

  /* ── CANVASES ── */
  let vineCanvas, vineCtx;
  let crackCanvas, crackCtx;

  /* ── DOM ── */
  let overlay = null, restoreBtn = null;

  /* ────────────────────────────────────────────────
     THEME FLOWER COLOURS
  ──────────────────────────────────────────────────*/
  const FLOWERS = {
    dark:   [
      { p:'#5588ff', c:'#ffffff' },
      { p:'#9944ee', c:'#ffddff' },
      { p:'#3399ff', c:'#ddeeff' },
    ],
    light:  [
      { p:'#ffaacc', c:'#fff5ee' },
      { p:'#ffcc44', c:'#fff8cc' },
      { p:'#ff88aa', c:'#ffeedd' },
    ],
    slate:  [
      { p:'#88aacc', c:'#eef2f8' },
      { p:'#99bbdd', c:'#ddeeff' },
      { p:'#aabbcc', c:'#f0f4f8' },
    ],
    forest: [
      { p:'#ffcc00', c:'#fff8cc' },
      { p:'#ff8800', c:'#ffeecc' },
      { p:'#ddcc00', c:'#ffffcc' },
    ],
  };
  function themeFlowers() {
    const t = document.documentElement.getAttribute('data-theme') || 'dark';
    return FLOWERS[t] || FLOWERS.dark;
  }

  /* ────────────────────────────────────────────────
     MATH HELPERS
  ──────────────────────────────────────────────────*/
  function rand(lo, hi) { return lo + Math.random() * (hi - lo); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function easeIn(t)    { return t * t; }
  function easeOut(t)   { return 1 - (1-t)*(1-t); }
  function easeInOut(t) { return t<0.5 ? 2*t*t : -1+(4-2*t)*t; }

  /* ────────────────────────────────────────────────
     ANCHOR DISCOVERY
     Returns array of {x, y, label} points around
     DOM elements (their edges, not their centers).
     Vines start FROM these edges.
  ──────────────────────────────────────────────────*/
  const ANCHOR_SELECTORS = [
    /* Nav links */
    '#nav-links li a',
    '.nav-logo',
    /* Buttons */
    '.btn',
    '.btn-accent',
    '.game-play-btn',
    /* Cards */
    '.game-card',
    '.album-card',
    '.belief-card',
    '.profile-item',
    '.list-item',
    /* Headings */
    '.section-title',
    '.hero-name',
    /* Images */
    '.hero-photo-wrap',
    '.about-photo-wrap',
    /* Resume */
    '.resume-section-title',
    '.resume-entry',
    /* Timeline */
    '.year-node',
    /* Skills */
    '.skill-tag',
    /* Footer */
    '.footer',
  ];

  function discoverAnchors() {
    const anchors = [];
    ANCHOR_SELECTORS.forEach(sel => {
      try {
        document.querySelectorAll(sel).forEach(el => {
          if (!el.offsetParent && el.tagName !== 'BODY') return;
          const r = el.getBoundingClientRect();
          if (r.width < 8 || r.height < 8) return;
          if (r.right < 0 || r.bottom < 0) return;
          if (r.left > window.innerWidth || r.top > window.innerHeight) return;

          /* Spawn from the BOTTOM edge (vines grow up/sideways) */
          anchors.push({
            x: rand(r.left + 4, r.right - 4),
            y: r.bottom,
            side: 'bottom',
            label: sel,
          });
          /* Sometimes spawn from left/right edges */
          if (Math.random() > 0.6) {
            anchors.push({
              x: r.left,
              y: rand(r.top + 4, r.bottom - 4),
              side: 'left',
              label: sel,
            });
          }
          if (Math.random() > 0.6) {
            anchors.push({
              x: r.right,
              y: rand(r.top + 4, r.bottom - 4),
              side: 'right',
              label: sel,
            });
          }
        });
      } catch(e){}
    });

    /* Also include viewport corner/edge anchors */
    const W = window.innerWidth, H = window.innerHeight;
    [
      { x: 0,   y: 0 },
      { x: W,   y: 0 },
      { x: 0,   y: H },
      { x: W,   y: H },
      { x: W*0.25, y: 0 },
      { x: W*0.75, y: 0 },
      { x: 0,   y: H*0.4 },
      { x: W,   y: H*0.6 },
    ].forEach(p => anchors.push({ x: p.x, y: p.y, side: 'corner' }));

    return anchors;
  }

  /* ────────────────────────────────────────────────
     VINE CREATION
     Each vine is a growing path drawn on canvas.
     Segments added one by one via setInterval.
  ──────────────────────────────────────────────────*/
  function makeVine(anchor, index) {
    /* Initial angle: vines from bottom grow UP (negative y).
       Corners/sides grow inward. */
    let initAngle;
    if (anchor.side === 'bottom') {
      initAngle = rand(-Math.PI * 0.65, -Math.PI * 0.35); /* mostly upward */
    } else if (anchor.side === 'left') {
      initAngle = rand(-Math.PI * 0.2, Math.PI * 0.2);    /* rightward */
    } else if (anchor.side === 'right') {
      initAngle = rand(Math.PI * 0.8, Math.PI * 1.2);     /* leftward */
    } else {
      /* Corner — grow inward */
      const W = window.innerWidth, H = window.innerHeight;
      const dx = anchor.x < W/2 ? 1 : -1;
      const dy = anchor.y < H/2 ? 1 : -1;
      initAngle = Math.atan2(dy, dx) + rand(-0.4, 0.4);
    }

    /* Total length depends on spawn duration spread */
    const totalLen  = rand(80, 240);
    const totalSegs = Math.floor(totalLen / SEG_PX);
    const cols      = themeFlowers();
    const col       = cols[index % cols.length];

    /* Vine thickness — main stems thicker */
    const thickness = rand(1.1, 2.2);

    return {
      /* Position */
      x: anchor.x,
      y: anchor.y,
      /* Path (array of {x,y}) */
      pts: [{ x: anchor.x, y: anchor.y }],
      /* Walking state */
      angle: initAngle,
      momentum: 0,        /* smoothed angular momentum */
      totalSegs,
      drawnSegs: 0,
      /* Appearance */
      thickness,
      alpha: 0,           /* fades in */
      /* Children */
      leaves: [],         /* {x,y,angle,t,maxT,side,scale} */
      flowers: [],        /* {x,y,t,maxT,petals,col} */
      /* Control */
      done: false,
      dying: false,       /* set when restoring */
      dyingT: 0,
      /* Counters */
      segsSinceLeaf: 0,
      segsSinceFlower: 0,
      leafCount: 0,
      /* Floral colour */
      flowerCol: col,
    };
  }

  /* Advance one vine by one segment */
  function tickVine(v) {
    if (v.done || v.pts.length === 0) return;
    if (v.drawnSegs >= v.totalSegs) { v.done = true; return; }

    /* Update walking angle: slight random drift + gravity pull + curve memory */
    const drift    = (Math.random() - 0.5) * 0.28;
    const gravity  = 0.018; /* pull slightly downward */
    v.momentum    = v.momentum * 0.82 + drift * 0.18;
    v.angle      += v.momentum + gravity;

    /* Clamp so vine doesn't go completely horizontal or back on itself */
    /* Allow mostly upward/sideways growth */
    const maxDown = Math.PI * 0.25;
    v.angle = clamp(v.angle, -Math.PI + maxDown, maxDown);

    const last = v.pts[v.pts.length - 1];
    const nx = last.x + Math.cos(v.angle) * SEG_PX;
    const ny = last.y + Math.sin(v.angle) * SEG_PX;
    v.pts.push({ x: nx, y: ny });
    v.drawnSegs++;
    v.segsSinceLeaf++;
    v.segsSinceFlower++;
    v.leafCount;

    /* Try spawning a leaf */
    if (v.segsSinceLeaf >= LEAF_EVERY && v.drawnSegs > 4) {
      if (Math.random() > 0.3) {
        spawnLeaf(v);
        v.segsSinceLeaf = 0;
      }
    }

    /* Try spawning a flower (only after several leaves exist) */
    if (v.segsSinceFlower >= FLOWER_EVERY && v.leafCount >= 2) {
      if (Math.random() > 0.45) {
        spawnFlower(v);
        v.segsSinceFlower = 0;
      }
    }
  }

  function spawnLeaf(v) {
    const i    = v.pts.length - 1;
    const p    = v.pts[i];
    const prev = v.pts[Math.max(0, i - 3)];
    const stemAngle = Math.atan2(p.y - prev.y, p.x - prev.x);
    const side  = v.leafCount % 2 === 0 ? 1 : -1; /* alternate sides */
    const leafAngle = stemAngle + (Math.PI / 2) * side + rand(-0.3, 0.3);
    const maxScale  = rand(0.7, 1.6);
    const maxT      = rand(2800, 5500);

    v.leaves.push({ x: p.x, y: p.y, angle: leafAngle, t: 0, maxT, side, scale: 0, maxScale });
    v.leafCount++;
  }

  function spawnFlower(v) {
    const p   = v.pts[v.pts.length - 1];
    const maxT= rand(4000, 8000);
    const petals = Math.floor(rand(4, 7));
    v.flowers.push({ x: p.x, y: p.y, t: 0, maxT, petals, col: v.flowerCol });
  }

  /* ────────────────────────────────────────────────
     CRACK SYSTEM
     Stone-like hairline fractures from corners.
     Wandering paths, NOT radial spider webs.
  ──────────────────────────────────────────────────*/
  function buildCrackSystem() {
    /* Pre-compute all crack paths using a random-walk stone fracture algorithm */
    const W = window.innerWidth, H = window.innerHeight;

    /* Corner origins */
    const origins = [
      { x: 0,   y: 0,   ax: 0.55,  ay: 0.55  },
      { x: W,   y: 0,   ax:-0.55,  ay: 0.55  },
      { x: 0,   y: H,   ax: 0.55,  ay:-0.55  },
      { x: W,   y: H,   ax:-0.55,  ay:-0.55  },
    ];

    origins.forEach((o, oi) => {
      /* 2-4 main fractures per corner */
      const mainCount = 2 + Math.floor(Math.random() * 3);
      for (let m = 0; m < mainCount; m++) {
        const spreadAngle = (m / mainCount) * 0.7 - 0.35;
        const baseAngle   = Math.atan2(o.ay, o.ax) + spreadAngle;
        buildCrackLine(o.x, o.y, baseAngle, 0, oi * 10 + m);
      }
    });
  }

  function buildCrackLine(sx, sy, angle, depth, seed) {
    if (depth > 3) return;
    const W = window.innerWidth, H = window.innerHeight;
    const len = rand(40, 180) * (1 - depth * 0.25);
    const pts = [{ x: sx, y: sy }];

    let cx = sx, cy = sy, a = angle;
    const segs = Math.floor(rand(8, 20));
    const segLen = len / segs;

    for (let s = 0; s < segs; s++) {
      /* Stone cracks wander — not smooth curves */
      const drift = (Math.random() - 0.5) * 0.4;
      a += drift;
      /* Occasional sharp kink (realistic crack behaviour) */
      if (Math.random() > 0.82) a += (Math.random() - 0.5) * 0.6;

      const d = segLen * rand(0.6, 1.4);
      cx = clamp(cx + Math.cos(a) * d, -20, W + 20);
      cy = clamp(cy + Math.sin(a) * d, -20, H + 20);
      pts.push({ x: cx, y: cy });

      /* Branch: occasional secondary crack growing sideways */
      if (depth < 2 && Math.random() > 0.78) {
        const branchAngle = a + (Math.random() > 0.5 ? 1 : -1) * rand(0.5, 1.2);
        buildCrackLine(cx, cy, branchAngle, depth + 1, Math.random() * 9999);
      }
    }

    const opacity = rand(0.22, 0.52) - depth * 0.08;
    const width   = rand(0.4, 0.9) - depth * 0.1;

    cracks.push({
      pts,
      opacity,
      width: Math.max(0.2, width),
      t: 0,          /* growth progress 0→1 */
      maxT: rand(60000, SPAWN_DURATION * 0.7),
      alpha: 0,      /* fade alpha */
    });
  }

  /* ────────────────────────────────────────────────
     DRAW HELPERS
  ──────────────────────────────────────────────────*/

  /* Draw a leaf as a teardrop bezier */
  function drawLeaf(ctx, lf, vinealpha) {
    const s   = lf.scale * lf.maxScale;
    if (s < 0.05) return;
    const a   = lf.angle;
    const px  = lf.x, py = lf.y;
    const len = 9 * s, wid = 5 * s;

    /* Tip of leaf */
    const tx = px + Math.cos(a) * len;
    const ty = py + Math.sin(a) * len;
    /* Control points for bezier (left and right bulge) */
    const la = a + Math.PI / 2;
    const ra = a - Math.PI / 2;
    const mx = px + Math.cos(a) * len * 0.55;
    const my = py + Math.sin(a) * len * 0.55;
    const lx = mx + Math.cos(la) * wid;
    const ly = my + Math.sin(la) * wid;
    const rx = mx + Math.cos(ra) * wid;
    const ry = my + Math.sin(ra) * wid;

    /* Leaf vein */
    const veinProgress = clamp(lf.t / lf.maxT, 0, 1);

    ctx.save();
    ctx.globalAlpha = Math.min(0.92, vinealpha) * Math.min(1, lf.t / 800);

    /* Leaf fill */
    const leafGrad = ctx.createLinearGradient(px, py, tx, ty);
    leafGrad.addColorStop(0, '#2a5c14');
    leafGrad.addColorStop(0.5,'#3d7a22');
    leafGrad.addColorStop(1, '#4a9028');
    ctx.fillStyle = leafGrad;
    ctx.strokeStyle = '#1e4410';
    ctx.lineWidth = 0.4;

    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.bezierCurveTo(lx, ly, tx, ty, tx, ty);
    ctx.bezierCurveTo(tx, ty, rx, ry, px, py);
    ctx.fill();
    ctx.stroke();

    /* Midrib (center vein) */
    if (veinProgress > 0.15) {
      const veinEnd = lerp(0, 1, Math.min(1, veinProgress * 1.4));
      const vex = lerp(px, tx, veinEnd);
      const vey = lerp(py, ty, veinEnd);
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(vex, vey);
      ctx.strokeStyle = 'rgba(20,60,8,0.45)';
      ctx.lineWidth = 0.3;
      ctx.stroke();
    }

    ctx.restore();
  }

  /* Draw a tiny realistic flower */
  function drawFlower(ctx, fl, vinealpha) {
    const progress = clamp(fl.t / fl.maxT, 0, 1);
    if (progress < 0.05) return;

    const r    = 4.5 * easeOut(progress);
    const n    = fl.petals;
    const col  = fl.col;
    const cx2  = fl.x, cy2 = fl.y;

    ctx.save();
    ctx.globalAlpha = Math.min(0.9, vinealpha) * Math.min(1, fl.t / 1200);

    /* Petals open one at a time */
    const petalsOpen = Math.ceil(n * easeInOut(progress));
    for (let i = 0; i < petalsOpen; i++) {
      const petalProgress = clamp((progress * n - i) / 1, 0, 1);
      const ang = (i / n) * Math.PI * 2;
      const pr  = r * (0.85 + 0.15 * easeOut(petalProgress));
      const px2 = cx2 + Math.cos(ang) * pr;
      const py2 = cy2 + Math.sin(ang) * pr;

      /* Each petal: small filled ellipse rotated toward center */
      ctx.save();
      ctx.translate(px2, py2);
      ctx.rotate(ang + Math.PI / 2);
      ctx.scale(1, 0.55);
      ctx.beginPath();
      ctx.arc(0, 0, pr * 0.52 * petalProgress, 0, Math.PI * 2);
      ctx.fillStyle = col.p;
      ctx.globalAlpha *= 0.88;
      ctx.fill();
      /* Petal vein line */
      ctx.beginPath();
      ctx.moveTo(0, -pr * 0.52 * petalProgress);
      ctx.lineTo(0, pr * 0.52 * petalProgress);
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 0.3;
      ctx.stroke();
      ctx.restore();
    }

    /* Stamen/center */
    if (progress > 0.5) {
      const centerR = r * 0.28 * easeOut((progress - 0.5) * 2);
      ctx.beginPath();
      ctx.arc(cx2, cy2, centerR, 0, Math.PI * 2);
      ctx.fillStyle = col.c;
      ctx.globalAlpha = Math.min(0.9, vinealpha);
      ctx.fill();
      /* Tiny stamen dots */
      for (let d = 0; d < 5; d++) {
        const da  = (d / 5) * Math.PI * 2;
        const dr  = centerR * 0.55;
        ctx.beginPath();
        ctx.arc(cx2 + Math.cos(da)*dr, cy2 + Math.sin(da)*dr, 0.6, 0, Math.PI*2);
        ctx.fillStyle = '#ffee88';
        ctx.fill();
      }
    }

    ctx.restore();
  }

  /* Draw vine stem up to current drawn segment count */
  function drawVineStem(ctx, v) {
    if (v.pts.length < 2) return;

    ctx.save();
    ctx.globalAlpha = v.alpha;
    ctx.lineCap   = 'round';
    ctx.lineJoin  = 'round';

    /* Draw each segment with slight colour variation for depth */
    for (let i = 1; i < v.pts.length; i++) {
      const p0 = v.pts[i-1], p1 = v.pts[i];
      /* Taper: thicker near base, thinner toward tip */
      const t   = i / v.totalSegs;
      const w   = v.thickness * (1 - t * 0.55);
      /* Colour variation */
      const g   = Math.floor(lerp(22, 52, t));
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.strokeStyle = `rgb(${Math.floor(lerp(14,22,t))},${g+Math.floor(Math.random()*4-2)},${Math.floor(lerp(6,14,t))})`;
      ctx.lineWidth = Math.max(0.5, w);
      ctx.stroke();
    }

    ctx.restore();
  }

  /* Draw cracks: thin stone fracture lines */
  function drawCracks() {
    if (!crackCtx) return;
    const W = crackCanvas.width, H = crackCanvas.height;
    crackCtx.clearRect(0, 0, W, H);

    cracks.forEach(cr => {
      if (cr.alpha < 0.01 || cr.t < 1) return;
      const prog = clamp(cr.t / cr.maxT, 0, 1);
      const pts  = cr.pts;
      if (pts.length < 2) return;

      crackCtx.save();
      crackCtx.globalAlpha = cr.alpha * cr.opacity;
      crackCtx.lineCap    = 'round';
      crackCtx.lineJoin   = 'round';
      crackCtx.lineWidth  = cr.width;

      /* How many segments to draw based on progress */
      const drawPts = Math.max(2, Math.floor((pts.length - 1) * prog) + 1);

      crackCtx.beginPath();
      crackCtx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < drawPts; i++) {
        crackCtx.lineTo(pts[i].x, pts[i].y);
      }

      /* Stone crack look: vary colour slightly */
      const lightness = Math.floor(rand(70, 90));
      crackCtx.strokeStyle = `rgba(${lightness+20},${lightness+25},${lightness+28},0.88)`;
      crackCtx.stroke();

      /* Subtle bright highlight along crack (depth illusion) */
      crackCtx.globalAlpha = cr.alpha * cr.opacity * 0.22;
      crackCtx.strokeStyle = `rgba(220,235,245,0.9)`;
      crackCtx.lineWidth   = cr.width * 0.35;
      crackCtx.stroke();

      crackCtx.restore();
    });
  }

  /* ────────────────────────────────────────────────
     MAIN RENDER LOOP
  ──────────────────────────────────────────────────*/
  function renderLoop() {
    rafId = requestAnimationFrame(renderLoop);
    if (!vineCtx) return;

    const dt = 16; /* approximate */

    /* Clear vine canvas */
    vineCtx.clearRect(0, 0, vineCanvas.width, vineCanvas.height);

    const elapsed     = ruinMode ? (Date.now() - ruinStart) : 0;
    const spawnFrac   = ruinMode ? clamp(elapsed / SPAWN_DURATION, 0, 1) : globalAlpha;

    /* ── Update & draw each vine ── */
    vines.forEach(v => {
      /* Fade vine in */
      if (!v.dying) {
        v.alpha = Math.min(0.92, v.alpha + 0.004);
      } else {
        /* Fade out slowly */
        v.dyingT += dt;
        v.alpha   = Math.max(0, v.alpha - (1 / (RESTORE_DURATION / 60)));
      }

      /* Update leaves */
      v.leaves.forEach(lf => {
        if (lf.t < lf.maxT) lf.t += dt;
        if (v.dying) lf.t = Math.max(0, lf.t - dt * 2);
        lf.scale = easeInOut(clamp(lf.t / Math.min(lf.maxT, 3500), 0, 1));
      });

      /* Update flowers */
      v.flowers.forEach(fl => {
        if (fl.t < fl.maxT) fl.t += dt;
        if (v.dying) fl.t = Math.max(0, fl.t - dt * 3);
      });

      if (v.alpha < 0.005) return;

      /* Draw stem */
      drawVineStem(vineCtx, v);

      /* Draw leaves (behind flowers) */
      v.leaves.forEach(lf => drawLeaf(vineCtx, lf, v.alpha));

      /* Draw flowers */
      v.flowers.forEach(fl => drawFlower(vineCtx, fl, v.alpha));
    });

    /* ── Cracks ── */
    if (crackStarted || cracks.some(c => c.t > 0)) {
      const now = Date.now();
      cracks.forEach(cr => {
        if (!ruinMode && !cr.dying) { cr.dying = true; cr.dyingStart = now; }
        if (cr.dying) {
          const elapsed2 = now - (cr.dyingStart || now);
          cr.alpha = Math.max(0, 1 - elapsed2 / RESTORE_DURATION);
        } else {
          cr.alpha = Math.min(1, (ruinMode ? elapsed : 0) / (SPAWN_DURATION * 0.4));
          if (cr.t < cr.maxT && ruinMode) cr.t += dt;
        }
      });
      drawCracks();
    }

    /* ── Remove fully faded vines ── */
    for (let i = vines.length - 1; i >= 0; i--) {
      if (vines[i].dying && vines[i].alpha <= 0.002) {
        vines.splice(i, 1);
      }
    }
  }

  /* ────────────────────────────────────────────────
     VINE GROWTH TICKER
     Adds one segment to each active vine per tick
  ──────────────────────────────────────────────────*/
  function startGrowthTick() {
    segTimer = setInterval(() => {
      if (!ruinMode) { clearInterval(segTimer); return; }
      vines.forEach(v => { if (!v.done && !v.dying) tickVine(v); });
    }, SEG_RATE);
  }

  /* ────────────────────────────────────────────────
     SPAWN VINES GRADUALLY OVER 5 MINUTES
  ──────────────────────────────────────────────────*/
  let vineSpawnIdx = 0;
  let anchorsCache = [];

  function spawnNextVine() {
    if (!ruinMode || vineSpawnIdx >= MAX_VINES) {
      clearInterval(vineTimer); return;
    }
    if (anchorsCache.length === 0) return;

    /* Pick a random anchor (shuffle so vines spread across the page) */
    const idx    = Math.floor(Math.random() * anchorsCache.length);
    const anchor = anchorsCache.splice(idx, 1)[0];

    vines.push(makeVine(anchor, vineSpawnIdx));
    vineSpawnIdx++;
  }

  /* ────────────────────────────────────────────────
     CANVAS SETUP
  ──────────────────────────────────────────────────*/
  function setupCanvases() {
    if (!vineCanvas) {
      vineCanvas = document.createElement('canvas');
      vineCanvas.className = 'ruins-vine-canvas';
      vineCanvas.style.cssText =
        'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:10;';
      document.body.appendChild(vineCanvas);
      vineCtx = vineCanvas.getContext('2d');
    }
    if (!crackCanvas) {
      crackCanvas = document.createElement('canvas');
      crackCanvas.className = 'ruins-crack-canvas';
      crackCanvas.style.cssText =
        'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:12;';
      document.body.appendChild(crackCanvas);
      crackCtx = crackCanvas.getContext('2d');
    }
    resizeCanvases();
  }

  function resizeCanvases() {
    const W = window.innerWidth, H = window.innerHeight;
    if (vineCanvas)  { vineCanvas.width  = W; vineCanvas.height  = H; }
    if (crackCanvas) { crackCanvas.width = W; crackCanvas.height = H; }
  }

  /* ────────────────────────────────────────────────
     OVERLAY (subtle vignette at edges)
  ──────────────────────────────────────────────────*/
  function showOverlay() {
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.className = 'ruins-overlay';
    document.body.appendChild(overlay);
    requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('visible')));
  }
  function hideOverlay() {
    if (!overlay) return;
    overlay.classList.remove('visible');
    setTimeout(() => { if (overlay && overlay.parentNode) overlay.remove(); overlay = null; }, 4000);
  }

  /* ────────────────────────────────────────────────
     RESTORE BUTTON
  ──────────────────────────────────────────────────*/
  function showRestoreButton() {
    if (restoreBtn) return;
    /* Show after 25s so it doesn't appear immediately */
    setTimeout(() => {
      if (!ruinMode) return;
      restoreBtn = document.createElement('button');
      restoreBtn.className = 'ruins-restore-btn';
      restoreBtn.innerHTML =
        '<span class="ruins-restore-line"></span>' +
        '<span class="ruins-restore-text">Restore</span>' +
        '<span class="ruins-restore-line"></span>';
      document.body.appendChild(restoreBtn);
      requestAnimationFrame(() => requestAnimationFrame(() => restoreBtn.classList.add('visible')));
      restoreBtn.addEventListener('click', restoreInstant);
    }, 25000);
  }

  function hideRestoreButton(instant) {
    if (!restoreBtn) return;
    const btn = restoreBtn;
    restoreBtn = null;
    if (instant) {
      btn.classList.remove('visible');
      btn.classList.add('hiding');
      setTimeout(() => { if (btn.parentNode) btn.remove(); }, 800);
    } else {
      /* Keep visible until ALL vines are gone */
      const check = setInterval(() => {
        if (vines.length === 0) {
          clearInterval(check);
          btn.classList.remove('visible');
          btn.classList.add('hiding');
          setTimeout(() => { if (btn.parentNode) btn.remove(); }, 800);
        }
      }, 2000);
    }
  }

  /* ────────────────────────────────────────────────
     ENTER / EXIT RUIN MODE
  ──────────────────────────────────────────────────*/
  function enterRuinMode() {
    if (ruinMode) return;
    ruinMode  = true;
    restoring = false;
    ruinStart = Date.now();
    document.documentElement.classList.add('ruins-active');

    setupCanvases();
    anchorsCache = discoverAnchors();

    /* Pre-build crack system */
    cracks.length = 0;
    buildCrackSystem();
    crackStarted  = true;

    showOverlay();
    showRestoreButton();

    /* Start vine spawning */
    vineSpawnIdx = 0;
    spawnNextVine();
    vineTimer = setInterval(spawnNextVine, VINE_SPAWN_GAP);

    /* Start growth ticker */
    startGrowthTick();

    /* Start render loop if not already */
    if (!rafId) renderLoop();
  }

  function beginRestore() {
    if (!ruinMode) return;
    ruinMode  = false;
    restoring = true;
    document.documentElement.classList.remove('ruins-active');

    clearInterval(vineTimer);
    clearInterval(segTimer);

    /* Mark all vines as dying */
    vines.forEach(v => { v.dying = true; v.dyingT = 0; });

    /* Mark cracks as dying */
    const now = Date.now();
    cracks.forEach(cr => { cr.dying = true; cr.dyingStart = now; });

    hideOverlay();

    /* Don't hide restore button — keep visible until vines are fully gone */
    /* It's already set up to do this via the setInterval check in hideRestoreButton */

    setTimeout(() => { restoring = false; resetIdleTimer(); }, RESTORE_DURATION);
  }

  function restoreInstant() {
    const wasRuining = ruinMode || restoring;
    ruinMode  = false;
    restoring = false;
    document.documentElement.classList.remove('ruins-active');

    clearInterval(vineTimer);
    clearInterval(segTimer);

    /* Fast-fade everything */
    vines.forEach(v => { v.dying = true; v.alpha = 0.001; });
    cracks.forEach(cr => { cr.alpha = 0; });
    crackStarted = false;

    hideOverlay();
    hideRestoreButton(true);

    setTimeout(() => {
      vines.length  = 0;
      cracks.length = 0;
      if (vineCtx)  vineCtx.clearRect(0,0,vineCanvas.width,vineCanvas.height);
      if (crackCtx) crackCtx.clearRect(0,0,crackCanvas.width,crackCanvas.height);
      resetIdleTimer();
    }, 400);
  }

  /* ────────────────────────────────────────────────
     IDLE DETECTION
  ──────────────────────────────────────────────────*/
  function resetIdleTimer() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(enterRuinMode, IDLE_TRIGGER);
  }

  function onActivity() {
    if (ruinMode)   beginRestore();
    if (!restoring) resetIdleTimer();
  }

  const EVENTS = ['mousemove','mousedown','keydown','touchstart','touchmove','scroll','wheel','click'];
  EVENTS.forEach(ev => document.addEventListener(ev, onActivity, { passive: true }));

  /* Start idle timer */
  resetIdleTimer();

  /* Start render loop immediately so it's ready */
  setupCanvases();
  renderLoop();

  /* Handle resize */
  window.addEventListener('resize', () => {
    resizeCanvases();
    if (ruinMode) {
      cracks.length = 0;
      buildCrackSystem();
      drawCracks();
    }
  });

})();
