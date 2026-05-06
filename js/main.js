/* ═══════════════════════════════════════════════════════════
   main.js — Core site logic
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
 
/* ═══════════════════════════════════════════════════════════
   THEME SWITCHER
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
 
/* ═══════════════════════════════════════════════════════════
   NAV SCROLL EFFECT
═══════════════════════════════════════════════════════════ */
document.querySelectorAll('.page').forEach(page => {
  page.addEventListener('scroll', () => {
    document.getElementById('nav').classList.toggle('scrolled', page.scrollTop > 60);
  }, { passive: true });
});
 
/* ═══════════════════════════════════════════════════════════
   PAGE NAVIGATION
═══════════════════════════════════════════════════════════ */
let currentPage = 'home';
const overlay   = document.getElementById('transition-overlay');
 
function navigateTo(pageId) {
  if (pageId === currentPage) return;
  // Push state for mobile hardware back-button support
  history.pushState({ page: pageId, prev: currentPage }, '', '#' + pageId);
  doTransition(pageId);
}
 
function doTransition(pageId) {
  overlay.style.transition      = 'transform 0.4s cubic-bezier(0.76, 0, 0.24, 1)';
  overlay.style.transformOrigin = 'bottom';
  overlay.style.transform       = 'scaleY(1)';
 
  setTimeout(() => {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active', 'exit-up'));
    const next = document.getElementById('page-' + pageId);
    if (next) {
      next.classList.add('active');
      next.scrollTop = 0;
    }
    currentPage = pageId;
    updateNavActive(pageId);
 
    setTimeout(() => {
      overlay.style.transition      = 'transform 0.5s cubic-bezier(0.76, 0, 0.24, 1)';
      overlay.style.transformOrigin = 'top';
      overlay.style.transform       = 'scaleY(0)';
      setTimeout(() => triggerPageReveals(pageId), 100);
    }, 60);
  }, 420);
}
 
function updateNavActive(pageId) {
  const map = {
    home:'Home', about:'Identity', photos:'Photos', resume:'CV',
    projects:'Projects', profiles:'Profiles', journey:'Journey', birthday:'Clock',
    thoughts:'Thoughts', contact:'Contact', lists:'Lists',
    skills:'Traits', games:'Games', social:'Social'
  };
  document.querySelectorAll('#nav-links a').forEach(a => {
    a.classList.remove('active');
    if (a.textContent.trim().startsWith(map[pageId] || '')) a.classList.add('active');
  });
}
 
/* ═══════════════════════════════════════════════════════════
   MOBILE HISTORY API — Hardware / Gesture Back Button Support
   ─────────────────────────────────────────────────────────
   On Android and iOS gesture-back, the popstate event fires.
   Priority order:
     1. Close any open modal/overlay (belief, photo, game, gate)
     2. Navigate to the previous main page
     3. Fall back to Home
═══════════════════════════════════════════════════════════ */
 
// Stamp the initial state so we always have something to pop back to
history.replaceState({ page: 'home', prev: null }, '', '#home');
 
window.addEventListener('popstate', (e) => {
 
  // ── 1. Belief / Thoughts sub-section ──
  const beliefView = document.getElementById('belief-post-view');
  if (beliefView && beliefView.classList.contains('active')) {
    closeBelief();
    // Re-push so the next back press goes to the previous main page
    history.pushState({ page: currentPage, prev: null }, '', '#' + currentPage);
    return;
  }
 
  // ── 2. Photo viewer ──
  const photoViewer = document.getElementById('photo-viewer');
  if (photoViewer && photoViewer.classList.contains('open')) {
    closeViewer();
    history.pushState({ page: currentPage, prev: null }, '', '#' + currentPage);
    return;
  }
 
  // ── 3. Game modal ──
  const gameModal = document.getElementById('game-modal');
  if (gameModal && gameModal.classList.contains('open')) {
    closeGame();
    history.pushState({ page: currentPage, prev: null }, '', '#' + currentPage);
    return;
  }
 
  // ── 4. Password gate ──
  const gate = document.getElementById('password-gate');
  if (gate && gate.classList.contains('visible')) {
    closeGate();
    history.pushState({ page: currentPage, prev: null }, '', '#' + currentPage);
    return;
  }
 
  // ── 5. Music panel ──
  const mp = document.getElementById('music-panel');
  if (mp && mp.classList.contains('open')) {
    closeMusicPanel();
    history.pushState({ page: currentPage, prev: null }, '', '#' + currentPage);
    return;
  }
 
  // ── 6. Main page navigation ──
  if (e.state && e.state.page) {
    const target = e.state.page;
    if (target !== currentPage) {
      doTransition(target);
    }
  } else {
    // No recorded state — return home
    doTransition('home');
  }
});
 
/* ═══════════════════════════════════════════════════════════
   SCROLL-TRIGGERED REVEALS
═══════════════════════════════════════════════════════════ */
function triggerPageReveals(pageId) {
  const page = document.getElementById('page-' + pageId);
  if (!page) return;
 
  const reveals = page.querySelectorAll('.reveal');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        obs.unobserve(entry.target);
      }
    });
  }, { root: page, threshold: 0.1 });
 
  reveals.forEach(el => obs.observe(el));
  if (pageId === 'skills') setTimeout(() => animateSkillBars(page), 400);
}
 
function animateSkillBars(page) {
  page.querySelectorAll('.skill-item').forEach(item => item.classList.add('animated'));
}
 
setTimeout(() => triggerPageReveals('home'), 1500);
 
/* ═══════════════════════════════════════════════════════════
   PASSWORD SYSTEM
═══════════════════════════════════════════════════════════ */
let gateTargetPage = null;
 
function unlockSection(inputId, contentId) {
  const input   = document.getElementById(inputId);
  const content = document.getElementById(contentId);
  if (!input || !content) return;
 
  if (input.value === CONFIG.MASTER_PASSWORD) {
    content.classList.add('unlocked');
    content.style.display = 'block';
    const form = input.closest('.inline-password-form');
    if (form) { form.style.opacity = '0.3'; form.style.pointerEvents = 'none'; }
  } else {
    input.classList.add('error');
    input.value       = '';
    input.placeholder = 'Wrong password ✗';
    setTimeout(() => {
      input.classList.remove('error');
      input.placeholder = 'password';
    }, 1500);
  }
}
 
function tryLockedPage(pageId) {
  gateTargetPage = pageId;
  document.getElementById('password-gate').classList.add('visible');
  setTimeout(() => document.getElementById('gate-input').focus(), 300);
}
 
function closeGate() {
  document.getElementById('password-gate').classList.remove('visible');
  document.getElementById('gate-input').value = '';
  document.getElementById('gate-error').classList.remove('show');
  gateTargetPage = null;
}
 
function submitGate() {
  const input  = document.getElementById('gate-input');
  const target = gateTargetPage;
  if (input.value === CONFIG.MASTER_PASSWORD) {
    closeGate();
    if (target) doTransition(target);
  } else {
    input.classList.add('error');
    document.getElementById('gate-error').classList.add('show');
    input.value = '';
    setTimeout(() => input.classList.remove('error'), 500);
  }
}
 
