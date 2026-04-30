/**
 * ═══════════════════════════════════════════════════════════
 * abandoned.js — RECURSIVE DECAY ENGINE
 * No more straight lines. No more Spirographs.
 * ═══════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  const CONFIG = {
    IDLE_TIME: 5000,        // 5s for testing
    MAX_ROOTS: 12,          // Fewer, higher-quality clusters
    BRANCH_PROB: 0.25,      // Likelihood of a vine splitting
    CRACK_COLOR: 'rgba(200, 230, 255, 0.4)',
    VINE_COLOR: '#142b0f'
  };

  let isRuined = false;
  let canvas, ctx, idleTimer;

  function initCanvas() {
    if (canvas) return;
    canvas = document.createElement('canvas');
    canvas.style.cssText = "position:fixed; inset:0; z-index:99990; pointer-events:none; mix-blend-mode:screen;";
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');
  }

  /* ── ORGANIC CREEPER LOGIC ── */
  function drawCreeper(x, y, angle, length, depth) {
    if (depth <= 0 || length < 2) return;

    // Jittered movement for "crooked" organic growth
    const nx = x + Math.cos(angle) * length;
    const ny = y + Math.sin(angle) * length;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(nx, ny);
    ctx.strokeStyle = CONFIG.VINE_COLOR;
    ctx.lineWidth = depth * 0.6;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Occasional tiny "leaves"
    if (Math.random() > 0.8) {
      ctx.fillStyle = '#2d5a27';
      ctx.beginPath();
      ctx.ellipse(nx, ny, 2, 4, angle, 0, Math.PI * 2);
      ctx.fill();
    }

    // Recursive branching
    const nextAngle = angle + (Math.random() - 0.5) * 0.4;
    const nextLen = length * (0.95 + Math.random() * 0.05);

    setTimeout(() => {
      if (Math.random() < CONFIG.BRANCH_PROB) {
        drawCreeper(nx, ny, angle + 0.5, nextLen * 0.7, depth - 1);
        drawCreeper(nx, ny, angle - 0.5, nextLen * 0.7, depth - 1);
      } else {
        drawCreeper(nx, ny, nextAngle, nextLen, depth);
      }
    }, 40); // Animated growth speed
  }

  /* ── GLASS SHATTER LOGIC ── */
  function drawCrack(x, y, angle, length, depth) {
    if (depth <= 0) return;

    const nx = x + Math.cos(angle) * length;
    const ny = y + Math.sin(angle) * length;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(nx, ny);
    ctx.strokeStyle = CONFIG.CRACK_COLOR;
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // Fractal shattering
    const branches = Math.random() > 0.8 ? 2 : 1;
    for (let i = 0; i < branches; i++) {
      drawCrack(nx, ny, angle + (Math.random() - 0.5) * 1.5, length * 0.8, depth - 1);
    }
  }

  function startDecay() {
    if (isRuined) return;
    isRuined = true;
    initCanvas();

    // 1. Shatter the screen (Instant)
    for (let i = 0; i < 4; i++) {
      drawCrack(
        Math.random() * canvas.width, 
        Math.random() * canvas.height, 
        Math.random() * Math.PI * 2, 
        40, 8
      );
    }

    // 2. Grow Vines (Animated)
    for (let i = 0; i < CONFIG.MAX_ROOTS; i++) {
      const side = Math.floor(Math.random() * 4);
      let sx, sy, sa;
      if (side === 0) { sx = Math.random() * canvas.width; sy = 0; sa = Math.PI / 2; }
      else if (side === 1) { sx = canvas.width; sy = Math.random() * canvas.height; sa = Math.PI; }
      else if (side === 2) { sx = Math.random() * canvas.width; sy = canvas.height; sa = -Math.PI / 2; }
      else { sx = 0; sy = Math.random() * canvas.height; sa = 0; }

      drawCreeper(sx, sy, sa, 15, 15);
    }

    showRestoreButton();
  }

  function showRestoreButton() {
    const btn = document.createElement('button');
    btn.innerText = "RESTORE SYSTEM";
    btn.style.cssText = `
      position: fixed; bottom: 40px; left: 50%; transform: translateX(-50%);
      z-index: 100000; padding: 10px 30px; background: rgba(0,0,0,0.8);
      color: #fff; border: 1px solid #444; font-family: monospace; 
      cursor: pointer; letter-spacing: 2px;
    `;
    btn.onclick = () => location.reload();
    document.body.appendChild(btn);
  }

  function resetTimer() {
    if (isRuined) return;
    clearTimeout(idleTimer);
    idleTimer = setTimeout(startDecay, CONFIG.IDLE_TIME);
  }

  ['mousemove', 'click', 'keydown'].forEach(ev => document.addEventListener(ev, resetTimer));
  resetTimer();
})();
