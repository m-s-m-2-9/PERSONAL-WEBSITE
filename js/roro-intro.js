/* ═══════════════════════════════════════════════════════════
   js/roro-intro.js  ·  MSM Cinematic Experience  ·  v3.0
   ─────────────────────────────────────────────────────────
   PHASE 1 — Movie Intro: M · S · M expands into Manomay Shailendra Misra
   PHASE 2 — Loading Screen: context/welcome, facts, bar, terminal, continue
   ─────────────────────────────────────────────────────────
   index.html needs (all already present in your file):
   ① <style>body{visibility:hidden}</style>  in <head>
   ② <div id="roro-cover" ...>  as first child of <body>
   ③ <script src="js/roro-intro.js"></script>  before main.js
   ④ Old loading-screen div deleted
═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── Step 1: restore body visibility ── */
  document.body.style.visibility = 'visible';

  /* ── Step 2: music guard — blocks bg-music/rain-song until CONTINUE ── */
  window._roroActive = true;
  var _origPlay = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () {
    if (window._roroActive && (this.id === 'bg-music' || this.id === 'rain-song')) {
      return Promise.resolve();
    }
    return _origPlay.apply(this, arguments);
  };

  /* ════════════════════════════════════════════════════════════════
   PHASE 1 — CINEMATIC NAME REVEAL
════════════════════════════════════════ */