document.getElementById('gate-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') submitGate();
});
 
/* ═══════════════════════════════════════════════════════════
   MOBILE NAV
═══════════════════════════════════════════════════════════ */
let mobileNavOpen = false;
function toggleMobileNav() {
  mobileNavOpen = !mobileNavOpen;
  document.getElementById('mobile-nav').classList.toggle('open', mobileNavOpen);
  document.getElementById('hamburger').classList.toggle('open', mobileNavOpen);
}
 
/* ═══════════════════════════════════════════════════════════
   BIRTHDAY TIMER
═══════════════════════════════════════════════════════════ */
function updateBirthdayTimer() {
  const now = new Date();
 
  // ╔══════════════════════════════════════════════════════════════╗
  // ║  BIRTHDAY TESTING TOGGLE                                     ║
  // ║  To simulate August 29th immediately for testing:            ║
  // ║  1. Comment out the `const checkDate = now;` line below.     ║
  // ║  2. Uncomment the OVERRIDE line directly beneath it.         ║
  // ║  Remember to revert before deploying to production.          ║
  // ╠══════════════════════════════════════════════════════════════╣
  const checkDate = now;
  // OVERRIDE ↓ Uncomment to test birthday state instantly:
  //const checkDate = new Date(now.getFullYear(), 7, 29, 13, 0, 0);
  // ╚══════════════════════════════════════════════════════════════╝
 
  const isBirthday = checkDate.getMonth() === 7 && checkDate.getDate() === 29;
 
  let nextBirthday = new Date(now.getFullYear(), 7, 29, 13, 0, 0);
  if (now > nextBirthday) nextBirthday = new Date(now.getFullYear() + 1, 7, 29, 13, 0, 0);
 
  const diff    = nextBirthday - now;
  const days    = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours   = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  const ms      = diff % 1000;
  const pad     = (n, len = 2) => String(n).padStart(len, '0');
 
  document.getElementById('bd-days').textContent  = pad(days, 3);
  document.getElementById('bd-hours').textContent = pad(hours);
  document.getElementById('bd-mins').textContent  = pad(minutes);
  document.getElementById('bd-secs').textContent  = pad(seconds);
  document.getElementById('bd-ms').textContent    = pad(ms, 3) + ' ms';
 
  const born = new Date(2008, 7, 29);
  let age = now.getFullYear() - born.getFullYear();
  if (now < new Date(now.getFullYear(), born.getMonth(), born.getDate())) age--;
  const ageEl = document.getElementById('current-age');
  if (ageEl) ageEl.textContent = age + ' years old';
 
  // ── Birthday banner injection ──────────────────────────────────
  // Inserts "WISH MANOMAY SHAILENDRA MISRA" below the milliseconds
  // display only on August 29th. Clicking routes to the Contact page.
  const existingBanner = document.getElementById('birthday-wish-banner');
  if (isBirthday) {
    if (!existingBanner) {
      const banner       = document.createElement('div');
      banner.id          = 'birthday-wish-banner';
      banner.className   = 'birthday-wish-text';
      banner.textContent = 'WISH MANOMAY SHAILENDRA MISRA';
      banner.title       = 'Send a message';
      banner.addEventListener('click', () => navigateTo('contact'));
      const msEl = document.getElementById('bd-ms');
      if (msEl && msEl.parentNode) {
        msEl.parentNode.insertAdjacentElement('afterend', banner);
      }
    }
    // Activate full-page birthday aesthetic
    document.body.classList.add('birthday-mode');
  } else {
    if (existingBanner) existingBanner.remove();
    document.body.classList.remove('birthday-mode');
  }
}
 
setInterval(updateBirthdayTimer, 10);
updateBirthdayTimer();
 
/* ═══════════════════════════════════════════════════════════
   YEAR JOURNEY TIMELINE
═══════════════════════════════════════════════════════════ */
const yearData = {
  2008: { title: "The Beginning", body: "The story begins in the humid, electric atmosphere of Maharashtra, my entry into the world was marked by a setting defined by contrast—where the old soul of India meets the relentless ambition of its financial heart. From the very first day, my life was positioned at the intersection of diverse cultures and high expectations. Even though these early months are a blur of sensory memories, they established the -Nomadic- blueprint of my life. I was born into a family that valued education and presence, setting the stage for a boy who would eventually grow to command rooms and lead institutions." },
  2009: { title: "Year One", body: "Before the constant moves and the changing cities, 2009 was a year of profound, silent growth. This was the period where my internal world began to synthesize the environment around me. Living in the wake of the vibrant energy of Mumbai and Lucknow, I was a child developing an early sense of observation—the -Old Soul- beginning to peak through. While most children at this age are simply reacting to stimuli, I was absorbing the rhythms of a household that valued structure and discipline. This year was the silent foundation; it was the quiet before the journey of moving across India began." },
  2010: { title: "Growing Up", body: "In 2010, the nomadic cycle that would define my childhood truly began with a significant move to Jaipur, the Pink City. This was my first major geographical shift, triggered by my father's transfer, and it marked the beginning of my deep connection with the regal aesthetics of Rajasthan. Joining Star Kids Pre-school in the playgroup section was my first introduction to a social ecosystem outside of my family. It was here that I first learned the art of real presence." },
  2011: { title: "Discovery", body: "2011 was the year I proved that the -Standard Path- was never meant for me. Entering Junior KG, I quickly realized that I was processing information and navigating social hierarchies at a different velocity than those around me. My teachers at the time recognized a rare combination of discipline, high IQ, and a raw, intrinsic motivation to excel that was far beyond my years. This led to a double promotion—an academic leap that saw me move from LKG to UKG in a mere six months." },
  2012: { title: "Early Years", body: "By 2012, I had solidified my position as the -Gold Standard- of my peer group. Completing my half-promotion into UKG, I secured the 1st Rank for outstanding academic and behavioral performance. However, the true significance of this year was my father being honored with the -Best Father Award- by the entire school community. This was a moment of immense pride, reinforcing the idea that my name was attached to impact and excellence." },
  2013: { title: "Shifting",       body: "xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz. — REPLACE" },
  2014: { title: "New Ground",     body: "xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz. — REPLACE" },
  2015: { title: "The Turn",       body: "xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz. — REPLACE" },
  2016: { title: "Momentum",       body: "xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz. — REPLACE" },
  2017: { title: "Building",       body: "xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz. — REPLACE" },
  2018: { title: "Defining",       body: "xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz. — REPLACE" },
  2019: { title: "Expanding",      body: "xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz. — REPLACE" },
  2020: { title: "The Pause",      body: "The world stopped. Pandemic year. But something changed internally too. xyz xyz xyz xyz xyz xyz xyz xyz. — REPLACE" },
  2021: { title: "Rebuilding",     body: "xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz. — REPLACE" },
  2022: { title: "Acceleration",   body: "xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz. — REPLACE" },
  2023: { title: "Clarity",        body: "xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz. — REPLACE" },
  2024: { title: "Intention",      body: "xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz. — REPLACE" },
  2025: { title: "Transformation", body: "xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz. — REPLACE" },
  2026: { title: "Present",        body: "Now. Right here. This website exists. That means something. xyz xyz xyz xyz xyz xyz xyz xyz xyz. — REPLACE" },
};
 
