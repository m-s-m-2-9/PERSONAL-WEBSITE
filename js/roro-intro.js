/* ═══════════════════════════════════════════════════════════
   js/roro-intro.js  ·  MSM Cinematic Splash  ·  FINAL
   ─────────────────────────────────────────────────────────
   ⚠  Before this works you MUST also:
   ①  In <head> of index.html, add:   <style>body{visibility:hidden}</style>
   ②  As first child of <body>, add:   <div id="roro-cover" style="position:fixed;inset:0;z-index:9999999;background:var(--bg,#080808)"></div>
   ③  Add before main.js script tag:  <script src="js/roro-intro.js"></script>
   ④  Delete the old <div id="loading-screen">...</div> from index.html
═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── STEP 1: Unhide body (was set visibility:hidden in <head>) ── */
  /* The #roro-cover div (hardcoded first child of body) is already   */
  /* painted and covering everything. We just restore body visibility. */
  document.body.style.visibility = 'visible';

  /* ── STEP 2: Music guard ────────────────────────────────────────── */
  /* main.js adds mousemove/click/scroll listeners that call           */
  /* tryStartBgMusic(). We intercept play() itself so music only       */
  /* starts when the user explicitly clicks CONTINUE.                  */
  window._roroActive = true;
  var _origPlay = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () {
    if (window._roroActive && (this.id === 'bg-music' || this.id === 'rain-song')) {
      return Promise.resolve();
    }
    return _origPlay.apply(this, arguments);
  };

  /* ════════════════════════════════════════════════════════════════
     § CSS
     CHANGES:
     - .rs-logo  → accent colour, font-weight 700, glow/shadow
     - .rs-ghost → restructured as flex column for time + meta lines
     - .rs-ghost-time / .rs-ghost-meta → new sub-elements
     - .rs-clock-shell and children → REMOVED (clock lives in ghost only)
  ════════════════════════════════════════════════════════════════ */
  var CSS = `
    /* ── Cursor always on top ── */
    #cursor-dot,#cursor-ring{z-index:9999999!important}

    /* ── Root ── */
    #roro-splash{
      position:fixed;inset:0;z-index:999998;
      background:var(--bg);
      display:flex;align-items:center;justify-content:center;
      overflow:hidden;
      opacity:0;transition:opacity 0.4s ease;
    }
    #roro-splash.rs-show{opacity:1}

    /* ── Grid overlay (matches hero) ── */
    .rs-grid{
      position:absolute;inset:0;
      background-image:
        linear-gradient(var(--border) 1px,transparent 1px),
        linear-gradient(90deg,var(--border) 1px,transparent 1px);
      background-size:60px 60px;
      -webkit-mask-image:radial-gradient(ellipse 80% 65% at 50% 50%,black 5%,transparent 100%);
      mask-image:radial-gradient(ellipse 80% 65% at 50% 50%,black 5%,transparent 100%);
      pointer-events:none;z-index:0;
    }

    /* ── Grain ── */
    #roro-splash::before{
      content:'';position:absolute;inset:0;
      background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.018'/%3E%3C/svg%3E");
      opacity:0.5;pointer-events:none;z-index:0;
    }

    /* ── Ghost clock — now shows FULL time + day + date as layered ghost ── */
    /* Two child spans: rs-ghost-time (huge) and rs-ghost-meta (small below) */
    .rs-ghost{
      position:fixed;
      top:50%;left:50%;
      transform:translate(-50%,-52%);
      display:flex;
      flex-direction:column;
      align-items:center;
      gap:0.5rem;
      opacity:0;
      user-select:none;pointer-events:none;
      z-index:0;
      transition:opacity 2.5s ease;
    }
    .rs-ghost.rs-on{opacity:0.042}

    /* The big clock numerals — same massive feel as before */
    .rs-ghost-time{
      font-family:var(--ff-display);
      font-size:clamp(14vw,20vw,26vw);
      font-weight:300;
      color:var(--text);
      letter-spacing:-0.04em;
      line-height:1;
      white-space:nowrap;
    }

    /* Day · Month Date in small monospaced ghost text below the digits */
    .rs-ghost-meta{
      font-family:var(--ff-mono);
      font-size:clamp(1.4vw,2.2vw,3vw);
      font-weight:400;
      color:var(--text);
      letter-spacing:0.38em;
      text-transform:uppercase;
      white-space:nowrap;
      line-height:1;
    }

    /* ── Scan line — subtle CRT sweep ── */
    .rs-scan{
      position:fixed;left:0;right:0;
      height:120px;
      background:linear-gradient(
        to bottom,
        transparent 0%,
        rgba(255,255,255,0.012) 40%,
        rgba(255,255,255,0.018) 50%,
        rgba(255,255,255,0.012) 60%,
        transparent 100%
      );
      animation:rsScan 9s linear infinite;
      pointer-events:none;z-index:1;
      top:-120px;
    }
    @keyframes rsScan{0%{top:-120px}100%{top:100vh}}

    /* ── Film strips — cinematic framing ── */
    .rs-film{
      position:absolute;top:-30px;bottom:-30px;
      width:28px;overflow:hidden;
      pointer-events:none;
      opacity:0;
      animation:rsFilmIn 1.5s ease 0.3s forwards;
      z-index:1;
    }
    @keyframes rsFilmIn{to{opacity:1}}
    .rs-film--l{left:clamp(8px,3vw,40px)}
    .rs-film--r{right:clamp(8px,3vw,40px)}
    .rs-belt{
      display:flex;flex-direction:column;
      gap:6px;padding:6px 0;
    }
    .rs-film--l .rs-belt{animation:rsUp   28s linear infinite}
    .rs-film--r .rs-belt{animation:rsDown 28s linear infinite}
    @keyframes rsUp  {from{transform:translateY(0)}   to{transform:translateY(-50%)}}
    @keyframes rsDown{from{transform:translateY(-50%)} to{transform:translateY(0)}}
    .rs-frame{
      width:28px;height:18px;
      border:1px solid var(--border2);
      border-radius:2px;flex-shrink:0;
      opacity:0.22;position:relative;
    }
    .rs-frame::before,.rs-frame::after{
      content:'';position:absolute;
      width:4px;height:4px;border-radius:1px;
      background:var(--bg);
      border:1px solid var(--border2);
      top:50%;transform:translateY(-50%);
    }
    .rs-frame::before{left:2px}
    .rs-frame::after{right:2px}
    .rs-frame.rs-f-accent{
      opacity:0.5;
      border-color:var(--accent);
    }
    .rs-frame.rs-f-accent::after{
      content:'';
      position:absolute;
      inset:3px;
      background:var(--accent);
      opacity:0.1;
      border-radius:1px;
      top:auto;transform:none;
      width:auto;height:auto;
      border:none;left:3px;right:3px;
    }
    .rs-frame.rs-f-accent::before{
      display:block;
    }

    /* ── Inner column ── */
    .rs-inner{
      position:relative;z-index:2;
      width:100%;max-width:520px;
      padding:0 3rem;
      display:flex;flex-direction:column;
      align-items:center;
    }

    /* ── Keyframes ── */
    @keyframes rsFadeUp{
      from{opacity:0;transform:translateY(14px)}
      to{opacity:1;transform:translateY(0)}
    }
    @keyframes rsFadeIn{from{opacity:0}to{opacity:1}}

    /* ══ (i) LOGO — BOLD, BRIGHT, COMMANDING ══════════════════════ */
    /* This is the first thing eyes land on. Make it impossible to miss. */
    .rs-logo{
      font-family:var(--ff-display);
      font-size:clamp(1.05rem,2.4vw,1.5rem);
      font-weight:700;
      letter-spacing:0.75em;
      color:var(--accent);
      text-align:center;
      user-select:none;
      margin-bottom:0.55rem;
      opacity:0;
      animation:rsFadeIn 1.2s ease 0.1s forwards;
      text-shadow:
        0 0 18px var(--accent),
        0 0 48px rgba(200,169,110,0.22),
        0 0 90px rgba(200,169,110,0.08);
    }
    /* Accent rule below logo — slightly thicker and glowing */
    .rs-logo-hr{
      width:44px;height:1px;
      background:var(--accent);
      opacity:0;
      margin-bottom:2.2rem;
      box-shadow:0 0 8px var(--accent),0 0 20px rgba(200,169,110,0.3);
      animation:rsFadeIn 1s ease 0.5s forwards;
    }

    /* ══ (ii) WELCOME ══════════════════════════════════════════════ */
    .rs-welcome-shell{
      width:100%;
      min-height:4.8rem;
      display:flex;align-items:center;justify-content:center;
      text-align:center;
      margin-bottom:0.65rem;
      position:relative;
    }
    .rs-welcome-shell::before{
      content:'';
      position:absolute;
      top:50%;left:50%;
      transform:translate(-50%,-50%);
      width:340px;height:160px;
      background:radial-gradient(ellipse,rgba(200,169,110,0.055) 0%,transparent 70%);
      pointer-events:none;
      opacity:0;
      transition:opacity 1.4s ease;
    }
    .rs-welcome-shell.rs-on::before{opacity:1}
    .rs-welcome{
      font-family:var(--ff-display);
      font-size:clamp(2.1rem,6vw,3.4rem);
      font-weight:400;font-style:italic;
      color:var(--text);line-height:1.18;
      opacity:0;transform:translateY(14px);
      transition:opacity 1.1s cubic-bezier(0.16,1,0.3,1),transform 1.1s cubic-bezier(0.16,1,0.3,1);
    }
    .rs-welcome.rs-on{opacity:1;transform:translateY(0)}

    /* ══ (iii) CONTEXT ═════════════════════════════════════════════ */
    .rs-ctx-shell{
      width:100%;
      min-height:1.6rem;
      display:flex;align-items:center;justify-content:center;
      margin-bottom:1.9rem;
    }
    .rs-ctx{
      font-family:var(--ff-mono);
      font-size:0.65rem;font-weight:500;
      letter-spacing:0.24em;text-transform:uppercase;
      color:var(--text2);text-align:center;
      opacity:0;transform:translateY(8px);
      transition:opacity 0.9s ease 0.1s,transform 0.9s ease 0.1s;
    }
    .rs-ctx.rs-on{opacity:1;transform:translateY(0)}

    /* ══ FACTS LINE — fixed single-line height ═════════════════════ */
    .rs-facts-shell{
      width:100%;
      height:20px;
      overflow:hidden;
      margin-bottom:1.4rem;
      opacity:0;
      transition:opacity 0.8s ease 0.3s;
    }
    .rs-facts-shell.rs-on{opacity:1}
    .rs-fact-txt{
      font-family:var(--ff-mono);
      font-size:0.57rem;
      color:var(--text3);
      letter-spacing:0.07em;
      line-height:20px;
      text-align:center;
      white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
      opacity:1;
      transition:opacity 0.09s ease;
    }
    .rs-fact-txt.rs-fade{opacity:0}
    .rs-fact-txt::before{
      content:'·  ';
      color:var(--accent);
      opacity:0.6;
    }

    /* ══ (v) PROGRESS BAR ══════════════════════════════════════════ */
    .rs-bar-shell{
      width:100%;margin-bottom:0.5rem;
      opacity:0;animation:rsFadeIn 0.5s ease 0.25s forwards;
    }
    .rs-bar-row{display:flex;align-items:center;gap:10px}
    .rs-track{
      flex:1;height:1px;background:var(--border2);
      position:relative;overflow:hidden;
    }
    .rs-fill{
      position:absolute;top:0;left:0;bottom:0;
      width:0%;background:var(--accent);
      transition:width 0.38s cubic-bezier(0.4,0,0.2,1);
    }
    .rs-fill::after{
      content:'';position:absolute;
      top:0;bottom:0;right:-60px;width:60px;
      background:linear-gradient(90deg,transparent,rgba(255,255,255,0.38),transparent);
      animation:rsShimmer 2s ease-in-out infinite;
    }
    @keyframes rsShimmer{0%,100%{opacity:0}50%{opacity:1}}
    .rs-pct{
      font-family:var(--ff-mono);font-size:0.54rem;
      color:var(--text3);letter-spacing:0.06em;
      min-width:3.5ch;text-align:right;flex-shrink:0;
    }

    /* ══ (vi) FLYING LOG TEXT — fixed height ═══════════════════════ */
    .rs-log-shell{
      width:100%;height:20px;overflow:hidden;
      position:relative;margin-bottom:1.3rem;
      opacity:0;animation:rsFadeIn 0.4s ease 0.35s forwards;
    }
    .rs-fly{
      position:absolute;inset:0;
      display:flex;align-items:center;justify-content:center;
      font-family:var(--ff-mono);font-size:0.59rem;
      letter-spacing:0.07em;color:var(--text3);
      white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
      pointer-events:none;
    }
    .rs-fly.rs-fi{animation:rsFlyIn  0.14s cubic-bezier(0.16,1,0.3,1) forwards}
    .rs-fly.rs-fo{animation:rsFlyOut 0.14s cubic-bezier(0.76,0,0.24,1) forwards}
    @keyframes rsFlyIn {from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}
    @keyframes rsFlyOut{from{transform:translateY(0);opacity:1}to{transform:translateY(-100%);opacity:0}}

    /* ══ (vii) SCRIPT BUTTON ════════════════════════════════════════ */
    .rs-script-shell{
      width:100%;display:flex;flex-direction:column;
      align-items:center;margin-bottom:1.1rem;
    }
    .rs-script-btn{
      display:none;
      align-items:center;gap:8px;
      background:none;
      border:1px solid var(--border2);border-radius:3px;
      padding:5px 16px 5px 11px;
      font-family:var(--ff-mono);font-size:0.57rem;
      letter-spacing:0.2em;color:var(--text3);
      text-transform:uppercase;cursor:pointer;outline:none;
      transition:border-color 0.25s,color 0.25s,background 0.25s;
      user-select:none;
    }
    .rs-script-btn.rs-show{display:flex;animation:rsFadeUp 0.4s ease forwards}
    .rs-script-btn:hover{border-color:var(--accent);color:var(--accent);background:rgba(200,169,110,0.04)}
    .rs-sdot{
      width:5px;height:5px;border-radius:50%;
      background:var(--accent);opacity:0.65;flex-shrink:0;
      animation:rsDot 1.8s ease-in-out infinite;
    }
    @keyframes rsDot{0%,100%{opacity:0.3;transform:scale(1)}50%{opacity:1;transform:scale(1.35)}}
    .rs-script-log{
      display:none;width:100%;margin-top:8px;
      background:var(--bg3);border:1px solid var(--border);
      border-radius:3px;padding:10px 14px;
      max-height:96px;overflow-y:auto;
      scrollbar-width:thin;scrollbar-color:var(--border2) transparent;
    }
    .rs-script-log::-webkit-scrollbar{width:2px}
    .rs-script-log::-webkit-scrollbar-thumb{background:var(--border2);border-radius:1px}
    .rs-script-log.rs-open{display:block;animation:rsFadeUp 0.22s ease forwards}
    .rs-entry{
      font-family:var(--ff-mono);font-size:0.52rem;
      color:var(--text3);letter-spacing:0.04em;
      padding:2px 0;line-height:1.8;opacity:0.78;
    }
    .rs-entry::before{content:'▸  ';color:var(--accent);opacity:0.5}

    /* ══ (viii) CONTINUE ════════════════════════════════════════════ */
    .rs-continue{
      width:100%;background:none;border:none;
      color:var(--text3);
      font-family:var(--ff-mono);font-size:0.63rem;
      letter-spacing:0.32em;text-transform:uppercase;
      padding:13px 0;cursor:pointer;
      display:flex;align-items:center;justify-content:center;
      opacity:0;pointer-events:none;outline:none;
      transform:translateY(8px);
      transition:opacity 0.75s ease,transform 0.75s cubic-bezier(0.16,1,0.3,1),color 0.3s ease;
    }
    .rs-continue.rs-show{opacity:1;pointer-events:all;transform:translateY(0)}
    .rs-continue:hover{color:var(--text)}
    .rs-continue:hover .rs-dash{background:var(--accent);opacity:0.4}
    .rs-dash{flex:1;height:1px;background:var(--border2);max-width:80px;transition:background 0.3s,opacity 0.3s}
    .rs-cword{padding:0 16px;flex-shrink:0}

    /* ── Mobile ── */
    @media(max-width:540px){
      .rs-inner{padding:0 1.4rem}
      .rs-film--l,.rs-film--r{display:none}
      .rs-ghost-time{font-size:clamp(17vw,24vw,30vw)}
      .rs-ghost-meta{font-size:clamp(2.2vw,3.5vw,4.5vw)}
    }
  `;

  /* ════════════════════════════════════════════════════════════════
     § DATA — unchanged
  ════════════════════════════════════════════════════════════════ */
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
    [0,0],[500,7],[1000,16],[1600,29],[2300,43],
    [3100,57],[3900,68],[4700,78],[5400,87],[6000,93],[6600,97],[7000,100]
  ];

  /* ════════════════════════════════════════════════════════════════
     § RoroSplash — the main class
  ════════════════════════════════════════════════════════════════ */
  function RoroSplash() {
    this._user      = this._readUser();
    this._msgIdx    = Math.floor(Math.random() * MSGS.length);
    this._factIdx   = Math.floor(Math.random() * FACTS.length);
    this._log       = [];
    this._flyTimer  = null;
    this._factTimer = null;
    this._clockInt  = null;
    this._isDone    = false;
    this._logOpen   = false;

    this._injectCSS();
    this._dom();
    this._revealSplash();
    this._run();
  }

  /* ── Read localStorage ── */
  RoroSplash.prototype._readUser = function () {
    try { return JSON.parse(localStorage.getItem('roroUser') || 'null'); }
    catch (e) { return null; }
  };

  /* ── Inject CSS ── */
  RoroSplash.prototype._injectCSS = function () {
    if (document.getElementById('rs-css')) return;
    var s = document.createElement('style');
    s.id = 'rs-css'; s.textContent = CSS;
    document.head.appendChild(s);
  };

  /* ── Build film strip ── */
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

  /* ── Build full DOM ──
     CHANGE: Ghost now has two child spans (time + meta).
             Clock shell with visible time/day/date is REMOVED entirely.
             Order: logo → hr → welcome → context → facts → bar → log → script → continue
  ── */
  RoroSplash.prototype._dom = function () {
    var root = document.createElement('div');
    root.id = 'roro-splash';

    /* Ghost has two spans: big time, small meta (AM/PM · DAY · MONTH DATE) */
    root.innerHTML = '<div class="rs-grid"></div>' +
      '<div class="rs-ghost" id="rs-ghost" aria-hidden="true">' +
        '<span class="rs-ghost-time" id="rs-ghost-time"></span>' +
        '<span class="rs-ghost-meta" id="rs-ghost-meta"></span>' +
      '</div>' +
      '<div class="rs-scan" aria-hidden="true"></div>';

    root.appendChild(this._strip('l'));
    root.appendChild(this._strip('r'));

    var inner = document.createElement('div');
    inner.className = 'rs-inner';
    inner.innerHTML =
      /* (i) Logo */
      '<div class="rs-logo" aria-label="MSM">M\u2009\u00b7\u2009S\u2009\u00b7\u2009M</div>' +
      '<div class="rs-logo-hr" aria-hidden="true"></div>' +
      /* (ii) Welcome */
      '<div class="rs-welcome-shell" id="rs-ws"><div class="rs-welcome" id="rs-welcome"></div></div>' +
      /* (iii) Context */
      '<div class="rs-ctx-shell"><div class="rs-ctx" id="rs-ctx"></div></div>' +
      /* Facts — no clock between context and facts anymore */
      '<div class="rs-facts-shell" id="rs-facts-shell"><div class="rs-fact-txt" id="rs-fact-txt"></div></div>' +
      /* (v) Bar */
      '<div class="rs-bar-shell">' +
        '<div class="rs-bar-row">' +
          '<div class="rs-track" id="rs-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="rs-fill" id="rs-fill"></div></div>' +
          '<div class="rs-pct" id="rs-pct">0%</div>' +
        '</div>' +
      '</div>' +
      /* (vi) Flying log text */
      '<div class="rs-log-shell" id="rs-log-shell" aria-hidden="true"></div>' +
      /* (vii) Script */
      '<div class="rs-script-shell">' +
        '<button class="rs-script-btn" id="rs-script-btn" type="button" aria-expanded="false">' +
          '<span class="rs-sdot" aria-hidden="true"></span><span>SCRIPT</span>' +
        '</button>' +
        '<div class="rs-script-log" id="rs-script-log" role="log"></div>' +
      '</div>' +
      /* (viii) Continue */
      '<button class="rs-continue" id="rs-continue" type="button" aria-label="Enter site">' +
        '<span class="rs-dash" aria-hidden="true"></span>' +
        '<span class="rs-cword">CONTINUE</span>' +
        '<span class="rs-dash" aria-hidden="true"></span>' +
      '</button>';

    root.appendChild(inner);
    document.body.appendChild(root);
    this._root = root;

    /* Refs — ghost now has time + meta sub-elements */
    this._ghost     = root.querySelector('#rs-ghost');
    this._ghostTime = root.querySelector('#rs-ghost-time');
    this._ghostMeta = root.querySelector('#rs-ghost-meta');
    this._ws        = root.querySelector('#rs-ws');
    this._welcome   = root.querySelector('#rs-welcome');
    this._ctx       = root.querySelector('#rs-ctx');
    this._factsS    = root.querySelector('#rs-facts-shell');
    this._factsT    = root.querySelector('#rs-fact-txt');
    this._fill      = root.querySelector('#rs-fill');
    this._track     = root.querySelector('#rs-track');
    this._pct       = root.querySelector('#rs-pct');
    this._logS      = root.querySelector('#rs-log-shell');
    this._scriptB   = root.querySelector('#rs-script-btn');
    this._scriptL   = root.querySelector('#rs-script-log');
    this._cont      = root.querySelector('#rs-continue');
  };

  /* ── Remove the HTML cover div, show splash ──
     CHANGE: Cover is removed AFTER the splash opacity transition fully
             completes (460ms), not simultaneously. This eliminates the
             brief window where both are transparent and the homepage shows.
  ── */
  RoroSplash.prototype._revealSplash = function () {
    var self = this;
    var oldLS = document.getElementById('loading-screen');
    if (oldLS) oldLS.style.cssText = 'display:none!important';

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        /* Start splash fade-in (0.4s transition) */
        self._root.classList.add('rs-show');

        var cover = document.getElementById('roro-cover');
        if (cover) {
          /* Wait until splash is fully opaque (0.4s + 60ms buffer),
             then remove the cover instantly — no cross-fade overlap,
             no flash of homepage underneath. */
          setTimeout(function () {
            if (cover.parentNode) cover.remove();
          }, 460);
        }
      });
    });
  };

  /* ── Start all sequences ──
     CHANGE: Removed the clock shell reveal (setTimeout at 780ms).
             Facts shell now reveals at 780ms (filled the freed slot).
             All other logic is identical.
  ── */
  RoroSplash.prototype._run = function () {
    var self = this;

    /* Clock ticks immediately — updates ghost only now */
    this._tick();
    this._clockInt = setInterval(function () { self._tick(); }, 1000);

    /* Ghost fades in slowly */
    setTimeout(function () { self._ghost.classList.add('rs-on'); }, 200);

    /* Flying messages */
    this._nextMsg();

    /* Facts — visible from start, cycling every 2.4s */
    this._factsT.textContent = FACTS[this._factIdx];
    this._factTimer = setInterval(function () { self._nextFact(); }, 2400);

    /* Progress bar */
    this._progress();

    /* Sequential element reveals */
    setTimeout(function () {
      self._welcome.textContent = self._getWelcome();
      self._welcome.classList.add('rs-on');
      self._ws.classList.add('rs-on');
    }, 300);

    setTimeout(function () {
      self._ctx.textContent = self._getCtx();
      self._ctx.classList.add('rs-on');
    }, 560);

    /* Clock shell reveal removed — ghost handles all time display now */
    /* Facts slide in at 780ms (previously 980ms), filling the freed slot */
    setTimeout(function () {
      self._factsS.classList.add('rs-on');
    }, 780);

    /* Events */
    this._scriptB.addEventListener('click', function () { self._toggleLog(); });
    this._cont.addEventListener('click', function () { self._finish(); });
  };

  /* ── Progress milestones — unchanged ── */
  RoroSplash.prototype._progress = function () {
    var self = this;
    MILESTONES.forEach(function (m) {
      setTimeout(function () {
        self._fill.style.width = m[1] + '%';
        self._pct.textContent  = m[1] + '%';
        self._track.setAttribute('aria-valuenow', m[1]);
        if (m[1] === 100) setTimeout(function () { self._done(); }, 300);
      }, m[0]);
    });
  };

  /* ── Cycle flying messages — unchanged ── */
  RoroSplash.prototype._nextMsg = function () {
    if (this._isDone) return;
    var self = this;
    var text = MSGS[this._msgIdx % MSGS.length];
    this._msgIdx++;
    this._log.push(text);
    this._showFly(text);
    this._flyTimer = setTimeout(function () { self._nextMsg(); }, 700);
  };

  RoroSplash.prototype._showFly = function (text) {
    var self = this;
    var el = document.createElement('div');
    el.className = 'rs-fly'; el.textContent = text;
    this._logS.appendChild(el);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { el.classList.add('rs-fi'); });
    });
    setTimeout(function () {
      el.classList.remove('rs-fi'); el.classList.add('rs-fo');
      setTimeout(function () { if (el.parentNode) el.remove(); }, 150);
    }, 550);
  };

  RoroSplash.prototype._stopFly = function () {
    this._isDone = true;
    clearTimeout(this._flyTimer);
    this._logS.querySelectorAll('.rs-fly').forEach(function (el) {
      el.classList.add('rs-fo');
      setTimeout(function () { if (el.parentNode) el.remove(); }, 150);
    });
  };

  /* ── Cycle facts — unchanged ── */
  RoroSplash.prototype._nextFact = function () {
    var self = this;
    this._factsT.classList.add('rs-fade');
    setTimeout(function () {
      self._factIdx = (self._factIdx + 1) % FACTS.length;
      self._factsT.textContent = FACTS[self._factIdx];
      self._factsT.classList.remove('rs-fade');
    }, 100);
  };

  /* ── Load complete — unchanged ── */
  RoroSplash.prototype._done = function () {
    var self = this;
    this._stopFly();
    this._logS.style.transition = 'opacity 0.28s ease';
    this._logS.style.opacity = '0';
    setTimeout(function () {
      self._logS.style.display = 'none';
      self._scriptB.classList.add('rs-show');
    }, 300);
    setTimeout(function () { self._cont.classList.add('rs-show'); }, 1900);
  };

  /* ── Toggle log panel — unchanged ── */
  RoroSplash.prototype._toggleLog = function () {
    this._logOpen = !this._logOpen;
    if (this._logOpen) {
      var frag = document.createDocumentFragment();
      this._log.forEach(function (line) {
        var d = document.createElement('div');
        d.className = 'rs-entry'; d.textContent = line;
        frag.appendChild(d);
      });
      this._scriptL.innerHTML = ''; this._scriptL.appendChild(frag);
      this._scriptL.classList.add('rs-open');
      this._scriptB.setAttribute('aria-expanded', 'true');
    } else {
      this._scriptL.classList.remove('rs-open');
      this._scriptB.setAttribute('aria-expanded', 'false');
      var l = this._scriptL;
      setTimeout(function () { l.innerHTML = ''; }, 250);
    }
  };

  /* ── Continue — unchanged ── */
  RoroSplash.prototype._finish = function () {
    var self    = this;
    var overlay = document.getElementById('transition-overlay');

    window._roroActive = false;

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

  /* ── Cleanup — unchanged ── */
  RoroSplash.prototype._cleanup = function () {
    clearInterval(this._clockInt);
    clearInterval(this._factTimer);
    clearTimeout(this._flyTimer);
    if (this._root.parentNode) this._root.remove();
    var css = document.getElementById('rs-css');
    if (css) css.remove();
  };

  /* ── Live clock update ──
     CHANGE: Now updates the ghost sub-elements (ghostTime + ghostMeta)
             instead of the removed visible clock elements.
             ghostTime → "2:57"  (huge ghost)
             ghostMeta → "PM · TUESDAY · MAY 12"  (small ghost below)
  ── */
  RoroSplash.prototype._tick = function () {
    var now  = new Date();
    var h    = now.getHours();
    var m    = String(now.getMinutes()).padStart(2, '0');
    var ap   = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    var DAYS = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];
    var MON  = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

    /* Big ghost numerals — just the time, clean */
    this._ghostTime.textContent = h + ':' + m;

    /* Ghost meta line — AM/PM · DAY · MONTH DATE */
    this._ghostMeta.textContent =
      ap + '\u00a0\u00b7\u00a0' +
      DAYS[now.getDay()] + '\u00a0\u00b7\u00a0' +
      MON[now.getMonth()] + '\u00a0' + now.getDate();
  };

  /* ── Content generators — unchanged ── */
  RoroSplash.prototype._getWelcome = function () {
    if (this._user && this._user.name) {
      return RETURN_LINES[Math.floor(Math.random() * RETURN_LINES.length)]
        .replace('{n}', this._user.name);
    }
    return FIRST_LINES[Math.floor(Math.random() * FIRST_LINES.length)];
  };

  RoroSplash.prototype._getCtx = function () {
    var h = new Date().getHours();
    var pool = h < 4  ? CTX.night :
               h < 7  ? CTX.dawn  :
               h < 12 ? CTX.morning :
               h < 14 ? CTX.midday :
               h < 18 ? CTX.afternoon :
               h < 21 ? CTX.evening : CTX.latenight;
    return pool[Math.floor(Math.random() * pool.length)];
  };

  /* ════════════════════════════════════════════════════════════════
     § BOOT — unchanged
  ════════════════════════════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════════════════════════
   YOUR index.html NEEDS THESE — verify all 4 are present:

   ① In <head>, before </head>:
       <style>body{visibility:hidden}</style>

   ② VERY FIRST child of <body> (before cursor divs, before nav, before everything):
       <div id="roro-cover" style="position:fixed;inset:0;z-index:9999999;background:var(--bg,#080808)"></div>

   ③ DELETE the old loading screen div entirely:
       <div id="loading-screen">...</div>  ← remove this

   ④ Script tag order — roro-intro.js MUST come before main.js:
       <script src="js/roro-intro.js"></script>
       <script src="js/main.js"></script>

   Looking at your current index.html — all 4 are already done correctly.
   The homepage flash fix is handled by removing #roro-cover AFTER the
   splash opacity transition finishes (460ms), not simultaneously.
   ═══════════════════════════════════════════════════════════════ */
