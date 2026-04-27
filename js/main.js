/* ═══════════════════════════════════════════════════════════
   main.js — Core site logic
═══════════════════════════════════════════════════════════ */

/* ─── CONFIGURATION ─── */
const CONFIG = {
  MASTER_PASSWORD:    "manomay2026",         // REPLACE
  EMAILJS_PUBLIC_KEY: "YOUR_PUBLIC_KEY",     // REPLACE
  EMAILJS_SERVICE_ID: "YOUR_SERVICE_ID",     // REPLACE
  EMAILJS_TEMPLATE_ID:"YOUR_TEMPLATE_ID",   // REPLACE
};

/* ─── EMAILJS INIT ─── */
emailjs.init(CONFIG.EMAILJS_PUBLIC_KEY);

/* ─── NETLIFY IDENTITY ─── */
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
(function () {
  const bar = document.getElementById('loading-bar');
  const pct = document.getElementById('loading-pct');
  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 15;
    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);
      setTimeout(() => {
        document.getElementById('loading-screen').classList.add('done');
        startHeroAnimations();
      }, 300);
    }
    bar.style.width = progress + '%';
    pct.textContent = Math.floor(progress) + '%';
  }, 80);
})();

/* ═══════════════════════════════════════════════════════════
   HERO ANIMATIONS
═══════════════════════════════════════════════════════════ */
function startHeroAnimations() {
  ['name-part-1', 'name-part-2', 'name-part-3'].forEach((id, i) => {
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.classList.add('visible');
    }, i * 150 + 200);
  });
  setTimeout(() => document.getElementById('hero-tagline')?.classList.add('visible'),    800);
  setTimeout(() => document.getElementById('hero-nav-hint')?.classList.add('visible'),   1000);
  setTimeout(() => document.getElementById('scroll-indicator')?.classList.add('visible'),1200);
}

/* ═══════════════════════════════════════════════════════════
   CUSTOM CURSOR
   FIX: use (pointer: coarse) media query — more reliable than
   ontouchstart which false-positives on touch-capable laptops.
   On mobile (coarse pointer): restore native cursor, hide custom.
   On desktop (fine pointer): run custom cursor.
═══════════════════════════════════════════════════════════ */
const dot  = document.getElementById('cursor-dot');
const ring = document.getElementById('cursor-ring');

/* pointer:coarse = touch screen | pointer:fine = mouse/trackpad */
const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;

if (isTouchDevice) {
  /* Mobile — restore native cursor, hide custom elements */
  document.body.style.cursor = 'auto';
  if (dot)  { dot.style.display  = 'none'; }
  if (ring) { ring.style.display = 'none'; }
} else {
  /* Desktop — run custom cursor */
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
   PAGE NAVIGATION — games now open freely, no nav-level lock
═══════════════════════════════════════════════════════════ */
let currentPage = 'home';
const overlay   = document.getElementById('transition-overlay');

function navigateTo(pageId) {
  if (pageId === currentPage) return;
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
    profiles:'Profiles', journey:'Journey', birthday:'Clock',
    thoughts:'Thoughts', contact:'Contact', lists:'Lists',
    skills:'Traits', games:'Games', social:'Social'
  };
  document.querySelectorAll('#nav-links a').forEach(a => {
    a.classList.remove('active');
    if (a.textContent.trim().startsWith(map[pageId] || '')) a.classList.add('active');
  });
}

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
   submitGate: saves target BEFORE closeGate nullifies gateTargetPage
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
  const target = gateTargetPage; /* save BEFORE closeGate nullifies it */
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
   MOBILE NAV — hamburger uses classList so CSS handles X animation
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
}

setInterval(updateBirthdayTimer, 10);
updateBirthdayTimer();

