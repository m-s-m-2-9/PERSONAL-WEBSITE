/* ═══════════════════════════════════════════════════════════════════════
   js/roro-intro.js  ·  MSM Experience  ·  v5.0
   ────────────────────────────────────────────────────────────────────
   PHASE 1 — Video Splash
     · Desktop (≥1024px) → assets/videos/pc-intro.mp4
     · Mobile/tablet (<1024px) → assets/videos/mobile-splash.mp4
     · Fullscreen object-fit:cover, autoplay muted playsinline
     · Graceful fallback: error / autoplay-block / 8s timeout → loader

   PHASE 2 — Loading Screen (COMPLETELY UNCHANGED)
     · Ghost clock · Welcome / context text · Facts rotation
     · Progress bar · Terminal log (click to expand/collapse)
     · Continue → page transition

   No GSAP. No canvas. No external dependencies. Pure JS + CSS.
   ────────────────────────────────────────────────────────────────────
   index.html checklist (same as before — zero changes needed):
   ① <style>body{visibility:hidden}</style>  in <head>
   ② <div id="roro-cover" ...>  first child of <body>
   ③ <script src="js/roro-intro.js"></script>  BEFORE main.js
   ④ Old loading-screen div: already removed ✓
═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ─────────────────────────────────────────────────────────────────
     SETUP
  ───────────────────────────────────────────────────────────────── */
  document.body.style.visibility = 'visible';
  document.body.style.overflow   = 'hidden'; /* block scroll during splash */

  window._roroActive = true;
  var _origPlay = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () {
    if (window._roroActive && (this.id === 'bg-music' || this.id === 'rain-song')) {
      return Promise.resolve();
    }
    return _origPlay.apply(this, arguments);
  };

  /* ═════════════════════════════════════════════════════════════════════
     CSS
  ═════════════════════════════════════════════════════════════════════ */
  var CSS = `
    #cursor-dot, #cursor-ring { z-index: 9999999 !important; }

    /* ── Root splash ── */
    #roro-splash {
      position: fixed; inset: 0; z-index: 999998;
      background: #000;
      overflow: hidden;
      opacity: 0;
      transition: opacity 0.4s ease;
    }
    #roro-splash.rs-show { opacity: 1; }

    /* ════════════════════════════════════════
       PHASE 1 — Video
    ════════════════════════════════════════ */

   #rs-video-wrap {
  position: absolute;
  inset: 0;
  z-index: 4;

  overflow: hidden;

  background:
    radial-gradient(circle at center, #111 0%, #000 72%);

  opacity: 1;
  transition: opacity 0.9s ease;
}

#rs-video-wrap.rs-fade-out {
  opacity: 0;
  pointer-events: none;
}

/* Balanced cinematic fit */
#rs-video {
  position: absolute;

  top: 50%;
  left: 50%;

  width: 100vw;
  height: 100vh;

  transform: translate(-50%, -50%) scale(1.06);

  object-fit: cover;
  object-position: center center;

  display: block;
  background: #000;
}


    /* ════════════════════════════════════════
       PHASE 2 — Loader (unchanged)
    ════════════════════════════════════════ */

    #rs-loader {
      position: absolute; inset: 0;
      display: none;
      flex-direction: column;
      align-items: center; justify-content: center;
      z-index: 3;
      opacity: 0;
      transition: opacity 0.65s ease;
    }
    #rs-loader.rs-show { opacity: 1; }

    .rs-ld-grid {
      position: absolute; inset: 0;
      pointer-events: none; z-index: 0;
      background-image:
        linear-gradient(var(--border, #1a1a1a) 1px, transparent 1px),
        linear-gradient(90deg, var(--border, #1a1a1a) 1px, transparent 1px);
      background-size: 60px 60px;
      -webkit-mask-image: radial-gradient(ellipse 80% 65% at 50% 50%, black 5%, transparent 100%);
      mask-image:         radial-gradient(ellipse 80% 65% at 50% 50%, black 5%, transparent 100%);
    }

    .rs-grain {
      position: absolute; inset: 0;
      pointer-events: none; z-index: 1;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.88' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.022'/%3E%3C/svg%3E");
      opacity: 0.55;
      animation: rsGrainShift 0.12s steps(1) infinite;
    }
    @keyframes rsGrainShift {
      0%   { background-position: 0 0; }
      20%  { background-position: -42px 18px; }
      40%  { background-position: 24px -35px; }
      60%  { background-position: -14px 45px; }
      80%  { background-position: 36px -12px; }
      100% { background-position: 0 0; }
    }

    .rs-scan {
      position: absolute; left: 0; right: 0;
      height: 120px; pointer-events: none; z-index: 1; top: -120px;
      background: linear-gradient(to bottom,
        transparent 0%, rgba(255,255,255,0.011) 50%, transparent 100%);
      animation: rsScanMove 9s linear infinite;
    }
    @keyframes rsScanMove { 0% { top: -120px; } 100% { top: 100%; } }

    .rs-film {
      position: absolute; top: -30px; bottom: -30px;
      width: 28px; overflow: hidden;
      pointer-events: none; z-index: 1;
      opacity: 0; animation: rsFilmIn 1.5s ease 0.4s forwards;
    }
    @keyframes rsFilmIn { to { opacity: 1; } }
    .rs-film--l { left: clamp(8px, 3vw, 40px); }
    .rs-film--r { right: clamp(8px, 3vw, 40px); }
    .rs-belt { display: flex; flex-direction: column; gap: 6px; padding: 6px 0; }
    .rs-film--l .rs-belt { animation: rsUp   28s linear infinite; }
    .rs-film--r .rs-belt { animation: rsDown 28s linear infinite; }
    @keyframes rsUp   { from { transform: translateY(0); }    to { transform: translateY(-50%); } }
    @keyframes rsDown { from { transform: translateY(-50%); } to { transform: translateY(0); } }
    .rs-frame {
      width: 28px; height: 18px;
      border: 1px solid var(--border2, #222); border-radius: 2px;
      flex-shrink: 0; opacity: 0.22; position: relative;
    }
    .rs-frame::before, .rs-frame::after {
      content: ''; position: absolute;
      width: 4px; height: 4px; border-radius: 1px;
      background: var(--bg, #080808);
      border: 1px solid var(--border2, #222);
      top: 50%; transform: translateY(-50%);
    }
    .rs-frame::before { left: 2px; }
    .rs-frame::after  { right: 2px; }
    .rs-frame.rs-f-accent { opacity: 0.5; border-color: var(--accent, #c8a96e); }

    .rs-ghost {
      position: absolute; top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      display: flex; flex-direction: column; align-items: center;
      gap: 2.4rem;
      opacity: 0; user-select: none; pointer-events: none; z-index: 0;
      transition: opacity 2.5s ease;
    }
    .rs-ghost.rs-on { opacity: 0.036; }
    .rs-ghost-time-row { display: flex; align-items: flex-start; line-height: 1; }
    .rs-ghost-time {
      font-family: var(--ff-display, 'Playfair Display', serif);
      font-size: clamp(14vw, 20vw, 26vw);
      font-weight: 300; color: var(--text, #f0ebe0);
      letter-spacing: -0.04em; line-height: 1; white-space: nowrap;
    }
    .rs-ghost-ampm {
      font-family: var(--ff-mono, monospace);
      font-size: clamp(7vw, 10vw, 13vw);
      font-weight: 300; color: var(--text, #f0ebe0);
      line-height: 1.08; padding-top: 0.07em;
      margin-left: 0.08em; white-space: nowrap;
    }
    .rs-ghost-meta {
      font-family: var(--ff-mono, monospace);
      font-size: clamp(1.4vw, 2.2vw, 3vw);
      color: var(--text, #f0ebe0);
      letter-spacing: 0.38em; text-transform: uppercase;
      white-space: nowrap; line-height: 1;
    }

    .rs-inner {
      position: relative; z-index: 2;
      width: 100%; max-width: 520px; padding: 0 3rem;
      display: flex; flex-direction: column; align-items: center;
    }

    .rs-welcome-shell {
      width: 100%; min-height: 5rem;
      display: flex; align-items: center; justify-content: center;
      text-align: center; margin-bottom: 1rem;
    }
    .rs-welcome {
      font-family: var(--ff-display, 'Playfair Display', serif);
      font-size: clamp(1.8rem, 5vw, 3rem);
      font-weight: 400; font-style: italic;
      color: var(--text, #f0ebe0); line-height: 1.2;
      opacity: 0; transform: translateY(16px);
      transition:
        opacity 1.1s cubic-bezier(0.16,1,0.3,1),
        transform 1.1s cubic-bezier(0.16,1,0.3,1);
    }
    .rs-welcome.rs-on { opacity: 1; transform: translateY(0); }

    .rs-facts-shell {
      width: 100%; height: 20px; overflow: hidden;
      margin-bottom: 1.8rem;
      opacity: 0; transition: opacity 0.8s ease;
    }
    .rs-facts-shell.rs-on { opacity: 1; }
    .rs-fact-txt {
      font-family: var(--ff-mono, monospace); font-size: 0.57rem;
      color: var(--text3, #555); letter-spacing: 0.07em;
      line-height: 20px; text-align: center;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      opacity: 1; transition: opacity 0.09s ease;
    }
    .rs-fact-txt.rs-fade { opacity: 0; }
    .rs-fact-txt::before { content: '·  '; color: var(--accent, #c8a96e); opacity: 0.6; }

    .rs-bar-shell {
      width: 100%; margin-bottom: 0.8rem;
      opacity: 0; animation: rsFadeIn 0.5s ease 0.2s forwards;
    }
    @keyframes rsFadeIn { from { opacity: 0; } to { opacity: 1; } }
    .rs-bar-row { display: flex; align-items: center; gap: 10px; }
    .rs-track {
      flex: 1; height: 1px;
      background: var(--border2, #222);
      position: relative; overflow: hidden;
    }
    .rs-fill {
      position: absolute; top: 0; left: 0; bottom: 0;
      width: 0%; background: var(--accent, #c8a96e);
      transition: width 0.38s cubic-bezier(0.4,0,0.2,1);
    }
    .rs-fill::after {
      content: ''; position: absolute;
      top: 0; bottom: 0; right: -60px; width: 60px;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.38), transparent);
      animation: rsShimmer 2s ease-in-out infinite;
    }
    @keyframes rsShimmer { 0%,100% { opacity:0; } 50% { opacity:1; } }
    .rs-pct {
      font-family: var(--ff-mono, monospace); font-size: 0.54rem;
      color: var(--text3, #555); letter-spacing: 0.06em;
      min-width: 3.5ch; text-align: right; flex-shrink: 0;
    }

    .rs-terminal-wrap {
      width: 100%; margin-bottom: 1.6rem;
      opacity: 0; transition: opacity 0.4s ease;
    }
    .rs-terminal-wrap.rs-on { opacity: 1; }

    .rs-log-panel {
      width: 100%; max-height: 0; overflow: hidden;
      transition: max-height 0.45s cubic-bezier(0.16,1,0.3,1);
      border: 1px solid transparent; border-bottom: none;
      border-radius: 4px 4px 0 0;
      background: rgba(200,169,110,0.018);
    }
    .rs-log-panel.rs-open {
      max-height: 240px; overflow-y: auto;
      border-color: var(--border2, #222);
    }
    .rs-log-panel::-webkit-scrollbar { width: 3px; }
    .rs-log-panel::-webkit-scrollbar-track { background: transparent; }
    .rs-log-panel::-webkit-scrollbar-thumb { background: var(--border2, #222); border-radius: 2px; }

    .rs-log-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 0.55rem 0.85rem 0.4rem;
      border-bottom: 1px solid var(--border2, #222);
    }
    .rs-log-title {
      font-family: var(--ff-mono, monospace); font-size: 0.52rem;
      color: var(--accent, #c8a96e); letter-spacing: 0.14em; text-transform: uppercase;
    }
    .rs-log-close {
      font-family: var(--ff-mono, monospace); font-size: 0.5rem;
      color: var(--text3, #555); letter-spacing: 0.08em;
    }
    .rs-log-entries {
      padding: 0.55rem 0.85rem 0.7rem;
      display: flex; flex-direction: column; gap: 0.38rem;
    }
    .rs-log-entry {
      font-family: var(--ff-mono, monospace); font-size: 0.545rem;
      color: var(--text3, #555); letter-spacing: 0.05em; line-height: 1.5;
      opacity: 0; transform: translateY(4px);
      transition: opacity 0.18s ease, transform 0.18s ease;
    }
    .rs-log-entry.rs-on { opacity: 1; transform: translateY(0); }
    .rs-log-entry::before { content: '  › '; color: var(--accent, #c8a96e); opacity: 0.45; }
    .rs-log-entry.rs-log-done { color: var(--text, #f0ebe0); opacity: 0; }
    .rs-log-entry.rs-log-done.rs-on { opacity: 1; }
    .rs-log-entry.rs-log-done::before { content: '  ✓ '; color: var(--accent, #c8a96e); opacity: 0.85; }

    .rs-terminal {
      display: flex; align-items: center; gap: 0.65rem;
      padding: 0.52rem 0.8rem;
      border-left: 2px solid var(--accent, #c8a96e);
      background: rgba(200,169,110,0.026);
      cursor: pointer; user-select: none;
      transition: background 0.25s ease;
    }
    .rs-terminal:hover { background: rgba(200,169,110,0.052); }
    .rs-terminal-wrap.rs-log-open .rs-terminal { border-top: 1px solid var(--border2, #222); }

    .rs-term-prefix {
      font-family: var(--ff-mono, monospace); font-size: 0.65rem;
      color: var(--accent, #c8a96e); flex-shrink: 0; line-height: 1;
    }
    .rs-term-msg {
      font-family: var(--ff-mono, monospace); font-size: 0.57rem;
      color: var(--text3, #555); letter-spacing: 0.055em;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1;
      opacity: 1; transition: opacity 0.09s ease;
    }
    .rs-term-msg.rs-fade { opacity: 0; }
    .rs-term-cursor {
      font-family: var(--ff-mono, monospace); font-size: 0.57rem;
      color: var(--accent, #c8a96e); flex-shrink: 0;
      animation: rsBlink 1.1s step-end infinite;
    }
    @keyframes rsBlink { 0%,100% { opacity:0; } 50% { opacity:1; } }
    .rs-term-chevron {
      font-size: 0.48rem; color: var(--text3, #555); flex-shrink: 0;
      transition: transform 0.35s cubic-bezier(0.16,1,0.3,1), color 0.2s ease;
      opacity: 0.55; margin-left: 2px;
    }
    .rs-terminal-wrap.rs-log-open .rs-term-chevron {
      transform: rotate(180deg); color: var(--accent, #c8a96e); opacity: 1;
    }

    .rs-continue {
      width: 100%; background: none; border: none;
      color: var(--text3, #555);
      font-family: var(--ff-mono, monospace); font-size: 0.63rem;
      letter-spacing: 0.32em; text-transform: uppercase;
      padding: 13px 0; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      opacity: 0; pointer-events: none; outline: none;
      transform: translateY(8px);
      transition: opacity 0.75s ease, transform 0.75s cubic-bezier(0.16,1,0.3,1), color 0.3s ease;
    }
    .rs-continue.rs-show { opacity: 1; pointer-events: all; transform: translateY(0); }
    .rs-continue:hover { color: var(--text, #f0ebe0); }
    .rs-continue:hover .rs-dash { background: var(--accent, #c8a96e); opacity: 0.4; }
    .rs-dash {
      flex: 1; height: 1px; background: var(--border2, #222);
      max-width: 80px; transition: background 0.3s, opacity 0.3s;
    }
    .rs-cword { padding: 0 16px; flex-shrink: 0; }

    @media (max-width: 540px) {
      .rs-inner { padding: 0 1.4rem; }
      .rs-film--l, .rs-film--r { display: none; }
    }
  `;

  /* ═════════════════════════════════════════════════════════════════════
     DATA
  ═════════════════════════════════════════════════════════════════════ */
  var MSGS = [
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
    "Welcome.", "You've arrived.",
    "Something worth seeing awaits.",
    "An intentional space.", "Not many find their way here.",
    "Presence acknowledged.",
    "Built for people who notice things."
  ];

  var RETURN_LINES = [
    "Welcome back, {n}.", "Still curious, {n}?",
    "You returned, {n}.", "{n}. Good to have you back.",
    "Again, {n}. That means something.",
    "Back already, {n}.",
    "The site remembers you, {n}."
  ];

  var CTX = {
    night:     ["The world is quiet. You're still here.", "Building at midnight. That's a certain kind of ambition.", "Late nights have a clarity daylight rarely offers.", "The rare hour. Use it.", "Most of the city is asleep right now."],
    dawn:      ["Before dawn. The rarest window.", "You're up before most cities are.", "Pre-dawn. A strange calm settles here.", "The world resets in a few hours.", "Early enough to see things clearly."],
    morning:   ["Morning already in motion.", "First thoughts of the day carry weight.", "The day hasn't decided what it is yet.", "Good time to build. Or explore.", "Morning light is honest."],
    midday:    ["Midday. Half the day already spent.", "The machine is running. You found a pause.", "Somewhere between intention and momentum.", "Post-morning clarity. Good timing.", "Noon. A strange pivot."],
    afternoon: ["The afternoon carries a certain weight.", "The day has settled into itself now.", "That quiet hour before the light shifts.", "Golden hour is not far.", "Afternoons here feel slightly different."],
    evening:   ["Evening feels quieter here.", "The day is softening at its edges.", "Evenings are for noticing things you missed.", "Dusk settles differently when you're paying attention.", "End-of-day clarity."],
    latenight: ["Night has a particular kind of focus.", "Late enough to mean something.", "The city dims. You stay lit.", "Burning the midnight oil. Noted.", "After-hours. This is when real things happen."]
  };

  var FACTS = [
    "A teaspoon of neutron star material weighs around 6 billion tons",
    "Venus rotates clockwise — opposite to most planets",
    "There are more stars in the universe than grains of sand on all Earth's beaches",
    "The Moon drifts ~1.5 inches further from Earth every year",
    "A human sneeze can reach 100 miles per hour",
    "Bananas grow upward against gravity — called negative geotropism",
    "The bumblebee bat weighs 0.05 oz — the world's smallest mammal",
    "All clownfish are born male — the dominant one can change sex",
    "Hippos can't swim. They gallop along riverbeds instead",
    "The oldest cat ever recorded lived 38 years and 3 days",
    "Humans blink up to 28,800 times per day",
    "Your stomach gets a new lining every 3–4 days",
    "Identical twins do not share fingerprints",
    "About 10% of all people are left-handed",
    "The human brain burns ~400–500 calories per day just to function",
    "The Anglo-Zanzibar War of 1896 lasted exactly 38 minutes",
    "Egypt is considered the world's oldest country — dating to 3100 BCE",
    "The Eiffel Tower grows up to 6 inches taller in summer",
    "The letter J was the last letter added to the English alphabet",
    "The # symbol is officially called an octothorpe",
    "HINT: Click the name on the homepage 7 times. Something will appear",
    "HINT: Type the word 'manomay' on your keyboard anywhere on the site",
    "Some sections require a password — the Contact page is how you ask",
    "The Clock page activates a hidden state on August 29th",
    "There are 14 sections on this site. Most visitors find 6 or 7",
    "The background music has two tracks. Only one is immediately visible",
    "Every pixel of this site was written by hand. No templates. No frameworks",
    "The Journey timeline covers 19 chapters — from 2008 to the present",
    "RoRo is the site's intelligence layer. Try asking it something",
    "Some photo albums require trust. There's a reason they're locked",
    "The mechanical click sound in the nav can be toggled off",
    "There are four visual themes. Switching changes more than colours",
    "Five fully playable games are built into this site. No shortcuts",
    "The hero name cycles its highlighted word on every reload",
    "The vinyl record in the bottom-left corner doesn't always appear",
    "Nothing here was accidental. Every element was placed deliberately",
    "The Thoughts section has 16 posts across 6 categories — all personal",
    "RoRo stands for nothing specific. It just felt right when named",
    "Some of the best content here sits behind a password — knock politely",
    "The footer says it plainly: built with intention, not a template"
  ];

  var MILESTONES = [
    [0,    0],  [320,  7],  [640,  16], [1030, 29], [1480, 43],
    [2000, 57], [2500, 68], [3020, 78], [3470, 87], [3860, 93],
    [4240, 97], [4500, 100]
  ];

  /* ═════════════════════════════════════════════════════════════════════
     RORO SPLASH — main class
  ═════════════════════════════════════════════════════════════════════ */
  function RoroSplash() {
    this._user          = this._readUser();
    this._msgIdx        = 0;
    this._factIdx       = Math.floor(Math.random() * FACTS.length);
    this._factTimer     = null;
    this._msgTimer      = null;
    this._clockInt      = null;
    this._isDone        = false;
    this._logOpen       = false;
    this._logData       = [];
    this._transitioned  = false; /* guard: video→loader only fires once */
    this._fallbackTimer = null;

    this._injectCSS();
    this._dom();
    this._revealSplash();
    this._setupVideo();
  }

  RoroSplash.prototype._readUser = function () {
    try { return JSON.parse(localStorage.getItem('roroUser') || 'null'); }
    catch (e) { return null; }
  };

  RoroSplash.prototype._injectCSS = function () {
    if (document.getElementById('rs-css')) return;
    var s = document.createElement('style');
    s.id = 'rs-css'; s.textContent = CSS;
    document.head.appendChild(s);
  };

  RoroSplash.prototype._strip = function (side) {
    var wrap = document.createElement('div');
    wrap.className = 'rs-film rs-film--' + side;
    var belt = document.createElement('div');
    belt.className = 'rs-belt';
    var html = '';
    for (var i = 0; i < 60; i++) {
      html += '<div class="rs-frame' + (i % 5 === 0 ? ' rs-f-accent' : '') + '"></div>';
    }
    belt.innerHTML = html + html;
    wrap.appendChild(belt);
    return wrap;
  };

  /* Returns true when the viewport is narrower than 1024 px
     (phone + tablet — uses mobile-splash.mp4)                  */
  RoroSplash.prototype._isMobile = function () {
    return (window.innerWidth || document.documentElement.clientWidth) < 1024;
  };

  /* ══════════════════════════════════════════════════════════════════
     DOM BUILD
  ══════════════════════════════════════════════════════════════════ */
  RoroSplash.prototype._dom = function () {
    var root = document.createElement('div');
    root.id = 'roro-splash';

    /* ── Video wrapper ── */
    var videoWrap = document.createElement('div');
    videoWrap.id = 'rs-video-wrap';

    var video = document.createElement('video');
    video.id = 'rs-video';
    /* Every attribute needed for autoplay on every browser + iOS */
    video.setAttribute('autoplay', '');
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', ''); /* old iOS Safari */
    video.setAttribute('preload', 'auto');
    video.setAttribute('disablepictureinpicture', '');
    video.muted      = true;  /* property — required by Firefox/Chrome */
    video.playsInline = true; /* property — belt + suspenders          */

    videoWrap.appendChild(video);
    root.appendChild(videoWrap);

    /* ── Loader ── */
    var loader = document.createElement('div');
    loader.id = 'rs-loader';

    /* Ghost clock */
    var ghost = document.createElement('div');
    ghost.className = 'rs-ghost'; ghost.id = 'rs-ghost';
    ghost.setAttribute('aria-hidden', 'true');
    var timeRow = document.createElement('div');
    timeRow.className = 'rs-ghost-time-row';
    var gTime = document.createElement('span');
    gTime.className = 'rs-ghost-time'; gTime.id = 'rs-ghost-time';
    var gAmpm = document.createElement('span');
    gAmpm.className = 'rs-ghost-ampm'; gAmpm.id = 'rs-ghost-ampm';
    timeRow.appendChild(gTime); timeRow.appendChild(gAmpm);
    ghost.appendChild(timeRow);
    var gMeta = document.createElement('span');
    gMeta.className = 'rs-ghost-meta'; gMeta.id = 'rs-ghost-meta';
    ghost.appendChild(gMeta);
    loader.appendChild(ghost);

    /* Grid */
    var ldGrid = document.createElement('div');
    ldGrid.className = 'rs-ld-grid';
    loader.appendChild(ldGrid);

    /* Grain */
    var grain = document.createElement('div');
    grain.className = 'rs-grain';
    grain.setAttribute('aria-hidden', 'true');
    loader.appendChild(grain);

    /* CRT scan */
    var scan = document.createElement('div');
    scan.className = 'rs-scan';
    scan.setAttribute('aria-hidden', 'true');
    loader.appendChild(scan);

    /* Film strips */
    loader.appendChild(this._strip('l'));
    loader.appendChild(this._strip('r'));

    /* Inner content */
    var inner = document.createElement('div');
    inner.className = 'rs-inner';
    inner.innerHTML =
      '<div class="rs-welcome-shell" id="rs-ws">' +
        '<div class="rs-welcome" id="rs-welcome"></div>' +
      '</div>' +
      '<div class="rs-facts-shell" id="rs-facts-shell">' +
        '<div class="rs-fact-txt" id="rs-fact-txt"></div>' +
      '</div>' +
      '<div class="rs-bar-shell">' +
        '<div class="rs-bar-row">' +
          '<div class="rs-track" id="rs-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">' +
            '<div class="rs-fill" id="rs-fill"></div>' +
          '</div>' +
          '<div class="rs-pct" id="rs-pct">0%</div>' +
        '</div>' +
      '</div>' +
      '<div class="rs-terminal-wrap" id="rs-terminal-wrap">' +
        '<div class="rs-log-panel" id="rs-log-panel">' +
          '<div class="rs-log-header">' +
            '<span class="rs-log-title">TERMINAL LOG</span>' +
            '<span class="rs-log-close">▲ COLLAPSE</span>' +
          '</div>' +
          '<div class="rs-log-entries" id="rs-log-entries"></div>' +
        '</div>' +
        '<div class="rs-terminal" id="rs-terminal" role="button" tabindex="0" aria-label="Toggle terminal log">' +
          '<span class="rs-term-prefix">›</span>' +
          '<span class="rs-term-msg" id="rs-term-msg"></span>' +
          '<span class="rs-term-cursor" aria-hidden="true">_</span>' +
          '<span class="rs-term-chevron" id="rs-term-chevron" aria-hidden="true">▾</span>' +
        '</div>' +
      '</div>' +
      '<button class="rs-continue" id="rs-continue" type="button" aria-label="Enter site">' +
        '<span class="rs-dash" aria-hidden="true"></span>' +
        '<span class="rs-cword">CONTINUE</span>' +
        '<span class="rs-dash" aria-hidden="true"></span>' +
      '</button>';

    loader.appendChild(inner);
    root.appendChild(loader);
    document.body.appendChild(root);

    this._root      = root;
    this._videoWrap = videoWrap;
    this._video     = video;

    this._ghost      = document.getElementById('rs-ghost');
    this._ghostTime  = document.getElementById('rs-ghost-time');
    this._ghostAmpm  = document.getElementById('rs-ghost-ampm');
    this._ghostMeta  = document.getElementById('rs-ghost-meta');
    this._welcome    = document.getElementById('rs-welcome');
    this._factsS     = document.getElementById('rs-facts-shell');
    this._factsT     = document.getElementById('rs-fact-txt');
    this._fill       = document.getElementById('rs-fill');
    this._track      = document.getElementById('rs-track');
    this._pct        = document.getElementById('rs-pct');
    this._termWrap   = document.getElementById('rs-terminal-wrap');
    this._terminal   = document.getElementById('rs-terminal');
    this._termMsg    = document.getElementById('rs-term-msg');
    this._logPanel   = document.getElementById('rs-log-panel');
    this._logEntries = document.getElementById('rs-log-entries');
    this._cont       = document.getElementById('rs-continue');
  };

  /* ── Reveal splash, drop cover ── */
  RoroSplash.prototype._revealSplash = function () {
    var self = this;
    var oldLS = document.getElementById('loading-screen');
    if (oldLS) oldLS.style.cssText = 'display:none!important';

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        self._root.classList.add('rs-show');
        var cover = document.getElementById('roro-cover');
        if (cover) {
          setTimeout(function () { if (cover.parentNode) cover.remove(); }, 460);
        }
      });
    });
  };

  /* ══════════════════════════════════════════════════════════════════
     PHASE 1: VIDEO
  ══════════════════════════════════════════════════════════════════ */
  RoroSplash.prototype._setupVideo = function () {
    var self  = this;
    var video = this._video;

    /* Source selection */
    video.src = this._isMobile()
      ? 'assets/videos/mobile-splash.mp4'
      : 'assets/videos/pc-intro.mp4';

    /* ── Listeners ── */

    /* Natural end → transition */
    video.addEventListener('ended', function () {
      self._clearFallback();
      self._videoToLoader();
    });

    /* Any media error → skip gracefully */
    video.addEventListener('error', function () {
      self._clearFallback();
      self._videoToLoader();
    });

    /* Stalled for 3 s → give up and show loader */
    video.addEventListener('stalled', function () {
      setTimeout(function () {
        if (!self._transitioned) {
          self._clearFallback();
          self._videoToLoader();
        }
      }, 3000);
    });

    /* Absolute safety net: 8 s hard timeout.
       Covers: very slow networks, silent codec failures,
       browser policies that fire no event at all.          */
    this._fallbackTimer = setTimeout(function () {
      self._videoToLoader();
    }, 8000);

    /* Attempt autoplay */
    video.load();
    var playPromise = video.play();

    if (playPromise !== undefined) {
      playPromise.catch(function () {
        /* Autoplay was blocked (common on mobile without prior user gesture).
           Skip to loader immediately so the user is never stuck.             */
        self._clearFallback();
        self._videoToLoader();
      });
    }
  };

  RoroSplash.prototype._clearFallback = function () {
    if (this._fallbackTimer) {
      clearTimeout(this._fallbackTimer);
      this._fallbackTimer = null;
    }
  };

  /* ── Video out → Loader in (smooth crossfade) ── */
  RoroSplash.prototype._videoToLoader = function () {
    if (this._transitioned) return; /* fire exactly once */
    this._transitioned = true;

    var self   = this;
    var wrap   = this._videoWrap;
    var loader = document.getElementById('rs-loader');

    /* Stop video to free decode resources */
    try { this._video.pause(); } catch (e) {}

    /* STEP 1 — fade video out (0.9 s CSS transition) */
    wrap.classList.add('rs-fade-out');

    /* STEP 2 — crossfade: show loader while video is still mid-fade */
    setTimeout(function () {
      loader.style.display = 'flex';
      /* Two rAF ticks so display:flex is rendered before the
         opacity class triggers the transition                 */
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          loader.classList.add('rs-show');
          self._runLoader();
        });
      });
    }, 420);

    /* STEP 3 — once fully faded, remove from DOM + free memory */
    setTimeout(function () {
      if (wrap && wrap.parentNode) {
        wrap.style.display = 'none';
        try {
          self._video.removeAttribute('src');
          self._video.load();
        } catch (e) {}
      }
    }, 980);
  };

  /* ════════════════════════════════════════════════════════════════
     PHASE 2: LOADING SCREEN — all methods unchanged
  ════════════════════════════════════════════════════════════════ */
  RoroSplash.prototype._runLoader = function () {
    var self = this;

    /* Ghost clock */
    this._tick();
    this._clockInt = setInterval(function () { self._tick(); }, 1000);
    setTimeout(function () { self._ghost.classList.add('rs-on'); }, 200);

    /* Terminal: first message */
    var firstMsg = MSGS[this._msgIdx % MSGS.length];
    this._msgIdx++;
    this._termMsg.textContent = firstMsg;
    this._logData.push({ text: firstMsg, done: false });
    this._termWrap.classList.add('rs-on');

    /* Message cycling */
    this._msgTimer = setInterval(function () { self._nextMsg(); }, 700);

    /* Progress */
    this._progress();

    /* Facts */
    this._factsT.textContent = FACTS[this._factIdx];
    this._factTimer = setInterval(function () { self._nextFact(); }, 2400);

    /* Welcome */
    setTimeout(function () {
      self._welcome.textContent = self._getWelcome();
      self._welcome.classList.add('rs-on');
    }, 250);

    /* Facts line */
    setTimeout(function () { self._factsS.classList.add('rs-on'); }, 550);

    /* Terminal: click + keyboard */
    this._terminal.addEventListener('click', function () {
      self._toggleLogPanel();
    });
    this._terminal.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        self._toggleLogPanel();
      }
    });

    /* Continue */
    this._cont.addEventListener('click', function () { self._finish(); });
  };

  RoroSplash.prototype._progress = function () {
    var self = this;
    MILESTONES.forEach(function (m) {
      setTimeout(function () {
        self._fill.style.width = m[1] + '%';
        self._pct.textContent  = m[1] + '%';
        self._track.setAttribute('aria-valuenow', m[1]);
        if (m[1] === 100) {
          setTimeout(function () { self._done(); }, 300);
        }
      }, m[0]);
    });
  };

  RoroSplash.prototype._done = function () {
    var self = this;
    this._isDone = true;
    clearInterval(this._msgTimer);

    this._termMsg.classList.add('rs-fade');
    setTimeout(function () {
      self._termMsg.textContent = 'READY.';
      self._termMsg.classList.remove('rs-fade');
      self._logData.push({ text: 'READY.', done: true });
      if (self._logOpen) { self._renderLogPanel(); }
    }, 95);

    setTimeout(function () { self._cont.classList.add('rs-show'); }, 500);
  };

  RoroSplash.prototype._nextMsg = function () {
    if (this._isDone) return;
    var self = this;
    var text = MSGS[this._msgIdx % MSGS.length];
    this._msgIdx++;

    this._termMsg.classList.add('rs-fade');
    setTimeout(function () {
      if (self._isDone) return;
      self._termMsg.textContent = text;
      self._termMsg.classList.remove('rs-fade');
      self._logData.push({ text: text, done: false });
      if (self._logOpen) { self._renderLogPanel(); }
    }, 95);
  };

  RoroSplash.prototype._nextFact = function () {
    var self = this;
    this._factsT.classList.add('rs-fade');
    setTimeout(function () {
      self._factIdx = (self._factIdx + 1) % FACTS.length;
      self._factsT.textContent = FACTS[self._factIdx];
      self._factsT.classList.remove('rs-fade');
    }, 100);
  };

  RoroSplash.prototype._toggleLogPanel = function () {
    this._logOpen = !this._logOpen;
    if (this._logOpen) {
      this._renderLogPanel();
      this._logPanel.classList.add('rs-open');
      this._termWrap.classList.add('rs-log-open');
    } else {
      this._logPanel.classList.remove('rs-open');
      this._termWrap.classList.remove('rs-log-open');
    }
  };

  RoroSplash.prototype._renderLogPanel = function () {
    /* Fisher-Yates shuffle — panel shows messages in random order */
    var entries = this._logData.slice();
    for (var i = entries.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = entries[i]; entries[i] = entries[j]; entries[j] = tmp;
    }

    var container = this._logEntries;
    container.innerHTML = '';
    entries.forEach(function (entry, idx) {
      var div = document.createElement('div');
      div.className = 'rs-log-entry' + (entry.done ? ' rs-log-done' : '');
      div.textContent = entry.text;
      container.appendChild(div);
      setTimeout(function () { div.classList.add('rs-on'); }, idx * 28 + 20);
    });
  };

  RoroSplash.prototype._tick = function () {
    var now  = new Date();
    var h    = now.getHours();
    var m    = String(now.getMinutes()).padStart(2, '0');
    var ap   = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    var DAYS = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];
    var MON  = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    this._ghostTime.textContent = h + ':' + m;
    this._ghostAmpm.textContent = ap;
    this._ghostMeta.textContent =
      DAYS[now.getDay()] + '\u00a0\u00b7\u00a0' +
      MON[now.getMonth()] + '\u00a0' + now.getDate();
  };

  RoroSplash.prototype._getWelcome = function () {
    if (this._user && this._user.name) {
      return RETURN_LINES[Math.floor(Math.random() * RETURN_LINES.length)]
        .replace('{n}', this._user.name);
    }
    if (Math.random() > 0.5) {
      return FIRST_LINES[Math.floor(Math.random() * FIRST_LINES.length)];
    }
    var h = new Date().getHours();
    var pool = h < 4  ? CTX.night
             : h < 7  ? CTX.dawn
             : h < 12 ? CTX.morning
             : h < 14 ? CTX.midday
             : h < 18 ? CTX.afternoon
             : h < 21 ? CTX.evening
             :          CTX.latenight;
    return pool[Math.floor(Math.random() * pool.length)];
  };

  RoroSplash.prototype._finish = function () {
    var self    = this;
    var overlay = document.getElementById('transition-overlay');

    window._roroActive = false;
    document.body.style.overflow = ''; /* restore scroll */

    if (overlay) {
      overlay.style.transition      = 'transform 0.4s cubic-bezier(0.76,0,0.24,1)';
      overlay.style.transformOrigin = 'bottom';
      overlay.style.transform       = 'scaleY(1)';

      setTimeout(function () {
        self._cleanup();
        var bgm = document.getElementById('bg-music');
        if (bgm) bgm.play().catch(function () {});
        if (typeof window._roroRunHero === 'function') window._roroRunHero();
        setTimeout(function () {
          overlay.style.transition      = 'transform 0.5s cubic-bezier(0.76,0,0.24,1)';
          overlay.style.transformOrigin = 'top';
          overlay.style.transform       = 'scaleY(0)';
        }, 60);
      }, 420);

    } else {
      self._root.style.transition = 'opacity 0.6s ease';
      self._root.style.opacity    = '0';
      setTimeout(function () {
        self._cleanup();
        var bgm = document.getElementById('bg-music');
        if (bgm) bgm.play().catch(function () {});
        if (typeof window._roroRunHero === 'function') window._roroRunHero();
      }, 650);
    }

    setTimeout(function () {
      HTMLMediaElement.prototype.play = _origPlay;
    }, 500);
  };

  RoroSplash.prototype._cleanup = function () {
    clearInterval(this._clockInt);
    clearInterval(this._factTimer);
    clearInterval(this._msgTimer);
    this._clearFallback();

    try {
      if (this._video) {
        this._video.pause();
        this._video.removeAttribute('src');
        this._video.load();
      }
    } catch (e) {}

    if (this._root && this._root.parentNode) this._root.remove();
    var css = document.getElementById('rs-css');
    if (css) css.remove();

    document.body.style.overflow = ''; /* safety restore */
  };

  /* ═════════════════════════════════════════════════════════════════════
     BOOT
  ═════════════════════════════════════════════════════════════════════ */
  document.addEventListener('DOMContentLoaded', function () {
    var _oh = window.startHeroAnimations;
    window.startHeroAnimations = function () { /* noop during splash */ };
    window._roroRunHero = function () {
      window.startHeroAnimations = _oh;
      if (typeof _oh === 'function') _oh();
    };
    window._roroSplashInstance = new RoroSplash();
  });

  window.initRoroSplash = function () {
    window._roroSplashInstance = new RoroSplash();
  };

})();