(function buildTimeline() {
  const track = document.getElementById('years-track');
  if (!track) return;
  for (let year = 2008; year <= 2026; year++) {
    const node = document.createElement('div');
    node.className = 'year-node';
    node.innerHTML = `<div class="year-dot"></div><div class="year-label">${year}</div>`;
    node.onclick   = () => showYear(year, node);
    track.appendChild(node);
  }
})();
 
function showYear(year, nodeEl) {
  document.querySelectorAll('.year-node').forEach(n => n.classList.remove('active'));
  nodeEl.classList.add('active');
  const data = yearData[year] || { title: 'Year ' + year, body: 'Details coming soon.' };
  document.getElementById('detail-year').textContent  = year;
  document.getElementById('detail-title').textContent = data.title;
  document.getElementById('detail-body').textContent  = data.body;
  const detail = document.getElementById('year-detail');
  detail.classList.remove('visible');
  setTimeout(() => detail.classList.add('visible'), 50);
}
 
/* ═══════════════════════════════════════════════════════════
   THOUGHTS / BELIEFS
═══════════════════════════════════════════════════════════ */
const beliefPosts = {
  politics: [
    { date: "April 2026",   title: "xyz Politics post title — REPLACE", body: "xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz. REPLACE with your actual thoughts on politics." },
    { date: "March 2026",   title: "xyz Politics post title — REPLACE", body: "xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz. REPLACE." },
    { date: "January 2026", title: "xyz Politics post title — REPLACE", body: "xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz. REPLACE." },
  ],
  god: [
    { date: "March 2026",    title: "xyz Faith post title — REPLACE", body: "xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz. REPLACE." },
    { date: "February 2026", title: "xyz Faith post title — REPLACE", body: "xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz. REPLACE." },
  ],
  science: [
    { date: "April 2026",    title: "xyz Science post — REPLACE", body: "xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz. REPLACE." },
    { date: "February 2026", title: "xyz Science post — REPLACE", body: "xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz. REPLACE." },
  ],
  life: [
    { date: "April 2026",    title: "xyz Life post — REPLACE", body: "xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz. REPLACE." },
    { date: "March 2026",    title: "xyz Life post — REPLACE", body: "xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz. REPLACE." },
    { date: "February 2026", title: "xyz Life post — REPLACE", body: "xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz. REPLACE." },
    { date: "January 2026",  title: "xyz Life post — REPLACE", body: "xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz. REPLACE." },
  ],
  society: [
    { date: "March 2026",    title: "xyz Society post — REPLACE", body: "xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz. REPLACE." },
    { date: "February 2026", title: "xyz Society post — REPLACE", body: "xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz. REPLACE." },
    { date: "January 2026",  title: "xyz Society post — REPLACE", body: "xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz. REPLACE." },
  ],
  tech: [
    { date: "April 2026", title: "xyz Tech post — REPLACE", body: "xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz. REPLACE." },
    { date: "March 2026", title: "xyz Tech post — REPLACE", body: "xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz. REPLACE." },
  ],
};
 
function openBelief(category) {
  const posts = beliefPosts[category] || [];
  document.getElementById('beliefs-overview').style.display = 'none';
  const view  = document.getElementById('belief-post-view');
  const label = document.getElementById('belief-view-label');
  const list  = document.getElementById('belief-posts-list');
  label.textContent = category.charAt(0).toUpperCase() + category.slice(1);
  list.innerHTML = posts.map(p => `
    <div class="belief-post">
      <div class="belief-post-date">${p.date}</div>
      <div class="belief-post-title">${p.title}</div>
      <div class="belief-post-body">${p.body}</div>
    </div>
  `).join('');
  view.classList.add('active');
}
 
function closeBelief() {
  document.getElementById('belief-post-view').classList.remove('active');
  document.getElementById('beliefs-overview').style.display = '';
}
 
/* ═══════════════════════════════════════════════════════════
   CONTACT FORM
═══════════════════════════════════════════════════════════ */
async function submitContactForm(e) {
  e.preventDefault();
  const form   = document.getElementById('contact-form');
  const status = document.getElementById('form-status');
  const btn    = form.querySelector('button[type=submit]');
  btn.textContent = 'Sending...';
  btn.disabled    = true;
  status.textContent = '';
  try {
    await emailjs.sendForm(CONFIG.EMAILJS_SERVICE_ID, CONFIG.EMAILJS_TEMPLATE_ID, form);
    status.textContent = '✓ Message sent. I\'ll be in touch.';
    status.className   = 'form-status success';
    form.reset();
  } catch (err) {
    status.textContent = '✗ Something went wrong. Try again.';
    status.className   = 'form-status error';
    console.error('EmailJS error:', err);
  }
  btn.textContent = 'Send →';
  btn.disabled    = false;
}
 
/* ═══════════════════════════════════════════════════════════
   LIST TABS
═══════════════════════════════════════════════════════════ */
function switchListTab(panel, tabEl) {
  document.querySelectorAll('.list-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.list-panel').forEach(p => p.classList.remove('active'));
  tabEl.classList.add('active');
  document.getElementById('list-' + panel).classList.add('active');
}
 
/* ═══════════════════════════════════════════════════════════
   PHOTO VIEWER
═══════════════════════════════════════════════════════════ */
const albumData = {
  album1:  { photos: [{ src:'', title:'xyz Photo Title — REPLACE', desc:'xyz description — REPLACE' }, { src:'', title:'xyz Photo Title — REPLACE', desc:'xyz description — REPLACE' }] },
  album2:  { photos: [{ src:'', title:'xyz Photo Title — REPLACE', desc:'xyz description — REPLACE' }] },
  album3:  { photos: [{ src:'', title:'xyz Photo Title — REPLACE', desc:'xyz description — REPLACE' }] },
  secret1: { photos: [{ src:'', title:'xyz Private Photo — REPLACE', desc:'xyz description — REPLACE' }] },
  secret2: { photos: [{ src:'', title:'xyz Private Photo — REPLACE', desc:'xyz description — REPLACE' }] },
};
 
let currentAlbum      = null;
let currentPhotoIndex = 0;
 
function openAlbum(albumId) {
  currentAlbum      = albumData[albumId] || { photos: [] };
  currentPhotoIndex = 0;
  showPhoto(0);
  document.getElementById('photo-viewer').classList.add('open');
}
 
function showPhoto(index) {
  const photos = currentAlbum.photos;
  if (!photos || photos.length === 0) return;
  currentPhotoIndex = (index + photos.length) % photos.length;
  const photo = photos[currentPhotoIndex];
  const img   = document.getElementById('viewer-img');
  img.src = photo.src || `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400'><rect fill='%23222'/><text x='50%25' y='50%25' fill='%23555' text-anchor='middle' dy='.3em' font-family='sans-serif' font-size='16'>Photo placeholder — add real image src</text></svg>`;
  img.alt = photo.title;
  document.getElementById('viewer-title').textContent = photo.title;
  document.getElementById('viewer-desc').textContent  = photo.desc;
}
 
function viewerNav(dir) { showPhoto(currentPhotoIndex + dir); }
 
