/* ═══════════════════════════════════════════════════════════
   js/core/theme.js
   ─────────────────────────────────────────────────────────
   WHAT IS HERE:
     - setTheme()  — applies a theme and saves it to localStorage
     - IIFE        — restores the saved theme on page load
   LOADED BY: main.js (second, so theme applies before anything renders)
═══════════════════════════════════════════════════════════ */
 
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.querySelectorAll('.theme-dot').forEach(d => {
    d.classList.toggle('active', d.dataset.t === theme);
  });
  localStorage.setItem('msm-theme', theme);
}
 
(function () {
  const saved = localStorage.getItem('msm-theme');
  if (saved) setTheme(saved);
})();