/* ═══════════════════════════════════════════════════════════════════════
   TIMING WALKTHROUGH  (v5.0)
   ─────────────────────────────────────────────────────────────────────
   0ms       #roro-cover blankets everything. Splash invisible (opacity 0).
   ~0ms      Video src chosen: pc-intro.mp4 (≥1024px) or mobile-splash.mp4.
   460ms     #roro-cover removed. Splash fully opaque. Video plays.

   [video plays in full, any length]

   on 'ended'  OR error  OR stalled+3s  OR 8s timeout:
     0ms       video.pause(). Video wrap gets .rs-fade-out (0.9s CSS fade).
     420ms     Loader becomes display:flex and gets .rs-show (0.65s fade in).
               _runLoader() starts — clock, terminal, progress, facts, welcome.
     980ms     Video DOM hidden. src cleared. Memory freed.

   LOADING SCREEN
     +250ms    Welcome text fades up.
     +550ms    Facts line appears.
     +200ms    Ghost clock fades in (2.5s transition).
     +4800ms   Progress → 100% → terminal shows "READY."
     +5300ms   CONTINUE button fades in.
     click     Page transition wipes. Music plays. Hero fires.

   FALLBACK CHAIN (priority order)
   1. play() promise rejected  → immediate skip
   2. 'error' event            → immediate skip
   3. 'stalled' + 3s silence   → skip
   4. 8 s absolute timeout     → skip
   5. _transitioned flag       → prevents any double-fire

   VIDEO FILE LOCATIONS (must exist in your repo)
     assets/videos/pc-intro.mp4        ← desktop / laptop (≥1024px)
     assets/videos/mobile-splash.mp4   ← phones + tablets  (<1024px)
═══════════════════════════════════════════════════════════════════════ */
