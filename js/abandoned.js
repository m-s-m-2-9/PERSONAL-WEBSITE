/**
 * ═══════════════════════════════════════════════════════════
 * abandoned.js — FINAL CINEMATIC DECAY
 * Procedural Ivy Growth + Fractal Glass Shattering
 * ═══════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  const CONFIG = {
    IDLE_TIME: 5000,
    MAX_VINES: 10,
    VINE_COLOR: '#0d1a0a',   // Deep dark wood
    LEAF_COLOR: '#1e3d14',   // Mossy green
    CRACK_COLOR: 'rgba(200, 220, 240, 0.4)', // Etched glass
  };

  let isRuined = false;
  let canvas, ctx, idleTimer;

  function initCanvas() {
    if (canvas) return;
    canvas = document.createElement('canvas');
    canvas.style.cssText = "position:fixed; inset:0; z-index:99999; pointer-events:none; mix-blend-mode:normal;";
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');
  }

  /* ── BOTANICAL GROWTH ── */
  function growIvy(x, y, angle, length, depth, thickness) {
    if (depth <= 0 || thickness < 0.1) return;

    // Organic "wobble"
    const nx = x + Math.cos(angle) * length;
    const ny = y + Math.sin(angle) * length;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(nx, ny);
    ctx.strokeStyle = CONFIG.VINE_COLOR;
    ctx.lineWidth = thickness;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Leaf clusters (only on outer branches)
    if (depth < 10 && Math.random() > 0.6) {
      ctx.fillStyle = CONFIG.LEAF_COLOR;
      for (let i = 0; i < 3; i++) {
        const lx = nx + (Math.random() - 0.5) * 10;
        const ly = ny + (Math.random() - 0.5) * 10;
        ctx.beginPath();
        ctx.ellipse(lx, ly, 2, 4, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Branching Logic
    const nextAngle = angle + (Math.random() - 0.5) * 0.4;
    setTimeout(() => {
      if (Math.random() > 0.85 && depth > 5) {
        // Split into two
        growIvy(nx, ny, angle + 0.5, length * 0.9, depth - 1, thickness * 0.8);
        growIvy(nx, ny, angle - 0.5, length * 0.9, depth - 1, thickness * 0.8);
      } else {
        // Keep growing straight
        growIvy(nx, ny, nextAngle, length * 0.98, depth - 1, thickness * 0.95);
      }
    }, 30);
  }

  /* ── GLASS PHYSICS ── */
  function shatter(x, y, angle, length, depth) {
    if (depth <= 0) return;
    const nx = x + Math.cos(angle) * length;
    const ny = y + Math.sin(angle) * length;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(nx, ny);
    ctx.strokeStyle = CONFIG.CRACK_COLOR;
    ctx.lineWidth = 0.5;
    ctx.stroke();

    if (Math.random() > 0.7) {
      shatter(nx, ny, angle + (Math.random() - 0.5) * 2, length * 0.8, depth - 1);
    }
    shatter(nx, ny, angle + (Math.random() - 0.5) * 0.5, length * 0.8, depth - 1);
  }

  function startRuin() {
    if (isRuined) return;
    isRuined = true;
    initCanvas();

    // Shatter points
    for (let i = 0; i < 3; i++) {
      shatter(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 6, 30, 8);
    }

    // Ivy start points (Corners)
    const corners = [
      {x:0, y:0, a: 0.8}, {x:canvas.width, y:0, a: 2.3},
      {x:0, y:canvas.height, a: -0.8}, {x:canvas.width, y:canvas.height, a: -2.3}
    ];

    corners.forEach(c => growIvy(c.x, c.y, c.a, 15, 25, 5));
    showRestore();
  }

  function showRestore() {
    const btn = document.createElement('button');
    btn.innerText = "RESTORE SYSTEM";
    btn.style.cssText = `
      position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
      z-index: 100000; padding: 10px 25px; background: rgba(0,0,0,0.8);
      color: #fff; border: 1px solid #333; font-family: monospace; cursor: pointer;
    `;
    btn.onclick = () => location.reload();
    document.body.appendChild(btn);
  }

  function resetTimer() {
    if (isRuined) return;
    clearTimeout(idleTimer);
    idleTimer = setTimeout(startRuin, CONFIG.IDLE_TIME);
  }

  ['mousemove', 'keydown', 'click'].forEach(e => document.addEventListener(e, resetTimer));
  resetTimer();
})();
