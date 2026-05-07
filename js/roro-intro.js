/* ═══════════════════════════════════════════════════════════
   js/roro-intro.js  —  MSM Cinematic Splash Screen
   ─────────────────────────────────────────────────────────
   INTEGRATION STEPS (read before using):
   1. Add <script src="js/roro-intro.js"></script>
      BEFORE <script src="js/main.js"></script> in index.html
   2. DELETE or HIDE the existing #loading-screen block:
      <div id="loading-screen"> ... </div>
      (or leave it — this script hides it automatically)
   3. Nothing else needs touching.
   ─────────────────────────────────────────────────────────
   ORDER OF ELEMENTS (top → bottom):
   i.   M · S · M  (small logo)
   ii.  WELCOME BACK, NAME  /  WELCOME.  (large display)
   iii. Context line  (smaller, bold, accent)
   iv.  Clock  |  Day / Date
   v.   Loading bar  + percentage
   vi.  Log messages — one by one (fixed area, no layout shift)
   vii. On 100%: log area → [ SCRIPT ] button
   viii. CONTINUE button
═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ─── suppress the old loading screen immediately ──── */
  const _OLD = document.getElementById('loading-screen');
  if (_OLD) _OLD.style.cssText = 'display:none!important;pointer-events:none!important;';

  /* ═══════════════════════════════════════════════════
     DATA
  ═══════════════════════════════════════════════════ */

  const FIRST_WELCOME = [
    'Welcome.',
    'You\'ve arrived.',
    'Something worth seeing awaits.',
    'An intentional space.',
    'Not many find their way here.',
    'Presence acknowledged.',
    'Built for people who notice things.',
  ];

  const RETURN_WELCOME = [
    'Welcome back, {name}.',
    'Still curious, {name}?',
    'You returned, {name}.',
    '{name}. Good to have you back.',
    'Again, {name}. That means something.',
    'Back already, {name}.',
    'The site remembers you, {name}.',
  ];

  const CONTEXT_LINES = {
    night:     ['The world is quiet. You\'re still here.', 'Late nights have a clarity daylight rarely offers.', 'Most of the city is asleep.', 'The rare hour. Use it well.'],
    dawn:      ['Before dawn. The rarest window.', 'You\'re up before most cities are.', 'Pre-dawn. A strange calm settles here.', 'Early enough to see things clearly.'],
    morning:   ['Morning already in motion.', 'First thoughts of the day carry weight.', 'The day hasn\'t decided what it is yet.', 'Good time to explore things.'],
    midday:    ['Midday. Half the day already spent.', 'Somewhere between intention and momentum.', 'Noon. A strange pivot in the day.', 'Post-morning clarity. Good timing.'],
    afternoon: ['The afternoon carries a certain weight.', 'The day has settled into itself now.', 'That quiet hour before the light shifts.', 'Golden hour is not far.'],
    evening:   ['Evening feels quieter here.', 'The day is softening at its edges.', 'Evenings are for noticing things you missed.', 'Dusk settles differently when you pay attention.'],
    night2:    ['Night has a particular kind of focus.', 'Late enough to mean something.', 'The city dims. You stay lit.', 'After-hours. This is when real things happen.'],
  };

  const LOG_LINES = [
    { tag: 'SYS', msg: 'initialising identity_matrix v2026' },
    { tag: 'MEM', msg: 'reading 18 years across 6 cities' },
    { tag: 'IDX', msg: 'indexing journey 2008 → 2026' },
    { tag: 'REF', msg: 'compiling thoughts & beliefs' },
    { tag: 'IMG', msg: 'loading captured moments' },
    { tag: 'NET', msg: 'connecting social presence nodes' },
    { tag: 'AUD', msg: 'preparing ambient layer' },
    { tag: 'SEC', msg: 'encrypting private sections' },
    { tag: 'RUN', msg: 'finalising portfolio render' },
    { tag: 'OK ', msg: 'all systems nominal · entering' },
  ];

  const FACTS = [
    'Hint: click the name on the home page exactly 7 times.',
    'Hint: type the word manomay anywhere. watch the accent.',
    'A teaspoon of neutron star material weighs ~6 billion tons.',
    'Venus rotates clockwise — opposite to most planets.',
    'More stars exist than grains of sand on all Earth\'s beaches.',
    'The Moon drifts 1.5 inches further from Earth every year.',
    'The "#" symbol is officially called an octothorpe.',
    'Some sections here require a password. Contact is how you ask.',
    'The Clock page has a special state — only on August 29th.',
    'There are 14 distinct sections. Most visitors find 6 or 7.',
    'Identical twins do not share fingerprints.',
    'The Anglo-Zanzibar War lasted 38 minutes — the shortest war ever.',
    'The Eiffel Tower grows up to 6 inches taller in summer.',
    'The background music has two tracks. Only one is obvious.',
    'Every pixel of this site was written by hand. No frameworks.',
    'The letter J was the last added to the English alphabet.',
    'The Journey timeline covers 19 chapters — 2008 to present.',
    'There are four visual themes. Switching changes more than colours.',
    'The hero name cycles its highlight on each reload.',
    'Nothing here was accidental. Every element was placed deliberately.',
    'All clownfish are born male. The dominant one can change sex.',
    'The human brain burns ~400–500 calories per day just to function.',
    'Hippos cannot swim — they gallop along riverbeds.',
    'Bananas grow upward against gravity — negative geotropism.',
    'The vinyl record isn\'t always visible. Find out why.',
    'Mechanical click sounds can be toggled in the nav bar.',
    'Some photo albums require trust. There\'s a reason they\'re locked.',
    'The Thoughts section has 16 posts across six categories.',
    'The oldest cat ever recorded lived 38 years and 3 days.',
    'Humans blink up to 28,800 times per day.',
    'Egypt is considered the world\'s oldest country, ~3100 BCE.',
    'Your stomach gets a new lining every 3–4 days.',
    'The five games are fully real. No half-measures.',
    'Hint: Knock. Some of the best content sits behind a password.',
    'A sneeze can reach 100 miles per hour.',
    'The bumblebee bat weighs 0.05–0.07 ounces — world\'s smallest mammal.',
  ];

  /* ═══════════════════════════════════════════════════
     HELPERS
  ═══════════════════════════════════════════════════ */

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function loadUser() {
    try { const r = localStorage.getItem('roroUser'); return r ? JSON.parse(r) : null; }
    catch { return null; }
  }

  function getContextLine() {
    const h = new Date().getHours();
    let pool;
    if      (h >= 0  && h < 4)  pool = CONTEXT_LINES.night;
    else if (h >= 4  && h < 7)  pool = CONTEXT_LINES.dawn;
    else if (h >= 7  && h < 12) pool = CONTEXT_LINES.morning;
    else if (h >= 12 && h < 14) pool = CONTEXT_LINES.midday;
    else if (h >= 14 && h < 18) pool = CONTEXT_LINES.afternoon;
    else if (h >= 18 && h < 21) pool = CONTEXT_LINES.evening;
    else                         pool = CONTEXT_LINES.night2;
    return pick(pool);
  }

  function formatClock(d) {
    let h = d.getHours(), m = String(d.getMinutes()).padStart(2, '0');
    const ap = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return { time: `${String(h).padStart(2,'0')}:${m}`, ampm: ap };
  }

  function formatDate(d) {
    const days  = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
    const months= ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    return { day: days[d.getDay()], date: `${months[d.getMonth()]} ${d.getDate()}` };
  }

  /* ═══════════════════════════════════════════════════
     STYLES  (injected once)
  ═══════════════════════════════════════════════════ */

  function injectStyles() {
    if (document.getElementById('roro-css')) return;
    const s = document.createElement('style');
    s.id = 'roro-css';
    s.textContent = `
#roro-splash {
  position: fixed;
  inset: 0;
  z-index: 100000;
  background: var(--bg, #080808);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  font-family: var(--ff-mono, 'DM Mono', monospace);
}

#roro-splash * { cursor: none; }

#roro-splash .rs-grid {
  position: absolute; inset: 0;
  background-image:
    linear-gradient(var(--border, rgba(255,255,255,0.04)) 1px, transparent 1px),
    linear-gradient(90deg, var(--border, rgba(255,255,255,0.04)) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse 70% 60% at 50% 50%, black 20%, transparent 100%);
  -webkit-mask-image: radial-gradient(ellipse 70% 60% at 50% 50%, black 20%, transparent 100%);
  pointer-events: none;
}

/* film reel strips */
.rs-film {
  position: absolute;
  top: 0; bottom: 0;
  width: 40px;
  overflow: hidden;
  pointer-events: none;
}
.rs-film.left  { left: 18px; }
.rs-film.right { right: 18px; }

.rs-film-track {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0;
}
.rs-film.left  .rs-film-track { animation: filmUp   14s linear infinite; }
.rs-film.right .rs-film-track { animation: filmDown 14s linear infinite; }

@keyframes filmUp   { from { transform: translateY(0);    } to { transform: translateY(-50%); } }
@keyframes filmDown { from { transform: translateY(-50%); } to { transform: translateY(0);    } }

.rs-frame {
  width: 32px;
  height: 22px;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 3px;
  flex-shrink: 0;
  background: transparent;
}
.rs-frame.lit {
  border-color: rgba(255,255,255,0.16);
  box-shadow: inset 0 0 6px rgba(255,255,255,0.03);
}

/* center column — FIXED, never moves */
.rs-center {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 440px;
  padding: 0 64px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* logo */
.rs-logo {
  font-family: var(--ff-mono, 'DM Mono', monospace);
  font-size: 0.65rem;
  letter-spacing: 0.38em;
  color: rgba(255,255,255,0.22);
  margin-bottom: 32px;
  user-select: none;
}

/* welcome */
.rs-welcome {
  font-family: var(--ff-display, 'Cormorant Garamond', serif);
  font-size: clamp(1.6rem, 4vw, 2.2rem);
  font-weight: 300;
  color: var(--text, rgba(255,255,255,0.92));
  letter-spacing: -0.01em;
  text-align: center;
  line-height: 1.15;
  margin-bottom: 10px;
  min-height: 1.15em;
}

/* context */
.rs-context {
  font-family: var(--ff-mono, 'DM Mono', monospace);
  font-size: 0.6rem;
  letter-spacing: 0.18em;
  color: var(--accent, rgba(232,213,183,0.82));
  text-transform: uppercase;
  font-weight: 500;
  margin-bottom: 28px;
  text-align: center;
  min-height: 1em;
}

/* clock */
.rs-clock-row {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 28px;
}
.rs-time-main {
  font-family: var(--ff-display, 'Cormorant Garamond', serif);
  font-size: clamp(1.5rem, 4.5vw, 2.2rem);
  font-weight: 300;
  color: var(--text, rgba(255,255,255,0.8));
  letter-spacing: -0.02em;
  line-height: 1;
}
.rs-time-ampm {
  font-family: var(--ff-mono, 'DM Mono', monospace);
  font-size: 0.52rem;
  letter-spacing: 0.08em;
  color: rgba(255,255,255,0.3);
  vertical-align: middle;
  margin-left: 3px;
}
.rs-clock-sep {
  width: 1px;
  height: 28px;
  background: rgba(255,255,255,0.1);
  flex-shrink: 0;
}
.rs-clock-right {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.rs-clock-day {
  font-family: var(--ff-mono, 'DM Mono', monospace);
  font-size: 0.52rem;
  letter-spacing: 0.2em;
  color: rgba(255,255,255,0.28);
  text-transform: uppercase;
}
.rs-clock-date {
  font-family: var(--ff-mono, 'DM Mono', monospace);
  font-size: 0.62rem;
  letter-spacing: 0.1em;
  color: rgba(255,255,255,0.45);
}

/* loading bar */
.rs-bar-row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}
.rs-bar-track {
  flex: 1;
  height: 1px;
  background: rgba(255,255,255,0.08);
  position: relative;
  overflow: hidden;
}
.rs-bar-fill {
  position: absolute;
  top: 0; left: 0; bottom: 0;
  width: 0%;
  background: var(--accent, rgba(232,213,183,0.7));
  transition: width 0.25s ease;
}
.rs-bar-pct {
  font-size: 0.52rem;
  letter-spacing: 0.08em;
  color: rgba(255,255,255,0.2);
  min-width: 3.5ch;
  text-align: right;
  flex-shrink: 0;
}

/* ── LOG AREA — FIXED HEIGHT, never causes layout shift ── */
.rs-log-area {
  width: 100%;
  height: 52px;
  overflow: hidden;
  margin-top: 16px;
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 4px;
}
.rs-log-line {
  display: flex;
  gap: 10px;
  align-items: baseline;
  font-size: 0.56rem;
  letter-spacing: 0.04em;
  color: rgba(255,255,255,0.2);
  line-height: 1.6;
  opacity: 0;
  transform: translateY(6px);
  transition: opacity 0.25s ease, transform 0.25s ease;
  white-space: nowrap;
  overflow: hidden;
}
.rs-log-line.visible {
  opacity: 1;
  transform: translateY(0);
}
.rs-log-tag {
  color: var(--accent, rgba(232,213,183,0.5));
  font-size: 0.5rem;
  letter-spacing: 0.12em;
  flex-shrink: 0;
  opacity: 0.6;
}
.rs-log-msg { color: rgba(255,255,255,0.22); }

/* fact area — same fixed height as log area, sits beneath it */
.rs-fact-area {
  width: 100%;
  height: 20px;
  margin-top: 6px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.rs-fact {
  font-size: 0.52rem;
  letter-spacing: 0.05em;
  color: rgba(255,255,255,0.13);
  text-align: center;
  transition: opacity 0.15s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}
.rs-fact.fade { opacity: 0; }

/* ── POST-LOAD: script button + continue ── */
.rs-post {
  width: 100%;
  margin-top: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.5s ease;
}
.rs-post.visible {
  opacity: 1;
  pointer-events: all;
}

/* script button — replaces log area when loading done */
.rs-script-btn {
  font-family: var(--ff-mono, 'DM Mono', monospace);
  font-size: 0.54rem;
  letter-spacing: 0.22em;
  color: rgba(255,255,255,0.22);
  background: none;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 3px;
  padding: 5px 14px;
  cursor: none;
  transition: color 0.3s, border-color 0.3s;
  outline: none;
}
.rs-script-btn:hover {
  color: rgba(255,255,255,0.55);
  border-color: rgba(255,255,255,0.22);
}
.rs-script-btn:active { opacity: 0.7; }

/* script log panel (expands when script btn clicked) */
.rs-script-log {
  width: 100%;
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.4s cubic-bezier(0.16,1,0.3,1);
}
.rs-script-log.open { max-height: 220px; }
.rs-script-log-inner {
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 3px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  overflow-y: auto;
  max-height: 200px;
}
.rs-script-log-inner::-webkit-scrollbar { width: 2px; }
.rs-script-log-inner::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 1px; }
.rs-slog-line {
  font-size: 0.52rem;
  letter-spacing: 0.04em;
  color: rgba(255,255,255,0.2);
  line-height: 1.7;
  display: flex;
  gap: 8px;
}
.rs-slog-tag { color: var(--accent, rgba(232,213,183,0.4)); font-size: 0.48rem; flex-shrink: 0; }

/* continue button */
.rs-continue {
  font-family: var(--ff-mono, 'DM Mono', monospace);
  font-size: 0.6rem;
  letter-spacing: 0.4em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.38);
  background: none;
  border: none;
  padding: 8px 24px;
  cursor: none;
  transition: color 0.35s ease, letter-spacing 0.45s ease;
  outline: none;
}
.rs-continue:hover {
  color: rgba(255,255,255,0.88);
  letter-spacing: 0.55em;
}
.rs-continue:active { opacity: 0.6; }

/* exit transition — slides up like original */
#roro-splash.rs-exit {
  transition: opacity 0.55s ease, transform 0.55s cubic-bezier(0.76,0,0.24,1);
  opacity: 0;
  transform: translateY(-100%);
  pointer-events: none;
}

@media (max-width: 480px) {
  .rs-center { padding: 0 52px; }
  .rs-film.left  { left: 10px; }
  .rs-film.right { right: 10px; }
  .rs-frame { width: 26px; height: 18px; }
  .rs-logo { font-size: 0.58rem; }
}
    `;
    document.head.appendChild(s);
  }

  /* ═══════════════════════════════════════════════════
     BUILD FILM STRIP  (duplicate for seamless loop)
  ═══════════════════════════════════════════════════ */

  function buildFilmTrack(n, litIndices) {
    const track = document.createElement('div');
    track.className = 'rs-film-track';
    /* duplicate for seamless scroll */
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < n; i++) {
        const f = document.createElement('div');
        f.className = 'rs-frame' + (litIndices.includes(i) ? ' lit' : '');
        track.appendChild(f);
      }
    }
    return track;
  }

  /* ═══════════════════════════════════════════════════
     BUILD DOM
  ═══════════════════════════════════════════════════ */

  function buildDOM(user) {
    const root = document.createElement('div');
    root.id = 'roro-splash';

    const welcomeText = (user && user.name)
      ? pick(RETURN_WELCOME).replace(/\{name\}/g, user.name)
      : pick(FIRST_WELCOME);

    const contextText = getContextLine();

    const now = new Date();
    const { time, ampm } = formatClock(now);
    const { day, date }   = formatDate(now);

    root.innerHTML = `
      <div class="rs-grid" aria-hidden="true"></div>

      <div class="rs-film left"  aria-hidden="true"></div>
      <div class="rs-film right" aria-hidden="true"></div>

      <div class="rs-center">
        <div class="rs-logo" aria-label="MSM">M &nbsp;&middot;&nbsp; S &nbsp;&middot;&nbsp; M</div>

        <div class="rs-welcome"  id="rs-welcome">${welcomeText}</div>
        <div class="rs-context"  id="rs-context">${contextText}</div>

        <div class="rs-clock-row" id="rs-clock-row">
          <div>
            <span class="rs-time-main" id="rs-time">${time}</span><span class="rs-time-ampm" id="rs-ampm">${ampm}</span>
          </div>
          <div class="rs-clock-sep"></div>
          <div class="rs-clock-right">
            <div class="rs-clock-day"  id="rs-day">${day}</div>
            <div class="rs-clock-date" id="rs-date">${date}</div>
          </div>
        </div>

        <div class="rs-bar-row">
          <div class="rs-bar-track"><div class="rs-bar-fill" id="rs-bar"></div></div>
          <div class="rs-bar-pct"  id="rs-pct">0%</div>
        </div>

        <!-- FIXED-HEIGHT LOG AREA — never shifts layout -->
        <div class="rs-log-area" id="rs-log-area">
          <div class="rs-log-line" id="rs-log-0"><span class="rs-log-tag"></span><span class="rs-log-msg"></span></div>
          <div class="rs-log-line" id="rs-log-1"><span class="rs-log-tag"></span><span class="rs-log-msg"></span></div>
        </div>

        <!-- FACT AREA — fixed height, no layout impact -->
        <div class="rs-fact-area" id="rs-fact-area">
          <div class="rs-fact" id="rs-fact"></div>
        </div>

        <!-- POST-LOAD (hidden until done) -->
        <div class="rs-post" id="rs-post">
          <button class="rs-script-btn" id="rs-script-btn" aria-label="Expand loading log">SCRIPT</button>
          <div class="rs-script-log" id="rs-script-log">
            <div class="rs-script-log-inner" id="rs-script-log-inner"></div>
          </div>
          <button class="rs-continue" id="rs-continue" aria-label="Enter site">CONTINUE</button>
        </div>
      </div>
    `;

    document.body.appendChild(root);

    /* inject film strips */
    const litL = [1, 4, 7, 10, 13];
    const litR = [2, 5, 8, 11, 14];
    const filmCount = 18;
    root.querySelector('.rs-film.left').appendChild(buildFilmTrack(filmCount, litL));
    root.querySelector('.rs-film.right').appendChild(buildFilmTrack(filmCount, litR));

    return root;
  }

  /* ═══════════════════════════════════════════════════
     MAIN CONTROLLER
  ═══════════════════════════════════════════════════ */

  function run() {
    injectStyles();

    /* make sure cursor elements are above the splash */
    const cursorDot  = document.getElementById('cursor-dot');
    const cursorRing = document.getElementById('cursor-ring');
    if (cursorDot)  cursorDot.style.zIndex  = '100002';
    if (cursorRing) cursorRing.style.zIndex = '100001';

    const user = loadUser();
    const root = buildDOM(user);

    /* element refs */
    const barEl        = root.querySelector('#rs-bar');
    const pctEl        = root.querySelector('#rs-pct');
    const log0El       = root.querySelector('#rs-log-0');
    const log1El       = root.querySelector('#rs-log-1');
    const factEl       = root.querySelector('#rs-fact');
    const postEl       = root.querySelector('#rs-post');
    const scriptBtnEl  = root.querySelector('#rs-script-btn');
    const scriptLogEl  = root.querySelector('#rs-script-log');
    const scriptInner  = root.querySelector('#rs-script-log-inner');
    const continueEl   = root.querySelector('#rs-continue');
    const timeEl       = root.querySelector('#rs-time');
    const ampmEl       = root.querySelector('#rs-ampm');
    const dayEl        = root.querySelector('#rs-day');
    const dateEl       = root.querySelector('#rs-date');

    /* ── live clock ── */
    function tickClock() {
      const n = new Date();
      const { time, ampm } = formatClock(n);
      const { day, date }  = formatDate(n);
      timeEl.textContent = time;
      ampmEl.textContent = ampm;
      dayEl.textContent  = day;
      dateEl.textContent = date;
    }
    const clockInterval = setInterval(tickClock, 1000);

    /* ── fact rotation ── */
    let factIdx = Math.floor(Math.random() * FACTS.length);
    factEl.textContent = FACTS[factIdx];

    const factInterval = setInterval(() => {
      factEl.classList.add('fade');
      setTimeout(() => {
        factIdx = (factIdx + 1) % FACTS.length;
        factEl.textContent = FACTS[factIdx];
        factEl.classList.remove('fade');
      }, 160);
    }, 2800);

    /* ── log messages — two visible at a time ── */
    let logSlot   = 0;   /* which slot (0 or 1) is "top" */
    let logFired  = 0;   /* how many log messages shown so far */
    const allLogs = [];  /* accumulated for SCRIPT panel */

    function showLog(entry) {
      allLogs.push(entry);

      /* slot 0 = top line, slot 1 = bottom line
         each new message pushes into the bottom slot,
         old bottom becomes top */
      const top    = root.querySelector(`#rs-log-${logSlot}`);
      const bottom = root.querySelector(`#rs-log-${1 - logSlot}`);

      /* fade out top */
      top.classList.remove('visible');

      /* update bottom with new content */
      setTimeout(() => {
        bottom.querySelector('.rs-log-tag').textContent = entry.tag;
        bottom.querySelector('.rs-log-msg').textContent = entry.msg;
        bottom.classList.add('visible');
        logSlot = 1 - logSlot;
      }, 80);
    }

    /* ── loading progress (7 seconds to 100%) ── */
    const LOAD_MS = 7000;
    const startTime = Date.now();
    let progressDone = false;

    const barInterval = setInterval(() => {
      const elapsed  = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / LOAD_MS) * 100);

      barEl.style.width = progress + '%';
      pctEl.textContent = Math.floor(progress) + '%';

      /* fire log messages spaced across the 7 seconds */
      const expectedLogs = Math.floor((progress / 100) * LOG_LINES.length);
      while (logFired < expectedLogs && logFired < LOG_LINES.length) {
        showLog(LOG_LINES[logFired]);
        logFired++;
      }

      if (progress >= 100 && !progressDone) {
        progressDone = true;
        clearInterval(barInterval);

        /* hide the log area after a brief hold, then show post-load */
        setTimeout(() => {
          /* fade log area out */
          const logArea = root.querySelector('#rs-log-area');
          const factArea = root.querySelector('#rs-fact-area');
          logArea.style.transition  = 'opacity 0.3s ease';
          factArea.style.transition = 'opacity 0.3s ease';
          logArea.style.opacity  = '0';
          factArea.style.opacity = '0';

          setTimeout(() => {
            logArea.style.display  = 'none';
            factArea.style.display = 'none';
            /* show post section */
            postEl.classList.add('visible');
          }, 320);

          /* stop fact rotation */
          clearInterval(factInterval);
        }, 600);
      }
    }, 40);

    /* ── SCRIPT toggle ── */
    let scriptOpen = false;
    scriptBtnEl.addEventListener('click', () => {
      scriptOpen = !scriptOpen;
      if (scriptOpen) {
        scriptInner.innerHTML = '';
        allLogs.forEach(e => {
          const line = document.createElement('div');
          line.className = 'rs-slog-line';
          line.innerHTML = `<span class="rs-slog-tag">${e.tag}</span><span>${e.msg}</span>`;
          scriptInner.appendChild(line);
        });
        scriptLogEl.classList.add('open');
      } else {
        scriptLogEl.classList.remove('open');
      }
    });

    /* ── CONTINUE — the ONLY place music starts ── */
    continueEl.addEventListener('click', () => {
      /* start background music only here */
      const bgMusic = document.getElementById('bg-music');
      if (bgMusic) bgMusic.play().catch(() => {});

      /* animate splash out */
      root.classList.add('rs-exit');

      /* cleanup + fire hero animations after exit */
      setTimeout(() => {
        clearInterval(clockInterval);
        clearInterval(factInterval);
        root.remove();

        const cssEl = document.getElementById('roro-css');
        if (cssEl) cssEl.remove();

        /* restore cursor z-indexes */
        if (cursorDot)  cursorDot.style.zIndex  = '99999';
        if (cursorRing) cursorRing.style.zIndex = '99998';

        /* fire the existing homepage animation */
        if (typeof window.startHeroAnimations === 'function') {
          window.startHeroAnimations();
        }
      }, 580);
    });
  }

  /* ═══════════════════════════════════════════════════
     AUTO-INIT on DOMContentLoaded
  ═══════════════════════════════════════════════════ */
  window.initRoroSplash = run;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }

})();

/*
  ═══════════════════════════════════════════════════════
  QUICK CHECKLIST — DO THESE THREE THINGS:
  ═══════════════════════════════════════════════════════

  1. In index.html, add this line BEFORE main.js:
       <script src="js/roro-intro.js"></script>

  2. In index.html, DELETE (or comment out) this block:
       <div id="loading-screen">
         <div class="loading-name">M · S · M</div>
         <div class="loading-bar-wrap">
           <div class="loading-bar" id="loading-bar"></div>
         </div>
         <div class="loading-pct" id="loading-pct">0%</div>
       </div>

  3. To store a user's name for the "Welcome back" personalisation,
     save this anywhere in your code after they give their name:
       localStorage.setItem('roroUser', JSON.stringify({ name: 'Manomay' }))

  ═══════════════════════════════════════════════════════
*/
