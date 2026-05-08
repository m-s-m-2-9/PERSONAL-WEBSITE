/* ═══════════════════════════════════════════════════════════
   js/core/cursor.js
   ─────────────────────────────────────────────────────────
   WHAT IS HERE:
     - Custom cursor dot + ring that follow the mouse
     - Touch device detection — hides cursor on mobile
     - Hover / text cursor state classes on body
   LOADED BY: main.js (core group)
═══════════════════════════════════════════════════════════ */
 
/* ═══════════════════════════════════════════════════════════
   CUSTOM CURSOR
═══════════════════════════════════════════════════════════ */
const dot  = document.getElementById('cursor-dot');
const ring = document.getElementById('cursor-ring');
const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
 
if (isTouchDevice) {
  document.body.style.cursor = 'auto';
  if (dot)  { dot.style.display  = 'none'; }
  if (ring) { ring.style.display = 'none'; }
} else {
  let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0;
 
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (dot) {
      dot.style.left = mouseX + 'px';
      dot.style.top  = mouseY + 'px';
    }
  });
 
  (function animateRing() {
    ringX += (mouseX - ringX) * 0.12;
    ringY += (mouseY - ringY) * 0.12;
    if (ring) {
      ring.style.left = ringX + 'px';
      ring.style.top  = ringY + 'px';
    }
    requestAnimationFrame(animateRing);
  })();
 
  document.querySelectorAll('a, button, .game-card, .album-card, .belief-card, .year-node, .profile-item')
    .forEach(el => {
      el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
      el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });
 
  document.querySelectorAll('input, textarea')
    .forEach(el => {
      el.addEventListener('mouseenter', () => document.body.classList.add('cursor-text'));
      el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-text'));
    });
}
