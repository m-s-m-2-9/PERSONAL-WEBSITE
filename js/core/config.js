/* ═══════════════════════════════════════════════════════════
   js/core/config.js
   ─────────────────────────────────────────────────────────
   WHAT IS HERE:
     - CONFIG object  (master password, EmailJS keys)
     - EmailJS initialisation
     - Netlify Identity login redirect
   LOADED BY: main.js (first, before all other modules)
═══════════════════════════════════════════════════════════ */
 
const CONFIG = {
  MASTER_PASSWORD:    "manomay2026",
  EMAILJS_PUBLIC_KEY: "YOUR_PUBLIC_KEY",
  EMAILJS_SERVICE_ID: "YOUR_SERVICE_ID",
  EMAILJS_TEMPLATE_ID:"YOUR_TEMPLATE_ID",
};
 
emailjs.init(CONFIG.EMAILJS_PUBLIC_KEY);
 
if (window.netlifyIdentity) {
  window.netlifyIdentity.on("init", user => {
    if (!user) {
      window.netlifyIdentity.on("login", () => {
        document.location.href = "/admin/";
      });
    }
  });
}