function closeViewer() {
  document.getElementById('photo-viewer').classList.remove('open');
}
 
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeViewer(); closeGame(); closeGate(); closeMusicPanel(); }
});
 
/* ═══════════════════════════════════════════════════════════
   GAMES
═══════════════════════════════════════════════════════════ */
let activeGame = null;
 
function openGame(gameId) {
  activeGame = gameId;
  document.getElementById('game-modal').classList.add('open');
  renderGame(gameId);
}
 
function closeGame() {
  document.getElementById('game-modal').classList.remove('open');
  document.getElementById('game-container').innerHTML = '';
  activeGame = null;
}
 
function renderGame(gameId) {
  const container = document.getElementById('game-container');
  container.innerHTML = '';
  switch (gameId) {
    case 'snake':    renderSnake(container);        break;
    case 'memory':   renderMemory(container);       break;
    case '2048':     render2048(container);         break;
    case 'reaction': renderReaction(container);     break;
    case 'word':     renderWordScramble(container); break;
  }
}
 
/* ─────────────────────────────────────────────────────────
   FIX 1A: SNAKE — touch swipe support for mobile
   Swipe maps to direction. First swipe starts game.
   Touch listeners on canvas with preventDefault so
   page doesn't scroll while swiping to play.
───────────────────────────────────────────────────────── */
function renderSnake(container) {
  /* Detect touch device for instruction text */
  const isMobile = window.matchMedia('(pointer: coarse)').matches;
  const inputHint = isMobile ? 'Swipe to move' : 'Arrow keys or WASD';
 
  container.innerHTML = `
    <h3 style="font-family:var(--ff-display);font-size:1.5rem;color:var(--text);text-align:center;margin-bottom:1rem;">Snake</h3>
    <p style="text-align:center;font-size:0.75rem;color:var(--text3);margin-bottom:1rem;">${inputHint} · Score: <span id="snake-score">0</span></p>
    <canvas id="snake-canvas" width="400" height="400" style="border:1px solid var(--border2);background:var(--bg2);display:block;margin:0 auto;max-width:100%;touch-action:none;"></canvas>
    <p style="text-align:center;font-size:0.75rem;color:var(--text3);margin-top:1rem;" id="snake-msg">${isMobile ? 'Swipe to start' : 'Press any arrow key to start'}</p>
  `;
 
  const canvas = document.getElementById('snake-canvas');
  const ctx    = canvas.getContext('2d');
  const SIZE = 20, COLS = canvas.width / SIZE, ROWS = canvas.height / SIZE;
  let snake = [{ x: 10, y: 10 }], dir = { x: 0, y: 0 }, food = spawnFood();
  let score = 0, running = false, gameOver = false, interval;
 
  function spawnFood() {
    let f;
    do { f = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) }; }
    while (snake.some(s => s.x === f.x && s.y === f.y));
    return f;
  }
 
  function draw() {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#e8d5b7';
    ctx.fillRect(food.x * SIZE + 2, food.y * SIZE + 2, SIZE - 4, SIZE - 4);
    snake.forEach((seg, i) => {
      ctx.fillStyle = i === 0 ? '#e8d5b7' : `rgba(232,213,183,${0.4 + 0.6 * (i / snake.length)})`;
      ctx.fillRect(seg.x * SIZE + 1, seg.y * SIZE + 1, SIZE - 2, SIZE - 2);
    });
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#e8d5b7';
      ctx.font = '20px Cormorant Garamond, serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over — Score: ' + score, canvas.width / 2, canvas.height / 2);
      ctx.font = '13px DM Sans, sans-serif';
      ctx.fillStyle = '#888';
      ctx.fillText(isMobile ? 'Swipe to restart' : 'Press any key to restart', canvas.width / 2, canvas.height / 2 + 28);
    }
  }
 
  function step() {
    if (!running || gameOver) return;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) { endGame(); return; }
    if (snake.some(s => s.x === head.x && s.y === head.y)) { endGame(); return; }
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
      score++;
      document.getElementById('snake-score').textContent = score;
      food = spawnFood();
    } else { snake.pop(); }
    draw();
  }
 
  function endGame() { gameOver = true; clearInterval(interval); draw(); }
 
  function startGame() {
    snake = [{ x: 10, y: 10 }]; dir = { x: 1, y: 0 }; score = 0;
    document.getElementById('snake-score').textContent = 0;
    food = spawnFood(); gameOver = false; running = true;
    document.getElementById('snake-msg').textContent = '';
    clearInterval(interval);
    interval = setInterval(step, 120);
    draw();
  }
 
  /* ── Keyboard controls (desktop) ── */
  const DIRS = {
    ArrowUp:{x:0,y:-1}, ArrowDown:{x:0,y:1}, ArrowLeft:{x:-1,y:0}, ArrowRight:{x:1,y:0},
    w:{x:0,y:-1}, s:{x:0,y:1}, a:{x:-1,y:0}, d:{x:1,y:0},
    W:{x:0,y:-1}, S:{x:0,y:1}, A:{x:-1,y:0}, D:{x:1,y:0},
  };
 
  document.addEventListener('keydown', function snakeKeys(e) {
    if (!document.getElementById('game-modal').classList.contains('open')) {
      document.removeEventListener('keydown', snakeKeys); return;
    }
    if (gameOver) { startGame(); return; }
    if (!running) { startGame(); }
    const newDir = DIRS[e.key];
    if (newDir) {
      if (dir.x !== -newDir.x || dir.y !== -newDir.y) dir = newDir;
      e.preventDefault();
    }
  });
 
  /* ── Touch swipe controls (mobile) — FIX 1A ── */
  if (isMobile) {
    let touchStartX = 0, touchStartY = 0;
    const SWIPE_THRESHOLD = 20; /* minimum px to count as a swipe */
 
    canvas.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      e.preventDefault(); /* stop page scroll while on canvas */
    }, { passive: false });
 
    canvas.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      const absDx = Math.abs(dx), absDy = Math.abs(dy);
 
      /* Must exceed threshold to register as intentional swipe */
      if (Math.max(absDx, absDy) < SWIPE_THRESHOLD) return;
 
      if (gameOver) { startGame(); return; }
      if (!running) { startGame(); }
 
      let newDir;
      if (absDx > absDy) {
        /* Horizontal swipe */
        newDir = dx > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 };
      } else {
        /* Vertical swipe */
        newDir = dy > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 };
      }
 
      /* Prevent reversing directly into self */
      if (dir.x !== -newDir.x || dir.y !== -newDir.y) {
        dir = newDir;
      }
 
      e.preventDefault();
    }, { passive: false });
  }
 
  draw();
}
 
