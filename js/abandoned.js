/**
 * ═══════════════════════════════════════════════════════════
 * abandoned.js — THE FINAL ARCHITECTURAL OVERHAUL
 * Procedural Botanical Growth & Glass Fracture Physics
 * ═══════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  const CONFIG = {
    IDLE_TIME: 5000,           // Triggers after 5s of inactivity
    MAX_VINES: 8,              // Quality over quantity
    VINE_COLOR: '#0d1a0a',     // Deep, dark organic green
    LEAF_COLOR: '#1e3d14',     // Mossy green
    FLOWER_COLORS: ['#6a4cff', '#b388ff', '#4d88ff'],
    CRACK_COLOR: 'rgba(230, 245, 255, 0.6)',
  };

  let isRuined = false;
  let canvas, ctx, idleTimer;

  function initCanvas() {
    if (canvas) return;
    canvas = document.createElement('canvas');
    canvas.style.cssText = `
      position: fixed; inset: 0; z-index: 99999;
      pointer-events: none; mix-blend-mode: normal;
    `;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');
  }

  /* ── FRACTAL GLASS SHATTERING ── */
  function shatter(x, y, angle, length, depth) {
    if (depth <= 0) return;

    // Jagged, non-linear fracture movement
    const jitter = (Math.random() - 0.5) * 0.8;
    const nx = x + Math.cos(angle + jitter) * length;
    const ny = y + Math.sin(angle + jitter) * length;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(nx, ny);
    ctx.strokeStyle = CONFIG.CRACK_COLOR;
    ctx.lineWidth = depth * 0.3;
    ctx.setLineDash([Math.random() * 5, Math.random() * 2]); // Micro-fracture texture
    ctx.stroke();
    ctx.setLineDash([]); 

    // Recursive splintering
    const branches = Math.random() > 0.8 ? 2 : 1;
    for (let i = 0; i < branches; i++) {
      setTimeout(() => {
        shatter(nx, ny, angle + (Math.random() - 0.5) * 2, length * 0.7, depth - 1);
      }, 20);
    }
  }

  /* ── PROCEDURAL VINE GROWTH (L-SYSTEM) ── */
  function growVine(x, y, angle, length, depth) {
    if (depth <= 0) return;

    const nx = x + Math.cos(angle) * length;
    const ny = y + Math.sin(angle) * length;

    // Draw the woody stem
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(
      x + Math.random() * 10, y + Math.random() * 10,
      nx - Math.random() * 10, ny - Math.random() * 10,
      nx, ny
    );
    ctx.strokeStyle = CONFIG.VINE_COLOR;
    ctx.lineWidth = depth * 0.8;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Add Leaves/Moss
    if (depth < 12 && Math.random() > 0.6) {
      drawLeaf(nx, ny, angle);
    }

    // Add Flowers at tips
    if (depth === 1) {
      drawFlower(nx, ny);
    }

    // Recursive logic with "gravity" and "seeking"
    const nextAngle = angle + (Math.random() - 0.5) * 0.5;
    const nextLen = length * 0.98;

    setTimeout(() => {
      // Branching probability
      if (Math.random() > 0.92 && depth > 5) {
        growVine(nx, ny, angle + 0.6, nextLen, depth - 1);
        growVine(nx, ny, angle - 0.6, nextLen, depth - 1);
      } else {
        growVine(nx, ny, nextAngle, nextLen, depth - 1);
      }
    }, 30);
  }

  function drawLeaf(x, y, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle + Math.PI / 2);
    ctx.beginPath();
    ctx.ellipse(0, 0, 2, 5, 0, 0, Math.PI * 2);
    ctx.fillStyle = CONFIG.LEAF_COLOR;
    ctx.fill();
    ctx.restore();
  }

  function drawFlower(x, y) {
    const color = CONFIG.FLOWER_COLORS[Math.floor(Math.random() * CONFIG.FLOWER_COLORS.length)];
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = color;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  /* ── ENGINE CONTROL ── */
  function startDecay() {
    if (isRuined) return;
    isRuined = true;
    initCanvas();

    // 1. Initial Glass Impact
    for (let i = 0; i < 3; i++) {
      shatter(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 6, 50, 10);
    }

    // 2. Botanical Takeover
    const origins = [
      { x: 0, y: 0, a: 0.8 }, { x: canvas.width, y: 0, a: 2.3 },
      { x: 0, y: canvas.height, a: -0.8 }, { x: canvas.width, y: canvas.height, a: -2.3 }
    ];

    origins.forEach((o, i) => {
      setTimeout(() => growVine(o.x, o.y, o.a, 12, 25), i * 1000);
    });

    showRestore();
  }

  function showRestore() {
    const btn = document.createElement('button');
    btn.innerHTML = "RESTORE SYSTEM";
    btn.style.cssText = `
      position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
      z-index: 1000000; padding: 12px 30px; background: rgba(0,0,0,0.9);
      color: #fff; border: 1px solid #333; font-family: 'Courier New', monospace;
      cursor: pointer; letter-spacing: 4px; font-size: 10px; transition: 0.3s;
    `;
    btn.onmouseover = () => btn.style.borderColor = '#fff';
    btn.onmouseout = () => btn.style.borderColor = '#333';
    btn.onclick = () => location.reload();
    document.body.appendChild(btn);
  }

  function resetTimer() {
    if (isRuined) return;
    clearTimeout(idleTimer);
    idleTimer = setTimeout(startDecay, CONFIG.IDLE_TIME);
  }

  ['mousemove', 'keydown', 'click'].forEach(e => document.addEventListener(e, resetTimer));
  resetTimer();
})();