const introStyles = `
<style>

/* MAIN INTRO */

#rs-intro{
  position:absolute;
  inset:0;
  display:flex;
  align-items:center;
  justify-content:center;
  z-index:10;
  opacity:0;
  transition:opacity .7s ease;
}

#rs-intro.rs-show{
  opacity:1;
}

#rs-intro.rs-out{
  opacity:0;
  pointer-events:none;
}

/* GRID */

.rs-intro-grid{
  position:absolute;
  inset:0;

  background-image:
    linear-gradient(var(--border) 1px, transparent 1px),
    linear-gradient(90deg, var(--border) 1px, transparent 1px);

  background-size:60px 60px;

  -webkit-mask-image:radial-gradient(
    ellipse 85% 70% at 50% 50%,
    black 10%,
    transparent 100%
  );

  mask-image:radial-gradient(
    ellipse 85% 70% at 50% 50%,
    black 10%,
    transparent 100%
  );

  opacity:0;
  transition:opacity 1.4s ease .3s;
}

#rs-intro.rs-show .rs-intro-grid{
  opacity:1;
}

/* GRAIN */

.rs-intro-grain{
  position:absolute;
  inset:0;
  pointer-events:none;

  background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.018'/%3E%3C/svg%3E");

  opacity:.45;
}

/* STAGE */

.rs-intro-stage{
  position:relative;
  z-index:2;

  display:flex;
  flex-direction:column;
  align-items:center;
}

/* TOP LINE */

#rs-intro-line{
  width:0;
  height:1px;

  background:var(--accent);

  box-shadow:
    0 0 14px var(--accent),
    0 0 35px rgba(200,169,110,.28);

  margin-bottom:2.8rem;

  opacity:0;

  transition:
    width .7s cubic-bezier(.4,0,.2,1),
    opacity .3s ease;
}

#rs-intro-line.rs-draw{
  width:clamp(60px,11vw,110px);
  opacity:1;
}

/* NAME WRAP */

.rs-intro-name-wrap{
  position:relative;

  display:flex;
  align-items:center;
  justify-content:center;

  min-height:clamp(110px,14vw,170px);
}

/* MSM */

#rs-intro-initials{
  position:absolute;

  display:flex;
  align-items:center;
  gap:clamp(.8rem,2.5vw,1.8rem);

  opacity:0;

  transform:
    translateY(24px)
    scale(.94);

  transition:
    opacity .75s ease,
    transform .75s cubic-bezier(.16,1,.3,1),
    gap .8s cubic-bezier(.16,1,.3,1);
}

#rs-intro-initials.rs-on{
  opacity:1;

  transform:
    translateY(0)
    scale(1);
}

#rs-intro-initials.rs-expand{
  gap:0;
}

/* INITIAL LETTERS */

.rs-intro-letter{
  position:relative;

  font-family:var(--ff-display);
  font-size:clamp(5rem,12vw,10rem);
  font-style:italic;
  font-weight:300;
  line-height:1;

  color:var(--accent);

  text-shadow:
    0 0 10px rgba(200,169,110,.12),
    0 0 28px rgba(200,169,110,.08);

  transition:all .8s cubic-bezier(.16,1,.3,1);
}

/* DOTS */

.rs-intro-dot{
  font-family:var(--ff-display);
  font-size:clamp(2rem,5vw,4rem);

  color:var(--text3);

  opacity:.24;

  transition:
    opacity .45s ease,
    transform .45s ease;
}

#rs-intro-initials.rs-expand .rs-intro-dot{
  opacity:0;
  transform:scale(0);
}

/* FULL NAME */

/* ── FULL NAME INLINE CINEMATIC REVEAL ── */

#rs-intro-fullname {
  display:flex;
  align-items:center;
  justify-content:center;

  gap:0.18em;

  opacity:0;
  pointer-events:none;

  white-space:nowrap;

  transition:
    opacity .4s ease,
    transform .8s cubic-bezier(.16,1,.3,1);

  transform:translateY(8px);
}

#rs-intro-fullname.rs-on{
  opacity:1;
  transform:translateY(0);
}

.rs-name-word{
  display:flex;
  align-items:center;

  font-family:var(--ff-display);
  font-size:clamp(3.2rem,8vw,7.8rem);
  font-style:italic;
  font-weight:300;

  line-height:1;
  letter-spacing:.012em;

  color:var(--text);
}

/* GOLD INITIAL */

.rs-name-initial{
  color:var(--accent);

  text-shadow:
    0 0 10px rgba(200,169,110,.14),
    0 0 28px rgba(200,169,110,.08);
}

/* TYPED LETTERS */

.rs-name-rest{
  display:inline-flex;
}

.rs-char{
  display:inline-block;

  opacity:0;

  transform:
    translateY(30px)
    scale(.92);

  filter:blur(6px);

  animation:
    rsTypeReveal .7s cubic-bezier(.16,1,.3,1) forwards;
}

/* Stagger delays */

.rs-char:nth-child(1){ animation-delay:.03s; }
.rs-char:nth-child(2){ animation-delay:.06s; }
.rs-char:nth-child(3){ animation-delay:.09s; }
.rs-char:nth-child(4){ animation-delay:.12s; }
.rs-char:nth-child(5){ animation-delay:.15s; }
.rs-char:nth-child(6){ animation-delay:.18s; }
.rs-char:nth-child(7){ animation-delay:.21s; }
.rs-char:nth-child(8){ animation-delay:.24s; }
.rs-char:nth-child(9){ animation-delay:.27s; }

@keyframes rsTypeReveal {

  0%{
    opacity:0;

    transform:
      translateY(34px)
      scale(.88);

    filter:blur(8px);
  }

  100%{
    opacity:1;

    transform:
      translateY(0)
      scale(1);

    filter:blur(0);
  }
}

/* UNDERLINE */

#rs-intro-underline{
  width:0;
  height:1px;

  margin-top:2.6rem;

  background:linear-gradient(
    90deg,
    transparent,
    var(--accent),
    transparent
  );

  opacity:0;

  box-shadow:
    0 0 18px rgba(200,169,110,.22);

  transition:
    width 1s cubic-bezier(.16,1,.3,1),
    opacity .5s ease;
}

#rs-intro-underline.rs-draw{
  width:min(72vw,620px);
  opacity:1;
}

/* DO NOT CLOSE THE STYLE TAG HERE */

/* ════════════════════════════════════════
   HTML
════════════════════════════════════════ */

/* ════════════════════════════════════════
   TIMELINE
════════════════════════════════════════ */

const rsInitials  = document.getElementById("rs-intro-initials");
const rsFullname  = document.getElementById("rs-intro-fullname");
const rsLine      = document.getElementById("rs-intro-line");
const rsUnderline = document.getElementById("rs-intro-underline");

/* LINE */

setTimeout(() => {
  rsLine.classList.add("rs-draw");
}, 250);

/* MSM SHOW */

setTimeout(() => {
  rsInitials.classList.add("rs-on");
}, 700);

/* MSM TRANSFORMS INTO FULL NAME */

setTimeout(() => {

  rsInitials.classList.add("rs-expand");

  rsFullname.classList.add("rs-on");

}, 2100);

/* UNDERLINE */

setTimeout(() => {
  rsUnderline.classList.add("rs-draw");
}, 3200);
   
   
   /* ════════════════════════════════════════
       PHASE 2 — Loading Screen
    ════════════════════════════════════════ */

    #rs-loader {
      position: absolute; inset: 0;
      display: none;
      flex-direction: column;
      align-items: center; justify-content: center;
      z-index: 8;
      opacity: 0;
      transition: opacity 0.65s ease;
    }
    #rs-loader.rs-show { opacity: 1; }

    /* Grid + grain overlays for loader */
    .rs-ld-grid {
      position: absolute; inset: 0; pointer-events: none; z-index: 0;
      background-image:
        linear-gradient(var(--border) 1px, transparent 1px),
        linear-gradient(90deg, var(--border) 1px, transparent 1px);
      background-size: 60px 60px;
      -webkit-mask-image: radial-gradient(ellipse 80% 65% at 50% 50%, black 5%, transparent 100%);
      mask-image: radial-gradient(ellipse 80% 65% at 50% 50%, black 5%, transparent 100%);
    }
    .rs-ld-grain {
      position: absolute; inset: 0; pointer-events: none; z-index: 0;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.018'/%3E%3C/svg%3E");
      opacity: 0.5;
    }

    /* CRT scan line */
    .rs-scan {
      position: absolute; left: 0; right: 0;
      height: 120px; pointer-events: none; z-index: 1; top: -120px;
      background: linear-gradient(
        to bottom,
        transparent 0%,
        rgba(255,255,255,0.012) 40%,
        rgba(255,255,255,0.018) 50%,
        rgba(255,255,255,0.012) 60%,
        transparent 100%
      );
      animation: rsScan 9s linear infinite;
    }
    @keyframes rsScan { 0% { top: -120px; } 100% { top: 100%; } }

    /* Film strips */
    .rs-film {
      position: absolute; top: -30px; bottom: -30px;
      width: 28px; overflow: hidden;
      pointer-events: none; z-index: 1;
      opacity: 0; animation: rsFilmIn 1.5s ease 0.4s forwards;
    }
    @keyframes rsFilmIn { to { opacity: 1; } }
    .rs-film--l { left: clamp(8px,3vw,40px); }
    .rs-film--r { right: clamp(8px,3vw,40px); }
    .rs-belt { display: flex; flex-direction: column; gap: 6px; padding: 6px 0; }
    .rs-film--l .rs-belt { animation: rsUp   28s linear infinite; }
    .rs-film--r .rs-belt { animation: rsDown 28s linear infinite; }
    @keyframes rsUp   { from { transform: translateY(0); }   to { transform: translateY(-50%); } }
    @keyframes rsDown { from { transform: translateY(-50%); } to { transform: translateY(0); } }
    .rs-frame {
      width: 28px; height: 18px;
      border: 1px solid var(--border2); border-radius: 2px;
      flex-shrink: 0; opacity: 0.22; position: relative;
    }
    .rs-frame::before, .rs-frame::after {
      content: ''; position: absolute;
      width: 4px; height: 4px; border-radius: 1px;
      background: var(--bg); border: 1px solid var(--border2);
      top: 50%; transform: translateY(-50%);
    }
    .rs-frame::before { left: 2px; }
    .rs-frame::after  { right: 2px; }
    .rs-frame.rs-f-accent { opacity: 0.5; border-color: var(--accent); }
    .rs-frame.rs-f-accent::after {
      content: ''; position: absolute;
      inset: 3px; background: var(--accent); opacity: 0.1;
      border-radius: 1px; top: auto; transform: none;
      width: auto; height: auto; border: none; left: 3px; right: 3px;
    }
    .rs-frame.rs-f-accent::before { display: block; }

    /* ── Ghost clock — massive, barely visible, atmospheric ── */
    /* FIXED: time + AM/PM on same row, meta line below with clear gap */
    .rs-ghost {
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      display: flex; flex-direction: column; align-items: center;
      gap: 2.8rem;                    /* ← the gap that prevents overlap */
      opacity: 0; user-select: none; pointer-events: none; z-index: 0;
      transition: opacity 2.5s ease;
    }
    .rs-ghost.rs-on { opacity: 0.038; }

    /* Time + AM/PM on same line */
    .rs-ghost-time-row {
      display: flex;
      align-items: flex-start;       /* tops aligned */
      line-height: 1;
    }

    /* The big digits */
    .rs-ghost-time {
      font-family: var(--ff-display);
      font-size: clamp(14vw, 20vw, 26vw);
      font-weight: 300;
      color: var(--text);
      letter-spacing: -0.04em;
      line-height: 1;
      white-space: nowrap;
    }

    /* AM/PM — exactly half the font size of the clock, sits top-right */
    .rs-ghost-ampm {
      font-family: var(--ff-mono);
      font-size: clamp(7vw, 10vw, 13vw);   /* half of rs-ghost-time */
      font-weight: 300;
      color: var(--text);
      line-height: 1.08;
      padding-top: 0.07em;
      margin-left: 0.1em;
      white-space: nowrap;
      letter-spacing: 0.01em;
    }

    /* Day · Month Date — separated by 2.8rem gap, no overlap possible */
    .rs-ghost-meta {
      font-family: var(--ff-mono);
      font-size: clamp(1.4vw, 2.2vw, 3vw);
      font-weight: 400;
      color: var(--text);
      letter-spacing: 0.38em;
      text-transform: uppercase;
      white-space: nowrap;
      line-height: 1;
    }

    /* ── Inner content column ── */
    .rs-inner {
      position: relative; z-index: 2;
      width: 100%; max-width: 520px; padding: 0 3rem;
      display: flex; flex-direction: column; align-items: center;
    }

    /* Keyframes */
    @keyframes rsFadeUp  { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
    @keyframes rsFadeIn  { from { opacity: 0; } to { opacity: 1; } }

    /* ── Welcome / Context (single combined element, large italic) ── */
    .rs-welcome-shell {
      width: 100%;
      min-height: 5.2rem;
      display: flex; align-items: center; justify-content: center;
      text-align: center;
      margin-bottom: 0.9rem;
      position: relative;
    }
    .rs-welcome-shell::before {
      content: '';
      position: absolute; top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      width: 380px; height: 180px;
      background: radial-gradient(ellipse, rgba(200,169,110,0.05) 0%, transparent 70%);
      pointer-events: none; opacity: 0;
      transition: opacity 1.5s ease;
    }
    .rs-welcome-shell.rs-on::before { opacity: 1; }

    .rs-welcome {
      font-family: var(--ff-display);
      font-size: clamp(2rem, 5.5vw, 3.2rem);
      font-weight: 400; font-style: italic;
      color: var(--text); line-height: 1.2;
      opacity: 0; transform: translateY(16px);
      transition: opacity 1.1s cubic-bezier(0.16,1,0.3,1), transform 1.1s cubic-bezier(0.16,1,0.3,1);
    }
    .rs-welcome.rs-on { opacity: 1; transform: translateY(0); }

    /* ── Facts/hints line ── */
    .rs-facts-shell {
      width: 100%; height: 20px; overflow: hidden;
      margin-bottom: 1.9rem;
      opacity: 0; transition: opacity 0.8s ease;
    }
    .rs-facts-shell.rs-on { opacity: 1; }

    .rs-fact-txt {
      font-family: var(--ff-mono); font-size: 0.57rem;
      color: var(--text3); letter-spacing: 0.07em;
      line-height: 20px; text-align: center;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      opacity: 1; transition: opacity 0.09s ease;
    }
    .rs-fact-txt.rs-fade { opacity: 0; }
    .rs-fact-txt::before { content: '·  '; color: var(--accent); opacity: 0.6; }

    /* ── Progress bar ── */
    .rs-bar-shell {
      width: 100%; margin-bottom: 0.8rem;
      opacity: 0; animation: rsFadeIn 0.5s ease 0.2s forwards;
    }
    .rs-bar-row { display: flex; align-items: center; gap: 10px; }
    .rs-track {
      flex: 1; height: 1px; background: var(--border2);
      position: relative; overflow: hidden;
    }
    .rs-fill {
      position: absolute; top: 0; left: 0; bottom: 0;
      width: 0%; background: var(--accent);
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
      font-family: var(--ff-mono); font-size: 0.54rem;
      color: var(--text3); letter-spacing: 0.06em;
      min-width: 3.5ch; text-align: right; flex-shrink: 0;
    }

    /* ── Terminal log — sleek, left-accented line, no weird icons ── */
    .rs-terminal {
      width: 100%;
      display: flex; align-items: center; gap: 0.65rem;
      padding: 0.52rem 0.8rem;
      border-left: 2px solid var(--accent);
      margin-bottom: 1.6rem;
      background: rgba(200,169,110,0.026);
      opacity: 0; transition: opacity 0.4s ease;
    }
    .rs-terminal.rs-on { opacity: 1; }

    .rs-term-prefix {
      font-family: var(--ff-mono); font-size: 0.65rem;
      color: var(--accent); flex-shrink: 0; line-height: 1;
    }
    .rs-term-msg {
      font-family: var(--ff-mono); font-size: 0.57rem;
      color: var(--text3); letter-spacing: 0.055em;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      flex: 1;
      opacity: 1; transition: opacity 0.09s ease;
    }
    .rs-term-msg.rs-fade { opacity: 0; }
    .rs-term-cursor {
      font-family: var(--ff-mono); font-size: 0.57rem;
      color: var(--accent); flex-shrink: 0;
      animation: rsBlink 1.1s step-end infinite;
    }
    @keyframes rsBlink { 0%,100% { opacity:0; } 50% { opacity:1; } }

    /* ── Continue button ── */
    .rs-continue {
      width: 100%; background: none; border: none;
      color: var(--text3);
      font-family: var(--ff-mono); font-size: 0.63rem;
      letter-spacing: 0.32em; text-transform: uppercase;
      padding: 13px 0; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      opacity: 0; pointer-events: none; outline: none;
      transform: translateY(8px);
      transition: opacity 0.75s ease, transform 0.75s cubic-bezier(0.16,1,0.3,1), color 0.3s ease;
    }
    .rs-continue.rs-show { opacity:1; pointer-events:all; transform:translateY(0); }
    .rs-continue:hover { color: var(--text); }
    .rs-continue:hover .rs-dash { background: var(--accent); opacity: 0.4; }
    .rs-dash { flex:1; height:1px; background:var(--border2); max-width:80px; transition:background 0.3s,opacity 0.3s; }
    .rs-cword { padding: 0 16px; flex-shrink: 0; }

    /* ── Mobile breakpoints ── */
    @media (max-width: 540px) {
      .rs-inner { padding: 0 1.4rem; }
      .rs-film--l, .rs-film--r { display: none; }
      .rs-intro-letter   { font-size: clamp(4.5rem, 18vw, 6rem); }
      .rs-ghost-time  { font-size: clamp(16vw, 22vw, 28vw); }
      .rs-ghost-ampm  { font-size: clamp(8vw, 11vw, 14vw); }
      .rs-ghost-meta  { font-size: clamp(2vw, 3.5vw, 4.5vw); }
    }

  </style>
`;