/* ─── GAME 2: MEMORY MATCH ─── */
function renderMemory(container) {
  const emojis = ['🌙', '⭐', '☀️', '🌊', '🔥', '🌿', '💎', '🎭'];
  let cards = [...emojis, ...emojis].sort(() => Math.random() - 0.5);
  let flipped = [], matched = 0, locked = false, moves = 0;
 
  container.innerHTML = `
    <h3 style="font-family:var(--ff-display);font-size:1.5rem;color:var(--text);text-align:center;margin-bottom:0.5rem;">Memory Match</h3>
    <p style="text-align:center;font-size:0.75rem;color:var(--text3);margin-bottom:1.5rem;">Moves: <span id="mem-moves">0</span> · Pairs: <span id="mem-pairs">0</span>/8</p>
    <div id="mem-grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;max-width:340px;margin:0 auto;"></div>
  `;
 
  const grid = document.getElementById('mem-grid');
  cards.forEach((emoji, i) => {
    const card = document.createElement('div');
    card.style.cssText = `width:100%;aspect-ratio:1;background:var(--bg3);border:1px solid var(--border2);border-radius:4px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:1.5rem;transition:all 0.3s ease;user-select:none;`;
    card.dataset.emoji = emoji; card.textContent = '?'; card.style.color = 'var(--text3)';
    card.onclick = () => {
      if (locked || flipped.includes(i) || card.dataset.matched) return;
      card.textContent = emoji; card.style.background = 'var(--bg4)'; card.style.borderColor = 'var(--accent)'; card.style.color = '#fff';
      flipped.push(i);
      if (flipped.length === 2) {
        locked = true; moves++;
        document.getElementById('mem-moves').textContent = moves;
        const [a, b] = flipped; const cA = grid.children[a], cB = grid.children[b];
        if (cA.dataset.emoji === cB.dataset.emoji) {
          cA.dataset.matched = cB.dataset.matched = 'yes';
          cA.style.background = cB.style.background = 'var(--accent-glow)';
          matched++; document.getElementById('mem-pairs').textContent = matched;
          flipped = []; locked = false;
          if (matched === 8) setTimeout(() => container.insertAdjacentHTML('beforeend',
            `<p style="text-align:center;color:var(--accent);margin-top:1.5rem;font-family:var(--ff-display);font-size:1.2rem;">Completed in ${moves} moves!</p>`), 300);
        } else {
          setTimeout(() => {
            [cA, cB].forEach(c => { c.textContent = '?'; c.style.background = 'var(--bg3)'; c.style.borderColor = 'var(--border2)'; c.style.color = 'var(--text3)'; });
            flipped = []; locked = false;
          }, 900);
        }
      }
    };
    grid.appendChild(card);
  });
}
 
/* ─────────────────────────────────────────────────────────
   FIX 1B: 2048 — touch swipe support for mobile
   Swipe on the grid maps to move direction.
   touch-action:none on grid prevents scroll interference.
───────────────────────────────────────────────────────── */
function render2048(container) {
  const isMobile = window.matchMedia('(pointer: coarse)').matches;
  const inputHint = isMobile ? 'Swipe to slide' : 'Arrow keys to slide';
 
  let grid = Array(4).fill(null).map(() => Array(4).fill(0)), score = 0;
  container.innerHTML = `
    <h3 style="font-family:var(--ff-display);font-size:1.5rem;color:var(--text);text-align:center;margin-bottom:0.5rem;">2048</h3>
    <p style="text-align:center;font-size:0.75rem;color:var(--text3);margin-bottom:1rem;">Score: <span id="g2048-score">0</span> · ${inputHint}</p>
    <div id="g2048-grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;max-width:340px;margin:0 auto;background:var(--bg3);padding:6px;border-radius:4px;touch-action:none;user-select:none;"></div>
  `;
  const colors = {0:'var(--bg3)',2:'#eee4da',4:'#ede0c8',8:'#f2b179',16:'#f59563',32:'#f67c5f',64:'#f65e3b',128:'#edcf72',256:'#edcc61',512:'#edc850',1024:'#edc53f',2048:'#edc22e'};
 
  function addRandom() {
    const empty = [];
    grid.forEach((row, r) => row.forEach((val, c) => { if (!val) empty.push([r, c]); }));
    if (empty.length) { const [r, c] = empty[Math.floor(Math.random() * empty.length)]; grid[r][c] = Math.random() < 0.9 ? 2 : 4; }
  }
 
  function drawGrid() {
    const g = document.getElementById('g2048-grid'); if (!g) return; g.innerHTML = '';
    grid.forEach(row => row.forEach(val => {
      const cell = document.createElement('div');
      cell.style.cssText = `aspect-ratio:1;background:${colors[val] || '#f9f6f2'};border-radius:3px;display:flex;align-items:center;justify-content:center;font-family:var(--ff-display);font-size:${val > 999 ? '1rem' : '1.3rem'};font-weight:600;color:${val > 4 ? '#f9f6f2' : '#776e65'};`;
      cell.textContent = val || ''; g.appendChild(cell);
    }));
    document.getElementById('g2048-score').textContent = score;
  }
 
  function slide(row) {
    let arr = row.filter(v => v);
    for (let i = 0; i < arr.length - 1; i++) { if (arr[i] === arr[i + 1]) { arr[i] *= 2; score += arr[i]; arr.splice(i + 1, 1); } }
    while (arr.length < 4) arr.push(0);
    return arr;
  }
 
  function transpose(g) { return g[0].map((_, i) => g.map(row => row[i])); }
 
  function move(dir) {
    const prev = JSON.stringify(grid);
    if (dir === 'left')  grid = grid.map(row => slide(row));
    if (dir === 'right') grid = grid.map(row => slide([...row].reverse()).reverse());
    if (dir === 'up')  { grid = transpose(grid).map(row => slide(row)); grid = transpose(grid); }
    if (dir === 'down'){ grid = transpose(grid).map(row => slide([...row].reverse()).reverse()); grid = transpose(grid); }
    if (JSON.stringify(grid) !== prev) addRandom();
    drawGrid();
  }
 
  addRandom(); addRandom(); drawGrid();
 
  /* ── Keyboard controls (desktop) ── */
  document.addEventListener('keydown', function keys2048(e) {
    if (!document.getElementById('game-modal').classList.contains('open')) { document.removeEventListener('keydown', keys2048); return; }
    const map = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
    if (map[e.key]) { e.preventDefault(); move(map[e.key]); }
  });
 
  /* ── Touch swipe controls (mobile) — FIX 1B ── */
  if (isMobile) {
    const gridEl = document.getElementById('g2048-grid');
    let touchStartX = 0, touchStartY = 0;
    const SWIPE_THRESHOLD = 24; /* min px for valid swipe */
 
    gridEl.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      e.preventDefault(); /* prevent scroll while interacting with grid */
    }, { passive: false });
 
    gridEl.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      const absDx = Math.abs(dx), absDy = Math.abs(dy);
 
      if (Math.max(absDx, absDy) < SWIPE_THRESHOLD) return;
 
      if (absDx > absDy) {
        move(dx > 0 ? 'right' : 'left');
      } else {
        move(dy > 0 ? 'down' : 'up');
      }
 
      e.preventDefault();
    }, { passive: false });
  }
}
 
