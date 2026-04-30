(function () {
  'use strict';

  /* ── CONFIG ── */
  const IDLE_DELAY    = 5000; // SET TO 5 SECONDS FOR TESTING (Change back to 600000 later)
  const GROW_INTERVAL = 1500;
  const MAX_VINES     = 15;

  /* ── STATE ── */
  let ruinMode     = false;
  let idleTimer    = null;
  let growTimer    = null;
  let activeVines  = [];
  let crackCanvas  = null;
  let crackCtx     = null;
  let crackLevel   = 0;
  let restoreBtn   = null;

  /* ── CRACK DRAWING (Etched Glass Fix) ── */
  function initCrackCanvas() {
    if (crackCanvas) return;
    crackCanvas = document.createElement('canvas');
    crackCanvas.className = 'ruins-crack-canvas';
    crackCanvas.style.cssText = "position:fixed; inset:0; z-index:99980; pointer-events:none; opacity:0; transition:opacity 2s;";
    crackCanvas.width  = window.innerWidth;
    crackCanvas.height = window.innerHeight;
    document.body.appendChild(crackCanvas);
    crackCtx = crackCanvas.getContext('2d');
  }

  function drawCracks(level) {
    if (!crackCtx) return;
    crackCtx.clearRect(0, 0, crackCanvas.width, crackCanvas.height);
    crackCtx.save();
    // Soft White Etched Glass Look
    crackCtx.strokeStyle = `rgba(255, 255, 255, ${level * 0.4})`;
    crackCtx.lineWidth = 0.8;
    crackCtx.shadowBlur = 4;
    crackCtx.shadowColor = "white";

    for (let i = 0; i < 5; i++) {
      let x = (Math.sin(i * 10) * 0.5 + 0.5) * crackCanvas.width;
      let y = (Math.cos(i * 10) * 0.5 + 0.5) * crackCanvas.height;
      crackCtx.beginPath();
      crackCtx.moveTo(x, y);
      crackCtx.lineTo(x + (50 * level), y + (50 * level));
      crackCtx.stroke();
    }
    crackCtx.restore();
  }

  /* ── VINE GENERATION (SVG Path Fix) ── */
  function createVine(index) {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.cssText = "position:fixed; inset:0; pointer-events:none; z-index:99970;";
    
    // Smooth curving vines instead of blobs
    const d = `M${Math.random() * W},${Math.random() * H} Q${W/2},${H/2} ${Math.random() * W},${Math.random() * H}`;
    
    svg.innerHTML = `
      <path d="${d}" fill="none" stroke="#2d5a27" stroke-width="2" stroke-dasharray="1000" stroke-dashoffset="1000" style="transition: stroke-dashoffset 4s ease;">
        <animate attributeName="stroke-dashoffset" from="1000" to="0" dur="3s" fill="freeze" />
      </path>
      <circle r="5" fill="#9955ff" style="filter:blur(2px); opacity:0;">
        <animate attributeName="opacity" from="0" to="0.7" dur="1s" begin="2s" fill="freeze" />
      </circle>
    `;
    return svg;
  }

  /* ── ENGINE ── */
  function enterRuinMode() {
    if (ruinMode) return;
    ruinMode = true;
    initCrackCanvas();
    crackCanvas.style.opacity = "1";
    
    let step = 0;
    growTimer = setInterval(() => {
      if (step >= MAX_VINES) return clearInterval(growTimer);
      const v = createVine(step);
      document.body.appendChild(v);
      activeVines.push(v);
      drawCracks(step / MAX_VINES);
      step++;
    }, GROW_INTERVAL);

    showRestoreButton();
  }

  function showRestoreButton() {
    if (restoreBtn) return;
    restoreBtn = document.createElement('button');
    restoreBtn.innerText = "RESTORE";
    restoreBtn.style.cssText = "position:fixed; bottom:20px; left:50%; transform:translateX(-50%); z-index:99999; padding:10px 20px; background:rgba(0,0,0,0.8); color:white; border:1px solid white; cursor:pointer;";
    restoreBtn.onclick = () => location.reload(); // Simple reload to clear everything
    document.body.appendChild(restoreBtn);
  }

  function resetIdleTimer() {
    if (ruinMode) return;
    clearTimeout(idleTimer);
    idleTimer = setTimeout(enterRuinMode, IDLE_DELAY);
  }

  ['mousemove', 'click', 'keydown'].forEach(ev => document.addEventListener(ev, resetIdleTimer));
  resetIdleTimer();
})();
