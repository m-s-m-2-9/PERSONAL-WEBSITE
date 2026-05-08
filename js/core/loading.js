/* ═══════════════════════════════════════════════════════════
   js/core/loading.js
   ─────────────────────────────────────────────────────────
   WHAT IS HERE:
     - window load event  — animates the loading screen bar
       and calls startHeroAnimations() when complete
     - startHeroAnimations() — reveals the hero name parts,
       tagline, nav hint and scroll indicator with timing
   LOADED BY: main.js (core group)
═══════════════════════════════════════════════════════════ */
 
/* ═══════════════════════════════════════════════════════════
   LOADING SCREEN
═══════════════════════════════════════════════════════════ */
window.addEventListener("load", () => {
  const loadingScreen = document.getElementById("loading-screen");
  const bar = document.getElementById("loading-bar");
  const pct = document.getElementById("loading-pct");
 
  loadingScreen.classList.add("ready");
 
  let progress = 0;
 
  const interval = setInterval(() => {
    progress += Math.random() * 15;
 
    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);
 
      setTimeout(() => {
        loadingScreen.classList.add("done");
        startHeroAnimations();
      }, 300);
    }
 
    bar.style.width = progress + "%";
    pct.textContent = Math.floor(progress) + "%";
  }, 160);
});
 
/* ═══════════════════════════════════════════════════════════
   HERO ANIMATIONS
═══════════════════════════════════════════════════════════ */
function startHeroAnimations() {
  const nameParts = [
    document.getElementById('name-part-1'),
    document.getElementById('name-part-2'),
    document.getElementById('name-part-3')
  ];
 
  let currentHighlight = parseInt(localStorage.getItem("heroHighlightIndex")) || 0;
 
  nameParts.forEach(el => {
    if (el) el.classList.remove("highlight");
  });
 
  nameParts.forEach((el, i) => {
    setTimeout(() => {
      if (!el) return;
      if (i === currentHighlight) {
        el.classList.add("highlight");
      }
      requestAnimationFrame(() => {
        el.classList.add("visible");
      });
    }, i * 150 + 200);
  });
 
  let nextIndex = (currentHighlight + 1) % 3;
  localStorage.setItem("heroHighlightIndex", nextIndex);
 
  setTimeout(() => {
    document.getElementById('hero-tagline')?.classList.add('visible');
  }, 800);
 
  setTimeout(() => {
    document.getElementById('hero-nav-hint')?.classList.add('visible');
  }, 1000);
 
  setTimeout(() => {
    document.getElementById('scroll-indicator')?.classList.add('visible');
  }, 1200);
}