/* ═══════════════════════════════════════════════════════════
   YEAR JOURNEY TIMELINE
═══════════════════════════════════════════════════════════ */
const yearData = {
  2008: { title: "The Beginning", body: "The story begins in the humid, electric atmosphere of Maharashtra, my entry into the world was marked by a setting defined by contrast—where the old soul of India meets the relentless ambition of its financial heart. From the very first day, my life was positioned at the intersection of diverse cultures and high expectations. Even though these early months are a blur of sensory memories, they established the -Nomadic- blueprint of my life. I was born into a family that valued education and presence, setting the stage for a boy who would eventually grow to command rooms and lead institutions." },
  2009: { title: "Year One", body: "Before the constant moves and the changing cities, 2009 was a year of profound, silent growth. This was the period where my internal world began to synthesize the environment around me. Living in the wake of the vibrant energy of Mumbai and Lucknow, I was a child developing an early sense of observation—the -Old Soul- beginning to peak through. While most children at this age are simply reacting to stimuli, I was absorbing the rhythms of a household that valued structure and discipline. This year was the silent foundation; it was the quiet before the journey of moving across India began. I was learning the nuances of human interaction before I could even speak, watching the leadership styles of the adults around me. It was a year of -Poetry- before the -Boardrooms- took over, filled with the vintage simplicity of a life that hadn't yet been complicated by the responsibilities I would later carry. It remains a placeholder for the peace I still chase today—a mind that feels calm amidst a world of noise." },
  2010: { title: "Growing Up", body: "In 2010, the nomadic cycle that would define my childhood truly began with a significant move to Jaipur, the Pink City. This was my first major geographical shift, triggered by my father's transfer, and it marked the beginning of my deep connection with the regal aesthetics of Rajasthan. Joining Star Kids Pre-school in the playgroup section was my first introduction to a social ecosystem outside of my family. Jaipur, with its symmetrical architecture and history of royalty, likely influenced my early appreciation for luxury and structure. I remember the transition from the familiar comfort of home to the structured chaos of a classroom. It was here that I first learned the art of real presence. I wasn't just another face in the playgroup; I was a child who teachers and peers naturally noticed. I began to navigate group dynamics for the first time, an early prototype of the student leader who would one day win elections through memorable speeches and strategic campaigning." },
  2011: { title: "Discovery", body: "2011 was the year I proved that the -Standard Path- was never meant for me. Entering Junior KG, I quickly realized that I was processing information and navigating social hierarchies at a different velocity than those around me. My teachers at the time recognized a rare combination of discipline, high IQ, and a raw, intrinsic motivation to excel that was far beyond my years. This led to a double promotion—an academic leap that saw me move from LKG to UKG in a mere six months. This wasn't just about finishing school faster; it was a psychological milestone. It taught me at the age of three that if you demonstrate mastery and maintain a -Boardroom- level of focus, the system will adapt to you. I began to view education as a game of strategy where excellence is the only currency that matters. While others were learning to follow rules, I was learning how to master them so I could eventually rewrite them." },
  2012: { title: "Early Years", body: "By 2012, I had solidified my position as the -Gold Standard- of my peer group. Completing my half-promotion into UKG, I secured the 1st Rank for outstanding academic and behavioral performance. However, the true significance of this year—the event that truly fits the -Luxury and Legacy- theme of my life—was my father being honored with the -Best Father Award- by the entire school community. This was a moment of immense pride, reinforcing the idea that my name was attached to impact and excellence. It taught me that real power is not just about individual success, but about the respect you command from your community. My life felt perfectly balanced during this period: I was the top student, my family was being recognized for its values, and the future felt like a straight line toward greatness. This year represents the peak of stability before the nomadic shifts became more frequent, serving as the benchmark for the -extraordinary life- I am currently building." },
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
    { date: "March 2026",    title: "xyz Faith post title — REPLACE", body: "xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz xyz. REPLACE with your thoughts on god/faith." },
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

  btn.textContent    = 'Sending...';
  btn.disabled       = true;
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

let currentAlbum     = null;
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
   GAMES — all 5 are public, no password gate
   Private games (family only, external links) are in HTML
   behind unlockSection password — handled separately
═══════════════════════════════════════════════════════════ */
let activeGame = null;

function openGame(gameId) {
  activeGame = gameId;
  document.getElementById('game-modal').classList.add('open');
  renderGame(gameId); /* directly open — no password */
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

/* ─── GAME 1: SNAKE ─── */
function renderSnake(container) {
  container.innerHTML = `
    <h3 style="font-family:var(--ff-display);font-size:1.5rem;color:var(--text);text-align:center;margin-bottom:1rem;">Snake</h3>
    <p style="text-align:center;font-size:0.75rem;color:var(--text3);margin-bottom:1rem;">Arrow keys or WASD · Score: <span id="snake-score">0</span></p>
    <canvas id="snake-canvas" width="400" height="400" style="border:1px solid var(--border2);background:var(--bg2);display:block;margin:0 auto;"></canvas>
    <p style="text-align:center;font-size:0.75rem;color:var(--text3);margin-top:1rem;" id="snake-msg">Press any arrow key to start</p>
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
      ctx.fillText('Press any key to restart', canvas.width / 2, canvas.height / 2 + 28);
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

/* ─── GAME 3: 2048 ─── */
function render2048(container) {
  let grid = Array(4).fill(null).map(() => Array(4).fill(0)), score = 0;
  container.innerHTML = `
    <h3 style="font-family:var(--ff-display);font-size:1.5rem;color:var(--text);text-align:center;margin-bottom:0.5rem;">2048</h3>
    <p style="text-align:center;font-size:0.75rem;color:var(--text3);margin-bottom:1rem;">Score: <span id="g2048-score">0</span> · Arrow keys to slide</p>
    <div id="g2048-grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;max-width:340px;margin:0 auto;background:var(--bg3);padding:6px;border-radius:4px;"></div>
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

  document.addEventListener('keydown', function keys2048(e) {
    if (!document.getElementById('game-modal').classList.contains('open')) { document.removeEventListener('keydown', keys2048); return; }
    const map = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
    if (map[e.key]) { e.preventDefault(); move(map[e.key]); }
  });
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
  function reset() { state = 'waiting'; box.style.background = 'var(--bg3)'; text.textContent = 'Click when it turns green'; sub.textContent = ''; }
  reset(); let timeout;
  function reactionClick() {
    if (state === 'waiting') {
      state = 'ready'; box.style.background = '#c0392b'; text.textContent = 'Wait...'; sub.textContent = '';
      clearTimeout(timeout);
      timeout = setTimeout(() => { state = 'go'; box.style.background = '#27ae60'; text.textContent = 'Click now!'; startTime = performance.now(); }, 1500 + Math.random() * 3000);
    } else if (state === 'ready') {
      clearTimeout(timeout); box.style.background = '#c0392b'; text.textContent = 'Too early! Click again.'; setTimeout(reset, 1000);
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

/* 1. Konami Code */
(function () {
  const konami = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  let idx = 0;
  document.addEventListener('keydown', e => {
    if (e.key === konami[idx]) { idx++; if (idx === konami.length) { const egg = document.getElementById('konami-egg'); egg.classList.add('show'); setTimeout(() => egg.classList.remove('show'), 3500); idx = 0; } }
    else { idx = 0; }
  });
})();

/* 2. Name click counter */
let nameClicks = 0;
const nameClickMessages = [
  "", "", "", "", "",
  "5 clicks... curious.",
  "6 clicks... you're definitely onto something.",
  "7 clicks! You found the easter egg. Hello, persistent human. Here is your reward — lean back and calm down.",
];

/* 3. Type "manomay" anywhere */
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

  /* Backdrop click closes panel — music keeps playing */
  const backdrop = document.getElementById('music-backdrop');
  if (backdrop) backdrop.addEventListener('click', closeMusicPanel);
});

/* ═══════════════════════════════════════════════════════════
   MUSIC SYSTEM
   Music bar (nav) = play/pause toggle only
   Vinyl record (bottom-left) = separate easter egg, panel control
   They are completely independent
═══════════════════════════════════════════════════════════ */

const bgMusic    = document.getElementById("bg-music");
const rainSong   = document.getElementById("rain-song");
const songBar    = document.getElementById("music-toggle"); /* nav button */
const vinylEl    = document.getElementById("vinyl-player");
const musicPanel = document.getElementById("music-panel");

let easterUnlocked = false;
let musicStarted   = false;
let userPaused     = false;   /* true when user manually paused via toggle */
let currentSongId  = 'bg';   /* 'bg' | 'easter' */

/* ─── updateMusicUI ───
   ONLY toggles .muted class on the nav bar button.
   NEVER sets innerHTML — that would destroy the sound-bars spans. */
function updateMusicUI() {
  const isPlaying = (bgMusic && !bgMusic.paused && !bgMusic.ended) ||
                    (rainSong && !rainSong.paused && !rainSong.ended);

  /* Toggle muted on nav button — CSS animations handle the bars */
  if (isPlaying) {
    songBar.classList.remove("muted");
  } else {
    songBar.classList.add("muted");
  }

  /* Vinyl rotation — only if vinyl is visible */
  if (vinylEl) {
    if (isPlaying) { vinylEl.classList.remove("paused"); }
    else           { vinylEl.classList.add("paused"); }
  }

  /* Animated bars inside the panel */
  const panelBars = document.getElementById('music-panel-bars');
  if (panelBars) {
    if (isPlaying) { panelBars.classList.add('playing'); }
    else           { panelBars.classList.remove('playing'); }
  }

  updateMusicPanelState();
}

/* ─── updateMusicPanelState ─── */
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

/* ─── MUSIC TOGGLE CLICK (nav bar button) ───
   ONLY pauses/resumes. Resumes from exact timestamp. No reset. */
songBar.addEventListener("click", () => {
  const isPlaying = (bgMusic && !bgMusic.paused && !bgMusic.ended) ||
                    (rainSong && !rainSong.paused && !rainSong.ended);

  if (isPlaying) {
    /* Pause without resetting currentTime — resume will continue from here */
    bgMusic.pause();
    rainSong.pause();
    userPaused = true;
  } else {
    userPaused = false;
    /* Resume the correct song from where it stopped */
    if (currentSongId === 'easter' && rainSong.currentTime > 0 && !rainSong.ended) {
      rainSong.play().catch(() => {});
    } else {
      bgMusic.play().catch(() => {});
      currentSongId = 'bg';
    }
  }
  updateMusicUI();
});

/* ─── When rain song ends: auto-resume bgMusic (if user hasn't paused) ─── */
rainSong.addEventListener("ended", () => {
  currentSongId = 'bg';
  if (!userPaused) {
    bgMusic.currentTime = 0;
    bgMusic.play().catch(() => {});
  }
  updateMusicUI();
});

/* Keep UI synced when browser changes audio state */
bgMusic.addEventListener("play",  updateMusicUI);
bgMusic.addEventListener("pause", updateMusicUI);
rainSong.addEventListener("play",  updateMusicUI);
rainSong.addEventListener("pause", updateMusicUI);

/* ─── Autoplay bgMusic on first user interaction ─── */
function tryStartBgMusic() {
  if (musicStarted || userPaused) return;
  bgMusic.play()
    .then(() => {
      musicStarted  = true;
      currentSongId = 'bg';
      updateMusicUI();
    })
    .catch(() => { /* browser blocked — user must click toggle to start */ });
}

/* Start on ANY interaction — mousemove, click, scroll */
document.addEventListener("mousemove", tryStartBgMusic, { once: true });
document.addEventListener("click",     tryStartBgMusic, { once: true });
document.addEventListener("scroll",    tryStartBgMusic, { once: true, capture: true });

/* ─── VINYL PANEL FUNCTIONS ─── */

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
  /* music continues playing — do NOT pause here */
}

function toggleMusicPanel() {
  if (!musicPanel) return;
  if (musicPanel.classList.contains('open')) {
    closeMusicPanel();
  } else {
    openMusicPanel();
  }
}

/* Vinyl click → open/close panel. Does NOT control music. */
if (vinylEl) {
  vinylEl.addEventListener("click", () => {
    toggleMusicPanel();
  });
}

/* ─── SHOW/HIDE VINYL ─── */

function showVinyl() {
  if (!vinylEl) return;
  vinylEl.classList.remove("hidden");
  easterUnlocked = true;
}

/* Called by "Hide Vinyl Record" button inside panel */
function hideVinyl() {
  if (!vinylEl) return;
  closeMusicPanel();
  /* Small delay so panel closes before vinyl disappears */
  setTimeout(() => {
    vinylEl.classList.add("hidden");
    easterUnlocked = false;
  }, 200);
}

/* ─── PLAY FROM PANEL ─── */
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

/* ─── NAME CLICK EASTER EGG ─── */
function nameclickHandler() {
  nameClicks++;
  const hint = document.getElementById("name-click-hint");

  if (nameClicks >= 5) {
    hint.textContent = nameClickMessages[Math.min(nameClicks, 7)];
    hint.classList.add("show");
  }

  if (nameClicks >= 7) {
    /* If vinyl already visible → show "already enabled" message, do NOT hide vinyl */
    if (easterUnlocked) {
      hint.textContent = "Easter egg already enabled! Check the bottom-left corner 🎵";
      hint.classList.add("show");
      setTimeout(() => {
        nameClicks = 0;
        hint.classList.remove("show");
      }, 3000);
      return; /* exit early — do not re-trigger */
    }

    /* First time — show vinyl, play rain song */
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
