(function () {
  const IDLE_TIME = 15000;

  let idleTimer, active = false;

  const overlay = document.getElementById('abandoned-overlay');
  const canvas = document.getElementById('abandoned-cracks');
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  function crack(x, y) {
    ctx.strokeStyle = getComputedStyle(document.documentElement)
      .getPropertyValue('--ruin-color') || 'rgba(200,220,255,0.5)';

    ctx.lineWidth = 1;

    for (let i = 0; i < 4; i++) {
      let angle = Math.random() * Math.PI * 2;
      let px = x, py = y;

      ctx.beginPath();
      ctx.moveTo(px, py);

      for (let j = 0; j < 12; j++) {
        px += Math.cos(angle) * 8;
        py += Math.sin(angle) * 8;
        ctx.lineTo(px, py);
        angle += (Math.random() - 0.5) * 0.5;
      }

      ctx.stroke();
    }
  }

  function generate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < 6; i++) {
      crack(Math.random()*canvas.width, Math.random()*canvas.height);
    }
  }

  function activate() {
    if (active) return;
    active = true;
    overlay.classList.add('active');
    setTimeout(generate, 600);
  }

  function deactivate() {
    active = false;
    overlay.classList.remove('active');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function reset() {
    clearTimeout(idleTimer);
    if (active) deactivate();
    idleTimer = setTimeout(activate, IDLE_TIME);
  }

  ['mousemove','click','scroll','keydown','touchstart']
    .forEach(e => document.addEventListener(e, reset, { passive: true }));

  reset();
})();
