(function () {
  'use strict';

  /* ── CONFIG ── */
  const IDLE_DELAY    = 5000; // Testing speed: 5 seconds
  const MAX_VINES     = 20;
  const GROW_INTERVAL = 1500;

  /* ── STATE ── */
  let ruinMode     = false;
  let idleTimer    = null;
  let growTimer    = null;
  let activeVines  = [];
  let crackCanvas  = null;
  let crackCtx     = null;
  let restoreBtn   = null;

  /* ── FLOWER COLORS ── */
  const COLORS = ['#9955ff', '#4d88ff', '#22ddff', '#cc44ff'];

  /* ════════════════════════════════════════════════════════
      GLASS ETCHING ENGINE (The Crack Fix)
   ════════════════════════════════════════════════════════ */
  function initCracks() {
    if (crackCanvas) return;
    crackCanvas = document.createElement('canvas');
    crackCanvas.style.cssText = "position:fixed; inset:0; z-index:99980; pointer-events:none; mix-blend-mode:screen; opacity:0; transition:opacity 3s;";
    crackCanvas.width = window.innerWidth;
    crackCanvas.height = window.innerHeight;
    document.body.appendChild(crackCanvas);
    crackCtx = crackCanvas.getContext('2d');
  }

  function drawFractalCrack(x, y, angle, depth, level) {
    if (depth <= 0) return;

    const length = (Math.random() * 30 + 20) * level;
    const nx = x + Math.cos(angle) * length;
    const ny = y + Math.sin(angle) * length;

    crackCtx.beginPath();
    crackCtx.moveTo(x, y);
    crackCtx.lineTo(nx, ny);
    crackCtx.strokeStyle = `rgba(220, 240, 255, ${0.4 * level})`;
    crackCtx.lineWidth = 0.5;
    crackCtx.stroke();

    // Branching
    if (Math.random() > 0.5) {
      drawFractalCrack(nx, ny, angle + (Math.random() - 0.5), depth - 1, level);
    }
    drawFractalCrack(nx, ny, angle + (Math.random() - 0.5) * 0.5, depth - 1, level);
  }

  /* ════════════════════════════════════════════════════════
      ORGANIC VINE ENGINE (The Nature Fix)
   ════════════════════════════════════════════════════════ */
  function createOrganicVine(index) {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.cssText = "position:fixed; inset:0; pointer-events:none; z-index:99970; overflow:visible;";

    // Start from corners/edges
    const startX = (index % 2 === 0) ? 0 : W;
    const startY = Math.random() * H;
    const endX = W / 2 + (Math.random() - 0.5) * (W * 0.4);
    const endY = H / 2 + (Math.random() - 0.5) * (H * 0.4);
    const cpX = W / 2;
    const cpY = startY;

    const color = COLORS[index % COLORS.length];
    const pathId = `vine-${index}`;

    svg.innerHTML = `
      <defs>
        <filter id="glow-${index}"><feGaussianBlur stdDeviation="2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <path id="${pathId}" d="M${startX},${startY} Q${cpX},${cpY} ${endX},${endY}" 
            fill="none" stroke="#1a3a14" stroke-width="2.5" stroke-linecap="round" 
            stroke-dasharray="1200" stroke-dashoffset="1200">
        <animate attributeName="stroke-dashoffset" from="1200" to="0" dur="4s" fill="freeze" />
      </path>
      <g filter="url(#glow-${index})">
        <circle cx="${endX}" cy="${endY}" r="0" fill="${color}">
          <animate attributeName="r" from="0" to="6" dur="1s" begin="3s" fill="freeze" />
        </circle>
        <circle cx="${endX}" cy="${endY}" r="0" fill="${color}" opacity="0.3">
          <animate attributeName="r" from="0" to="12" dur="1.5s" begin="3.2s" fill="freeze" />
        </circle>
      </g>
    `;
    return svg;
  }

  /* ════════════════════════════════════════════════════════
      CORE ENGINE
   ════════════════════════════════════════════════════════ */
  function startRuin() {
    if (ruinMode) return;
    ruinMode = true;

    initCracks();
    crackCanvas.style.opacity = "1";

    let count = 0;
    growTimer = setInterval(() => {
      if (count >= MAX_VINES) return clearInterval(growTimer);
      
      // Grow Vine
      const v = createOrganicVine(count);
      document.body.appendChild(v);
      activeVines.push(v);

      // Etch Crack
      if (count % 4 === 0) {
        drawFractalCrack(Math.random() * window.innerWidth, Math.random() * window.innerHeight, Math.random() * Math.PI * 2, 5, 1);
      }

      count++;
    }, GROW_INTERVAL);

    showRestore();
  }

  function showRestore() {
    if (restoreBtn) return;
    restoreBtn = document.createElement('button');
    restoreBtn.innerText = "RESTORE SYSTEM";
    restoreBtn.style.cssText = "position:fixed; bottom:30px; left:50%; transform:translateX(-50%); z-index:99999; padding:12px 24px; background:rgba(255,255,255,0.05); color:white; border:1px solid rgba(255,255,255,0.2); backdrop-filter:blur(10px); cursor:pointer; letter-spacing:2px; font-size:10px;";
    restoreBtn.onclick = () => location.reload();
    document.body.appendChild(restoreBtn);
  }

  function resetIdle() {
    if (ruinMode) return;
    clearTimeout(idleTimer);
    idleTimer = setTimeout(startRuin, IDLE_DELAY);
  }

  ['mousemove', 'click', 'keydown'].forEach(e => document.addEventListener(e, resetIdle));
  resetIdle();

})();
