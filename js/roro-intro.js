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
     § CSS — All styling injected here. Every colour is a CSS
     variable so all four themes work automatically.
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

    /* ── Ghost clock — the jaw-dropper ── */
    /* A massive, almost-invisible time string lives behind everything. */
    /* It updates live. Creates depth and a sense of cinematic scale.  */
    .rs-ghost{
      position:fixed;
      top:50%;left:50%;
      transform:translate(-50%,-53%);
      font-family:var(--ff-display);
      font-size:clamp(11vw,17vw,22vw);
      font-weight:300;
      color:var(--text);
      opacity:0;
      letter-spacing:-0.04em;
      line-height:1;
      white-space:nowrap;
      user-select:none;pointer-events:none;
      z-index:0;
      transition:opacity 2.5s ease;
    }
    .rs-ghost.rs-on{opacity:0.042}

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
    /* Reset the ::before for accent frames */
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

    /* ══ (i) LOGO ══════════════════════════════════════════ */
    .rs-logo{
      font-family:var(--ff-display);
      font-size:clamp(0.7rem,1.6vw,0.95rem);
      font-weight:300;
      letter-spacing:0.7em;
      color:var(--text3);
      text-align:center;
      user-select:none;
      margin-bottom:0.6rem;
      opacity:0;
      animation:rsFadeIn 1.2s ease 0.1s forwards;
    }
    /* Rule below logo */
    .rs-logo-hr{
      width:32px;height:1px;
      background:var(--accent);
      opacity:0;
      margin-bottom:2rem;
      animation:rsFadeIn 1s ease 0.5s forwards;
    }

    /* ══ (ii) WELCOME ══════════════════════════════════════ */
    /* PRE-ALLOCATED — always occupies height, no layout shift */
    .rs-welcome-shell{
      width:100%;
      min-height:4.8rem;
      display:flex;align-items:center;justify-content:center;
      text-align:center;
      margin-bottom:0.65rem;
      position:relative;
    }
    /* Ambient glow behind welcome text */
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

    /* ══ (iii) CONTEXT ════════════════════════════════════ */
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

    /* ══ (iv) CLOCK ═══════════════════════════════════════ */
    .rs-clock-shell{
      min-height:3.8rem;
      display:flex;align-items:center;justify-content:center;
      gap:1.2rem;
      margin-bottom:1.3rem;
      opacity:0;transform:translateY(8px);
      transition:opacity 0.85s ease 0.18s,transform 0.85s ease 0.18s;
    }
    .rs-clock-shell.rs-on{opacity:1;transform:translateY(0)}
    .rs-time-g{display:flex;align-items:flex-start;gap:5px}
    .rs-digits{
      font-family:var(--ff-display);
      font-size:clamp(1.9rem,5.5vw,2.8rem);
      font-weight:300;color:var(--text);
      letter-spacing:-0.03em;line-height:1;
    }
    /* AM/PM — the tiny superscript, NOT huge */
    .rs-ampm{
      font-family:var(--ff-mono);
      font-size:0.48rem;color:var(--text3);
      letter-spacing:0.08em;text-transform:uppercase;
      margin-top:5px;line-height:1;flex-shrink:0;
    }
    .rs-pipe{
      font-family:var(--ff-display);font-size:1.2rem;
      color:var(--accent);opacity:0.25;
      user-select:none;flex-shrink:0;align-self:center;
    }
    .rs-dr{display:flex;flex-direction:column;gap:3px;align-self:center}
    .rs-day{
      font-family:var(--ff-mono);font-size:0.53rem;
      letter-spacing:0.16em;color:var(--text3);
      text-transform:uppercase;line-height:1;
    }
    .rs-date{
      font-family:var(--ff-display);font-size:0.92rem;
      font-weight:300;color:var(--text2);line-height:1;
    }

    /* ══ FACTS LINE — fixed single-line height ════════════ */
    /* Sits between clock and loading bar.                   */
    /* ALWAYS occupies space — never causes layout shift.    */
    .rs-facts-shell{
      width:100%;
      height:20px;         /* fixed — never grows */
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
    /* Accent dot prefix rendered in CSS */
    .rs-fact-txt::before{
      content:'·  ';
      color:var(--accent);
      opacity:0.6;
    }

    /* ══ (v) PROGRESS BAR ════════════════════════════════ */
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

    /* ══ (vi) FLYING LOG TEXT — fixed height ═════════════ */
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

    /* ══ (vii) SCRIPT BUTTON ════════════════════════════ */
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

    /* ══ (viii) CONTINUE — no border-top, no border-bottom ═ */
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
      .rs-ghost{font-size:clamp(14vw,22vw,28vw)}
    }
  `;

  /* ════════════════════════════════════════════════════════════════
     § DATA
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

  /* 40 facts + easter egg hints — all visible during splash */
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

  /* 7-second loading milestones */
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
    /* Duplicate for seamless infinite scroll */
    belt.innerHTML = html + html;
    wrap.appendChild(belt);
    return wrap;
  };

  /* ── Build full DOM ── */
  RoroSplash.prototype._dom = function () {
    var root = document.createElement('div');
    root.id = 'roro-splash';

    root.innerHTML = '<div class="rs-grid"></div>' +
      '<div class="rs-ghost" id="rs-ghost" aria-hidden="true"></div>' +
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
      /* (iv) Clock */
      '<div class="rs-clock-shell" id="rs-clock-shell">' +
        '<div class="rs-time-g"><span class="rs-digits" id="rs-digits"></span><span class="rs-ampm" id="rs-ampm"></span></div>' +
        '<div class="rs-pipe" aria-hidden="true">|</div>' +
        '<div class="rs-dr"><div class="rs-day" id="rs-day"></div><div class="rs-date" id="rs-date"></div></div>' +
      '</div>' +
      /* Facts */
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

    /* Refs */
    this._ghost    = root.querySelector('#rs-ghost');
    this._ws       = root.querySelector('#rs-ws');
    this._welcome  = root.querySelector('#rs-welcome');
    this._ctx      = root.querySelector('#rs-ctx');
    this._clkShell = root.querySelector('#rs-clock-shell');
    this._digits   = root.querySelector('#rs-digits');
    this._ampm     = root.querySelector('#rs-ampm');
    this._day      = root.querySelector('#rs-day');
    this._date     = root.querySelector('#rs-date');
    this._factsS   = root.querySelector('#rs-facts-shell');
    this._factsT   = root.querySelector('#rs-fact-txt');
    this._fill     = root.querySelector('#rs-fill');
    this._track    = root.querySelector('#rs-track');
    this._pct      = root.querySelector('#rs-pct');
    this._logS     = root.querySelector('#rs-log-shell');
    this._scriptB  = root.querySelector('#rs-script-btn');
    this._scriptL  = root.querySelector('#rs-script-log');
    this._cont     = root.querySelector('#rs-continue');
  };

  /* ── Remove the HTML cover div, show splash ── */
  RoroSplash.prototype._revealSplash = function () {
    var self = this;
    /* Remove old loading-screen if present (keep it alive til we're visible) */
    var oldLS = document.getElementById('loading-screen');
    if (oldLS) oldLS.style.cssText = 'display:none!important';

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        /* Show our splash */
        self._root.classList.add('rs-show');
        /* Remove the #roro-cover guard div (added to HTML by user) */
        var cover = document.getElementById('roro-cover');
        if (cover) {
          cover.style.transition = 'opacity 0.3s ease';
          cover.style.opacity = '0';
          setTimeout(function () { if (cover.parentNode) cover.remove(); }, 320);
        }
      });
    });
  };

  /* ── Start all sequences ── */
  RoroSplash.prototype._run = function () {
    var self = this;

    /* Clock starts immediately */
    this._tick();
    this._clockInt = setInterval(function () { self._tick(); }, 1000);

    /* Ghost clock fades in slowly */
    setTimeout(function () { self._ghost.classList.add('rs-on'); }, 200);

    /* Flying messages */
    this._nextMsg();

    /* Facts — visible from start, cycling every 2.4s */
    this._factsT.textContent = FACTS[this._factIdx];
    this._factTimer = setInterval(function () { self._nextFact(); }, 2400);

    /* Progress bar */
    this._progress();

    /* Sequential element reveals — all pre-allocated, zero layout shift */
    setTimeout(function () {
      self._welcome.textContent = self._getWelcome();
      self._welcome.classList.add('rs-on');
      self._ws.classList.add('rs-on');
    }, 300);

    setTimeout(function () {
      self._ctx.textContent = self._getCtx();
      self._ctx.classList.add('rs-on');
    }, 560);

    setTimeout(function () { self._clkShell.classList.add('rs-on'); }, 780);

    setTimeout(function () {
      self._factsS.classList.add('rs-on');
    }, 980);

    /* Events */
    this._scriptB.addEventListener('click', function () { self._toggleLog(); });
    this._cont.addEventListener('click', function () { self._finish(); });
  };

  /* ── Progress milestones ── */
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

  /* ── Cycle flying messages ── */
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

  /* ── Cycle facts ── */
  RoroSplash.prototype._nextFact = function () {
    var self = this;
    this._factsT.classList.add('rs-fade');
    setTimeout(function () {
      self._factIdx = (self._factIdx + 1) % FACTS.length;
      self._factsT.textContent = FACTS[self._factIdx];
      self._factsT.classList.remove('rs-fade');
    }, 100);
  };

  /* ── Load complete ── */
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

  /* ── Toggle log panel ── */
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

  /* ── Continue — uses #transition-overlay same as page switches ── */
  RoroSplash.prototype._finish = function () {
    var self    = this;
    var overlay = document.getElementById('transition-overlay');

    /* Unblock music */
    window._roroActive = false;

    if (overlay) {
      /* EXACT same animation as main.js doTransition() */
      overlay.style.transition      = 'transform 0.4s cubic-bezier(0.76,0,0.24,1)';
      overlay.style.transformOrigin = 'bottom';
      overlay.style.transform       = 'scaleY(1)'; /* cream/theme slides up */

      setTimeout(function () {
        /* Overlay covers screen — safe to remove splash */
        self._cleanup();

        /* Play music */
        var bgm = document.getElementById('bg-music');
        if (bgm) bgm.play().catch(function () {});

        /* Fire hero animations */
        if (typeof window._roroRunHero === 'function') window._roroRunHero();

        /* Slide overlay back up — reveals homepage with hero animating in */
        setTimeout(function () {
          overlay.style.transition      = 'transform 0.5s cubic-bezier(0.76,0,0.24,1)';
          overlay.style.transformOrigin = 'top';
          overlay.style.transform       = 'scaleY(0)';
        }, 60);
      }, 420);

    } else {
      /* Fallback: simple fade */
      self._root.style.transition = 'opacity 0.6s ease';
      self._root.style.opacity    = '0';
      setTimeout(function () {
        self._cleanup();
        var bgm = document.getElementById('bg-music');
        if (bgm) bgm.play().catch(function () {});
        if (typeof window._roroRunHero === 'function') window._roroRunHero();
      }, 650);
    }

    /* Restore native play after transition */
    setTimeout(function () {
      HTMLMediaElement.prototype.play = _origPlay;
    }, 500);
  };

  /* ── Cleanup ── */
  RoroSplash.prototype._cleanup = function () {
    clearInterval(this._clockInt);
    clearInterval(this._factTimer);
    clearTimeout(this._flyTimer);
    if (this._root.parentNode) this._root.remove();
    var css = document.getElementById('rs-css');
    if (css) css.remove();
  };

  /* ── Live clock update ── */
  RoroSplash.prototype._tick = function () {
    var now  = new Date();
    var h    = now.getHours();
    var m    = String(now.getMinutes()).padStart(2, '0');
    var ap   = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    var DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    var MON  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    this._digits.textContent = h + ':' + m;
    this._ampm.textContent   = ap;
    this._day.textContent    = DAYS[now.getDay()];
    this._date.textContent   = MON[now.getMonth()] + ' ' + now.getDate();
    this._ghost.textContent  = h + ':' + m;
  };

  /* ── Content generators ── */
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
     § BOOT — DOMContentLoaded fires after all scripts run.
       At this point main.js has already defined startHeroAnimations
       so we can safely wrap it to defer it until Continue is clicked.
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
   WHAT TO CHANGE IN OTHER FILES:
   ─────────────────────────────────────────────────────────────
   index.html — THREE changes:

   ① In <head>, add before </head>:
       <style>body{visibility:hidden}</style>

   ② As VERY FIRST child of <body> (before anything else):
       <div id="roro-cover" style="position:fixed;inset:0;z-index:9999999;background:var(--bg,#080808)"></div>

   ③ DELETE the old loading screen:
       <div id="loading-screen">...</div>

   ④ Add before <script src="js/main.js">:
       <script src="js/roro-intro.js"></script>

   WHY THIS FIXES THE HOMEPAGE FLASH:
   ─────────────────────────────────────────────────────────────
   #roro-cover is a raw HTML div — no JS needed for it to exist.
   It's in the browser's VERY FIRST PAINT before any script runs.
   body{visibility:hidden} in <head> is also applied pre-script.
   Together they guarantee the homepage is never exposed.
   My JS removes both once the splash is visible.
   ═══════════════════════════════════════════════════════════════
*/