/* ─── GAME 4: REACTION TIME ─── */
function renderReaction(container) {
  let state = 'waiting', startTime, times = [];
  container.innerHTML = `
    <h3 style="font-family:var(--ff-display);font-size:1.5rem;color:var(--text);text-align:center;margin-bottom:1rem;">Reaction Time</h3>
    <div id="react-box" style="width:300px;height:200px;border-radius:8px;background:var(--bg3);border:1px solid var(--border2);display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;margin:0 auto;transition:background 0.3s ease;">
      <div id="react-text" style="font-family:var(--ff-display);font-size:1.2rem;color:var(--text2);text-align:center;"></div>
      <div id="react-sub" style="font-size:0.7rem;color:var(--text3);margin-top:0.5rem;"></div>
    </div>
    <p id="react-results" style="text-align:center;font-size:0.8rem;color:var(--text2);margin-top:1.5rem;"></p>
  `;
  const box = document.getElementById('react-box'), text = document.getElementById('react-text'), sub = document.getElementById('react-sub');
  function reset() { state = 'waiting'; box.style.background = 'var(--bg3)'; text.textContent = 'Tap when it turns green'; sub.textContent = ''; }
  reset(); let timeout;
  function reactionClick() {
    if (state === 'waiting') {
      state = 'ready'; box.style.background = '#c0392b'; text.textContent = 'Wait...'; sub.textContent = '';
      clearTimeout(timeout);
      timeout = setTimeout(() => { state = 'go'; box.style.background = '#27ae60'; text.textContent = 'Tap now!'; startTime = performance.now(); }, 1500 + Math.random() * 3000);
    } else if (state === 'ready') {
      clearTimeout(timeout); box.style.background = '#c0392b'; text.textContent = 'Too early! Tap again.'; setTimeout(reset, 1000);
    } else if (state === 'go') {
      const t = Math.round(performance.now() - startTime); times.push(t);
      const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
      document.getElementById('react-results').innerHTML = `Last: <strong style="color:var(--accent)">${t}ms</strong> &nbsp;·&nbsp; Best: <strong style="color:var(--accent)">${Math.min(...times)}ms</strong> &nbsp;·&nbsp; Avg: ${avg}ms`;
      reset();
    }
  }
  window.reactionClick = reactionClick;
  box.onclick = reactionClick;
}
 
/* ─── GAME 5: WORD SCRAMBLE ─── */
function renderWordScramble(container) {
  const words = ['PLANET', 'SILENT', 'MUSIC', 'OCEAN', 'DREAM', 'LIGHT', 'FLAME', 'STORM', 'GRACE', 'SWIFT'];
  let current = 0, score = 0;
  function scramble(word) { return word.split('').sort(() => Math.random() - 0.5).join(''); }
  function nextWord() {
    const word = words[current % words.length]; let s = scramble(word);
    while (s === word) s = scramble(word);
    document.getElementById('ws-scramble').textContent = s;
    document.getElementById('ws-input').value = ''; document.getElementById('ws-input').focus();
    document.getElementById('ws-feedback').textContent = '';
    document.getElementById('ws-word').dataset.answer = word;
  }
  container.innerHTML = `
    <h3 style="font-family:var(--ff-display);font-size:1.5rem;color:var(--text);text-align:center;margin-bottom:0.5rem;">Word Scramble</h3>
    <p style="text-align:center;font-size:0.75rem;color:var(--text3);margin-bottom:2rem;">Score: <span id="ws-score">0</span> · Unscramble the word</p>
    <div style="text-align:center;">
      <div id="ws-scramble" style="font-family:var(--ff-display);font-size:3rem;letter-spacing:0.2em;color:var(--accent);margin-bottom:2rem;"></div>
      <div style="display:flex;gap:0;max-width:260px;margin:0 auto;">
        <input id="ws-input" type="text" style="flex:1;background:var(--bg3);border:1px solid var(--border2);color:var(--text);padding:0.75rem;font-family:var(--ff-mono);font-size:1rem;text-transform:uppercase;letter-spacing:0.15em;outline:none;border-right:none;" placeholder="TYPE HERE" autocomplete="off" />
        <button onclick="wsCheck()" style="background:var(--accent);border:1px solid var(--accent);color:var(--bg);padding:0.75rem 1rem;cursor:pointer;font-family:var(--ff-mono);font-size:0.8rem;">Go</button>
      </div>
      <div id="ws-feedback" style="margin-top:1rem;font-size:0.85rem;min-height:1.5rem;"></div>
      <span id="ws-word" style="display:none;"></span>
    </div>
  `;
  nextWord();
  document.getElementById('ws-input').addEventListener('keydown', e => { if (e.key === 'Enter') wsCheck(); });
  window.wsCheck = function () {
    const input = document.getElementById('ws-input').value.trim().toUpperCase();
    const answer = document.getElementById('ws-word').dataset.answer;
    const fb = document.getElementById('ws-feedback');
    if (input === answer) {
      score++; document.getElementById('ws-score').textContent = score;
      fb.style.color = '#4ade80'; fb.textContent = '✓ Correct!'; current++; setTimeout(nextWord, 800);
    } else { fb.style.color = '#f87171'; fb.textContent = '✗ Try again'; }
  };
}
 
/* ═══════════════════════════════════════════════════════════
   EASTER EGGS
═══════════════════════════════════════════════════════════ */
let nameClicks = 0;
const nameClickMessages = [
  "", "", "", "", "",
  "5 clicks... curious.",
  "6 clicks... you're definitely onto something.",
  "7 clicks! You found the easter egg. Hello, persistent human. Here is your reward — lean back and calm down.",
];
 
(function () {
  let typed = '';
  document.addEventListener('keypress', e => {
    typed += e.key.toLowerCase(); typed = typed.slice(-7);
    if (typed === 'manomay') {
      document.documentElement.style.setProperty('--accent', '#ff6b6b');
      setTimeout(() => document.documentElement.style.setProperty('--accent', ''), 1500);
    }
  });
})();
 
/* ═══════════════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════════════ */
window.addEventListener('load', () => {
  updateNavActive('home');
  setTimeout(() => triggerPageReveals('home'), 2000);
  const backdrop = document.getElementById('music-backdrop');
  if (backdrop) backdrop.addEventListener('click', closeMusicPanel);
});
 
/* ═══════════════════════════════════════════════════════════
   MUSIC SYSTEM
═══════════════════════════════════════════════════════════ */
const bgMusic    = document.getElementById("bg-music");
const rainSong   = document.getElementById("rain-song");
const songBar    = document.getElementById("music-toggle");
const vinylEl    = document.getElementById("vinyl-player");
const musicPanel = document.getElementById("music-panel");
 
let easterUnlocked = false;
let musicStarted   = false;
let userPaused     = false;
let currentSongId  = 'bg';
 
function updateMusicUI() {
  const isPlaying = (bgMusic && !bgMusic.paused && !bgMusic.ended) ||
                    (rainSong && !rainSong.paused && !rainSong.ended);
  if (isPlaying) {
    songBar.classList.remove("muted");
  } else {
    songBar.classList.add("muted");
  }
  if (vinylEl) {
    if (isPlaying) { vinylEl.classList.remove("paused"); }
    else           { vinylEl.classList.add("paused"); }
  }
  const panelBars = document.getElementById('music-panel-bars');
  if (panelBars) {
    if (isPlaying) { panelBars.classList.add('playing'); }
    else           { panelBars.classList.remove('playing'); }
  }
  updateMusicPanelState();
}
 
