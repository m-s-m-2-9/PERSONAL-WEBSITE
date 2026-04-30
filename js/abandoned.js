/* ═══════════════════════════════════════════════════════════
   abandoned.js — Fixed Ruins Easter Egg
   Refined for cinematic growth and subtle glass fractures.
═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── CONFIG ── */
  const IDLE_DELAY    = 10 * 60 * 1000; // 10 Minutes
  const GROW_INTERVAL = 2000;           // Slower, more natural growth
  const MAX_VINES     = 18;             // Slightly fewer for less clutter

  /* ── STATE ── */
  let ruinMode     = false;
  let idleTimer    = null;
  let growTimer    = null;
  let activeVines  = [];
  let activeMoss   = [];
  let crackCanvas  = null;
  let crackCtx     = null;
  let crackLevel   = 0;
  let crackRaf     = null;
  let restoreBtn   = null;
  let ruinOverlay  = null;
  let growCount    = 0;

  const THEME_FLOWERS = {
    dark:   ['#4d88ff', '#9955ff', '#22ddff', '#cc44ff'],
    light:  ['#ff88bb', '#ffcc44', '#ff66aa', '#f5dd00'],
    slate:  ['#88ccee', '#c0ccd8', '#66aacc', '#dde8f0'],
    forest: ['#ffcc00', '#ff8800', '#ffe066', '#ff6600'],
  };

  function getTheme() { return document.documentElement.getAttribute('data-theme') || 'dark'; }
  function getFlowers() { return THEME_FLOWERS[getTheme()] || THEME_FLOWERS.dark; }

  /* ════════════════════════════════════════════════════════
      CRACK CANVAS (The "Glass" Fix)
   ════════════════════════════════════════════════════════ */
  function initCrackCanvas() {
    if (crackCanvas) return;
    crackCanvas = document.createElement('canvas');
    crackCanvas.className = 'ruins-crack-canvas';
    crackCanvas.style.cssText = `
      position: fixed; inset: 0; z-index: 99980;
      pointer-events: none; opacity: 0;
      filter: drop-shadow(0 0 2px rgba(255,255,255,0.3));
      transition: opacity 2s ease;
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
    
    const seed = 42;
    function seededRand(n) {
      const x = Math.sin(n + seed) * 43758.5453;
      return x - Math.floor(x);
    }

    const numClusters = Math.floor(2 + level * 5);
    for (let c = 0; c < numClusters; c++) {
      const cx = seededRand(c * 7)   * W;
      const cy = seededRand(c * 7 + 1) * H;
      const numRays = Math.floor(3 + seededRand(c * 7 + 2) * 5);

      for (let r = 0; r < numRays; r++) {
        const ang = seededRand(c * 50 + r) * Math.PI * 2;
        const len = (20 + seededRand(c * 50 + r + 1) * 100) * level;
        let px = cx, py = cy;
        const segments = 6;

        crackCtx.beginPath();
        crackCtx.moveTo(px, py);
        for (let s = 0; s < segments; s++) {
          const jitter = (seededRand(c * 200 + r * 10 + s) - 0.5) * 0.8;
          const d = len / segments;
          px += Math.cos(ang + jitter) * d;
          py += Math.sin(ang + jitter) * d;
          crackCtx.lineTo(px, py);
        }

        // The Styling Fix: White/Cyan etched glass look
        const alpha = (0.2 + seededRand(c * 100 + r) * 0.3) * level;
        crackCtx.strokeStyle = `rgba(230, 245, 255, ${alpha})`;
        crackCtx.lineWidth   = 0.4 + seededRand(c * 100 + r + 5) * 0.6;
        crackCtx.stroke();
      }
    }
    crackCtx.restore();
  }

  /* ════════════════════════════════════════════════════════
      VINE GENERATOR (The "Blob" Fix)
   ════════════════════════════════════════════════════════ */
  const VINE_ORIGINS = [
    { x: 0, y: 0, dx: 1, dy: 1 }, { x: 1, y: 0, dx: -1, dy: 1 },
    { x: 0, y: 1, dx: 1, dy: -1 }, { x: 1, y: 1, dx: -1, dy: -1 },
    { x: 0.5, y: 0, dx: 0, dy: 1 }, { x: 0.5, y: 1, dx: 0, dy: -1 }
  ];

  function createVineSVG(origin, index, W, H) {
    const ox = origin.x * W;
    const oy = origin.y * H;
    const len = W * (0.12 + (index / MAX_VINES) * 0.15);
    const seed = index * 1337;
    const colors = getFlowers();
    
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'ruins-vine-svg');
    svg.style.cssText = `position:fixed; inset:0; pointer-events:none; z-index:99970; opacity:0; transition: opacity 1.5s;`;
    
    // Create a curved path rather than dots
    const d = `M${ox},${oy} Q${ox + (W*0.1*origin.dx)},${oy + (H*0.1*origin.dy)} ${ox + (len*origin.dx)},${oy + (len*origin.dy)}`;
    
    svg.innerHTML = `
      <path d="${d}" fill="none" stroke="#1a3a14" stroke-width="2.5" stroke-dasharray="500" stroke-dashoffset="500" 
            style="animation: ruins-grow 3s ease forwards; opacity: 0.7;">
      </path>
      <circle cx="${ox + (len*origin.dx)}" cy="${oy + (len*origin.dy)}" r="8" fill="${colors[index % colors.length]}" 
              style="filter: blur(4px); opacity: 0.6; animation: ruins-fade-flora 2s ease forwards; animation-delay: 1s;">
      </circle>
    `;
    return svg;
  }

  /* ════════════════════════════════════════════════════════
      CORE LOGIC
   ════════════════════════════════════════════════════════ */
  function enterRuinMode() {
    if (ruinMode) return;
    ruinMode = true;
    document.documentElement.classList.add('ruins-active');
    initCrackCanvas();
    startGrowing();
    setTimeout(() => { if (ruinMode) animateCracksIn(); }, 2000);
    showRestoreButton();
  }

  function animateCracksIn() {
    function step() {
      if (!ruinMode) return;
      crackLevel = Math.min(1, crackLevel + 0.005);
      drawCracks(crackLevel);
      if (crackLevel < 1) crackRaf = requestAnimationFrame(step);
    }
    crackRaf = requestAnimationFrame(step);
  }

  function startGrowing() {
    growCount = 0;
    growTimer = setInterval(() => {
      if (growCount >= MAX_VINES) return clearInterval(growTimer);
      const origin = VINE_ORIGINS[growCount % VINE_ORIGINS.length];
      const svg = createVineSVG(origin, growCount, window.innerWidth, window.innerHeight);
      document.body.appendChild(svg);
      activeVines.push(svg);
      requestAnimationFrame(() => svg.style.opacity = "1");
      growCount++;
    }, GROW_INTERVAL);
  }

  function showRestoreButton() {
    if (restoreBtn) return;
    restoreBtn = document.createElement('button');
    restoreBtn.className = 'ruins-restore-btn';
    restoreBtn.innerText = "RESTORE SYSTEM";
    restoreBtn.style.cssText = `
      position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
      z-index: 99999; padding: 10px 20px; background: rgba(255,255,255,0.1);
      border: 1px solid white; color: white; cursor: pointer; backdrop-filter: blur(5px);
    `;
    restoreBtn.onclick = restoreAll;
    document.body.appendChild(restoreBtn);
  }

  function restoreAll() {
    ruinMode = false;
    document.documentElement.classList.remove('ruins-active');
    activeVines.forEach(v => v.remove());
    activeVines = [];
    if (crackCtx) crackCtx.clearRect(0,0, crackCanvas.width, crackCanvas.height);
    if (restoreBtn) restoreBtn.remove();
    restoreBtn = null;
    resetIdleTimer();
  }

  function resetIdleTimer() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(enterRuinMode, IDLE_DELAY);
  }

  ['mousemove', 'keydown', 'click'].forEach(ev => document.addEventListener(ev, resetIdleTimer));
  resetIdleTimer();

})();
