/* ═══════════════════════════════════════════════════════════
   abandoned.js — Ruins Easter Egg (Perfected Top-Down)
   ───────────────────────────────────────────────────────────
   FIXES: 
   1. Realistic Physics: Sinusoidal "sway" + gravity-driven paths.
   2. Visual Polish: Tapered thickness (thicker at top, thin at tip).
   3. Instant Restore: System appears immediately upon growth.
   4. Depth: Fixed z-index to stay strictly behind UI elements.
═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ─── SETTINGS ─── */
  const IDLE_MS      = 10 * 1000;  
  const MAX_VINES     = 12;
  const TICK_MS       = 40;     
  const STEP_PX       = 2.5; 
  const RESTORE_MS   = 1200; // Fast, snappy restore

  /* ─── STATE ─── */
  let ruinMode = false, restoring = false;
  let ruinStart = 0, lastTs = 0, idleTimer = null;
  const vines = [];
  let vineCanvas = null, vineCtx = null, currentPage = null;
  let restoreBtn = null;

  const PALETTE = [
    { p:'#4d7fff', s:'#1b4409' }, 
    { p:'#8833ee', s:'#1b4409' }, 
    { p:'#ff9bcc', s:'#1b4409' }
  ];

  /* ─── HELPERS ─── */
  const TAU = Math.PI * 2;
  const rng = (lo, hi) => lo + Math.random() * (hi - lo);
  const clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;

  /* ═══════════════════════════════════════════════
     VINE LOGIC
  ═══════════════════════════════════════════════ */
  function makeVine(W) {
    return {
      pts: [{ x: rng(50, W - 50), y: rng(-10, 20) }],
      angle: Math.PI / 2 + rng(-0.2, 0.2), // Pointing down
      phase: rng(0, TAU),        // For swaying
      swaySpeed: rng(0.02, 0.05),
      swayAmp: rng(0.1, 0.3),
      maxSteps: rng(200, 500),
      step: 0,
      alpha: 0,
      thick: rng(2, 4),
      leaves: [],
      flowers: [],
      done: false,
      restoring: false
    };
  }

  function stepVine(v) {
    if (v.done || v.restoring || v.step >= v.maxSteps) return;

    // Realistic "Wandering" Downward Path
    v.phase += v.swaySpeed;
    const sway = Math.sin(v.phase) * v.swayAmp;
    const gravity = (Math.PI / 2 - v.angle) * 0.1; // Pull back toward center-down
    v.angle += sway + gravity + rng(-0.05, 0.05);

    const last = v.pts[v.pts.length - 1];
    const nx = last.x + Math.cos(v.angle) * STEP_PX;
    const ny = last.y + Math.sin(v.angle) * STEP_PX;

    v.pts.push({ x: nx, y: ny });
    v.step++;

    // Add Foliage
    if (v.step % 12 === 0 && Math.random() > 0.4) addLeaf(v, nx, ny);
    if (v.step % 40 === 0 && Math.random() > 0.7) addFlower(v, nx, ny);
  }

  function addLeaf(v, x, y) {
    v.leaves.push({ x, y, size: rng(6, 12), rot: rng(0, TAU), t: 0 });
  }

  function addFlower(v, x, y) {
    v.flowers.push({ x, y, size: rng(4, 8), t: 0, col: PALETTE[Math.floor(Math.random() * PALETTE.length)].p });
  }

  /* ═══════════════════════════════════════════════
     RENDERING (BEHIND CONTENT)
  ═══════════════════════════════════════════════ */
  function draw(ctx) {
    ctx.clearRect(0, 0, vineCanvas.width, vineCanvas.height);
    
    vines.forEach(v => {
      if (v.pts.length < 2) return;

      // Draw Stem with Tapering
      ctx.beginPath();
      ctx.strokeStyle = '#234a14';
      ctx.lineCap = 'round';
      
      for (let i = 1; i < v.pts.length; i++) {
        const t = i / v.maxSteps;
        ctx.lineWidth = v.thick * (1 - t * 0.8); // Get thinner as it grows
        ctx.beginPath();
        ctx.moveTo(v.pts[i-1].x, v.pts[i-1].y);
        ctx.lineTo(v.pts[i].x, v.pts[i].y);
        ctx.stroke();
      }

      // Draw Leaves
      v.leaves.forEach(l => {
        if (l.t < 1) l.t += 0.05;
        ctx.save();
        ctx.translate(l.x, l.y);
        ctx.rotate(l.rot);
        ctx.scale(l.t, l.t);
        ctx.fillStyle = '#35801d';
        ctx.beginPath();
        ctx.ellipse(0, 0, l.size, l.size/2, 0, 0, TAU);
        ctx.fill();
        ctx.restore();
      });

      // Draw Flowers
      v.flowers.forEach(f => {
        if (f.t < 1) f.t += 0.03;
        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.scale(f.t, f.t);
        ctx.fillStyle = f.col;
        for(let i=0; i<5; i++) {
            ctx.rotate(TAU/5);
            ctx.beginPath();
            ctx.ellipse(f.size, 0, f.size, f.size/2, 0, 0, TAU);
            ctx.fill();
        }
        ctx.restore();
      });
    });
  }

  /* ═══════════════════════════════════════════════
     SYSTEM CONTROLS
  ═══════════════════════════════════════════════ */
  function ensureCanvas() {
    const pg = document.querySelector('.page.active') || document.body;
    if (vineCanvas && currentPage === pg) return;
    if (vineCanvas) vineCanvas.remove();

    vineCanvas = document.createElement('canvas');
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
    restoreBtn.innerHTML = "RESTORE SYSTEM";
    restoreBtn.style.cssText = `position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:9999;padding:10px 20px;background:#000;color:#fff;border:1px solid #333;cursor:pointer;opacity:0;transition:opacity 0.5s;`;
    document.body.appendChild(restoreBtn);
    restoreBtn.onclick = () => location.reload(); // Snap restore via reload
    requestAnimationFrame(() => restoreBtn.style.opacity = "1");
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
    showRestore(); // Instant appearance
    for(let i=0; i<MAX_VINES; i++) {
        setTimeout(() => {
            vines.push(makeVine(vineCanvas.width));
        }, i * 2000); // Stagger growth starts
    }
  }

  function resetIdle() {
    clearTimeout(idleTimer);
    if (!ruinMode) idleTimer = setTimeout(enterRuin, IDLE_MS);
  }

  /* ─── INIT ─── */
  ['mousemove', 'keydown', 'touchstart', 'scroll'].forEach(ev => {
    document.addEventListener(ev, () => {
        if (ruinMode) return; // Stay in ruin mode if already active
        resetIdle();
    }, {passive: true});
  });

  requestAnimationFrame(renderLoop);
  resetIdle();
})();