function updateMusicPanelState() {
  const nowEl = document.getElementById('music-panel-now');
  if (!nowEl) return;
  const isPlaying = (bgMusic && !bgMusic.paused) || (rainSong && !rainSong.paused);
  document.querySelectorAll('.music-option').forEach(o => o.classList.remove('active'));
  document.querySelectorAll('.music-option-indicator').forEach(ind => ind.classList.remove('playing'));
  if (!isPlaying) {
    nowEl.textContent = '— paused —';
  } else if (currentSongId === 'easter') {
    nowEl.textContent = 'Rimjhim Gire Sawan';
    document.querySelector('.music-option[data-song="easter"]')?.classList.add('active');
    document.getElementById('indicator-easter')?.classList.add('playing');
  } else {
    nowEl.textContent = 'Background Ambience';
    document.querySelector('.music-option[data-song="bg"]')?.classList.add('active');
    document.getElementById('indicator-bg')?.classList.add('playing');
  }
}
 
songBar.addEventListener("click", () => {
  const isPlaying = (bgMusic && !bgMusic.paused && !bgMusic.ended) ||
                    (rainSong && !rainSong.paused && !rainSong.ended);
  if (isPlaying) {
    bgMusic.pause();
    rainSong.pause();
    userPaused = true;
  } else {
    userPaused = false;
    if (currentSongId === 'easter' && rainSong.currentTime > 0 && !rainSong.ended) {
      rainSong.play().catch(() => {});
    } else {
      bgMusic.play().catch(() => {});
      currentSongId = 'bg';
    }
  }
  updateMusicUI();
});
 
rainSong.addEventListener("ended", () => {
  currentSongId = 'bg';
  if (!userPaused) {
    bgMusic.currentTime = 0;
    bgMusic.play().catch(() => {});
  }
  updateMusicUI();
});
 
bgMusic.addEventListener("play",  updateMusicUI);
bgMusic.addEventListener("pause", updateMusicUI);
rainSong.addEventListener("play",  updateMusicUI);
rainSong.addEventListener("pause", updateMusicUI);
 
function tryStartBgMusic() {
  if (musicStarted || userPaused) return;
  bgMusic.play()
    .then(() => {
      musicStarted  = true;
      currentSongId = 'bg';
      updateMusicUI();
    })
    .catch(() => {});
}
 
document.addEventListener("mousemove", tryStartBgMusic, { once: true });
document.addEventListener("click",     tryStartBgMusic, { once: true });
document.addEventListener("scroll",    tryStartBgMusic, { once: true, capture: true });
 
function openMusicPanel() {
  if (!musicPanel) return;
  musicPanel.classList.add('open');
  const backdrop = document.getElementById('music-backdrop');
  if (backdrop) backdrop.classList.add('open');
  updateMusicPanelState();
}
 
function closeMusicPanel() {
  if (!musicPanel) return;
  musicPanel.classList.remove('open');
  const backdrop = document.getElementById('music-backdrop');
  if (backdrop) backdrop.classList.remove('open');
}
 
function toggleMusicPanel() {
  if (!musicPanel) return;
  if (musicPanel.classList.contains('open')) {
    closeMusicPanel();
  } else {
    openMusicPanel();
  }
}
 
if (vinylEl) {
  vinylEl.addEventListener("click", () => {
    toggleMusicPanel();
  });
}
 
function showVinyl() {
  if (!vinylEl) return;
  vinylEl.classList.remove("hidden");
  easterUnlocked = true;
}
 
function hideVinyl() {
  if (!vinylEl) return;
  closeMusicPanel();
  setTimeout(() => {
    vinylEl.classList.add("hidden");
    easterUnlocked = false;
  }, 200);
}
 
function playFromPanel(songId) {
  bgMusic.pause();
  rainSong.pause();
  userPaused    = false;
  currentSongId = songId;
  if (songId === 'bg') {
    bgMusic.currentTime = 0;
    bgMusic.play().catch(() => {});
  } else if (songId === 'easter') {
    rainSong.currentTime = 0;
    rainSong.play().catch(() => {});
  }
  musicStarted = true;
  updateMusicUI();
}
 
function nameclickHandler() {
  nameClicks++;
  const hint = document.getElementById("name-click-hint");
  if (nameClicks >= 5) {
    hint.textContent = nameClickMessages[Math.min(nameClicks, 7)];
    hint.classList.add("show");
  }
  if (nameClicks >= 7) {
    if (easterUnlocked) {
      hint.textContent = "Easter egg already enabled! Check the bottom-left corner 🎵";
      hint.classList.add("show");
      setTimeout(() => {
        nameClicks = 0;
        hint.classList.remove("show");
      }, 3000);
      return;
    }
    showVinyl();
    bgMusic.pause();
    currentSongId = 'easter';
    userPaused    = false;
    rainSong.currentTime = 0;
    rainSong.play().catch(() => {});
    musicStarted  = true;
    updateMusicUI();
    setTimeout(() => {
      nameClicks = 0;
      hint.classList.remove("show");
    }, 4000);
  }
}
 
/* ═══════════════════════════════════════════════════════════
   WEB AUDIO API — Mechanical Sound System
   ─────────────────────────────────────────────────────────
   Synthesises two sounds entirely via the Web Audio API.
   No external audio files are used.
 
   TICK  — hover: ultra-short transient, ~4 kHz click
   CLACK — click: slightly deeper, ~1.8 kHz body with
           a sharper initial attack and small tail
 
   Scope: all interactive elements EXCEPT game canvases.
   A toggle button is injected into the nav bar.
═══════════════════════════════════════════════════════════ */
 
let _audioCtx         = null;
let _soundEnabled     = localStorage.getItem('msm-sound') !== 'off'; // default ON
let _hoverCooldownMap = new WeakMap(); // per-element hover guard
 
function _getAudioCtx() {
  if (!_audioCtx) {
    _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  // Resume if suspended (browser autoplay policy)
  if (_audioCtx.state === 'suspended') _audioCtx.resume();
  return _audioCtx;
}
 
/* ── Synthesise a hover tick ── */
function _playTick() {
  if (!_soundEnabled) return;
  try {
    const ctx  = _getAudioCtx();
    const now  = ctx.currentTime;
 
    // Short band-pass filtered noise burst — "tick"
    const buf  = ctx.createBuffer(1, ctx.sampleRate * 0.018, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 6);
    }
 
    const src    = ctx.createBufferSource();
    src.buffer   = buf;
 
    const bp     = ctx.createBiquadFilter();
    bp.type      = 'bandpass';
    bp.frequency.value = 4200;
    bp.Q.value         = 2.4;
 
    const gain   = ctx.createGain();
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.018);
 
    src.connect(bp);
    bp.connect(gain);
    gain.connect(ctx.destination);
    src.start(now);
    src.stop(now + 0.02);
  } catch (_) {}
}
 
