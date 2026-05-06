/* ═══════════════════════════════════════════════════════════
   js/roro-intro.js
   MSM — Cinematic Splash Screen System
   ─────────────────────────────────────────────────────────
   Vanilla JS · Zero dependencies · CSS-variable aware
   ▸ Detects returning users via localStorage
   ▸ Staged 5–7 second cinematic sequence
   ▸ Live clock · Fact scanner · Flying loading messages
   ▸ Collapse → thinking bar → Continue
   ▸ Exits cleanly into existing homepage logic
   ─────────────────────────────────────────────────────────
   ⚠  INTEGRATION NOTES FOR DEVELOPER:
   1. Add <script src="js/roro-intro.js"></script>
      BEFORE <script src="js/main.js"></script> in index.html
   2. DELETE the existing #loading-screen block from HTML:
      <div id="loading-screen"> ... </div>
   3. No other files need modification.
═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ═══════════════════════════════════════════════════════
     § 0 — INJECTED STYLESHEET
     All styling lives here. Every colour pulls directly
     from the site's CSS custom properties — all four
     themes (Noir / Ivory / Slate / Forest) work without
     any additional configuration.
  ═══════════════════════════════════════════════════════ */

  const SPLASH_CSS = `

    /* ── Base overlay ───────────────────────────────── */
    #roro-splash {
      position: fixed;
      inset: 0;
      z-index: 99999;
      background: var(--bg);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    /* Grid background — same motif as the hero section */
    #roro-splash .rs-grid {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(var(--border) 1px, transparent 1px),
        linear-gradient(90deg, var(--border) 1px, transparent 1px);
      background-size: 60px 60px;
      -webkit-mask-image: radial-gradient(ellipse 80% 60% at 50% 50%, black 30%, transparent 100%);
      mask-image:         radial-gradient(ellipse 80% 60% at 50% 50%, black 30%, transparent 100%);
      pointer-events: none;
      z-index: 0;
    }

    /* Noise overlay */
    #roro-splash::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.025'/%3E%3C/svg%3E");
      opacity: 0.4;
      pointer-events: none;
      z-index: 0;
    }

    /* Exit animation — called when user clicks Continue */
    #roro-splash.rs-exit {
      animation: rsExit 0.65s cubic-bezier(0.76, 0, 0.24, 1) forwards;
    }
    @keyframes rsExit {
      0%   { opacity: 1; transform: scaleY(1);    }
      60%  { opacity: 1; transform: scaleY(0.98); }
      100% { opacity: 0; transform: scaleY(0.94); }
    }

    /* ── Inner layout container ─────────────────────── */
    .rs-inner {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 480px;
      padding: 0 2rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0;
    }

    /* ── Logo ───────────────────────────────────────── */
    .rs-logo {
      font-family: var(--ff-display);
      font-size: clamp(2.2rem, 8vw, 3.5rem);
      font-weight: 300;
      letter-spacing: 0.35em;
      color: var(--text);
      text-align: center;
      margin-bottom: 2.8rem;
      user-select: none;
      opacity: 0;
      animation: rsFadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards;
    }
    @keyframes rsFadeUp {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0);    }
    }

    /* ── Flying loading text ────────────────────────── */
    .rs-fly-wrap {
      width: 100%;
      height: 22px;
      overflow: hidden;
      position: relative;
      margin-bottom: 1.2rem;
      opacity: 0;
      animation: rsFadeIn 0.5s ease 0.4s forwards;
    }
    @keyframes rsFadeIn {
      to { opacity: 1; }
    }
    .rs-fly-item {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      text-align: center;
      font-family: var(--ff-mono);
      font-size: 0.62rem;
      letter-spacing: 0.05em;
      color: var(--text3);
      transform: translateY(100%);
      opacity: 0;
      pointer-events: none;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .rs-fly-item.rs-fly--in {
      animation: rsFlyIn 0.12s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .rs-fly-item.rs-fly--out {
      animation: rsFlyOut 0.12s cubic-bezier(0.76, 0, 0.24, 1) forwards;
    }
    @keyframes rsFlyIn {
      from { transform: translateY(100%); opacity: 0; }
      to   { transform: translateY(0);   opacity: 1; }
    }
    @keyframes rsFlyOut {
      from { transform: translateY(0);    opacity: 1; }
      to   { transform: translateY(-100%); opacity: 0; }
    }

    /* ── Progress bar ───────────────────────────────── */
    .rs-progress-wrap {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 0.5rem;
      opacity: 0;
      animation: rsFadeIn 0.5s ease 0.5s forwards;
    }
    .rs-bar-track {
      flex: 1;
      height: 1px;
      background: var(--border2);
      position: relative;
      overflow: hidden;
    }
    .rs-bar {
      position: absolute;
      top: 0; left: 0; bottom: 0;
      width: 0%;
      background: var(--accent);
      transition: width 0.28s cubic-bezier(0.4, 0, 0.2, 1);
    }
    /* Shimmer on bar */
    .rs-bar::after {
      content: '';
      position: absolute;
      top: 0; right: 0; bottom: 0;
      width: 60px;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
      animation: rsBarShimmer 1.4s ease-in-out infinite;
    }
    @keyframes rsBarShimmer {
      0%, 100% { opacity: 0;   }
      50%       { opacity: 1;   }
    }
    .rs-pct {
      font-family: var(--ff-mono);
      font-size: 0.6rem;
      color: var(--text3);
      letter-spacing: 0.06em;
      min-width: 3ch;
      text-align: right;
      flex-shrink: 0;
    }

    /* ── Thinking bar (replaces flying text after load) */
    .rs-think-wrap {
      width: 100%;
      margin-bottom: 0;
      display: none;
    }
    .rs-think-wrap.rs-think--visible {
      display: block;
    }
    .rs-think-bar {
      width: 100%;
      height: 1px;
      background: var(--border2);
      position: relative;
      overflow: hidden;
      cursor: pointer;
      margin-bottom: 0;
      transition: height 0.3s ease, background 0.3s ease;
    }
    .rs-think-bar:hover {
      background: var(--border);
    }
    .rs-think-pulse {
      position: absolute;
      top: 0; bottom: 0;
      left: -40%;
      width: 40%;
      background: linear-gradient(90deg, transparent, var(--accent), transparent);
      animation: rsThinkPulse 1.8s ease-in-out infinite;
      pointer-events: none;
    }
    @keyframes rsThinkPulse {
      from { left: -40%; }
      to   { left: 110%;  }
    }
    .rs-think-label {
      font-family: var(--ff-mono);
      font-size: 0.52rem;
      color: var(--text3);
      letter-spacing: 0.12em;
      text-align: center;
      margin-top: 4px;
      text-transform: uppercase;
      opacity: 0.55;
      cursor: pointer;
      user-select: none;
    }
    .rs-think-lines {
      display: none;
      padding: 10px 0 4px;
      border-top: 1px solid var(--border);
      margin-top: 6px;
    }
    .rs-think-lines.rs-think-lines--open {
      display: block;
      animation: rsFadeUp 0.3s ease forwards;
    }
    .rs-think-line {
      font-family: var(--ff-mono);
      font-size: 0.56rem;
      color: var(--text3);
      letter-spacing: 0.04em;
      padding: 2px 0;
      opacity: 0.7;
    }
    .rs-think-line::before {
      content: '> ';
      color: var(--accent);
      opacity: 0.6;
    }

    /* ── Divider ────────────────────────────────────── */
    .rs-divider {
      width: 100%;
      height: 1px;
      background: var(--border);
      margin: 1.8rem 0;
      opacity: 0;
      transform: scaleX(0);
      transform-origin: left;
      transition: opacity 0.5s ease, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .rs-divider.rs-visible {
      opacity: 1;
      transform: scaleX(1);
    }

    /* ── Welcome + context block ────────────────────── */
    .rs-welcome-block {
      width: 100%;
      text-align: center;
      margin-bottom: 1.8rem;
    }
    .rs-welcome {
      font-family: var(--ff-display);
      font-size: clamp(1.4rem, 4vw, 2rem);
      font-weight: 300;
      color: var(--text);
      margin-bottom: 0.5rem;
      font-style: italic;
      opacity: 0;
      transform: translateY(8px);
      transition: opacity 0.7s ease, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .rs-welcome.rs-visible {
      opacity: 1;
      transform: translateY(0);
    }
    .rs-context {
      font-family: var(--ff-mono);
      font-size: 0.65rem;
      letter-spacing: 0.12em;
      color: var(--text3);
      text-transform: uppercase;
      opacity: 0;
      transform: translateY(6px);
      transition: opacity 0.7s ease 0.15s, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.15s;
    }
    .rs-context.rs-visible {
      opacity: 1;
      transform: translateY(0);
    }

    /* ── Clock ──────────────────────────────────────── */
    .rs-clock-wrap {
      display: flex;
      align-items: center;
      gap: 1.2rem;
      margin-bottom: 1.6rem;
      opacity: 0;
      transform: translateY(6px);
      transition: opacity 0.6s ease 0.3s, transform 0.6s ease 0.3s;
    }
    .rs-clock-wrap.rs-visible {
      opacity: 1;
      transform: translateY(0);
    }
    .rs-time {
      font-family: var(--ff-display);
      font-size: clamp(1.8rem, 6vw, 2.8rem);
      font-weight: 300;
      color: var(--text);
      letter-spacing: -0.02em;
      line-height: 1;
      min-width: 8ch;
      text-align: right;
    }
    .rs-clock-sep {
      font-family: var(--ff-display);
      font-size: 1.5rem;
      color: var(--accent);
      opacity: 0.4;
      user-select: none;
      flex-shrink: 0;
    }
    .rs-clock-right {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .rs-day {
      font-family: var(--ff-mono);
      font-size: 0.65rem;
      letter-spacing: 0.12em;
      color: var(--text3);
      text-transform: uppercase;
    }
    .rs-date {
      font-family: var(--ff-display);
      font-size: 1.1rem;
      font-weight: 300;
      color: var(--text2);
      line-height: 1;
    }

    /* ── Fact ticker ────────────────────────────────── */
    .rs-fact-wrap {
      width: 100%;
      min-height: 18px;
      text-align: center;
      margin-bottom: 2rem;
      opacity: 0;
      transition: opacity 0.6s ease 0.45s;
    }
    .rs-fact-wrap.rs-visible {
      opacity: 1;
    }
    .rs-fact {
      font-family: var(--ff-mono);
      font-size: 0.58rem;
      color: var(--text3);
      letter-spacing: 0.05em;
      line-height: 1.6;
      transition: opacity 0.08s ease;
      opacity: 1;
    }
    .rs-fact.rs-fact--fade {
      opacity: 0;
    }

    /* ── Continue button ────────────────────────────── */
    .rs-continue-btn {
      width: 100%;
      background: none;
      border: none;
      border-top: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
      color: var(--text2);
      font-family: var(--ff-mono);
      font-size: 0.7rem;
      letter-spacing: 0.35em;
      text-transform: uppercase;
      padding: 14px 16px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0;
      opacity: 0;
      transform: translateY(8px);
      transition:
        opacity     0.6s ease,
        transform   0.6s cubic-bezier(0.16, 1, 0.3, 1),
        color       0.3s ease,
        border-color 0.3s ease;
      outline: none;
      pointer-events: none;
    }
    .rs-continue-btn.rs-visible {
      opacity: 1;
      transform: translateY(0);
      pointer-events: all;
    }
    .rs-continue-btn:hover {
      color: var(--text);
      border-color: var(--accent);
    }
    .rs-continue-btn:hover .rs-c-line {
      background: var(--accent);
      opacity: 0.5;
    }
    .rs-c-line {
      flex: 1;
      height: 1px;
      background: var(--border);
      transition: background 0.3s ease, opacity 0.3s ease;
    }
    .rs-c-label {
      padding: 0 18px;
      flex-shrink: 0;
    }

    /* ── Responsive ─────────────────────────────────── */
    @media (max-width: 480px) {
      .rs-inner { padding: 0 1.4rem; }
      .rs-logo  { margin-bottom: 2rem; }
      .rs-time  { font-size: clamp(1.4rem, 8vw, 2.2rem); }
    }
  `;

  /* ═══════════════════════════════════════════════════════
     § 1 — DATA ARRAYS
  ═══════════════════════════════════════════════════════ */

  /* Loading messages (cycling flying text) */
  const LOADING_MSGS = [
    "Convincing AI not to turn evil...",
    "Marinating website...",
    "Debugging the debugger...",
    "Aligning satellite dishes...",
    "Checking to see if anyone is still reading this...",
    "Compiling pixels into a masterpiece...",
    "Brewing coffee for the server...",
    "Recalibrating the flux capacitor...",
    "Deleting 'Untitled_Final_v2_REAL_FINAL.js'...",
    "Feeding the hamsters that power the engine..."
  ];

  /* First-visit welcome lines (pick 1 randomly) */
  const FIRST_LINES = [
    "Welcome.",
    "You've arrived.",
    "Something worth seeing awaits.",
    "An intentional space. Enter carefully.",
    "Not many find their way here.",
    "Presence acknowledged.",
    "This was built for people who notice things."
  ];

  /* Returning user welcome lines — {name} is replaced dynamically */
  const RETURN_LINES = [
    "Welcome back, {name}.",
    "Still curious, {name}?",
    "You returned, {name}.",
    "{name}. Good to have you back.",
    "Again, {name}. That means something.",
    "Back already, {name}.",
    "The site remembers you, {name}."
  ];

  /* Post-welcome follow-up lines */
  const FOLLOW_LINES = [
    "Resuming your world...",
    "Everything is where you left it.",
    "The layers run deeper this time.",
    "Pick up where you left off.",
    "Nothing essential has changed. But look closer."
  ];

  /* Time-based context lines — grouped by hour bracket */
  const CTX_BY_HOUR = {
    night:      [ // 0am – 4am
      "The world is quiet. You're still here.",
      "Building at midnight. That's a certain kind of ambition.",
      "Most of the city is asleep right now.",
      "Late nights have a clarity that daylight rarely offers.",
      "The rare hour. Use it."
    ],
    dawn:       [ // 4am – 7am
      "Before dawn. The rarest window.",
      "You're up before most cities are.",
      "The world resets in the next few hours.",
      "Pre-dawn. A strange calm settles here.",
      "Early enough to see things clearly."
    ],
    morning:    [ // 7am – 12pm
      "Morning already in motion.",
      "First thoughts of the day carry weight.",
      "The day hasn't decided what it is yet.",
      "Good time to build things. Or explore them.",
      "Morning light is honest."
    ],
    midday:     [ // 12pm – 2pm
      "Midday. Half the day already spent.",
      "Somewhere between intention and momentum.",
      "The machine is running. You found a pause.",
      "Noon. A strange pivot in the day.",
      "Post-morning clarity. This is good timing."
    ],
    afternoon:  [ // 2pm – 6pm
      "The afternoon carries a certain weight to it.",
      "The day has settled into itself now.",
      "That quiet hour before the light shifts.",
      "Golden hour is not far.",
      "Afternoons here feel slightly different."
    ],
    evening:    [ // 6pm – 9pm
      "Evening feels quieter here.",
      "The day is softening at its edges.",
      "Evenings are for noticing things you missed.",
      "Dusk settles differently when you're paying attention.",
      "End-of-day clarity. This site suits it."
    ],
    lateNight:  [ // 9pm – 12am
      "Night has a particular kind of focus to it.",
      "Late enough to mean something.",
      "The city dims. You stay lit.",
      "Burning the midnight oil. Noted.",
      "After-hours. This is when real things happen."
    ]
  };

  /* Facts & Easter eggs (30–40 lines, rotating during loading) */
  const FACTS = [
    /* — Given science facts — */
    "A teaspoon of neutron star material would weigh around 6 billion tons.",
    "Venus rotates clockwise — opposite to most planets in the solar system.",
    "There are more stars in the universe than grains of sand on every Earth beach combined.",
    "The Moon drifts approximately 1.5 inches further from Earth every year.",
    "A human sneeze can reach speeds of up to 100 miles per hour.",
    "Bananas grow upward against gravity — a process called negative geotropism.",
    "The bumblebee bat weighs 0.05 to 0.07 ounces, making it the world's smallest mammal.",
    "All clownfish are born male. The dominant one can change sex over time.",
    "Hippos cannot swim — they're too dense. They move by galloping along riverbeds.",
    "The oldest recorded cat, Creme Puff, lived 38 years and 3 days.",
    "Humans blink up to 28,800 times per day — roughly 15–20 per minute.",
    "Your stomach gets an entirely new lining every 3–4 days to avoid digesting itself.",
    "Identical twins do not share fingerprints.",
    "Approximately 10% of people are left-handed.",
    "The human brain uses roughly 400–500 calories per day just to function.",
    "The Anglo-Zanzibar War of 1896 lasted 38 minutes — the shortest in recorded history.",
    "Egypt is considered the world's oldest country, dating to around 3100 BCE.",
    "The Eiffel Tower grows up to 6 inches taller in summer due to thermal expansion.",
    "The letter 'J' was the last letter added to the English alphabet.",
    "The '#' symbol is officially called an octothorpe.",
    /* — Site easter eggs & hints — */
    "Hint: Click the name on the homepage exactly 7 times. Something will appear.",
    "Hint: Type the word 'manomay' anywhere on the keyboard. Watch the accent colour.",
    "Some sections here require a password. The Contact page is how you ask for it.",
    "The Clock page has a special state. It only activates on August 29th.",
    "There are 14 distinct sections on this site. Most visitors find 6 or 7.",
    "The background music has two tracks. Only one is immediately obvious.",
    "Every pixel of this site was written by hand. No frameworks. No templates.",
    "The Journey timeline covers 19 chapters — from 2008 to the present.",
    "RoRo is the site's intelligence layer. It knows every section. Try asking it something.",
    "Some photo albums require trust. There's a reason they're locked.",
    "The mechanical click sound on interactive elements can be toggled off in the nav.",
    "The footer states it plainly: built with intention, not a template.",
    "There are four visual themes. Switching between them changes more than colours.",
    "The games section contains five real, fully playable games. No half-measures.",
    "Some of the most interesting content here sits behind a password. Knock.",
    "The hero name cycles its highlight. Reload the page to see it shift.",
    "RoRo stands for nothing in particular. It just felt right when named.",
    "The vinyl record in the bottom-left corner isn't always there. Find out why.",
    "The Thoughts section has 16 posts across six categories. All of them are personal.",
    "Nothing here was accidental. Every element was placed deliberately."
  ];

  /* Progress milestones: [delayMs, targetPercent] */
  const PROGRESS_MILESTONES = [
    [0,    0],
    [150,  8],
    [350,  22],
    [550,  38],
    [750,  54],
    [950,  68],
    [1150, 79],
    [1350, 88],
    [1550, 94],
    [1750, 97],
    [2000, 99],
    [2350, 100]
  ];

  /* ═══════════════════════════════════════════════════════
     § 2 — RoroSplash CLASS
  ═══════════════════════════════════════════════════════ */

  class RoroSplash {

    constructor() {
      this._user         = this._loadUser();
      this._progress     = 0;
      this._factIdx      = Math.floor(Math.random() * FACTS.length);
      this._msgIdx       = Math.floor(Math.random() * LOADING_MSGS.length);
      this._loggedLines  = [];       /* all loading messages shown, for collapse panel */
      this._flyEl        = null;     /* current flying-text DOM node */
      this._flyTimer     = null;
      this._factTimer    = null;
      this._clockTimer   = null;
      this._thinkOpen    = false;
      this._isDone       = false;

      this._injectStyles();
      this._hideOldSplash();
      this._buildDOM();
      this._start();
    }

    /* ── § 2.1 Persistence ──────────────────────────── */

    _loadUser() {
      try {
        const raw = localStorage.getItem('roroUser');
        return raw ? JSON.parse(raw) : null;
      } catch { return null; }
    }

    /* ── § 2.2 Suppress old loading screen ──────────── */

    _hideOldSplash() {
      const old = document.getElementById('loading-screen');
      if (old) {
        old.style.cssText = 'display:none!important;pointer-events:none!important;';
      }
    }

    /* ── § 2.3 Style injection ──────────────────────── */

    _injectStyles() {
      if (document.getElementById('roro-splash-css')) return;
      const el = document.createElement('style');
      el.id          = 'roro-splash-css';
      el.textContent = SPLASH_CSS;
      document.head.appendChild(el);
    }

    /* ── § 2.4 DOM construction ──────────────────────── */

    _buildDOM() {
      const root = document.createElement('div');
      root.id = 'roro-splash';

      root.innerHTML = `
        <div class="rs-grid" aria-hidden="true"></div>
        <div class="rs-inner">

          <!-- Logo -->
          <div class="rs-logo" aria-label="MSM">M &middot; S &middot; M</div>

          <!-- Flying loading text -->
          <div class="rs-fly-wrap" id="rs-fly-wrap" aria-hidden="true"></div>

          <!-- Progress bar -->
          <div class="rs-progress-wrap">
            <div class="rs-bar-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" id="rs-bar-track">
              <div class="rs-bar" id="rs-bar"></div>
            </div>
            <div class="rs-pct" id="rs-pct" aria-live="polite">0%</div>
          </div>

          <!-- Thinking bar (hidden until loading completes) -->
          <div class="rs-think-wrap" id="rs-think-wrap" aria-hidden="true">
            <div class="rs-think-bar" id="rs-think-bar" title="Click to expand loading log" role="button" tabindex="0" aria-label="Loading log — click to expand">
              <div class="rs-think-pulse"></div>
            </div>
            <div class="rs-think-label" id="rs-think-label">processing complete &middot; tap to expand log</div>
            <div class="rs-think-lines" id="rs-think-lines" aria-live="polite"></div>
          </div>

          <!-- Separator -->
          <div class="rs-divider" id="rs-divider" aria-hidden="true"></div>

          <!-- Welcome + context -->
          <div class="rs-welcome-block">
            <div class="rs-welcome" id="rs-welcome" aria-live="polite"></div>
            <div class="rs-context"  id="rs-context"></div>
          </div>

          <!-- Live clock -->
          <div class="rs-clock-wrap" id="rs-clock-wrap" aria-label="Current time">
            <div class="rs-time" id="rs-time" aria-live="polite"></div>
            <div class="rs-clock-sep" aria-hidden="true">|</div>
            <div class="rs-clock-right">
              <div class="rs-day"  id="rs-day"></div>
              <div class="rs-date" id="rs-date"></div>
            </div>
          </div>

          <!-- Fact ticker -->
          <div class="rs-fact-wrap" id="rs-fact-wrap">
            <div class="rs-fact" id="rs-fact" aria-live="polite"></div>
          </div>

          <!-- Continue -->
          <button class="rs-continue-btn" id="rs-continue" aria-label="Enter site">
            <span class="rs-c-line" aria-hidden="true"></span>
            <span class="rs-c-label">CONTINUE</span>
            <span class="rs-c-line" aria-hidden="true"></span>
          </button>

        </div>
      `;

      document.body.appendChild(root);
      this._root = root;

      /* Cache elements */
      this._flyWrap    = root.querySelector('#rs-fly-wrap');
      this._barEl      = root.querySelector('#rs-bar');
      this._barTrack   = root.querySelector('#rs-bar-track');
      this._pctEl      = root.querySelector('#rs-pct');
      this._thinkWrap  = root.querySelector('#rs-think-wrap');
      this._thinkBar   = root.querySelector('#rs-think-bar');
      this._thinkLabel = root.querySelector('#rs-think-label');
      this._thinkLines = root.querySelector('#rs-think-lines');
      this._divider    = root.querySelector('#rs-divider');
      this._welcomeEl  = root.querySelector('#rs-welcome');
      this._contextEl  = root.querySelector('#rs-context');
      this._clockWrap  = root.querySelector('#rs-clock-wrap');
      this._timeEl     = root.querySelector('#rs-time');
      this._dayEl      = root.querySelector('#rs-day');
      this._dateEl     = root.querySelector('#rs-date');
      this._factWrap   = root.querySelector('#rs-fact-wrap');
      this._factEl     = root.querySelector('#rs-fact');
      this._continueBtn = root.querySelector('#rs-continue');
    }

    /* ── § 2.5 Sequence control ──────────────────────── */

    _start() {
      /* Start loading text cycling immediately */
      this._cycleFlyText();

      /* Start fact scanner */
      this._startFacts(150);   /* fast during loading */

      /* Start clock (hidden until post-load reveal) */
      this._updateClock();
      this._clockTimer = setInterval(() => this._updateClock(), 1000);

      /* Run progress milestones */
      this._runProgress();

      /* Bind collapse interaction */
      this._thinkBar.addEventListener('click',   () => this._toggleThinkLines());
      this._thinkBar.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') this._toggleThinkLines(); });
      this._thinkLabel.addEventListener('click', () => this._toggleThinkLines());

      /* Bind Continue */
      this._continueBtn.addEventListener('click', () => this._handleContinue());
    }

    /* ── § 2.6 Progress bar ──────────────────────────── */

    _runProgress() {
      PROGRESS_MILESTONES.forEach(([delay, pct]) => {
        setTimeout(() => {
          this._setProgress(pct);
          if (pct === 100) {
            /* Small grace period so bar visually reaches 100% */
            setTimeout(() => this._onLoadComplete(), 280);
          }
        }, delay);
      });
    }

    _setProgress(pct) {
      this._progress = pct;
      this._barEl.style.width   = pct + '%';
      this._pctEl.textContent   = pct + '%';
      this._barTrack.setAttribute('aria-valuenow', pct);
    }

    /* ── § 2.7 Flying loading text ───────────────────── */

    _cycleFlyText() {
      if (this._isDone) return;
      this._showFlyMessage(LOADING_MSGS[this._msgIdx % LOADING_MSGS.length]);
      this._msgIdx++;
      this._flyTimer = setTimeout(() => this._cycleFlyText(), 530);
    }

    _showFlyMessage(text) {
      /* Log for collapse panel */
      this._loggedLines.push(text);

      /* Create new item */
      const el = document.createElement('div');
      el.className   = 'rs-fly-item';
      el.textContent = text;
      this._flyWrap.appendChild(el);

      /* Fly in */
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.classList.add('rs-fly--in');
        });
      });

      /* Fly out after hold */
      setTimeout(() => {
        el.classList.remove('rs-fly--in');
        el.classList.add('rs-fly--out');
        setTimeout(() => { if (el.parentNode) el.remove(); }, 130);
      }, 400);
    }

    _stopFlyText() {
      this._isDone = true;
      clearTimeout(this._flyTimer);

      /* Fade out any remaining item */
      const remaining = this._flyWrap.querySelectorAll('.rs-fly-item');
      remaining.forEach(el => {
        el.classList.add('rs-fly--out');
        setTimeout(() => { if (el.parentNode) el.remove(); }, 130);
      });
    }

    /* ── § 2.8 Load complete transition ──────────────── */

    _onLoadComplete() {
      /* Stop cycling text */
      this._stopFlyText();

      /* Transition fly-wrap → think-bar */
      setTimeout(() => {
        this._flyWrap.style.opacity    = '0';
        this._flyWrap.style.transition = 'opacity 0.25s ease';
        setTimeout(() => {
          this._flyWrap.style.display = 'none';
          this._showThinkBar();
        }, 260);
      }, 80);

      /* Reveal post-load content (staggered) */
      this._revealPostLoad();

      /* Show Continue after delay */
      setTimeout(() => this._showContinue(), 2200);
    }

    /* ── § 2.9 Thinking bar ──────────────────────────── */

    _showThinkBar() {
      this._thinkWrap.classList.add('rs-think--visible');
      this._thinkWrap.style.opacity    = '0';
      this._thinkWrap.style.transition = 'opacity 0.35s ease';
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this._thinkWrap.style.opacity = '1';
        });
      });
    }

    _toggleThinkLines() {
      this._thinkOpen = !this._thinkOpen;
      if (this._thinkOpen) {
        /* Populate lines */
        this._thinkLines.innerHTML = '';
        this._loggedLines.forEach(line => {
          const div       = document.createElement('div');
          div.className   = 'rs-think-line';
          div.textContent = line;
          this._thinkLines.appendChild(div);
        });
        this._thinkLines.classList.add('rs-think-lines--open');
        this._thinkLabel.textContent = 'processing complete · tap to collapse log';
      } else {
        this._thinkLines.classList.remove('rs-think-lines--open');
        setTimeout(() => { this._thinkLines.innerHTML = ''; }, 300);
        this._thinkLabel.textContent = 'processing complete · tap to expand log';
      }
    }

    /* ── § 2.10 Post-load reveal ─────────────────────── */

    _revealPostLoad() {
      /* Divider */
      setTimeout(() => {
        this._divider.classList.add('rs-visible');
      }, 300);

      /* Welcome text */
      setTimeout(() => {
        this._welcomeEl.textContent = this._welcomeLine();
        this._welcomeEl.classList.add('rs-visible');
      }, 550);

      /* Context line */
      setTimeout(() => {
        this._contextEl.textContent = this._contextLine();
        this._contextEl.classList.add('rs-visible');
      }, 700);

      /* Clock reveal */
      setTimeout(() => {
        this._clockWrap.classList.add('rs-visible');
      }, 900);

      /* Fact wrap reveal + slow fact rotation */
      setTimeout(() => {
        this._factWrap.classList.add('rs-visible');
        /* Slow down fact rotation to readable pace */
        clearInterval(this._factTimer);
        this._startFacts(2800);
      }, 1100);
    }

    /* ── § 2.11 Continue button ──────────────────────── */

    _showContinue() {
      this._continueBtn.classList.add('rs-visible');
    }

    _handleContinue() {
      /* Start background music */
      this._tryStartMusic();

      /* Animate out */
      this._root.classList.add('rs-exit');

      /* Cleanup after animation */
      setTimeout(() => {
        clearInterval(this._clockTimer);
        clearInterval(this._factTimer);
        clearTimeout(this._flyTimer);
        if (this._root.parentNode) this._root.remove();

        /* Remove injected styles to keep DOM clean */
        const cssEl = document.getElementById('roro-splash-css');
        if (cssEl) cssEl.remove();

        /* Trigger hero animations if not already fired */
        if (typeof window.startHeroAnimations === 'function') {
          window.startHeroAnimations();
        }
      }, 680);
    }

    _tryStartMusic() {
      /* Try the site's existing music trigger */
      const bgMusic = document.getElementById('bg-music');
      if (bgMusic) {
        bgMusic.play().catch(() => {/* autoplay policy may block — that's fine */});
      }
    }

    /* ── § 2.12 Live clock ───────────────────────────── */

    _updateClock() {
      const now  = new Date();
      let   h    = now.getHours();
      const m    = String(now.getMinutes()).padStart(2, '0');
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      const hStr = String(h).padStart(2, '0');

      const days   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

      this._timeEl.textContent = `${hStr}:${m} ${ampm}`;
      this._dayEl.textContent  = days[now.getDay()];
      this._dateEl.textContent = `${months[now.getMonth()]} ${now.getDate()}`;
    }

    /* ── § 2.13 Fact ticker ──────────────────────────── */

    _startFacts(interval) {
      clearInterval(this._factTimer);

      /* Show initial fact immediately */
      this._factEl.textContent = FACTS[this._factIdx % FACTS.length];

      this._factTimer = setInterval(() => {
        /* Fast during loading: just swap text */
        /* Slow after load: fade out → swap → fade in */
        if (interval <= 200) {
          this._factIdx = (this._factIdx + 1) % FACTS.length;
          this._factEl.textContent = FACTS[this._factIdx];
        } else {
          this._factEl.classList.add('rs-fact--fade');
          setTimeout(() => {
            this._factIdx = (this._factIdx + 1) % FACTS.length;
            this._factEl.textContent = FACTS[this._factIdx];
            this._factEl.classList.remove('rs-fact--fade');
          }, 90);
        }
      }, interval);
    }

    /* ── § 2.14 Content generation ───────────────────── */

    _welcomeLine() {
      if (this._user && this._user.name) {
        const template = RETURN_LINES[Math.floor(Math.random() * RETURN_LINES.length)];
        return template.replace('{name}', this._user.name);
      }
      return FIRST_LINES[Math.floor(Math.random() * FIRST_LINES.length)];
    }

    _contextLine() {
      const h = new Date().getHours();
      let pool;
      if      (h >= 0  && h < 4)  pool = CTX_BY_HOUR.night;
      else if (h >= 4  && h < 7)  pool = CTX_BY_HOUR.dawn;
      else if (h >= 7  && h < 12) pool = CTX_BY_HOUR.morning;
      else if (h >= 12 && h < 14) pool = CTX_BY_HOUR.midday;
      else if (h >= 14 && h < 18) pool = CTX_BY_HOUR.afternoon;
      else if (h >= 18 && h < 21) pool = CTX_BY_HOUR.evening;
      else                         pool = CTX_BY_HOUR.lateNight;

      const line = pool[Math.floor(Math.random() * pool.length)];

      /* Optionally personalise with name for returning users */
      if (this._user && this._user.name && Math.random() > 0.6) {
        /* Light touch — only for lines that feel natural with a name appended */
        const appendable = [
          CTX_BY_HOUR.dawn[1],
          CTX_BY_HOUR.lateNight[3],
          CTX_BY_HOUR.lateNight[4]
        ];
        if (appendable.includes(line)) {
          return `${line} ${this._user.name}.`;
        }
      }
      return line;
    }

  } // end class RoroSplash

  /* ═══════════════════════════════════════════════════════
     § 3 — EXPORT & AUTO-INIT
  ═══════════════════════════════════════════════════════ */

  window.initRoroSplash = function () {
    window._roroSplashInstance = new RoroSplash();
  };

  document.addEventListener('DOMContentLoaded', () => {
    window._roroSplashInstance = new RoroSplash();
  });

})();

/*
  ─────────────────────────────────────────────────────────
  INTEGRATION CHECKLIST (read before deploying)
  ─────────────────────────────────────────────────────────

  1. In index.html, add this BEFORE main.js:
     <script src="js/roro-intro.js"></script>

  2. DELETE the existing loading screen block from index.html:
     <div id="loading-screen">
       <div class="loading-name">M · S · M</div>
       <div class="loading-bar-wrap">
         <div class="loading-bar" id="loading-bar"></div>
       </div>
       <div class="loading-pct" id="loading-pct">0%</div>
     </div>

  3. No changes to main.js are required.
     The existing loading bar logic runs silently in the
     background — hidden behind the splash — then fires
     startHeroAnimations() before the user clicks Continue.
     By the time the splash exits, the hero is fully loaded.

  4. No changes to pages.css or tokens.css are required.
     All splash colours pull from existing CSS variables.
  ─────────────────────────────────────────────────────────
*/
