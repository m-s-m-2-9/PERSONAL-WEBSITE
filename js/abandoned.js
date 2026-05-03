(function () {
  'use strict';

  /* ─── SETTINGS ─── */
  const IDLE_MS      = 10 * 1000;  
  const MAX_VINES     = 10;
  const TICK_MS       = 40;     
  const STEP_PX       = 2.2; 

  /* ─── STATE ─── */
  let ruinMode = false, restoring = false;
  let ruinStart = 0, lastTs = 0, idleTimer = null;
  const vines = [];
  let vineCanvas = null, vineCtx = null, currentPage = null;
  let restoreBtn = null;

  /* ─── ORIGINAL DESIGN PALETTES ─── */
  const PALETTES = {
    dark:   [{ p:'#4d7fff', c:'#cce' }, { p:'#8833ee', c:'#edd' }, { p:'#2299dd', c:'#cef' }],
    light:  [{ p:'#ff9bcc', c:'#fff' }, { p:'#ffbb44', c:'#ffe' }, { p:'#ee6699', c:'#fee' }],
  };

  function getPalette() {
    const t = document.documentElement.getAttribute('data-theme') || 'dark';
    return PALETTES[t] || PALETTES.dark;
  }

  const TAU = Math.PI * 2;
  const rng = (lo, hi) => lo + Math.random() * (hi - lo);
  const clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;

  /* ═══════════════════════════════════════════════
     REALISTIC TOP-DOWN PHYSICS
  ═══════════════════════════════════════════════ */
  function makeVine(W, idx) {
    const palette = getPalette();
    return {
      pts: [{ x: rng(50, W - 50), y: rng(60, 90) }], // Start below nav
      angle: Math.PI / 2 + rng(-0.1, 0.1),
      phase: rng(0, TAU),
      swaySpeed: rng(0.01, 0.03),
      swayAmp: rng(0.05, 0.15),
      maxSteps: rng(250, 450),
      step: 0,
      alpha: 0,
      thick: rng(1.2, 2.2),
      col: palette[idx % palette.length],
      leaves: [],
      flowers: [],
      done: false
    };
  }

  function stepVine(v) {
    if (v.done || v.step >= v.maxSteps) return;

    v.phase += v.swaySpeed;
    const sway = Math.sin(v.phase) * v.swayAmp;
    const gravity = (Math.PI / 2 - v.angle) * 0.08; 
    v.angle += sway + gravity + rng(-0.02, 0.02);

    const last = v.pts[v.pts.length - 1];
    const nx = last.x + Math.cos(v.angle) * STEP_PX;
    const ny = last.y + Math.sin(v.angle) * STEP_PX;

    v.pts.push({ x: nx, y: ny });
    v.step++;

    if (v.step % 10 === 0 && Math.random() > 0.3) {
      const side = v.leaves.length % 2 === 0 ? 1 : -1;
      v.leaves.push({ x: nx, y: ny, size: rng(8, 14), t: 0, side });
    }
    if (v.step % 35 === 0 && Math.random() > 0.8) {
      v.flowers.push({ x: nx, y: ny, t: 0, petals: Math.floor(rng(5, 7)) });
    }
  }

  /* ═══════════════════════════════════════════════
     ORIGINAL VISUAL STYLE (RESTORED)
  ═══════════════════════════════════════════════ */
  function draw(ctx) {
    ctx.clearRect(0, 0, vineCanvas.width, vineCanvas.height);
    vines.forEach(v => {
      if (v.alpha < 0.9) v.alpha += 0.005;
      
      // Stem
      ctx.save();
      ctx.globalAlpha = v.alpha;
      ctx.lineCap = 'round';
      for (let i = 1; i < v.pts.length; i++) {
        const t = i / v.maxSteps;
        ctx.lineWidth = v.thick * (1 - t * 0.5);
        ctx.strokeStyle = '#1b4409';
        ctx.beginPath(); ctx.moveTo(v.pts[i-1].x, v.pts[i-1].y);
        ctx.lineTo(v.pts[i].x, v.pts[i].y); ctx.stroke();
      }

      // Leaves (Original Design)
      v.leaves.forEach(lf => {
        if (lf.t < 1) lf.t += 0.02;
        ctx.fillStyle = '#286514';
        ctx.beginPath();
        ctx.ellipse(lf.x, lf.y, lf.size * lf.t, (lf.size/2) * lf.t, lf.side, 0, TAU);
        ctx.fill();
      });

      // Flowers (Original Design)
      v.flowers.forEach(fl => {
        if (fl.t < 1) fl.t += 0.01;
        ctx.fillStyle = v.col.p;
        for(let i=0; i<fl.petals; i++) {
          const ang = (i/fl.petals) * TAU;
          ctx.beginPath();
          ctx.arc(fl.x + Math.cos(ang)*5*fl.t, fl.y + Math.sin(ang)*5*fl.t, 4*fl.t, 0, TAU);
          ctx.fill();
        }
      });
      ctx.restore();
    });
  }

  /* ═══════════════════════════════════════════════
     CANVAS & ORIGINAL RESTORE BUTTON
  ═══════════════════════════════════════════════ */
  function ensureCanvas() {
    const pg = document.querySelector('.page.active') || document.body;
    if (vineCanvas && currentPage === pg) return;
    if (vineCanvas) vineCanvas.remove();
    vineCanvas = document.createElement('canvas');
    // Pin to background
    vineCanvas.style.cssText = `position:absolute;top:0;left:0;width:100%;height:100%;z-index:-1;pointer-events:none;`;
    pg.appendChild(vineCanvas);
    vineCanvas.width = pg.clientWidth;
    vineCanvas.height = pg.scrollHeight;
    vineCtx = vineCanvas.getContext('2d');
    currentPage = pg;
  }

  function showRestore() {
    if (restoreBtn) return;
    restoreBtn = document.createElement('button');
    restoreBtn.className = 'ruins-restore-btn visible'; // Uses your original CSS class
    restoreBtn.innerHTML = '<span class="ruins-restore-text">RESTORE SYSTEM</span>';
    document.body.appendChild(restoreBtn);
    restoreBtn.onclick = () => { location.reload(); };
  }

  function renderLoop(ts) {
    if (ruinMode) {
      vines.forEach(v => stepVine(v));
      draw(vineCtx);
    }
    requestAnimationFrame(renderLoop);
  }

  function enterRuin() {
    if (ruinMode) return;
    ruinMode = true;
    ensureCanvas();
    showRestore(); // Appears immediately
    for(let i=0; i<MAX_VINES; i++) {
      setTimeout(() => vines.push(makeVine(vineCanvas.width, i)), i * 1500);
    }
  }

  function resetIdle() {
    clearTimeout(idleTimer);
    if (!ruinMode) idleTimer = setTimeout(enterRuin, IDLE_MS);
  }

  ['mousemove', 'keydown', 'touchstart', 'scroll'].forEach(ev => {
    document.addEventListener(ev, () => { if (!ruinMode) resetIdle(); }, {passive: true});
  });

  requestAnimationFrame(renderLoop);
  resetIdle();
})();