/* ── Synthesise a click clack ── */
function _playClack() {
  if (!_soundEnabled) return;
  try {
    const ctx  = _getAudioCtx();
    const now  = ctx.currentTime;
 
    // Body: short sine-ish tone with fast decay
    const osc        = ctx.createOscillator();
    osc.type         = 'triangle';
    osc.frequency.setValueAtTime(1800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);
 
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.22, now);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);
 
    // Attack transient: short noise burst
    const buf  = ctx.createBuffer(1, ctx.sampleRate * 0.01, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 4);
    }
    const nSrc  = ctx.createBufferSource();
    nSrc.buffer = buf;
 
    const hp    = ctx.createBiquadFilter();
    hp.type     = 'highpass';
    hp.frequency.value = 2000;
 
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.3, now);
    nGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.01);
 
    // Master limiter-style gain
    const master = ctx.createGain();
    master.gain.value = 0.7;
 
    osc.connect(oscGain);
    oscGain.connect(master);
    nSrc.connect(hp);
    hp.connect(nGain);
    nGain.connect(master);
    master.connect(ctx.destination);
 
    osc.start(now);
    osc.stop(now + 0.06);
    nSrc.start(now);
    nSrc.stop(now + 0.012);
  } catch (_) {}
}
 
/* ── Attach sounds to a single element ── */
function _attachSounds(el) {
  // Skip game canvases
  if (el.tagName === 'CANVAS') return;
  // Skip if already bound
  if (el.dataset.soundBound) return;
  el.dataset.soundBound = 'yes';
 
  el.addEventListener('mouseenter', () => {
    // Per-element cooldown: no repeat while cursor remains
    if (_hoverCooldownMap.get(el)) return;
    _hoverCooldownMap.set(el, true);
    _playTick();
  }, { passive: true });
 
  el.addEventListener('mouseleave', () => {
    _hoverCooldownMap.set(el, false);
  }, { passive: true });
 
  el.addEventListener('mousedown', () => {
    _playClack();
  }, { passive: true });
}
 
/* ── Bind to all existing interactive elements ── */
function _bindSoundsToAll() {
  const sel = [
    'a', 'button', 'input[type="button"]', 'input[type="submit"]',
    '.game-card', '.album-card', '.belief-card', '.year-node',
    '.profile-item', '.list-tab', '.theme-dot', '.music-option',
    '.nav-link', '#nav-links a', '.nav-item', '[onclick]',
    '.music-toggle', '#hamburger', '#music-toggle',
    '.sound-toggle-btn'
  ].join(', ');
 
  document.querySelectorAll(sel).forEach(_attachSounds);
}
 
/* ── MutationObserver: bind sounds to dynamically added elements ── */
const _soundObserver = new MutationObserver((mutations) => {
  mutations.forEach(m => {
    m.addedNodes.forEach(node => {
      if (node.nodeType !== 1) return;
      if (node.tagName === 'CANVAS') return;
      const interactive = node.matches('a, button, [onclick], .game-card, .album-card, .belief-card, .year-node, .profile-item, .list-tab, .theme-dot, .music-option')
        ? [node]
        : [...node.querySelectorAll('a, button, [onclick], .game-card, .album-card, .belief-card, .year-node, .profile-item, .list-tab, .theme-dot, .music-option')];
      interactive.forEach(_attachSounds);
    });
  });
});
_soundObserver.observe(document.body, { childList: true, subtree: true });
 
/* ── Sound Toggle Button — injected into nav bar ── */
(function injectSoundToggle() {
  // Inject CSS for the button inline so it fully matches the site theme
  const style = document.createElement('style');
  style.textContent = `
    .sound-toggle-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 1px solid var(--border2, rgba(255,255,255,0.12));
      background: var(--bg3, rgba(255,255,255,0.04));
      cursor: pointer;
      position: relative;
      transition: border-color 0.25s ease, background 0.25s ease, box-shadow 0.25s ease;
      flex-shrink: 0;
      outline: none;
      padding: 0;
    }
    .sound-toggle-btn:hover {
      border-color: var(--accent, #c8a96e);
      box-shadow: 0 0 8px rgba(200, 169, 110, 0.25);
      background: var(--bg4, rgba(255,255,255,0.08));
    }
    .sound-toggle-btn.sound-off {
      opacity: 0.45;
    }
    .sound-toggle-btn.sound-off:hover {
      opacity: 0.8;
    }
    /* Push-button SVG icon inside */
    .sound-toggle-btn svg {
      width: 16px;
      height: 16px;
      display: block;
      transition: transform 0.18s ease;
    }
    /* Depress animation on click */
    .sound-toggle-btn:active svg {
      transform: translateY(1px) scale(0.93);
    }
    /* ON state: accent tint on the button cap */
    .sound-toggle-btn.sound-on .btn-cap {
      fill: var(--accent, #c8a96e);
      transition: fill 0.25s ease;
    }
    .sound-toggle-btn.sound-off .btn-cap {
      fill: var(--text3, #555);
      transition: fill 0.25s ease;
    }
    .sound-toggle-btn .btn-body {
      fill: var(--bg2, #1a1a1a);
      stroke: var(--border2, rgba(255,255,255,0.12));
      stroke-width: 1;
    }
    .sound-toggle-btn .btn-ring {
      fill: none;
      stroke: var(--border2, rgba(255,255,255,0.12));
      stroke-width: 0.8;
    }
  `;
  document.head.appendChild(style);
 
  // Build the button
  const btn = document.createElement('button');
  btn.className    = 'sound-toggle-btn ' + (_soundEnabled ? 'sound-on' : 'sound-off');
  btn.title        = 'Toggle mechanical sounds';
  btn.setAttribute('aria-label', 'Toggle mechanical sounds');
  btn.dataset.soundBound = 'yes'; // prevent double-bind
 
  // Side-view push-button SVG icon
  btn.innerHTML = `
    <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <!-- Button body / housing (side profile) -->
      <rect class="btn-body" x="2" y="7" width="12" height="7" rx="1.5"/>
      <!-- Button cap (the pressable dome seen from the side) -->
      <rect class="btn-cap" x="3.5" y="3.5" width="9" height="4.5" rx="2"/>
      <!-- Small ring detail on cap top -->
      <ellipse class="btn-ring" cx="8" cy="3.6" rx="3.2" ry="0.9"/>
    </svg>
  `;
 
  btn.addEventListener('click', () => {
    _soundEnabled = !_soundEnabled;
    localStorage.setItem('msm-sound', _soundEnabled ? 'on' : 'off');
    btn.classList.toggle('sound-on', _soundEnabled);
    btn.classList.toggle('sound-off', !_soundEnabled);
    // Play a confirmation tick when enabling
    if (_soundEnabled) setTimeout(_playTick, 60);
  });
 
  // Insert into nav: find the music-toggle button and insert before it
  function _placeToggle() {
    const musicToggle = document.getElementById('music-toggle');
    if (musicToggle && musicToggle.parentNode) {
      musicToggle.parentNode.insertBefore(btn, musicToggle);
    } else {
      // Fallback: append to nav
      const nav = document.getElementById('nav');
      if (nav) nav.appendChild(btn);
    }
  }
 
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _placeToggle);
  } else {
    _placeToggle();
  }
})();
 
/* ── Initialise sound bindings after DOM is ready ── */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _bindSoundsToAll);
} else {
  _bindSoundsToAll();
}
// Re-bind after page transitions settle (for dynamically shown pages)
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(_bindSoundsToAll, 2500);
});
 
