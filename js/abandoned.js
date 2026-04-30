/* ═══════════════════════════════════════════════════════════
   abandoned.js — Ruins Easter Egg
   
   TIMING:
   - Triggers after 10 min idle
   - 5 min to fully spawn all effects
   - 5 min to fully restore after activity
   - Restore button for instant cleanup
   
   EFFECTS (layered, cinematic, non-blocking):
   - Organic vines growing from edges, following DOM structure
   - Leaves unfurling along vine stems
   - Flowers blooming at random intervals on vines
   - Stone cracks spreading from corners
   - Soft moss appearing on UI elements
   - Dust particles drifting
   
   THEME-AWARE flower colours:
   - dark   → neon blue / purple
   - light  → soft pink / gold
   - slate  → pale blue / silver
   - forest → yellow / orange
═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── TIMING ── */
  const IDLE_TRIGGER   = 10 * 1000;  /* 10 min idle → start */
  const SPAWN_DURATION = 5  * 60 * 1000;  /* 5 min to fully spawn */
  const FADE_DURATION  = 5  * 60 * 1000;  /* 5 min to fully restore */

  /* ── DERIVED INTERVALS ── */
  const MAX_VINES      = 28;
  const VINE_INTERVAL  = SPAWN_DURATION / MAX_VINES;  /* ~10.7s between vines */
  const MAX_PARTICLES  = 40;
  const PARTICLE_INT   = SPAWN_DURATION / MAX_PARTICLES;
  const MOSS_BATCH     = 1;
  const MOSS_INTERVAL  = SPAWN_DURATION / 60;   /* spread over spawn window */

  /* ── STATE ── */
  let ruinMode    = false;
  let restoring   = false;
  let idleTimer   = null;
  let vineTimer   = null;
  let mossTimer   = null;
  let particleTimer = null;

  const activeVines     = [];
  const activeMoss      = [];
  const activeParticles = [];

  let crackCanvas   = null;
  let crackCtx      = null;
  let crackProgress = 0;   /* 0 → 1 */
  let crackRaf      = null;

  let ruinOverlay   = null;
  let restoreBtn    = null;

  let vineCount     = 0;
  let mossTargetEls = [];
  let mossIndex     = 0;

  /* ── FLOWER THEME COLOURS ── */
  const THEME_FLOWERS = {
    dark:   ['#4d88ff','#9944ff','#22ddff','#bb33ff','#66aaff','#aa22ee'],
    light:  ['#ff88bb','#ffcc44','#ff66aa','#ffe066','#ffaacc','#f5cc00'],
    slate:  ['#88ccee','#c8d8e8','#66aacc','#dde8f0','#aaccdd','#b8ccd8'],
    forest: ['#ffcc00','#ff8800','#ffe066','#ff6600','#ffaa22','#dd7700'],
  };

  function getTheme() {
    return document.documentElement.getAttribute('data-theme') || 'dark';
  }
  function themeFlowers() {
    return THEME_FLOWERS[getTheme()] || THEME_FLOWERS.dark;
  }

  /* ════════════════════════════════════════════════════════
     MATHS / RANDOM HELPERS
  ════════════════════════════════════════════════════════ */
  function seeded(n, seed) {
    const v = Math.sin(n * seed * 0.09 + 1.618) * 43758.5453;
    return v - Math.floor(v);
  }
  function rand(lo, hi) { return lo + Math.random() * (hi - lo); }
  function randInt(lo, hi) { return Math.floor(rand(lo, hi + 1)); }
  function pick(arr) { return arr[randInt(0, arr.length - 1)]; }

  /* ════════════════════════════════════════════════════════
     CRACK CANVAS
  ════════════════════════════════════════════════════════ */
  function initCracks() {
    if (crackCanvas) return;
    crackCanvas = document.createElement('canvas');
    crackCanvas.className = 'ruins-crack-canvas';
    crackCanvas.width  = window.innerWidth;
    crackCanvas.height = window.innerHeight;
    document.body.appendChild(crackCanvas);
    crackCtx = crackCanvas.getContext('2d');
  }

  /* Procedural crack system — grows outward from corner clusters */
  function drawCracks(level) {
    if (!crackCtx) return;
    const W = crackCanvas.width, H = crackCanvas.height;
    crackCtx.clearRect(0, 0, W, H);
    if (level <= 0.01) return;

    crackCtx.save();

    /* Crack cluster origins — corners + a mid-screen cluster */
    const origins = [
      { x: 0,   y: 0,   radius: W * 0.35 },
      { x: W,   y: 0,   radius: W * 0.28 },
      { x: 0,   y: H,   radius: W * 0.32 },
      { x: W,   y: H,   radius: W * 0.30 },
      { x: W * 0.48, y: H * 0.52, radius: W * 0.18 * level },
    ];

    const SED = 9173;

    origins.forEach((origin, ci) => {
      const rays   = 4 + Math.floor(seeded(ci, SED) * 6);
      const spread = origin.radius * level;
      const clusterAlpha = Math.min(1, level * 1.4);

      for (let r = 0; r < rays; r++) {
        /* Each ray fans from origin */
        const baseAngle = seeded(ci * 20 + r, SED) * Math.PI * 2;
        const rayLen    = spread * (0.45 + seeded(ci * 30 + r, SED) * 0.7);

        /* Build a jagged polyline */
        const pts = [{ x: origin.x, y: origin.y }];
        let px = origin.x, py = origin.y;
        const segs = 6 + Math.floor(seeded(ci * 40 + r, SED) * 5);

        for (let s = 0; s < segs; s++) {
          const jitter = (seeded(ci * 60 + r * 10 + s, SED) - 0.5) * 0.65;
          const d = rayLen / segs * (0.6 + seeded(ci * 80 + r * 15 + s, SED) * 0.75);
          px += Math.cos(baseAngle + jitter) * d;
          py += Math.sin(baseAngle + jitter) * d;
          pts.push({ x: px, y: py });

          /* Secondary micro-cracks */
          if (level > 0.3 && seeded(ci * 100 + r * 20 + s, SED) > 0.62) {
            const ba  = baseAngle + (seeded(ci * 120 + r * 22 + s, SED) - 0.5) * 2.2;
            const bl  = d * (0.25 + seeded(ci * 140 + r + s, SED) * 0.4);
            const bx2 = px + Math.cos(ba) * bl;
            const by2 = py + Math.sin(ba) * bl;
            crackCtx.beginPath();
            crackCtx.moveTo(px, py);
            crackCtx.lineTo(bx2, by2);
            crackCtx.strokeStyle = `rgba(175,195,215,${clusterAlpha * 0.55})`;
            crackCtx.lineWidth   = 0.5;
            crackCtx.stroke();
          }
        }

        /* Draw main ray */
        crackCtx.beginPath();
        crackCtx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) crackCtx.lineTo(pts[i].x, pts[i].y);

        /* Primary line */
        crackCtx.strokeStyle = `rgba(180,205,225,${clusterAlpha * 0.85})`;
        crackCtx.lineWidth   = 0.7 + seeded(ci * 200 + r, SED) * 0.7;
        crackCtx.stroke();

        /* Inner highlight */
        crackCtx.strokeStyle = `rgba(255,255,255,${clusterAlpha * 0.22})`;
        crackCtx.lineWidth   = 0.3;
        crackCtx.stroke();
      }

      /* Debris specks near origin */
      if (level > 0.4) {
        const numSpecks = Math.floor(seeded(ci * 300, SED) * 8 + 4);
        for (let d = 0; d < numSpecks; d++) {
          const angle = seeded(ci * 400 + d, SED) * Math.PI * 2;
          const dist  = seeded(ci * 500 + d, SED) * spread * 0.18 * level;
          const sx    = origin.x + Math.cos(angle) * dist;
          const sy    = origin.y + Math.sin(angle) * dist;
          const sr2   = seeded(ci * 600 + d, SED) * 2.5 * level;
          crackCtx.beginPath();
          crackCtx.arc(sx, sy, sr2, 0, Math.PI * 2);
          crackCtx.fillStyle = `rgba(165,185,205,${0.28 * level})`;
          crackCtx.fill();
        }
      }
    });

    crackCtx.restore();
  }

  /* Grow cracks in slowly over spawn duration */
  function startCracks() {
    if (!crackCanvas) initCracks();
    crackCanvas.style.opacity = '1';
    const startTime = performance.now();
    /* Cracks start appearing after 60s of ruin mode */
    const crackStartDelay = 60000;
    const crackWindow     = SPAWN_DURATION - crackStartDelay;

    function step() {
      if (!ruinMode) return;
      const elapsed = Math.max(0, performance.now() - startTime - crackStartDelay);
      crackProgress = Math.min(1, elapsed / crackWindow);
      drawCracks(crackProgress);
      if (crackProgress < 1) crackRaf = requestAnimationFrame(step);
    }
    crackRaf = requestAnimationFrame(step);
  }

  function fadeCracks() {
    if (crackRaf) { cancelAnimationFrame(crackRaf); crackRaf = null; }
    const startProgress = crackProgress;
    const startTime     = performance.now();

    function step() {
      const t = Math.min(1, (performance.now() - startTime) / FADE_DURATION);
      crackProgress = startProgress * (1 - t);
      drawCracks(crackProgress);
      if (crackProgress > 0) {
        crackRaf = requestAnimationFrame(step);
      } else {
        if (crackCanvas) crackCanvas.style.opacity = '0';
        crackProgress = 0;
      }
    }
    crackRaf = requestAnimationFrame(step);
  }

  /* ════════════════════════════════════════════════════════
     VINE SYSTEM — SVG-based, drawn procedurally
  ════════════════════════════════════════════════════════ */

  /* Vine starting positions around viewport edges */
  function vineOrigins() {
    const W = window.innerWidth, H = window.innerHeight;
    return [
      /* Top edge */
      { x: rand(0, W*0.2),   y: 0, angle: 90,  weight: 1 },
      { x: rand(W*0.3, W*0.5), y: 0, angle: 95,  weight: 1.2 },
      { x: rand(W*0.5, W*0.7), y: 0, angle: 85,  weight: 1 },
      { x: rand(W*0.8, W),   y: 0, angle: 90,  weight: 0.9 },
      /* Right edge */
      { x: W, y: rand(0, H*0.25),  angle: 200, weight: 1 },
      { x: W, y: rand(H*0.3, H*0.5), angle: 195, weight: 1.2 },
      { x: W, y: rand(H*0.6, H*0.8), angle: 210, weight: 1 },
      { x: W, y: rand(H*0.85, H),    angle: 205, weight: 0.9 },
      /* Bottom edge */
      { x: rand(0, W*0.2),   y: H, angle: 270, weight: 1 },
      { x: rand(W*0.3, W*0.55), y: H, angle: 265, weight: 1.2 },
      { x: rand(W*0.55, W*0.75), y: H, angle: 275, weight: 1 },
      { x: rand(W*0.8, W),   y: H, angle: 270, weight: 0.9 },
      /* Left edge */
      { x: 0, y: rand(0, H*0.25),   angle: 350, weight: 1 },
      { x: 0, y: rand(H*0.3, H*0.5), angle: 5,  weight: 1.2 },
      { x: 0, y: rand(H*0.55, H*0.8), angle: 355, weight: 1 },
      { x: 0, y: rand(H*0.85, H),    angle: 10,  weight: 0.9 },
      /* Corner clusters */
      { x: rand(-10, 30),  y: rand(-10, 30), angle: 120, weight: 1.5 },
      { x: rand(W-30, W+10), y: rand(-10, 30),  angle: 210, weight: 1.5 },
      { x: rand(-10, 30),   y: rand(H-30, H+10), angle: 60, weight: 1.5 },
      { x: rand(W-30, W+10), y: rand(H-30, H+10), angle: 300, weight: 1.5 },
    ];
  }

  /* Build SVG path for one vine stem.
     Uses a growing random walk algorithm for organic look. */
  function buildVineSVGPath(ox, oy, startAngleDeg, W, H, seed) {
    const len       = rand(W * 0.12, W * 0.42);
    const segments  = Math.floor(rand(14, 28));
    const stepLen   = len / segments;

    let pts = [{ x: ox, y: oy }];
    let cx = ox, cy = oy;
    let angle = startAngleDeg * Math.PI / 180;

    for (let i = 0; i < segments; i++) {
      /* Organic drift — angle changes slightly each step */
      const drift   = (seeded(i * 3, seed) - 0.5) * 0.55;
      angle        += drift;
      const gravity  = 0.012; /* vines fall slightly */
      angle         += gravity;

      const sx = stepLen * (0.7 + seeded(i * 5, seed) * 0.6);
      cx += Math.cos(angle) * sx;
      cy += Math.sin(angle) * sx;

      /* Keep within bounds with some slack */
      const slack = 80;
      cx = Math.max(-slack, Math.min(W + slack, cx));
      cy = Math.max(-slack, Math.min(H + slack, cy));

      pts.push({ x: cx, y: cy });
    }

    /* Build smooth SVG cubic path */
    if (pts.length < 2) return null;
    let d = `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      const p0 = pts[i-1], p1 = pts[i];
      const cpx = (p0.x + p1.x) / 2 + (seeded(i*7, seed)-0.5) * 12;
      const cpy = (p0.y + p1.y) / 2 + (seeded(i*7+1, seed)-0.5) * 8;
      d += ` Q ${p0.x.toFixed(1)},${p0.y.toFixed(1)} ${cpx.toFixed(1)},${cpy.toFixed(1)}`;
    }

    /* Approximate total path length for dash animation */
    let approxLen = 0;
    for (let i = 1; i < pts.length; i++) {
      const dx = pts[i].x - pts[i-1].x, dy = pts[i].y - pts[i-1].y;
      approxLen += Math.sqrt(dx*dx + dy*dy);
    }
    approxLen *= 1.12; /* slight overestimate for smooth finish */

    return { d, pts, len: approxLen };
  }

  /* Build a leaf shape (teardrop/ellipse with point) */
  function leafPath(cx, cy, angle, size) {
    const a = angle * Math.PI / 180;
    const nx = Math.cos(a), ny = Math.sin(a);
    const px = Math.cos(a + Math.PI/2), py = Math.sin(a + Math.PI/2);

    const tipX  = cx + nx * size;
    const tipY  = cy + ny * size;
    const w     = size * 0.52;
    const c1x   = cx + nx * size * 0.38 + px * w;
    const c1y   = cy + ny * size * 0.38 + py * w;
    const c2x   = cx + nx * size * 0.38 - px * w;
    const c2y   = cy + ny * size * 0.38 - py * w;

    return `M ${cx.toFixed(1)},${cy.toFixed(1)}
            C ${c1x.toFixed(1)},${c1y.toFixed(1)} ${tipX.toFixed(1)},${tipY.toFixed(1)} ${tipX.toFixed(1)},${tipY.toFixed(1)}
            C ${tipX.toFixed(1)},${tipY.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${cx.toFixed(1)},${cy.toFixed(1)}
            Z`;
  }

  /* Build a flower — 5 petals + wisteria-style hanging cluster */
  function buildFlowerSVG(cx, cy, colors, size, seed) {
    const petCount = 5;
    const col1     = colors[Math.floor(seeded(1, seed) * colors.length)];
    const col2     = colors[Math.floor(seeded(2, seed) * colors.length)];
    const col3     = colors[Math.floor(seeded(3, seed) * colors.length)];
    const baseRot  = seeded(4, seed) * 360;
    const r        = size * (0.55 + seeded(5, seed) * 0.3);
    const delay    = seeded(6, seed) * 2;

    let svgStr = `<g class="ruins-flower-group" style="animation-delay:${delay}s;">`;

    /* Petals */
    for (let p = 0; p < petCount; p++) {
      const pa   = (p / petCount) * 360 + baseRot;
      const rad  = pa * Math.PI / 180;
      const px   = cx + Math.cos(rad) * r;
      const py   = cy + Math.sin(rad) * r;
      const petalW = r * 0.55;
      const petalH = r * 0.85;
      const d    = `${delay + p * 0.12}s`;
      svgStr += `
        <ellipse
          cx="${px.toFixed(1)}" cy="${py.toFixed(1)}"
          rx="${petalW.toFixed(1)}" ry="${petalH.toFixed(1)}"
          fill="${col1}"
          fill-opacity="0.88"
          transform="rotate(${pa.toFixed(1)} ${px.toFixed(1)} ${py.toFixed(1)})"
          class="ruins-petal"
          style="animation-delay:${d}; transform-origin:${cx.toFixed(1)}px ${cy.toFixed(1)}px;"
        />`;
    }

    /* Center */
    svgStr += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(r*0.38).toFixed(1)}"
      fill="${col2}" class="ruins-flower-center"
      style="filter:drop-shadow(0 0 ${(r*0.5).toFixed(1)}px ${col2});"/>`;

    /* Wisteria hanging cluster beneath flower */
    const clusterCount = 5 + Math.floor(seeded(7, seed) * 5);
    for (let k = 0; k < clusterCount; k++) {
      const ox  = cx + (seeded(k * 3 + 10, seed) - 0.5) * r * 0.8;
      const oy  = cy + r * 0.8 + k * r * 0.45;
      const fw  = r * 0.22 * (0.7 + seeded(k * 3 + 11, seed) * 0.5);
      const fh  = r * 0.32 * (0.8 + seeded(k * 3 + 12, seed) * 0.4);
      const fd  = `${delay + k * 0.18}s`;
      svgStr += `
        <ellipse cx="${ox.toFixed(1)}" cy="${oy.toFixed(1)}"
          rx="${fw.toFixed(1)}" ry="${fh.toFixed(1)}"
          fill="${col3}" fill-opacity="0.78"
          class="ruins-floret"
          style="animation-delay:${fd};"/>`;
    }

    svgStr += `</g>`;
    return svgStr;
  }

  /* Create full vine SVG element (stem + leaves + flowers) */
  function createVine(originIdx) {
    const W = window.innerWidth, H = window.innerHeight;
    const origins = vineOrigins();
    const o = origins[originIdx % origins.length];
    const seed = originIdx * 7919 + Math.floor(Math.random() * 1000);

    const result = buildVineSVGPath(o.x, o.y, o.angle, W, H, seed);
    if (!result) return null;
    const { d, pts, len } = result;

    const colors = themeFlowers();

    /* Leaves — placed alternately along path */
    let leafStr = '';
    for (let i = 2; i < pts.length - 1; i++) {
      if (seeded(i * 11, seed) > 0.42) {
        const p    = pts[i];
        const prev = pts[i - 1];
        const stemAngle = Math.atan2(p.y - prev.y, p.x - prev.x) * 180 / Math.PI;
        const side  = (i % 2 === 0 ? 1 : -1);
        const off   = (9 + seeded(i * 13, seed) * 14) * side;
        const leafAngle = stemAngle + 90 * side + (seeded(i, seed) - 0.5) * 35;
        const sz    = 7 + seeded(i * 17, seed) * 11;
        const lx    = p.x + Math.cos((stemAngle + 90) * Math.PI/180) * off;
        const ly    = p.y + Math.sin((stemAngle + 90) * Math.PI/180) * off;
        const leafDelay = (i / pts.length) * 8 + seeded(i, seed) * 2;
        const lp    = leafPath(lx, ly, leafAngle, sz);

        /* Darker leaves near base, lighter toward tip */
        const green = i < pts.length * 0.4 ? '#2a5816' :
                      i < pts.length * 0.7 ? '#3d7a25' : '#4d9030';
        const stroke = i < pts.length * 0.4 ? '#1e400e' : '#2d5e1a';

        leafStr += `
          <path d="${lp}"
            fill="${green}" stroke="${stroke}" stroke-width="0.4"
            class="ruins-leaf"
            style="animation-delay:${leafDelay.toFixed(2)}s;
                   transform-origin:${lx.toFixed(1)}px ${ly.toFixed(1)}px;"/>`;
      }
    }

    /* Flowers — at random positions toward tip of vine */
    let flowerStr = '';
    const flowerStart = Math.floor(pts.length * 0.4);
    for (let i = flowerStart; i < pts.length; i++) {
      if (seeded(i * 23, seed) > 0.62) {
        const p  = pts[i];
        const sz = 6 + seeded(i * 29, seed) * 10;
        flowerStr += buildFlowerSVG(p.x, p.y, colors, sz, seed + i * 97);
      }
    }
    /* Always a flower at the tip */
    const tip = pts[pts.length - 1];
    flowerStr += buildFlowerSVG(tip.x, tip.y, colors, 9 + seeded(99, seed) * 8, seed * 3);

    /* Stem grow duration — earlier vines grow faster (already grown by the time they appear) */
    const growDur = 12 + originIdx * 0.8;

    const svgNS = 'http://www.w3.org/2000/svg';
    const svg   = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('class',   'ruins-vine-svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.style.cssText = `
      position:fixed; top:0; left:0; width:100%; height:100%;
      pointer-events:none; z-index:99970; overflow:visible; opacity:0;
      will-change:opacity;
    `;

    /* Build thick/thin stems for depth */
    const thickness = o.weight > 1.2 ? 3.2 : o.weight > 1 ? 2.2 : 1.5;
    const stemColor  = o.weight > 1.2 ? '#1e4012' : '#2d5a1e';

    svg.innerHTML = `
      <!-- Main stem -->
      <path d="${d}"
        fill="none" stroke="${stemColor}" stroke-width="${thickness}"
        stroke-linecap="round" stroke-linejoin="round"
        stroke-dasharray="${len.toFixed(0)}" stroke-dashoffset="${len.toFixed(0)}"
        style="animation: ruins-stem-grow ${growDur}s cubic-bezier(0.25,0.46,0.45,0.94) forwards;
               --vine-len:${len.toFixed(0)};
               filter:drop-shadow(0 1px 3px rgba(0,0,0,0.4));"
        class="ruins-vine-stem"/>
      <!-- Thinner secondary overlay for texture -->
      <path d="${d}"
        fill="none" stroke="#3a7228" stroke-width="${(thickness*0.5).toFixed(1)}"
        stroke-linecap="round"
        stroke-dasharray="${len.toFixed(0)}" stroke-dashoffset="${len.toFixed(0)}"
        style="animation: ruins-stem-grow ${(growDur*0.95).toFixed(1)}s cubic-bezier(0.25,0.46,0.45,0.94) ${1.2}s forwards;
               --vine-len:${len.toFixed(0)};
               opacity:0.6;"/>
      <!-- Leaves (appear after stem) -->
      <g style="opacity:0; animation: ruins-leaf-unfurl 2s ease forwards ${(growDur*0.55).toFixed(1)}s;">
        ${leafStr}
      </g>
      <!-- Flowers (appear last) -->
      <g style="opacity:0; animation: ruins-leaf-unfurl 3s ease forwards ${(growDur*0.82).toFixed(1)}s;">
        ${flowerStr}
      </g>
    `;

    return svg;
  }

  /* ════════════════════════════════════════════════════════
     MOSS
  ════════════════════════════════════════════════════════ */
  const MOSS_SELECTORS = [
    '#nav', '.nav-links a', '.nav-logo',
    '.hero-link-item', '.btn', '.btn-accent',
    '.game-card', '.album-card', '.belief-card',
    '.profile-item', '.list-item', '.skill-tag',
    '.testimonial-card', '.year-node .year-dot',
    '.theme-dot', '.resume-section-title',
  ];

  function gatherMossTargets() {
    const all = [];
    MOSS_SELECTORS.forEach(sel => {
      try { document.querySelectorAll(sel).forEach(el => all.push(el)); } catch(e){}
    });
    /* Shuffle */
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }
    return all;
  }

  function startMoss() {
    mossTargetEls = gatherMossTargets();
    mossIndex = 0;
    const batchDelay = 30000; /* start moss after 30s of ruin */
    setTimeout(() => {
      if (!ruinMode) return;
      mossTimer = setInterval(() => {
        if (!ruinMode || mossIndex >= mossTargetEls.length) {
          clearInterval(mossTimer); return;
        }
        for (let b = 0; b < MOSS_BATCH; b++) {
          if (mossIndex < mossTargetEls.length) {
            const el = mossTargetEls[mossIndex++];
            el.classList.add('ruins-moss');
            activeMoss.push(el);
          }
        }
      }, MOSS_INTERVAL);
    }, batchDelay);
  }

  function removeMoss() {
    clearInterval(mossTimer);
    /* Stagger removal over FADE_DURATION */
    const stepDelay = Math.min(300, FADE_DURATION / (activeMoss.length + 1));
    activeMoss.forEach((el, i) => {
      setTimeout(() => {
        el.classList.add('ruins-moss-out');
        setTimeout(() => el.classList.remove('ruins-moss', 'ruins-moss-out'), 1800);
      }, i * stepDelay);
    });
    activeMoss.length = 0;
  }

  /* ════════════════════════════════════════════════════════
     DUST PARTICLES
  ════════════════════════════════════════════════════════ */
  function spawnParticle() {
    if (!ruinMode || activeParticles.length >= MAX_PARTICLES) return;
    const W = window.innerWidth, H = window.innerHeight;

    const p    = document.createElement('div');
    p.className = 'ruins-particle';
    const size = rand(2, 5);
    const x    = rand(0, W);
    const y    = rand(H * 0.2, H);
    const dx   = (Math.random() - 0.5) * 60;
    const dy   = -rand(30, 90);
    const dur  = rand(6, 14);
    const col  = getTheme() === 'light' ? 'rgba(150,180,100,0.55)'
               : getTheme() === 'forest' ? 'rgba(120,160,60,0.5)'
               : 'rgba(80,130,60,0.48)';

    p.style.cssText = `
      left:${x}px; top:${y}px;
      width:${size}px; height:${size}px;
      background:${col};
      --pdx:${dx}px; --pdy:${dy}px;
      --pdur:${dur}s;
    `;
    document.body.appendChild(p);
    activeParticles.push(p);

    setTimeout(() => {
      if (p.parentNode) p.remove();
      const idx = activeParticles.indexOf(p);
      if (idx > -1) activeParticles.splice(idx, 1);
    }, dur * 1000);
  }

  function startParticles() {
    setTimeout(() => {
      if (!ruinMode) return;
      particleTimer = setInterval(() => {
        if (ruinMode) spawnParticle();
        else clearInterval(particleTimer);
      }, PARTICLE_INT);
    }, 15000);
  }

  function removeParticles() {
    clearInterval(particleTimer);
    activeParticles.forEach(p => {
      p.style.transition = 'opacity 2s ease';
      p.style.opacity    = '0';
      setTimeout(() => { if (p.parentNode) p.remove(); }, 2100);
    });
    activeParticles.length = 0;
  }

  /* ════════════════════════════════════════════════════════
     OVERLAY
  ════════════════════════════════════════════════════════ */
  function showOverlay() {
    if (ruinOverlay) return;
    ruinOverlay = document.createElement('div');
    ruinOverlay.className = 'ruins-overlay';
    ruinOverlay.style.cssText = `
      position:fixed; inset:0; pointer-events:none;
      z-index:99960; opacity:0;
      background:radial-gradient(ellipse 120% 110% at 50% 50%,
        rgba(0,0,0,0) 30%, rgba(0,0,0,0.20) 100%);
    `;
    document.body.appendChild(ruinOverlay);
    /* Fade in over 30s */
    const t0 = performance.now();
    function fadeIn() {
      if (!ruinMode) return;
      const t = Math.min(1, (performance.now() - t0) / 30000);
      ruinOverlay.style.opacity = (t * 0.88).toFixed(3);
      if (t < 1) requestAnimationFrame(fadeIn);
    }
    requestAnimationFrame(fadeIn);
  }

  function hideOverlay() {
    if (!ruinOverlay) return;
    const el     = ruinOverlay;
    const t0     = performance.now();
    const start  = parseFloat(el.style.opacity);
    function fadeOut() {
      const t = Math.min(1, (performance.now() - t0) / FADE_DURATION);
      el.style.opacity = (start * (1 - t)).toFixed(3);
      if (t < 1) requestAnimationFrame(fadeOut);
      else { if (el.parentNode) el.remove(); }
    }
    requestAnimationFrame(fadeOut);
    ruinOverlay = null;
  }

  /* ════════════════════════════════════════════════════════
     RESTORE BUTTON
  ════════════════════════════════════════════════════════ */
  function showRestoreButton() {
    if (restoreBtn) return;

    /* Show after 20s so it doesn't appear immediately */
    setTimeout(() => {
      if (!ruinMode) return;
      restoreBtn = document.createElement('button');
      restoreBtn.className = 'ruins-restore-btn';
      restoreBtn.innerHTML = `
        <span class="ruins-restore-icon">✦</span>
        <span class="ruins-restore-text">Restore</span>
        <span class="ruins-restore-icon">✦</span>
      `;
      document.body.appendChild(restoreBtn);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        restoreBtn.classList.add('ruins-restore-visible');
      }));
      restoreBtn.addEventListener('click', () => {
        restoreInstant();
      });
    }, 20000);
  }

  function hideRestoreButton() {
    if (!restoreBtn) return;
    const btn = restoreBtn;
    restoreBtn = null;
    btn.classList.remove('ruins-restore-visible');
    btn.classList.add('ruins-restore-hiding');
    setTimeout(() => { if (btn.parentNode) btn.remove(); }, 900);
  }

  /* ════════════════════════════════════════════════════════
     GROW VINES
  ════════════════════════════════════════════════════════ */
  function growNextVine() {
    if (!ruinMode || vineCount >= MAX_VINES) {
      clearInterval(vineTimer); return;
    }
    const svg = createVine(vineCount);
    if (svg) {
      document.body.appendChild(svg);
      activeVines.push(svg);
      /* Fade in SVG container */
      requestAnimationFrame(() => {
        svg.style.transition = 'opacity 2.5s ease';
        svg.style.opacity    = '1';
      });
    }
    vineCount++;
  }

  function startVines() {
    vineCount = 0;
    clearInterval(vineTimer);
    growNextVine(); /* First vine immediately */
    vineTimer = setInterval(growNextVine, VINE_INTERVAL);
  }

  function removeVines() {
    clearInterval(vineTimer);
    const stepDelay = Math.min(500, FADE_DURATION / (activeVines.length + 1));
    activeVines.forEach((svg, i) => {
      setTimeout(() => {
        svg.style.transition = 'opacity ' + (2 + Math.random()) + 's ease';
        svg.style.opacity    = '0';
        setTimeout(() => { if (svg.parentNode) svg.remove(); }, 3200);
      }, i * stepDelay);
    });
    activeVines.length = 0;
    vineCount = 0;
  }

  /* ════════════════════════════════════════════════════════
     ENTER / EXIT RUIN MODE
  ════════════════════════════════════════════════════════ */
  function enterRuinMode() {
    if (ruinMode) return;
    ruinMode   = true;
    restoring  = false;
    document.documentElement.classList.add('ruins-active');

    showOverlay();
    showRestoreButton();
    startVines();
    startMoss();
    startParticles();
    initCracks();
    startCracks();
  }

  /* Gradual restore (triggered by user activity) */
  function beginRestore() {
    if (!ruinMode) return;
    ruinMode  = false;
    restoring = true;
    document.documentElement.classList.remove('ruins-active');

    clearInterval(vineTimer);
    clearInterval(mossTimer);
    clearInterval(particleTimer);

    removeVines();
    removeMoss();
    removeParticles();
    fadeCracks();
    hideOverlay();
    hideRestoreButton();

    setTimeout(() => { restoring = false; }, FADE_DURATION);
    resetIdleTimer();
  }

  /* Instant restore (button click) */
  function restoreInstant() {
    if (!ruinMode && !restoring) return;
    ruinMode  = false;
    restoring = false;
    document.documentElement.classList.remove('ruins-active');

    clearInterval(vineTimer);
    clearInterval(mossTimer);
    clearInterval(particleTimer);
    if (crackRaf) { cancelAnimationFrame(crackRaf); crackRaf = null; }

    /* Remove all vines immediately with fast fade */
    activeVines.forEach(svg => {
      svg.style.transition = 'opacity 0.8s ease';
      svg.style.opacity    = '0';
      setTimeout(() => { if (svg.parentNode) svg.remove(); }, 900);
    });
    activeVines.length = 0;
    vineCount = 0;

    /* Remove moss immediately */
    activeMoss.forEach(el => {
      el.classList.add('ruins-moss-out');
      setTimeout(() => el.classList.remove('ruins-moss', 'ruins-moss-out'), 900);
    });
    activeMoss.length = 0;

    /* Remove particles */
    activeParticles.forEach(p => {
      p.style.transition = 'opacity 0.5s ease'; p.style.opacity = '0';
      setTimeout(() => { if (p.parentNode) p.remove(); }, 600);
    });
    activeParticles.length = 0;

    /* Fade cracks */
    if (crackCanvas) {
      crackCanvas.style.transition = 'opacity 1.5s ease';
      crackCanvas.style.opacity    = '0';
      crackProgress = 0;
    }

    /* Fade overlay */
    if (ruinOverlay) {
      ruinOverlay.style.transition = 'opacity 1.2s ease';
      ruinOverlay.style.opacity    = '0';
      setTimeout(() => { if (ruinOverlay && ruinOverlay.parentNode) ruinOverlay.remove(); ruinOverlay = null; }, 1400);
    }

    hideRestoreButton();
    resetIdleTimer();
  }

  /* ════════════════════════════════════════════════════════
     IDLE DETECTION
  ════════════════════════════════════════════════════════ */
  function resetIdleTimer() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(enterRuinMode, IDLE_TRIGGER);
  }

  function onActivity() {
    if (ruinMode) beginRestore();
    if (!restoring) resetIdleTimer();
  }

  const EVENTS = ['mousemove','mousedown','keydown','touchstart','touchmove','scroll','wheel','click'];
  EVENTS.forEach(ev => document.addEventListener(ev, onActivity, { passive: true }));

  resetIdleTimer();

  /* Resize — redraw cracks */
  window.addEventListener('resize', () => {
    if (crackCanvas) {
      crackCanvas.width  = window.innerWidth;
      crackCanvas.height = window.innerHeight;
      drawCracks(crackProgress);
    }
  });

})();
