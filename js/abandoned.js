/* ═══════════════════════════════════════════════════════════
   abandoned.js — Ruins Easter Egg
   Triggers after 10 min idle. Nature takes over the site.
   Vines, moss, cracks, flowers grow in. Reverses on activity.
   Self-contained. Requires vines.css to be linked in HTML.
═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── CONFIG ── */
  const IDLE_DELAY    = 10 * 1000; /* 10 minutes */
  const GROW_INTERVAL = 1800;           /* ms between vine segment additions */
  const MAX_VINES     = 22;

  /* ── STATE ── */
  let ruinMode     = false;
  let idleTimer    = null;
  let growTimer    = null;
  let activeVines  = [];
  let activeMoss   = [];
  let crackCanvas  = null;
  let crackCtx     = null;
  let crackLevel   = 0;      /* 0 → 1 */
  let crackRaf     = null;
  let restoreBtn   = null;
  let restoreRaf   = null;
  let ruinOverlay  = null;
  let growCount    = 0;

  /* ── FLOWER COLOURS PER THEME ── */
  const THEME_FLOWERS = {
    dark:   ['#4d88ff', '#9955ff', '#22ddff', '#cc44ff'],
    light:  ['#ff88bb', '#ffcc44', '#ff66aa', '#f5dd00'],
    slate:  ['#88ccee', '#c0ccd8', '#66aacc', '#dde8f0'],
    forest: ['#ffcc00', '#ff8800', '#ffe066', '#ff6600'],
  };

  function getTheme() {
    return document.documentElement.getAttribute('data-theme') || 'dark';
  }
  function getFlowers() {
    return THEME_FLOWERS[getTheme()] || THEME_FLOWERS.dark;
  }

  /* ════════════════════════════════════════════════════════
     CRACK CANVAS
  ════════════════════════════════════════════════════════ */
  function initCrackCanvas() {
    if (crackCanvas) return;
    crackCanvas = document.createElement('canvas');
    crackCanvas.className = 'ruins-crack-canvas';
    crackCanvas.style.cssText = `
      position: fixed; inset: 0; z-index: 99980;
      pointer-events: none; opacity: 0;
      transition: opacity 1.2s ease;
    `;
    crackCanvas.width  = window.innerWidth;
    crackCanvas.height = window.innerHeight;
    document.body.appendChild(crackCanvas);
    crackCtx = crackCanvas.getContext('2d');
  }

  function drawCracks(level) {
    if (!crackCtx) return;
    const W = crackCanvas.width, H = crackCanvas.height;
    crackCtx.clearRect(0, 0, W, H);
    if (level <= 0) return;

    crackCtx.save();
    crackCtx.globalAlpha = level;

    /* Seed-based deterministic cracks (same layout every time) */
    const seed = 42;
    function seededRand(n) {
      const x = Math.sin(n + seed) * 43758.5453;
      return x - Math.floor(x);
    }

    const numClusters = Math.floor(3 + level * 7);
    for (let c = 0; c < numClusters; c++) {
      const cx = seededRand(c * 7)   * W;
      const cy = seededRand(c * 7 + 1) * H;
      const numRays = Math.floor(3 + seededRand(c * 7 + 2) * 6);

      for (let r = 0; r < numRays; r++) {
        const ang = seededRand(c * 50 + r) * Math.PI * 2;
        const len = (18 + seededRand(c * 50 + r + 1) * 85) * level;
        let px = cx, py = cy;
        const segments = 5;

        crackCtx.beginPath();
        crackCtx.moveTo(px, py);
        for (let s = 0; s < segments; s++) {
          const jitter = (seededRand(c * 200 + r * 10 + s) - 0.5) * 0.7;
          const d = len / segments;
          px += Math.cos(ang + jitter) * d;
          py += Math.sin(ang + jitter) * d;
          crackCtx.lineTo(px, py);

          /* Branch */
          if (level > 0.4 && seededRand(c * 300 + r * 20 + s) > 0.6) {
            const ba  = ang + (seededRand(c * 400 + r + s) - 0.5) * 1.8;
            const bl  = d * (0.3 + seededRand(c * 500 + r + s) * 0.4);
            const bx2 = px + Math.cos(ba) * bl;
            const by2 = py + Math.sin(ba) * bl;
            crackCtx.moveTo(px, py);
            crackCtx.lineTo(bx2, by2);
            crackCtx.moveTo(px, py);
          }
        }

        /* Crack line style — thin, stone-like */
        const alpha = (0.25 + seededRand(c * 100 + r) * 0.45) * level;
        crackCtx.strokeStyle = `rgba(180,195,210,${alpha})`;
        crackCtx.lineWidth   = 0.6 + seededRand(c * 100 + r + 5) * 0.8;
        crackCtx.stroke();
      }

      /* Tiny debris dots around cluster */
      if (level > 0.55) {
        for (let d = 0; d < 5; d++) {
          const dx = cx + (seededRand(c * 600 + d) - 0.5) * 60 * level;
          const dy = cy + (seededRand(c * 600 + d + 1) - 0.5) * 60 * level;
          const dr = seededRand(c * 600 + d + 2) * 2.5 * level;
          crackCtx.beginPath();
          crackCtx.arc(dx, dy, dr, 0, Math.PI * 2);
          crackCtx.fillStyle = `rgba(160,180,200,${0.2 * level})`;
          crackCtx.fill();
        }
      }
    }

    crackCtx.restore();
  }

  function animateCracksIn() {
    if (!crackCanvas) return;
    crackCanvas.style.opacity = '1';
    function step() {
      if (!ruinMode) return;
      crackLevel = Math.min(1, crackLevel + 0.0008);
      drawCracks(crackLevel);
      if (crackLevel < 1) crackRaf = requestAnimationFrame(step);
    }
    crackRaf = requestAnimationFrame(step);
  }

  function animateCracksOut() {
    if (crackRaf) cancelAnimationFrame(crackRaf);
    function step() {
      crackLevel = Math.max(0, crackLevel - 0.018);
      drawCracks(crackLevel);
      if (crackLevel > 0) crackRaf = requestAnimationFrame(step);
      else if (crackCanvas) crackCanvas.style.opacity = '0';
    }
    crackRaf = requestAnimationFrame(step);
  }

  /* ════════════════════════════════════════════════════════
     VINE SVG GENERATOR
     Each vine = SVG element with animated path growth
  ════════════════════════════════════════════════════════ */

  /* Origin positions: corners and edges */
  const VINE_ORIGINS = [
    { x: 0,    y: 0,    dx:  1, dy:  1, name: 'tl' },
    { x: 1,    y: 0,    dx: -1, dy:  1, name: 'tr' },
    { x: 0,    y: 1,    dx:  1, dy: -1, name: 'bl' },
    { x: 1,    y: 1,    dx: -1, dy: -1, name: 'br' },
    { x: 0,    y: 0.3,  dx:  1, dy:  0.3, name: 'ml' },
    { x: 1,    y: 0.6,  dx: -1, dy: -0.2, name: 'mr' },
    { x: 0.25, y: 0,    dx:  0.2, dy:  1, name: 'mt1' },
    { x: 0.75, y: 0,    dx: -0.2, dy:  1, name: 'mt2' },
    { x: 0.15, y: 1,    dx:  0.1, dy: -1, name: 'mb1' },
    { x: 0.85, y: 1,    dx: -0.1, dy: -1, name: 'mb2' },
  ];

  function buildVinePath(ox, oy, dx, dy, length, W, H, seed) {
    function sr(n) { const x = Math.sin(n * seed * 0.031 + 17.3) * 87654.32; return x - Math.floor(x); }

    let pts = [{ x: ox, y: oy }];
    let cx = ox, cy = oy;
    const steps = Math.floor(8 + sr(1) * 10);
    const stepLen = length / steps;

    for (let i = 0; i < steps; i++) {
      const jx = (sr(i * 3)     - 0.5) * 0.6;
      const jy = (sr(i * 3 + 1) - 0.5) * 0.6;
      cx = Math.max(0, Math.min(W, cx + (dx + jx) * stepLen));
      cy = Math.max(0, Math.min(H, cy + (dy + jy) * stepLen));
      pts.push({ x: cx, y: cy });
    }

    /* Build smooth SVG path from points */
    if (pts.length < 2) return '';
    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1], curr = pts[i];
      const mx   = (prev.x + curr.x) / 2;
      const my   = (prev.y + curr.y) / 2;
      d += ` Q ${prev.x.toFixed(1)} ${prev.y.toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
    }
    return { d, pts };
  }

  function makeLeaf(x, y, angle, size, seed) {
    function sr(n) { const v = Math.sin(n * seed * 0.07 + 3.1) * 54321; return v - Math.floor(v); }
    const w = size * (0.55 + sr(1) * 0.35);
    const h = size * (0.85 + sr(2) * 0.4);
    const rot = angle + (sr(3) - 0.5) * 80;
    /* Leaf shape: ellipse with pointed tip */
    return `
      <ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}"
               rx="${w.toFixed(1)}" ry="${h.toFixed(1)}"
               transform="rotate(${rot.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})"
               class="ruins-leaf"/>
    `;
  }

  function makeFlower(x, y, colors, size, seed) {
    function sr(n) { const v = Math.sin(n * seed * 0.11 + 1.7) * 99999; return v - Math.floor(v); }
    const col = colors[Math.floor(sr(1) * colors.length)];
    const col2 = colors[Math.floor(sr(2) * colors.length)];
    const rot  = sr(3) * 360;
    const r    = size * (0.55 + sr(4) * 0.35);
    const petals = 5;
    let petStr = '';
    for (let p = 0; p < petals; p++) {
      const pa = (p / petals) * Math.PI * 2 + rot;
      const px = x + Math.cos(pa) * r;
      const py = y + Math.sin(pa) * r;
      petStr += `<ellipse cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" rx="${(r*0.5).toFixed(1)}" ry="${(r*0.3).toFixed(1)}"
        transform="rotate(${(pa * 180/Math.PI).toFixed(1)} ${px.toFixed(1)} ${py.toFixed(1)})"
        fill="${col}" fill-opacity="0.88" class="ruins-petal"/>`;
    }
    /* Wisteria-style hanging cluster */
    const clusterStr = (() => {
      let s = '';
      for (let i = 0; i < 6; i++) {
        const oy = i * r * 0.55 + r * 0.3;
        const ox = (sr(i * 3 + 10) - 0.5) * r * 0.7;
        s += `<ellipse cx="${(x + ox).toFixed(1)}" cy="${(y + oy).toFixed(1)}"
          rx="${(r*0.28).toFixed(1)}" ry="${(r*0.38).toFixed(1)}"
          fill="${col2}" fill-opacity="0.7" class="ruins-floret"/>`;
      }
      return s;
    })();

    return `
      <g class="ruins-flower" style="--flower-color:${col}">
        ${petStr}
        <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(r*0.35).toFixed(1)}"
                fill="${col2}" class="ruins-flower-center"/>
        ${clusterStr}
      </g>`;
  }

  function createVineSVG(origin, index, W, H) {
    const ox    = origin.x * W;
    const oy    = origin.y * H;
    const len   = W * (0.2 + (index / MAX_VINES) * 0.32);
    const seed  = index * 1337 + 7;
    const result = buildVinePath(ox, oy, origin.dx, origin.dy, len, W, H, seed);
    if (!result || !result.d) return null;

    const { d, pts } = result;
    const colors = getFlowers();

    function sr(n) { const v = Math.sin(n * seed * 0.05 + 2.3) * 67890; return v - Math.floor(v); }

    /* Build leaves along path */
    let leafStr = '';
    for (let i = 1; i < pts.length - 1; i++) {
      if (sr(i * 7) > 0.35) {
        const angle = Math.atan2(pts[i].y - pts[i-1].y, pts[i].x - pts[i-1].x) * 180 / Math.PI;
        const size  = 6 + sr(i * 5) * 10;
        /* Alternate leaves left/right of stem */
        const offset = (i % 2 === 0 ? 1 : -1) * (8 + sr(i) * 12);
        const lx = pts[i].x + Math.sin((angle + 90) * Math.PI/180) * offset;
        const ly = pts[i].y - Math.cos((angle + 90) * Math.PI/180) * offset;
        leafStr += makeLeaf(lx, ly, angle + 90, size, seed + i);
      }
    }

    /* Add flowers at tip and at intervals */
    let flowerStr = '';
    const tip = pts[pts.length - 1];
    flowerStr += makeFlower(tip.x, tip.y, colors, 9 + sr(99) * 7, seed * 2);
    for (let i = Math.floor(pts.length * 0.4); i < pts.length - 2; i += 3) {
      if (sr(i * 9) > 0.55) {
        flowerStr += makeFlower(pts[i].x, pts[i].y, colors, 5 + sr(i) * 5, seed + i * 3);
      }
    }

    /* Path total length for stroke-dasharray animation */
    const approxLen = len * 1.4;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'ruins-vine-svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('width',  '100%');
    svg.setAttribute('height', '100%');
    svg.style.cssText = `
      position: fixed; inset: 0; pointer-events: none;
      z-index: 99970; overflow: visible; opacity: 0;
    `;

    svg.innerHTML = `
      <path d="${d}" class="ruins-vine-stem"
            stroke-dasharray="${approxLen}"
            stroke-dashoffset="${approxLen}"
            style="animation: ruins-grow ${1.8 + index * 0.3}s ease forwards;
                   animation-delay: ${index * 0.22}s;"/>
      <g class="ruins-vine-flora" style="opacity:0; animation: ruins-fade-flora 1.5s ease forwards;
         animation-delay: ${index * 0.22 + 1.6}s;">
        ${leafStr}
        ${flowerStr}
      </g>
    `;

    return svg;
  }

  /* ════════════════════════════════════════════════════════
     MOSS EFFECT
     Applies .ruins-moss class to site elements gradually
  ════════════════════════════════════════════════════════ */
  const MOSS_TARGETS = [
    '.nav-links a', '.btn', '.game-card', '.album-card',
    '.belief-card', '.profile-item', '.list-item',
    '.skill-tag', '.testimonial-card', '.year-node',
    '.hero-link-item', '.theme-dot', '#nav',
  ];

  function getMossTargets() {
    const all = [];
    MOSS_TARGETS.forEach(sel => {
      try {
        document.querySelectorAll(sel).forEach(el => all.push(el));
      } catch (e) {}
    });
    return all;
  }

  let mossQueue = [], mossInterval = null;

  function startMoss() {
    const all = getMossTargets();
    /* Shuffle */
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }
    mossQueue = all;

    let idx = 0;
    mossInterval = setInterval(() => {
      if (!ruinMode || idx >= mossQueue.length) {
        clearInterval(mossInterval);
        return;
      }
      mossQueue[idx].classList.add('ruins-moss');
      activeMoss.push(mossQueue[idx]);
      idx++;
    }, 1400);
  }

  function removeMoss() {
    clearInterval(mossInterval);
    activeMoss.forEach((el, i) => {
      setTimeout(() => {
        el.classList.add('ruins-moss-out');
        setTimeout(() => {
          el.classList.remove('ruins-moss', 'ruins-moss-out');
        }, 800);
      }, i * 60);
    });
    activeMoss = [];
  }

  /* ════════════════════════════════════════════════════════
     RESTORE BUTTON
  ════════════════════════════════════════════════════════ */
  function showRestoreButton() {
    if (restoreBtn) return;
    restoreBtn = document.createElement('button');
    restoreBtn.className = 'ruins-restore-btn';
    restoreBtn.innerHTML = `
      <span class="ruins-restore-icon">✦</span>
      <span class="ruins-restore-text">Restore</span>
      <span class="ruins-restore-icon">✦</span>
    `;
    restoreBtn.title = 'Restore site';
    restoreBtn.addEventListener('click', () => {
      restoreAll();
    });
    document.body.appendChild(restoreBtn);
    requestAnimationFrame(() => restoreBtn.classList.add('ruins-restore-visible'));
  }

  function hideRestoreButton() {
    if (!restoreBtn) return;
    restoreBtn.classList.remove('ruins-restore-visible');
    setTimeout(() => {
      if (restoreBtn && restoreBtn.parentNode) restoreBtn.remove();
      restoreBtn = null;
    }, 700);
  }

  /* ════════════════════════════════════════════════════════
     OVERLAY (dim / sepia effect)
  ════════════════════════════════════════════════════════ */
  function showOverlay() {
    if (ruinOverlay) return;
    ruinOverlay = document.createElement('div');
    ruinOverlay.className = 'ruins-overlay';
    ruinOverlay.style.cssText = `
      position: fixed; inset: 0; z-index: 99960;
      pointer-events: none; opacity: 0;
      background: radial-gradient(ellipse at center,
        rgba(0,0,0,0) 40%,
        rgba(0,0,0,0.22) 100%);
      transition: opacity 4s ease;
    `;
    document.body.appendChild(ruinOverlay);
    requestAnimationFrame(() => ruinOverlay.style.opacity = '1');
  }

  function hideOverlay() {
    if (!ruinOverlay) return;
    ruinOverlay.style.opacity = '0';
    setTimeout(() => {
      if (ruinOverlay && ruinOverlay.parentNode) ruinOverlay.remove();
      ruinOverlay = null;
    }, 1500);
  }

  /* ════════════════════════════════════════════════════════
     GROW VINES
  ════════════════════════════════════════════════════════ */
  function growNextVine() {
    if (!ruinMode || growCount >= MAX_VINES) {
      clearInterval(growTimer);
      return;
    }

    const W = window.innerWidth, H = window.innerHeight;
    const origin = VINE_ORIGINS[growCount % VINE_ORIGINS.length];
    const svgEl  = createVineSVG(origin, growCount, W, H);
    if (!svgEl) { growCount++; return; }

    svgEl.style.opacity = '0';
    document.body.appendChild(svgEl);
    activeVines.push(svgEl);

    /* Fade SVG in */
    requestAnimationFrame(() => {
      svgEl.style.transition = 'opacity 1.2s ease';
      svgEl.style.opacity    = '1';
    });

    growCount++;
  }

  function startGrowing() {
    growCount = 0;
    clearInterval(growTimer);
    growTimer = setInterval(growNextVine, GROW_INTERVAL);
    growNextVine(); /* Immediate first vine */
  }

  function removeVines() {
    clearInterval(growTimer);
    activeVines.forEach((svg, i) => {
      setTimeout(() => {
        if (!svg.parentNode) return;
        svg.style.transition = 'opacity 1.5s ease';
        svg.style.opacity    = '0';
        setTimeout(() => svg.remove(), 1600);
      }, i * 120);
    });
    activeVines = [];
    growCount   = 0;
  }

  /* ════════════════════════════════════════════════════════
     RUIN MODE ON / OFF
  ════════════════════════════════════════════════════════ */
  function enterRuinMode() {
    if (ruinMode) return;
    ruinMode = true;

    document.documentElement.classList.add('ruins-active');
    initCrackCanvas();
    showOverlay();
    showRestoreButton();
    startGrowing();
    startMoss();

    /* Cracks grow after a short delay */
    setTimeout(() => { if (ruinMode) animateCracksIn(); }, 4000);
  }

  function restoreAll() {
    if (!ruinMode) return;
    ruinMode = false;

    document.documentElement.classList.remove('ruins-active');
    clearInterval(growTimer);

    removeVines();
    removeMoss();
    animateCracksOut();
    hideOverlay();
    hideRestoreButton();

    /* Reset idle timer */
    resetIdleTimer();
  }

  /* ════════════════════════════════════════════════════════
     IDLE DETECTION
  ════════════════════════════════════════════════════════ */
  function resetIdleTimer() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(enterRuinMode, IDLE_DELAY);
  }

  function onActivity() {
    if (ruinMode) {
      restoreAll();
    }
    resetIdleTimer();
  }

  const EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'touchmove', 'scroll', 'wheel', 'click'];
  EVENTS.forEach(ev => document.addEventListener(ev, onActivity, { passive: true }));

  resetIdleTimer();

  /* Resize: redraw cracks, regen vines */
  window.addEventListener('resize', () => {
    if (crackCanvas) {
      crackCanvas.width  = window.innerWidth;
      crackCanvas.height = window.innerHeight;
      drawCracks(crackLevel);
    }
  });

  /* Theme change: update flowers next vine */
  const themeObserver = new MutationObserver(() => {
    /* Already-placed vines keep their colors — new ones get updated theme */
  });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

})();
