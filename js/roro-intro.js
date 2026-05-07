/* ═══════════════════════════════════════════════════════════
   js/roro-intro.js  —  MSM Cinematic Splash Screen v2
   ─────────────────────────────────────────────────────────
   Vanilla JS · Zero dependencies · CSS-variable aware
   ─────────────────────────────────────────────────────────
   ⚠  INTEGRATION — add to index.html BEFORE main.js:
      <script src="js/roro-intro.js"></script>
   ⚠  DELETE the old #loading-screen block from index.html.
═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ═══════════════════════════════════════════════════════
     STEP 0 — IMMEDIATE COVER (runs before DOMContentLoaded)
     Prevents the home page from flashing before the splash
     is ready. Appended synchronously while body exists.
  ═══════════════════════════════════════════════════════ */
  var _immediatecover = document.createElement('div');
  _immediatecover.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:999997',
    'background:var(--bg,#080808)', 'pointer-events:none'
  ].join(';');
  document.body.appendChild(_immediatecover);

  /* ═══════════════════════════════════════════════════════
     STEP 1 — MUSIC GUARD
     Intercepts HTMLMediaElement.prototype.play so bg-music
     cannot auto-start from main.js's interaction listeners
     (mousemove, click, scroll). Restored on Continue click.
  ═══════════════════════════════════════════════════════ */
  window._roroSplashActive = true;
  var _origPlay = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () {
    if (window._roroSplashActive &&
        (this.id === 'bg-music' || this.id === 'rain-song')) {
      return Promise.resolve();
    }
    return _origPlay.apply(this, arguments);
  };

  /* ═══════════════════════════════════════════════════════
     § 0 — INJECTED CSS
     All colours from site CSS vars — all 4 themes work.
  ═══════════════════════════════════════════════════════ */
  var SPLASH_CSS = `

    /* ── Custom cursor above splash ─────────────────── */
    #cursor-dot, #cursor-ring {
      z-index: 9999999 !important;
    }

    /* ── Root overlay ───────────────────────────────── */
    #roro-splash {
      position: fixed;
      inset: 0;
      z-index: 999999;
      background: var(--bg);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    /* Subtle grid — same motif as hero section */
    #roro-splash .rs-grid {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(var(--border) 1px, transparent 1px),
        linear-gradient(90deg, var(--border) 1px, transparent 1px);
      background-size: 60px 60px;
      -webkit-mask-image: radial-gradient(ellipse 65% 55% at 50% 50%, black 15%, transparent 100%);
      mask-image:         radial-gradient(ellipse 65% 55% at 50% 50%, black 15%, transparent 100%);
      pointer-events: none;
      z-index: 0;
    }

    /* Grain overlay */
    #roro-splash::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.022'/%3E%3C/svg%3E");
      opacity: 0.55;
      pointer-events: none;
      z-index: 0;
    }

    /* Exit — translates up with fade; homepage hero is already
       at final position so it appears cleanly underneath */
    #roro-splash.rs-exit {
      pointer-events: none;
      animation: rsExit 0.75s cubic-bezier(0.76, 0, 0.24, 1) forwards;
    }
    @keyframes rsExit {
      0%   { opacity: 1; transform: translateY(0);    }
      100% { opacity: 0; transform: translateY(-16px); }
    }

    /* ── Film / camera-reel strips ──────────────────── */
    .rs-film {
      position: absolute;
      top: 0; bottom: 0;
      width: 20px;
      overflow: hidden;
      pointer-events: none;
      opacity: 0;
      animation: rsFilmFade 1.2s ease 0.6s forwards;
    }
    @keyframes rsFilmFade { to { opacity: 1; } }
    .rs-film--left  { left:  clamp(8px, 2.5vw, 30px); }
    .rs-film--right { right: clamp(8px, 2.5vw, 30px); }

    /* Inner belt — duplicated frames for seamless loop */
    .rs-film-belt {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 6px 0;
    }
    .rs-film--left  .rs-film-belt { animation: rsRollUp   28s linear infinite; }
    .rs-film--right .rs-film-belt { animation: rsRollDown 28s linear infinite; }
    @keyframes rsRollUp   { from { transform: translateY(0);    } to { transform: translateY(-50%); } }
    @keyframes rsRollDown { from { transform: translateY(-50%); } to { transform: translateY(0);    } }

    /* Individual frame cell */
    .rs-film-cell {
      width: 20px;
      height: 14px;
      border: 1px solid var(--border2);
      border-radius: 2px;
      flex-shrink: 0;
      opacity: 0.28;
      position: relative;
      transition: opacity 0.4s;
    }
    /* Every 5th cell gets accent tint — like a frame marker */
    .rs-film-cell.rs-film-mark {
      opacity: 0.55;
      border-color: var(--accent);
    }
    .rs-film-cell.rs-film-mark::after {
      content: '';
      position: absolute;
      inset: 2px;
      background: var(--accent);
      opacity: 0.07;
      border-radius: 1px;
    }

    /* ── Inner column ────────────────────────────────── */
    .rs-inner {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 480px;
      padding: 0 2.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      /* All children pre-occupy their space so layout never shifts */
    }

    /* Shared reveal keyframes */
    @keyframes rsFadeUp {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0);    }
    }
    @keyframes rsFadeIn { from { opacity: 0; } to { opacity: 1; } }

    /* ── (i) Logo ─────────────────────────────────── */
    .rs-logo {
      font-family: var(--ff-display);
      font-size: clamp(1rem, 2.8vw, 1.5rem);
      font-weight: 300;
      letter-spacing: 0.55em;
      color: var(--text3);
      text-align: center;
      user-select: none;
      margin-bottom: 2.4rem;
      opacity: 0;
      animation: rsFadeUp 1s cubic-bezier(0.16, 1, 0.3, 1) 0.15s forwards;
    }

    /* ── (ii) Welcome ─────────────────────────────── */
    /* Always occupies space — no layout shift */
    .rs-welcome-wrap {
      width: 100%;
      min-height: 4rem;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      margin-bottom: 0.6rem;
    }
    .rs-welcome {
      font-family: var(--ff-display);
      font-size: clamp(1.9rem, 5.5vw, 2.8rem);
      font-weight: 400;
      font-style: italic;
      color: var(--text);
      line-height: 1.15;
      opacity: 0;
      transform: translateY(10px);
      transition:
        opacity   0.9s cubic-bezier(0.16, 1, 0.3, 1),
        transform 0.9s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .rs-welcome.rs-v { opacity: 1; transform: translateY(0); }

    /* ── (iii) Context ────────────────────────────── */
    .rs-context-wrap {
      width: 100%;
      min-height: 1.6rem;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.8rem;
    }
    .rs-context {
      font-family: var(--ff-mono);
      font-size: 0.7rem;
      font-weight: 500;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--text2);
      text-align: center;
      opacity: 0;
      transform: translateY(8px);
      transition:
        opacity   0.8s ease 0.14s,
        transform 0.8s ease 0.14s;
    }
    .rs-context.rs-v { opacity: 1; transform: translateY(0); }

    /* ── (iv) Clock ───────────────────────────────── */
    .rs-clock-wrap {
      min-height: 3.6rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1.2rem;
      margin-bottom: 2rem;
      opacity: 0;
      transform: translateY(8px);
      transition:
        opacity   0.7s ease 0.2s,
        transform 0.7s ease 0.2s;
    }
    .rs-clock-wrap.rs-v { opacity: 1; transform: translateY(0); }

    /* Time number + AM/PM */
    .rs-time-group {
      display: flex;
      align-items: flex-start;
      gap: 5px;
    }
    .rs-digits {
      font-family: var(--ff-display);
      font-size: clamp(2rem, 6vw, 2.9rem);
      font-weight: 300;
      color: var(--text);
      letter-spacing: -0.02em;
      line-height: 1;
    }
    /* Small superscript-style AM/PM — NOT the giant version */
    .rs-ampm {
      font-family: var(--ff-mono);
      font-size: 0.52rem;
      letter-spacing: 0.08em;
      color: var(--text3);
      text-transform: uppercase;
      margin-top: 5px;
      line-height: 1;
      flex-shrink: 0;
    }

    /* Separator pipe */
    .rs-clock-sep {
      font-family: var(--ff-display);
      font-size: 1.3rem;
      color: var(--accent);
      opacity: 0.3;
      user-select: none;
      flex-shrink: 0;
      line-height: 1;
      align-self: center;
    }

    /* Day + Date column */
    .rs-clock-right {
      display: flex;
      flex-direction: column;
      gap: 3px;
      align-self: center;
    }
    .rs-cday {
      font-family: var(--ff-mono);
      font-size: 0.56rem;
      letter-spacing: 0.14em;
      color: var(--text3);
      text-transform: uppercase;
      line-height: 1;
    }
    .rs-cdate {
      font-family: var(--ff-display);
      font-size: 0.95rem;
      font-weight: 300;
      color: var(--text2);
      line-height: 1;
    }

    /* ── (v) Loading bar ──────────────────────────── */
    .rs-bar-section {
      width: 100%;
      margin-bottom: 0.55rem;
      opacity: 0;
      animation: rsFadeIn 0.5s ease 0.3s forwards;
    }
    .rs-bar-row {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
    }
    .rs-bar-track {
      flex: 1;
      height: 1px;
      background: var(--border2);
      position: relative;
      overflow: hidden;
    }
    .rs-bar-fill {
      position: absolute;
      top: 0; left: 0; bottom: 0;
      width: 0%;
      background: var(--accent);
      transition: width 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    }
    /* Moving shimmer on bar */
    .rs-bar-fill::after {
      content: '';
      position: absolute;
      top: 0; bottom: 0;
      right: -50px; width: 50px;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent);
      animation: rsBarShimmer 1.8s ease-in-out infinite;
    }
    @keyframes rsBarShimmer {
      0%, 100% { opacity: 0; }
      50%       { opacity: 1; }
    }
    .rs-pct {
      font-family: var(--ff-mono);
      font-size: 0.56rem;
      color: var(--text3);
      letter-spacing: 0.06em;
      min-width: 3.5ch;
      text-align: right;
      flex-shrink: 0;
    }

    /* ── (vi) Loading text — fixed height, no layout shift */
    .rs-log-area {
      width: 100%;
      height: 20px;
      overflow: hidden;
      position: relative;
      margin-bottom: 1.6rem;
      opacity: 0;
      animation: rsFadeIn 0.4s ease 0.4s forwards;
    }

    /* Flying text item — fills container, centered */
    .rs-fly-item {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--ff-mono);
      font-size: 0.6rem;
      letter-spacing: 0.07em;
      color: var(--text3);
      pointer-events: none;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .rs-fly-item.rs-fi {
      animation: rsFlyIn  0.13s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .rs-fly-item.rs-fo {
      animation: rsFlyOut 0.13s cubic-bezier(0.76, 0, 0.24, 1) forwards;
    }
    @keyframes rsFlyIn  {
      from { transform: translateY(100%); opacity: 0; }
      to   { transform: translateY(0);    opacity: 1; }
    }
    @keyframes rsFlyOut {
      from { transform: translateY(0);     opacity: 1; }
      to   { transform: translateY(-100%); opacity: 0; }
    }

    /* ── (vii) SCRIPT button ──────────────────────── */
    .rs-script-wrap {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 1.4rem;
    }
    .rs-script-btn {
      display: none; /* shown after load */
      align-items: center;
      gap: 8px;
      cursor: pointer;
      background: none;
      border: 1px solid var(--border2);
      border-radius: 3px;
      padding: 5px 14px 5px 12px;
      font-family: var(--ff-mono);
      font-size: 0.6rem;
      letter-spacing: 0.2em;
      color: var(--text3);
      text-transform: uppercase;
      outline: none;
      transition: border-color 0.25s, color 0.25s, background 0.25s;
      user-select: none;
      position: relative;
    }
    .rs-script-btn.rs-active { display: flex; }
    .rs-script-btn:hover {
      border-color: var(--accent);
      color: var(--accent);
      background: rgba(200,169,110,0.04);
    }
    /* Pulsing dot on the button — "thinking" indicator */
    .rs-script-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: var(--accent);
      opacity: 0.55;
      flex-shrink: 0;
      animation: rsScriptPulse 1.6s ease-in-out infinite;
    }
    @keyframes rsScriptPulse {
      0%, 100% { opacity: 0.35; transform: scale(1);    }
      50%       { opacity: 0.8;  transform: scale(1.25); }
    }

    /* Expanded log panel */
    .rs-script-log {
      display: none;
      width: 100%;
      margin-top: 8px;
      background: var(--bg3);
      border: 1px solid var(--border);
      border-radius: 3px;
      padding: 10px 14px;
      max-height: 110px;
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: var(--border2) transparent;
    }
    .rs-script-log::-webkit-scrollbar       { width: 2px; }
    .rs-script-log::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 1px; }
    .rs-script-log.rs-open {
      display: block;
      animation: rsFadeUp 0.25s ease forwards;
    }
    .rs-script-entry {
      font-family: var(--ff-mono);
      font-size: 0.54rem;
      color: var(--text3);
      letter-spacing: 0.05em;
      padding: 2px 0;
      line-height: 1.7;
      opacity: 0.75;
    }
    .rs-script-entry::before {
      content: '▸ ';
      color: var(--accent);
      opacity: 0.55;
    }

    /* ── (viii) Continue — NO border lines above/below ─ */
    .rs-continue {
      width: 100%;
      background: none;
      border: none;            /* no top/bottom border */
      color: var(--text3);
      font-family: var(--ff-mono);
      font-size: 0.66rem;
      letter-spacing: 0.32em;
      text-transform: uppercase;
      padding: 13px 0;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0;
      opacity: 0;
      pointer-events: none;
      outline: none;
      transform: translateY(8px);
      transition:
        opacity   0.7s ease,
        transform 0.7s cubic-bezier(0.16, 1, 0.3, 1),
        color     0.3s ease;
    }
    .rs-continue.rs-v {
      opacity: 1;
      pointer-events: all;
      transform: translateY(0);
    }
    .rs-continue:hover { color: var(--text); }
    .rs-continue:hover .rs-c-line { background: var(--accent); opacity: 0.45; }
    /* The ─────── lines flanking CONTINUE */
    .rs-c-line {
      flex: 1;
      height: 1px;
      background: var(--border2);
      max-width: 90px;
      transition: background 0.3s, opacity 0.3s;
    }
    .rs-c-word { padding: 0 18px; flex-shrink: 0; }

    /* ── Mobile ─────────────────────────────────────── */
    @media (max-width: 520px) {
      .rs-inner { padding: 0 1.4rem; }
      .rs-film--left, .rs-film--right { display: none; }
    }
  `;

  /* ═══════════════════════════════════════════════════════
     § 1 — DATA
  ═══════════════════════════════════════════════════════ */

  var LOADING_MSGS = [
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

  var FIRST_LINES = [
    "Welcome.",
    "You've arrived.",
    "Something worth seeing awaits.",
    "An intentional space.",
    "Not many find their way here.",
    "Presence acknowledged.",
    "Built for people who notice things."
  ];

  var RETURN_LINES = [
    "Welcome back, {name}.",
    "Still curious, {name}?",
    "You returned, {name}.",
    "{name}. Good to have you back.",
    "Again, {name}. That means something.",
    "Back already, {name}.",
    "The site remembers you, {name}."
  ];

  var CTX_BY_HOUR = {
    night:     ["The world is quiet. You're still here.", "Building at midnight. That's a certain kind of ambition.", "Most of the city is asleep right now.", "Late nights have a clarity daylight rarely offers.", "The rare hour. Use it."],
    dawn:      ["Before dawn. The rarest window.", "You're up before most cities are.", "The world resets in a few hours.", "Pre-dawn. A strange calm settles here.", "Early enough to see things clearly."],
    morning:   ["Morning already in motion.", "First thoughts of the day carry weight.", "The day hasn't decided what it is yet.", "Good time to build. Or explore.", "Morning light is honest."],
    midday:    ["Midday. Half the day already spent.", "Somewhere between intention and momentum.", "The machine is running. You found a pause.", "Noon. A strange pivot point.", "Post-morning clarity. Good timing."],
    afternoon: ["The afternoon carries a certain weight.", "The day has settled into itself now.", "That quiet hour before the light shifts.", "Golden hour is not far.", "Afternoons here feel slightly different."],
    evening:   ["Evening feels quieter here.", "The day is softening at its edges.", "Evenings are for noticing things you missed.", "Dusk settles differently when you're paying attention.", "End-of-day clarity. This site suits it."],
    latenight: ["Night has a particular kind of focus.", "Late enough to mean something.", "The city dims. You stay lit.", "Burning the midnight oil. Noted.", "After-hours. This is when real things happen."]
  };

  /* 7-second milestones → 100% at exactly 7000ms */
  var PROGRESS_MILESTONES = [
    [0,    0],
    [500,  7],
    [1000, 17],
    [1600, 30],
    [2300, 44],
    [3100, 57],
    [3900, 68],
    [4700, 78],
    [5400, 87],
    [6000, 93],
    [6600, 97],
    [7000, 100]
  ];

  /* ═══════════════════════════════════════════════════════
     § 2 — RoroSplash CLASS
  ═══════════════════════════════════════════════════════ */

  function RoroSplash() {
    this._user        = this._loadUser();
    this._msgIdx      = Math.floor(Math.random() * LOADING_MSGS.length);
    this._logLines    = [];
    this._flyTimer    = null;
    this._clockTimer  = null;
    this._isDone      = false;
    this._scriptOpen  = false;

    this._injectStyles();
    this._hideOldSplash();
    this._buildDOM();
    this._start();
  }

  /* ── Persistence ──────────────────────────────────── */
  RoroSplash.prototype._loadUser = function () {
    try { return JSON.parse(localStorage.getItem('roroUser') || 'null'); }
    catch (e) { return null; }
  };

  /* ── Suppress old loading screen ─────────────────── */
  RoroSplash.prototype._hideOldSplash = function () {
    var old = document.getElementById('loading-screen');
    if (old) old.style.cssText = 'display:none!important;pointer-events:none!important;';
  };

  /* ── CSS injection ───────────────────────────────── */
  RoroSplash.prototype._injectStyles = function () {
    if (document.getElementById('rs-css')) return;
    var el = document.createElement('style');
    el.id = 'rs-css';
    el.textContent = SPLASH_CSS;
    document.head.appendChild(el);
  };

  /* ── Film strip builder ───────────────────────────── */
  RoroSplash.prototype._buildFilmStrip = function (side) {
    var wrap = document.createElement('div');
    wrap.className = 'rs-film rs-film--' + side;

    var belt = document.createElement('div');
    belt.className = 'rs-film-belt';

    /* Generate 60 cells, duplicated for seamless loop */
    var cells = [];
    for (var i = 0; i < 60; i++) {
      var cell = document.createElement('div');
      cell.className = 'rs-film-cell' + (i % 5 === 0 ? ' rs-film-mark' : '');
      cells.push(cell);
    }
    /* Duplicate for seamless infinite scroll */
    cells.concat(cells.slice()).forEach(function (c) { belt.appendChild(c.cloneNode(true)); });

    wrap.appendChild(belt);
    return wrap;
  };

  /* ── Full DOM construction ───────────────────────── */
  RoroSplash.prototype._buildDOM = function () {
    var root = document.createElement('div');
    root.id = 'roro-splash';

    /* Grid */
    var grid = document.createElement('div');
    grid.className = 'rs-grid';
    root.appendChild(grid);

    /* Film strips */
    root.appendChild(this._buildFilmStrip('left'));
    root.appendChild(this._buildFilmStrip('right'));

    /* Inner column */
    var inner = document.createElement('div');
    inner.className = 'rs-inner';

    inner.innerHTML = [
      /* (i) Logo */
      '<div class="rs-logo" aria-label="MSM">M &middot; S &middot; M</div>',

      /* (ii) Welcome — pre-allocated height */
      '<div class="rs-welcome-wrap"><div class="rs-welcome" id="rs-welcome"></div></div>',

      /* (iii) Context — pre-allocated height */
      '<div class="rs-context-wrap"><div class="rs-context" id="rs-context"></div></div>',

      /* (iv) Clock — pre-allocated height */
      '<div class="rs-clock-wrap" id="rs-clock-wrap">',
        '<div class="rs-time-group">',
          '<span class="rs-digits" id="rs-digits"></span>',
          '<span class="rs-ampm"   id="rs-ampm"></span>',
        '</div>',
        '<div class="rs-clock-sep">|</div>',
        '<div class="rs-clock-right">',
          '<div class="rs-cday"  id="rs-cday"></div>',
          '<div class="rs-cdate" id="rs-cdate"></div>',
        '</div>',
      '</div>',

      /* (v) Loading bar */
      '<div class="rs-bar-section">',
        '<div class="rs-bar-row">',
          '<div class="rs-bar-track" id="rs-bar-track">',
            '<div class="rs-bar-fill" id="rs-bar-fill"></div>',
          '</div>',
          '<div class="rs-pct" id="rs-pct">0%</div>',
        '</div>',
      '</div>',

      /* (vi) Flying loading text — fixed-height area */
      '<div class="rs-log-area" id="rs-log-area"></div>',

      /* (vii) SCRIPT button + log panel */
      '<div class="rs-script-wrap">',
        '<button class="rs-script-btn" id="rs-script-btn" type="button" aria-expanded="false">',
          '<span class="rs-script-dot"></span>',
          '<span>SCRIPT</span>',
        '</button>',
        '<div class="rs-script-log" id="rs-script-log" role="log" aria-live="polite"></div>',
      '</div>',

      /* (viii) Continue — no border above or below */
      '<button class="rs-continue" id="rs-continue" type="button">',
        '<span class="rs-c-line"></span>',
        '<span class="rs-c-word">CONTINUE</span>',
        '<span class="rs-c-line"></span>',
      '</button>'
    ].join('');

    root.appendChild(inner);
    document.body.appendChild(root);
    this._root = root;

    /* Cache references */
    this._welcomeEl  = root.querySelector('#rs-welcome');
    this._contextEl  = root.querySelector('#rs-context');
    this._clockWrap  = root.querySelector('#rs-clock-wrap');
    this._digitsEl   = root.querySelector('#rs-digits');
    this._ampmEl     = root.querySelector('#rs-ampm');
    this._cdayEl     = root.querySelector('#rs-cday');
    this._cdateEl    = root.querySelector('#rs-cdate');
    this._barFill    = root.querySelector('#rs-bar-fill');
    this._barTrack   = root.querySelector('#rs-bar-track');
    this._pctEl      = root.querySelector('#rs-pct');
    this._logArea    = root.querySelector('#rs-log-area');
    this._scriptBtn  = root.querySelector('#rs-script-btn');
    this._scriptLog  = root.querySelector('#rs-script-log');
    this._continueBtn = root.querySelector('#rs-continue');
  };

  /* ── Start sequence ──────────────────────────────── */
  RoroSplash.prototype._start = function () {
    var self = this;

    /* Start clock immediately */
    this._updateClock();
    this._clockTimer = setInterval(function () { self._updateClock(); }, 1000);

    /* Start flying text */
    this._cycleFlyText();

    /* Run progress milestones */
    this._runProgress();

    /* SCRIPT toggle */
    this._scriptBtn.addEventListener('click', function () { self._toggleScript(); });

    /* Continue */
    this._continueBtn.addEventListener('click', function () { self._handleContinue(); });
  };

  /* ── Progress bar ────────────────────────────────── */
  RoroSplash.prototype._runProgress = function () {
    var self = this;
    PROGRESS_MILESTONES.forEach(function (m) {
      setTimeout(function () {
        self._setProgress(m[1]);
        if (m[1] === 100) {
          setTimeout(function () { self._onLoadComplete(); }, 320);
        }
      }, m[0]);
    });
  };

  RoroSplash.prototype._setProgress = function (pct) {
    this._barFill.style.width = pct + '%';
    this._pctEl.textContent   = pct + '%';
    this._barTrack.setAttribute('aria-valuenow', pct);
  };

  /* ── Flying loading text ─────────────────────────── */
  RoroSplash.prototype._cycleFlyText = function () {
    if (this._isDone) return;
    var self = this;
    var text = LOADING_MSGS[this._msgIdx % LOADING_MSGS.length];
    this._msgIdx++;
    this._logLines.push(text);
    this._showFlyItem(text);
    this._flyTimer = setTimeout(function () { self._cycleFlyText(); }, 680);
  };

  RoroSplash.prototype._showFlyItem = function (text) {
    var self = this;
    var el = document.createElement('div');
    el.className   = 'rs-fly-item';
    el.textContent = text;
    this._logArea.appendChild(el);

    /* Fly in */
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { el.classList.add('rs-fi'); });
    });

    /* Fly out */
    setTimeout(function () {
      el.classList.remove('rs-fi');
      el.classList.add('rs-fo');
      setTimeout(function () { if (el.parentNode) el.remove(); }, 140);
    }, 540);
  };

  RoroSplash.prototype._stopFlyText = function () {
    this._isDone = true;
    clearTimeout(this._flyTimer);
    var remaining = this._logArea.querySelectorAll('.rs-fly-item');
    remaining.forEach(function (el) {
      el.classList.add('rs-fo');
      setTimeout(function () { if (el.parentNode) el.remove(); }, 140);
    });
  };

  /* ── Load complete ───────────────────────────────── */
  RoroSplash.prototype._onLoadComplete = function () {
    var self = this;
    this._stopFlyText();

    /* Fade out log area, then show SCRIPT button */
    this._logArea.style.transition = 'opacity 0.3s ease';
    this._logArea.style.opacity    = '0';

    setTimeout(function () {
      self._logArea.style.display = 'none';
      self._scriptBtn.classList.add('rs-active');
    }, 320);

    /* Reveal post-load content staggered */
    this._revealPostLoad();

    /* Continue button after 2.2s */
    setTimeout(function () { self._showContinue(); }, 2200);
  };

  /* ── SCRIPT button ───────────────────────────────── */
  RoroSplash.prototype._toggleScript = function () {
    this._scriptOpen = !this._scriptOpen;

    if (this._scriptOpen) {
      /* Populate log */
      var frag = document.createDocumentFragment();
      this._logLines.forEach(function (line) {
        var d = document.createElement('div');
        d.className   = 'rs-script-entry';
        d.textContent = line;
        frag.appendChild(d);
      });
      this._scriptLog.innerHTML = '';
      this._scriptLog.appendChild(frag);
      this._scriptLog.classList.add('rs-open');
      this._scriptBtn.setAttribute('aria-expanded', 'true');
    } else {
      this._scriptLog.classList.remove('rs-open');
      this._scriptBtn.setAttribute('aria-expanded', 'false');
      var log = this._scriptLog;
      setTimeout(function () { log.innerHTML = ''; }, 260);
    }
  };

  /* ── Post-load reveal (staggered, no layout shift) ─ */
  RoroSplash.prototype._revealPostLoad = function () {
    var self = this;

    setTimeout(function () {
      self._welcomeEl.textContent = self._welcomeLine();
      self._welcomeEl.classList.add('rs-v');
    }, 200);

    setTimeout(function () {
      self._contextEl.textContent = self._contextLine();
      self._contextEl.classList.add('rs-v');
    }, 400);

    setTimeout(function () {
      self._clockWrap.classList.add('rs-v');
    }, 600);
  };

  /* ── Continue button ─────────────────────────────── */
  RoroSplash.prototype._showContinue = function () {
    this._continueBtn.classList.add('rs-v');
  };

  RoroSplash.prototype._handleContinue = function () {
    /* Unblock music and play it */
    window._roroSplashActive = false;
    var bgMusic = document.getElementById('bg-music');
    if (bgMusic) bgMusic.play().catch(function () {});

    /* Animate splash out */
    this._root.classList.add('rs-exit');

    /* Cleanup and trigger hero */
    var self = this;
    setTimeout(function () {
      clearInterval(self._clockTimer);
      clearTimeout(self._flyTimer);
      if (self._root.parentNode) self._root.remove();

      /* Remove injected CSS */
      var css = document.getElementById('rs-css');
      if (css) css.remove();

      /* Restore and run hero animations */
      if (typeof window._roroRunHero === 'function') {
        window._roroRunHero();
      }

      /* Restore play method */
      HTMLMediaElement.prototype.play = _origPlay;
    }, 780);
  };

  /* ── Live clock ──────────────────────────────────── */
  RoroSplash.prototype._updateClock = function () {
    var now  = new Date();
    var h    = now.getHours();
    var m    = String(now.getMinutes()).padStart(2, '0');
    var ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;

    var DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    this._digitsEl.textContent = h + ':' + m;
    this._ampmEl.textContent   = ampm;
    this._cdayEl.textContent   = DAYS[now.getDay()];
    this._cdateEl.textContent  = MONTHS[now.getMonth()] + ' ' + now.getDate();
  };

  /* ── Content generators ──────────────────────────── */
  RoroSplash.prototype._welcomeLine = function () {
    if (this._user && this._user.name) {
      var tpl = RETURN_LINES[Math.floor(Math.random() * RETURN_LINES.length)];
      return tpl.replace('{name}', this._user.name);
    }
    return FIRST_LINES[Math.floor(Math.random() * FIRST_LINES.length)];
  };

  RoroSplash.prototype._contextLine = function () {
    var h = new Date().getHours();
    var pool;
    if      (h >= 0  && h < 4)  pool = CTX_BY_HOUR.night;
    else if (h >= 4  && h < 7)  pool = CTX_BY_HOUR.dawn;
    else if (h >= 7  && h < 12) pool = CTX_BY_HOUR.morning;
    else if (h >= 12 && h < 14) pool = CTX_BY_HOUR.midday;
    else if (h >= 14 && h < 18) pool = CTX_BY_HOUR.afternoon;
    else if (h >= 18 && h < 21) pool = CTX_BY_HOUR.evening;
    else                         pool = CTX_BY_HOUR.latenight;
    return pool[Math.floor(Math.random() * pool.length)];
  };

  /* ═══════════════════════════════════════════════════════
     § 3 — BOOT
     DOMContentLoaded fires after all scripts run.
     At this point main.js has defined startHeroAnimations,
     so we can wrap it safely.
  ═══════════════════════════════════════════════════════ */
  document.addEventListener('DOMContentLoaded', function () {

    /* Remove immediate cover now that splash is ready */
    if (_immediatecover && _immediatecover.parentNode) {
      _immediatecover.remove();
    }

    /* Wrap startHeroAnimations to defer it until Continue click */
    var _origHero = window.startHeroAnimations;
    window.startHeroAnimations = function () {
      /* noop — called by main.js window.load handler silently */
    };
    window._roroRunHero = function () {
      window.startHeroAnimations = _origHero; /* restore original */
      if (typeof _origHero === 'function') _origHero();
    };

    /* Launch splash */
    window._roroSplashInstance = new RoroSplash();
  });

  /* Public init handle */
  window.initRoroSplash = function () {
    window._roroSplashInstance = new RoroSplash();
  };

})();

/*
  ═══════════════════════════════════════════════════════════
  INTEGRATION CHECKLIST
  ═══════════════════════════════════════════════════════════

  1. In index.html, BEFORE <script src="js/main.js">:
       <script src="js/roro-intro.js"></script>

  2. DELETE this block entirely from index.html:
       <div id="loading-screen">
         <div class="loading-name">M · S · M</div>
         <div class="loading-bar-wrap">
           <div class="loading-bar" id="loading-bar"></div>
         </div>
         <div class="loading-pct" id="loading-pct">0%</div>
       </div>

  3. No changes to main.js, pages.css, or tokens.css needed.

  WHAT THIS FILE DOES:
  ▸ Adds an immediate black cover to body synchronously
    (prevents any flash of the home page)
  ▸ Intercepts HTMLMediaElement.prototype.play so bg-music
    cannot start from main.js's mousemove/click listeners
  ▸ On DOMContentLoaded, wraps window.startHeroAnimations
    so the hero animations fire ONLY when Continue is clicked
    — giving a clean, proper transition to the homepage
  ▸ On Continue: unblocks music, plays it, animates out the
    splash, then calls the real startHeroAnimations so the
    hero name/tagline animate in naturally
  ═══════════════════════════════════════════════════════════
*/