document.head.insertAdjacentHTML("beforeend", introStyles);

  /* ════════════════════════════════════════════════════════════════
     § DATA — all text arrays, unchanged from original
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

  /*
   * Milestones scaled to 4500ms — 2.5 seconds faster than the original 7000ms.
   * All values proportionally reduced by factor 0.643.
   */
  var MILESTONES = [
    [0,    0],
    [320,  7],
    [640,  16],
    [1030, 29],
    [1480, 43],
    [2000, 57],
    [2500, 68],
    [3020, 78],
    [3470, 87],
    [3860, 93],
    [4240, 97],
    [4500, 100]
  ];

  /* ════════════════════════════════════════════════════════════════
     § RoroSplash — main class
  ════════════════════════════════════════════════════════════════ */
  function RoroSplash() {
    this._user      = this._readUser();
    this._msgIdx    = 0;
    this._factIdx   = Math.floor(Math.random() * FACTS.length);
    this._factTimer = null;
    this._msgTimer  = null;
    this._clockInt  = null;
    this._isDone    = false;

    this._injectCSS();
    this._dom();
    this._revealSplash();
    this._runIntro();
  }

  /* ── Read saved user from localStorage ── */
  RoroSplash.prototype._readUser = function () {
    try { return JSON.parse(localStorage.getItem('roroUser') || 'null'); }
    catch (e) { return null; }
  };

  /* ── Inject CSS into <head> ── */
  RoroSplash.prototype._injectCSS = function () {
    if (document.getElementById('rs-css')) return;
    var s = document.createElement('style');
    s.id = 'rs-css'; s.textContent = CSS;
    document.head.appendChild(s);
  };

  /* ── Build one film strip ── */
  RoroSplash.prototype._strip = function (side) {
    var wrap = document.createElement('div');
    wrap.className = 'rs-film rs-film--' + side;
    var belt = document.createElement('div');
    belt.className = 'rs-belt';
    var html = '';
    for (var i = 0; i < 60; i++) {
      html += '<div class="rs-frame' + (i % 5 === 0 ? ' rs-f-accent' : '') + '"></div>';
    }
    belt.innerHTML = html + html; /* doubled for seamless loop */
    wrap.appendChild(belt);
    return wrap;
  };

  /* ══════════════════════════════════════════════════════
     BUILD DOM — creates #roro-splash with two phases inside
  ══════════════════════════════════════════════════════ */
  RoroSplash.prototype._dom = function () {
    var root = document.createElement('div');
    root.id = 'roro-splash';

    /* ─────────────────────────────────────
       PHASE 1: Movie Intro (#rs-intro)
    ───────────────────────────────────── */
    var intro = document.createElement('div');
    intro.id = 'rs-intro';

    var introGrid = document.createElement('div');
    introGrid.className = 'rs-intro-grid';
    intro.appendChild(introGrid);

    var introGrain = document.createElement('div');
    introGrain.className = 'rs-intro-grain';
    intro.appendChild(introGrain);

    /* The centered stage */
    var stage = document.createElement('div');
    stage.className = 'rs-intro-stage';

    /* Opening accent line */
    var topLine = document.createElement('div');
    topLine.id = 'rs-intro-line';
    stage.appendChild(topLine);

    /* Name zone — CSS Grid trick, both children share same cell */
    var nameZone = document.createElement('div');
    nameZone.className = 'rs-intro-name-zone';

    /* M · S · M initials */
    var initials = document.createElement('div');
    initials.id = 'rs-intro-initials';
    initials.innerHTML =
      '<span class="rs-intro-letter">M</span>' +
      '<span class="rs-intro-dot">&middot;</span>' +
      '<span class="rs-intro-letter">S</span>' +
      '<span class="rs-intro-dot">&middot;</span>' +
      '<span class="rs-intro-letter">M</span>';
    nameZone.appendChild(initials);

    /* Full name — Manomay Shailendra Misra */
    var fullname = document.createElement('div');
    fullname.id = 'rs-intro-fullname';
    fullname.innerHTML =

  '<div class="rs-intro-name">' +

    '<span class="rs-intro-acc">M</span>' +

    '<span class="rs-intro-rest">' +
      '<span class="rs-intro-char">a</span>' +
      '<span class="rs-intro-char">n</span>' +
      '<span class="rs-intro-char">o</span>' +
      '<span class="rs-intro-char">m</span>' +
      '<span class="rs-intro-char">a</span>' +
      '<span class="rs-intro-char">y</span>' +
    '</span>' +

    '&nbsp;' +

    '<span class="rs-intro-acc">S</span>' +

    '<span class="rs-intro-rest">' +
      '<span class="rs-intro-char">h</span>' +
      '<span class="rs-intro-char">a</span>' +
      '<span class="rs-intro-char">i</span>' +
      '<span class="rs-intro-char">l</span>' +
      '<span class="rs-intro-char">e</span>' +
      '<span class="rs-intro-char">n</span>' +
      '<span class="rs-intro-char">d</span>' +
      '<span class="rs-intro-char">r</span>' +
      '<span class="rs-intro-char">a</span>' +
    '</span>' +

    '&nbsp;' +

    '<span class="rs-intro-acc">M</span>' +

    '<span class="rs-intro-rest">' +
      '<span class="rs-intro-char">i</span>' +
      '<span class="rs-intro-char">s</span>' +
      '<span class="rs-intro-char">r</span>' +
      '<span class="rs-intro-char">a</span>' +
    '</span>' +

  '</div>';
    nameZone.appendChild(fullname);

    stage.appendChild(nameZone);

    /* Underline below name */
    var underline = document.createElement('div');
    underline.id = 'rs-intro-underline';
    stage.appendChild(underline);

    intro.appendChild(stage);
    root.appendChild(intro);

    /* ─────────────────────────────────────
       PHASE 2: Loading Screen (#rs-loader)
    ───────────────────────────────────── */
    var loader = document.createElement('div');
    loader.id = 'rs-loader';

    /* Ghost clock */
    var ghost = document.createElement('div');
    ghost.className = 'rs-ghost';
    ghost.id = 'rs-ghost';
    ghost.setAttribute('aria-hidden', 'true');

    var timeRow = document.createElement('div');
    timeRow.className = 'rs-ghost-time-row';

    var gTime = document.createElement('span');
    gTime.className = 'rs-ghost-time';
    gTime.id = 'rs-ghost-time';
    timeRow.appendChild(gTime);

    var gAmpm = document.createElement('span');
    gAmpm.className = 'rs-ghost-ampm';
    gAmpm.id = 'rs-ghost-ampm';
    timeRow.appendChild(gAmpm);

    ghost.appendChild(timeRow);

    var gMeta = document.createElement('span');
    gMeta.className = 'rs-ghost-meta';
    gMeta.id = 'rs-ghost-meta';
    ghost.appendChild(gMeta);

    loader.appendChild(ghost);

    /* Grid overlay */
    var ldGrid = document.createElement('div');
    ldGrid.className = 'rs-ld-grid';
    loader.appendChild(ldGrid);

    /* Grain */
    var ldGrain = document.createElement('div');
    ldGrain.className = 'rs-ld-grain';
    loader.appendChild(ldGrain);

    /* CRT scan */
    var scan = document.createElement('div');
    scan.className = 'rs-scan';
    scan.setAttribute('aria-hidden', 'true');
    loader.appendChild(scan);

    /* Film strips */
    loader.appendChild(this._strip('l'));
    loader.appendChild(this._strip('r'));

    /* Inner content column */
    var inner = document.createElement('div');
    inner.className = 'rs-inner';
    inner.innerHTML =
      /* Welcome + context combined into one large element */
      '<div class="rs-welcome-shell" id="rs-ws">' +
        '<div class="rs-welcome" id="rs-welcome"></div>' +
      '</div>' +
      /* Facts / hints line */
      '<div class="rs-facts-shell" id="rs-facts-shell">' +
        '<div class="rs-fact-txt" id="rs-fact-txt"></div>' +
      '</div>' +
      /* Progress bar */
      '<div class="rs-bar-shell">' +
        '<div class="rs-bar-row">' +
          '<div class="rs-track" id="rs-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">' +
            '<div class="rs-fill" id="rs-fill"></div>' +
          '</div>' +
          '<div class="rs-pct" id="rs-pct">0%</div>' +
        '</div>' +
      '</div>' +
      /* Terminal — sleek log line, no record icon */
      '<div class="rs-terminal" id="rs-terminal">' +
        '<span class="rs-term-prefix">›</span>' +
        '<span class="rs-term-msg" id="rs-term-msg"></span>' +
        '<span class="rs-term-cursor">_</span>' +
      '</div>' +
      /* Continue */
      '<button class="rs-continue" id="rs-continue" type="button" aria-label="Enter site">' +
        '<span class="rs-dash" aria-hidden="true"></span>' +
        '<span class="rs-cword">CONTINUE</span>' +
        '<span class="rs-dash" aria-hidden="true"></span>' +
      '</button>';

    loader.appendChild(inner);
    root.appendChild(loader);

    document.body.appendChild(root);
    this._root = root;

    /* ── Element refs ── */
    this._ghost     = document.getElementById('rs-ghost');
    this._ghostTime = document.getElementById('rs-ghost-time');
    this._ghostAmpm = document.getElementById('rs-ghost-ampm');
    this._ghostMeta = document.getElementById('rs-ghost-meta');
    this._ws        = document.getElementById('rs-ws');
    this._welcome   = document.getElementById('rs-welcome');
    this._factsS    = document.getElementById('rs-facts-shell');
    this._factsT    = document.getElementById('rs-fact-txt');
    this._fill      = document.getElementById('rs-fill');
    this._track     = document.getElementById('rs-track');
    this._pct       = document.getElementById('rs-pct');
    this._terminal  = document.getElementById('rs-terminal');
    this._termMsg   = document.getElementById('rs-term-msg');
    this._cont      = document.getElementById('rs-continue');
  };

  /* ── Show splash, remove #roro-cover after fade-in completes ── */
  RoroSplash.prototype._revealSplash = function () {
    var self = this;
    var oldLS = document.getElementById('loading-screen');
    if (oldLS) oldLS.style.cssText = 'display:none!important';

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        self._root.classList.add('rs-show');
        var cover = document.getElementById('roro-cover');
        if (cover) {
          /* Wait for splash opacity (0.4s) to finish, then remove cover instantly.
             No cross-fade = no flash of homepage underneath. */
          setTimeout(function () {
            if (cover.parentNode) cover.remove();
          }, 460);
        }
      });
    });
  };

  /* ══════════════════════════════════════════════════════
     PHASE 1: Movie Intro
     Timeline:
       280ms  — accent line draws in
       650ms  — M · S · M fades up
       1380ms — M·S·M fades out, line erases
       1550ms — Manomay | Shailendra | Misra reveal (staggered slide-up)
       2350ms — accent underline draws below name
       3100ms — transition to loader begins
  ══════════════════════════════════════════════════════ */
  RoroSplash.prototype._runIntro = function () {
    var self = this;

    var intro     = document.getElementById('rs-intro');
    var topLine   = document.getElementById('rs-intro-line');
    var initials  = document.getElementById('rs-intro-initials');
    var fullname  = document.getElementById('rs-intro-fullname');
    var underline = document.getElementById('rs-intro-underline');
    /* no-op */

    /* Intro is visible */
    intro.classList.add('rs-show');

    /* t=280ms: accent line draws */
    setTimeout(function () {
      topLine.classList.add('rs-draw');
    }, 280);

    /* t=650ms: M · S · M appears */
    setTimeout(function () {
      initials.classList.add('rs-on');
    }, 650);

    /* t=1380ms: initials fade out, line erases */
    setTimeout(function () {
      initials.classList.add('rs-off');
      topLine.classList.remove('rs-draw');
      topLine.classList.add('rs-erase');
    }, 1380);

    /* t=1550ms: full name becomes visible, words start revealing */
    setTimeout(function () {
      fullname.classList.add('rs-on');
      /* no stagger needed anymore */
    }, 1550);

    /* t=2350ms: underline draws below name */
    setTimeout(function () {
      underline.classList.add('rs-draw');
    }, 2350);

    /* t=3100ms: fade intro out and begin loader */
    setTimeout(function () {
      self._showLoader(intro);
    }, 3100);
  };

  /* ── Transition: fade out intro, fade in loader ── */
  RoroSplash.prototype._showLoader = function (intro) {
    var self   = this;
    var loader = document.getElementById('rs-loader');

    /* Fade intro out (0.7s ease transition set in CSS) */
    intro.classList.add('rs-out');

    /* After fade, hide intro and reveal loader */
    setTimeout(function () {
      intro.style.display = 'none';
      loader.style.display = 'flex';

      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          loader.classList.add('rs-show');
          self._runLoader();
        });
      });
    }, 720);
  };

  /* ══════════════════════════════════════════════════════
     PHASE 2: Loading Screen
     Chronological order:
       0ms   — terminal log starts, ghost fades in
       250ms — welcome/context text fades up
       550ms — facts line appears
       (bar animates via MILESTONES from 0ms)
       4500ms — 100% reached → "READY." → CONTINUE appears at 5000ms
  ══════════════════════════════════════════════════════ */
  RoroSplash.prototype._runLoader = function () {
    var self = this;

    /* Start the clock ticker */
    this._tick();
    this._clockInt = setInterval(function () { self._tick(); }, 1000);

    /* Ghost fades in slowly */
    setTimeout(function () {
      self._ghost.classList.add('rs-on');
    }, 200);

    /* Terminal: show first message immediately */
    this._termMsg.textContent = MSGS[this._msgIdx % MSGS.length];
    this._msgIdx++;
    this._terminal.classList.add('rs-on');

    /* Terminal message cycling */
    this._msgTimer = setInterval(function () {
      self._nextMsg();
    }, 700);

    /* Progress bar (milestones are relative to _runLoader call time) */
    this._progress();

    /* Facts: set first fact, start cycling */
    this._factsT.textContent = FACTS[this._factIdx];
    this._factTimer = setInterval(function () {
      self._nextFact();
    }, 2400);

    /* Welcome / context text */
    setTimeout(function () {
      self._welcome.textContent = self._getWelcome();
      self._welcome.classList.add('rs-on');
      self._ws.classList.add('rs-on');
    }, 250);

    /* Facts line becomes visible */
    setTimeout(function () {
      self._factsS.classList.add('rs-on');
    }, 550);

    /* Continue click handler */
    this._cont.addEventListener('click', function () {
      self._finish();
    });
  };

  /* ── Progress milestones ── */
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

  /* ── Called when loading reaches 100% ── */
  RoroSplash.prototype._done = function () {
    var self = this;
    this._isDone = true;
    clearInterval(this._msgTimer);

    /* Terminal shows READY state */
    this._termMsg.classList.add('rs-fade');
    setTimeout(function () {
      self._termMsg.textContent = 'READY.';
      self._termMsg.classList.remove('rs-fade');
    }, 95);

    /* CONTINUE button appears 500ms after 100% */
    setTimeout(function () {
      self._cont.classList.add('rs-show');
    }, 500);
  };

  /* ── Cycle terminal messages ── */
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
    }, 95);
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

  /* ── Live clock — updates ghost time + AM/PM + date ── */
  RoroSplash.prototype._tick = function () {
    var now  = new Date();
    var h    = now.getHours();
    var m    = String(now.getMinutes()).padStart(2, '0');
    var ap   = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    var DAYS = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];
    var MON  = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

    /* Time digits — big */
    this._ghostTime.textContent = h + ':' + m;

    /* AM/PM — half size, same line, no separator needed */
    this._ghostAmpm.textContent = ap;

    /* Day · Month Date — clearly separated below by 2.8rem gap */
    this._ghostMeta.textContent =
      DAYS[now.getDay()] + '\u00a0\u00b7\u00a0' +
      MON[now.getMonth()] + '\u00a0' + now.getDate();
  };

  /* ── Welcome text — combined context + welcome into one element ──
     For returning users: personalized RETURN_LINE (with their name)
     For new users: 50/50 split between FIRST_LINES and CTX lines
     Both arrays preserved exactly as original.
  ── */
  RoroSplash.prototype._getWelcome = function () {
    if (this._user && this._user.name) {
      return RETURN_LINES[Math.floor(Math.random() * RETURN_LINES.length)]
        .replace('{n}', this._user.name);
    }
    /* New user — context-aware half the time, generic welcome the other half */
    if (Math.random() > 0.5) {
      return FIRST_LINES[Math.floor(Math.random() * FIRST_LINES.length)];
    }
    var h = new Date().getHours();
    var pool = h < 4  ? CTX.night :
               h < 7  ? CTX.dawn  :
               h < 12 ? CTX.morning :
               h < 14 ? CTX.midday :
               h < 18 ? CTX.afternoon :
               h < 21 ? CTX.evening : CTX.latenight;
    return pool[Math.floor(Math.random() * pool.length)];
  };

  /* ── CONTINUE click — same page-transition as before ── */
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

    /* Restore native audio play after transition */
    setTimeout(function () {
      HTMLMediaElement.prototype.play = _origPlay;
    }, 500);
  };

  /* ── Cleanup all intervals and remove DOM ── */
  RoroSplash.prototype._cleanup = function () {
    clearInterval(this._clockInt);
    clearInterval(this._factTimer);
    clearInterval(this._msgTimer);
    if (this._root && this._root.parentNode) this._root.remove();
    var css = document.getElementById('rs-css');
    if (css) css.remove();
  };

  /* ════════════════════════════════════════════════════════════════
     § BOOT
     DOMContentLoaded: intercept startHeroAnimations so it only fires
     after CONTINUE is clicked, keeping the homepage hidden behind splash.
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
   YOUR index.html — all 4 requirements already present, no changes needed:

   ① In <head>:
       <style>body{visibility:hidden}</style>

   ② First child of <body>:
       <div id="roro-cover" style="position:fixed;inset:0;z-index:9999999;background:var(--bg,#080808)"></div>

   ③ Script order (roro-intro BEFORE main):
       <script src="js/roro-intro.js"></script>
       <script src="js/main.js"></script>

   ④ Old loading screen div: already removed from your index.html ✓

   TOTAL EXPERIENCE TIMING:
   ─────────────────────────
   0ms       Page loads, #roro-cover covers everything
   460ms     Cover removed (splash is fully opaque by now)
   280ms     Accent line draws in (movie intro)
   650ms     M · S · M appears
   1380ms    Initials fade out
   1550ms    "Manomay / Shailendra / Misra" slides up word by word
   2350ms    Accent underline draws below name
   3100ms    Intro fades out
   3820ms    Loading screen fully visible
   4070ms    Welcome text + ghost appears
   4370ms    Facts appear
   8320ms    Loading hits 100% → "READY." in terminal
   8820ms    CONTINUE button fades in
   ─────────────────────────
   User clicks CONTINUE → song plays → page transition → homepage
═══════════════════════════════════════════════════════════════ */
