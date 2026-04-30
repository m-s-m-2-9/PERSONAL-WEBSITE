/* ═════════════════════════════════════════════
   ABANDONED WEBSITE MODE
═════════════════════════════════════════════ */

(function () {

  const IDLE_TIME = 15000; // 15 sec (change to 600000 later)

  let idleTimer;
  let active = false;

  const overlay = document.getElementById('abandoned-overlay');
  const canvas = document.getElementById('abandoned-cracks');
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  resize();
  window.addEventListener('resize', resize);

  /* ───── CRACK GENERATOR ───── */

  function drawCrack(x, y, length, branches = 3) {
    ctx.strokeStyle = 'rgba(200,220,255,0.5)';
    ctx.lineWidth = 1;

    for (let i = 0; i < branches; i++) {
      let angle = Math.random() * Math.PI * 2;
      let px = x;
      let py = y;

      ctx.beginPath();
      ctx.moveTo(px, py);

      for (let j = 0; j < length; j++) {
        px += Math.cos(angle) * (5 + Math.random() * 10);
        py += Math.sin(angle) * (5 + Math.random() * 10);

        ctx.lineTo(px, py);

        angle += (Math.random() - 0.5) * 0.5;
      }

      ctx.stroke();
    }
  }

  function generateCracks() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 5; i++) {
      drawCrack(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        10 + Math.random() * 20,
        4
      );
    }
  }

  /* ───── ACTIVATE ───── */

  function activate() {
    if (active) return;
    active = true;

    overlay.classList.add('active');

    setTimeout(generateCracks, 800);
  }

  /* ───── DEACTIVATE ───── */

  function deactivate() {
    active = false;
    overlay.classList.remove('active');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  /* ───── IDLE DETECTION ───── */

  function resetTimer() {
    clearTimeout(idleTimer);

    if (active) deactivate();

    idleTimer = setTimeout(activate, IDLE_TIME);
  }

  ['mousemove','click','scroll','keydown','touchstart']
    .forEach(e => document.addEventListener(e, resetTimer, { passive: true }));

  resetTimer();

})();
