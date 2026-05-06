/* ═══════════════════════════════════════════════════════════
   js/manager-roro.js
   RoRo — Website Intelligence System for MSM
   ─────────────────────────────────────────────────────────
   Phantom AI Chatbot · Vanilla JS · Zero dependencies
   Context-aware · localStorage memory · NLP-lite engine
   Class: RoRoManager · Auto-initialises on DOMContentLoaded
═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ═══════════════════════════════════════════════════════
     § 0 — INJECTED CSS
     All styles live here. Every colour pulls from site CSS
     variables — all four themes (Noir/Ivory/Slate/Forest)
     work automatically without any extra configuration.
  ═══════════════════════════════════════════════════════ */

  const RORO_CSS = `

    /* ── Nav trigger button ─────────────────────────── */
    #roro-btn {
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
      transition: border-color 0.25s ease, box-shadow 0.25s ease, background 0.25s ease;
      flex-shrink: 0;
      outline: none;
    }
    #roro-btn:hover {
      border-color: var(--accent);
      box-shadow: 0 0 10px var(--accent-glow, rgba(200,169,110,0.25));
      background: var(--bg4, rgba(255,255,255,0.08));
    }
    #roro-btn.roro-btn--active {
      border-color: var(--accent);
      box-shadow: 0 0 10px var(--accent-glow, rgba(200,169,110,0.25));
    }
    #roro-btn svg {
      width: 15px;
      height: 15px;
      display: block;
    }

    /* Unread notification badge */
    .roro-badge {
      position: absolute;
      top: -3px;
      right: -3px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--accent);
      border: 2px solid var(--bg);
      display: none;
      pointer-events: none;
    }
    #roro-btn.roro-has-unread .roro-badge {
      display: block;
    }

    /* ── Panel base ─────────────────────────────────── */
    .roro-panel {
      position: fixed;
      bottom: 28px;
      right: 28px;
      width: 340px;
      height: 500px;
      background: var(--bg2);
      border: 1px solid var(--border);
      border-radius: 14px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      z-index: 9900;
      box-shadow:
        0 24px 64px rgba(0, 0, 0, 0.45),
        0 0 0 1px var(--border2);
      opacity: 0;
      pointer-events: none;
      transform: translateY(18px) scale(0.96);
      transition:
        transform 0.38s cubic-bezier(0.16, 1, 0.3, 1),
        opacity   0.3s  ease,
        width     0.32s cubic-bezier(0.16, 1, 0.3, 1),
        height    0.32s cubic-bezier(0.16, 1, 0.3, 1),
        bottom    0.32s cubic-bezier(0.16, 1, 0.3, 1),
        right     0.32s cubic-bezier(0.16, 1, 0.3, 1),
        border-radius 0.32s ease;
    }

    .roro-panel.roro-panel--open {
      opacity: 1;
      pointer-events: all;
      transform: translateY(0) scale(1);
    }

    /* Minimized pill */
    .roro-panel.roro-panel--minimized {
      height: 48px;
      width: 188px;
      border-radius: 24px;
      cursor: pointer;
      bottom: 28px;
      right: 28px;
    }

    /* Fullscreen */
    .roro-panel.roro-panel--fullscreen {
      width:  100vw !important;
      height: 100vh !important;
      bottom: 0    !important;
      right:  0    !important;
      border-radius: 0 !important;
    }

    /* ── Header ─────────────────────────────────────── */
    .roro-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 14px;
      border-bottom: 1px solid var(--border);
      background: var(--bg2);
      flex-shrink: 0;
      user-select: none;
      position: relative;
    }
    .roro-panel--minimized .roro-header {
      border-bottom: none;
      justify-content: center;
      padding: 0 16px;
      height: 100%;
    }

    /* Avatar */
    .roro-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--bg3);
      border: 1px solid var(--border2);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      position: relative;
    }
    .roro-avatar-pulse {
      position: absolute;
      inset: -5px;
      border-radius: 50%;
      border: 1px solid var(--accent);
      opacity: 0;
      animation: roroPulse 3.5s ease-in-out infinite;
      pointer-events: none;
    }
    @keyframes roroPulse {
      0%, 100% { opacity: 0;   transform: scale(1);   }
      50%       { opacity: 0.28; transform: scale(1.12); }
    }
    .roro-avatar svg { width: 18px; height: 18px; }

    /* Identity block */
    .roro-identity { flex: 1; min-width: 0; }
    .roro-name {
      font-family: var(--ff-display);
      font-size: 0.92rem;
      font-weight: 400;
      color: var(--text);
      line-height: 1;
      margin-bottom: 3px;
    }
    .roro-subtitle {
      font-family: var(--ff-mono);
      font-size: 0.58rem;
      color: var(--accent);
      letter-spacing: 0.1em;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .roro-status {
      display: flex;
      align-items: center;
      gap: 4px;
      font-family: var(--ff-mono);
      font-size: 0.55rem;
      color: var(--text3);
      letter-spacing: 0.04em;
    }
    .roro-status-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: #4ade80;
      flex-shrink: 0;
      animation: roroBlink 2.2s ease-in-out infinite;
    }
    @keyframes roroBlink {
      0%, 100% { opacity: 1;   }
      50%       { opacity: 0.35; }
    }

    /* Control buttons */
    .roro-controls {
      display: flex;
      gap: 4px;
      align-items: center;
      flex-shrink: 0;
    }
    .roro-ctrl {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 1px solid var(--border2);
      background: var(--bg3);
      color: var(--text3);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.7rem;
      transition: border-color 0.2s, color 0.2s, background 0.2s;
      outline: none;
      line-height: 1;
      padding: 0;
    }
    .roro-ctrl:hover {
      border-color: var(--accent);
      color: var(--accent);
      background: var(--bg4);
    }

    /* Minimized label — shown only in minimized mode */
    .roro-minimized-label {
      display: none;
      align-items: center;
      gap: 8px;
      font-family: var(--ff-mono);
      font-size: 0.72rem;
      color: var(--text2);
      letter-spacing: 0.1em;
    }
    .roro-minimized-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #4ade80;
      flex-shrink: 0;
      animation: roroBlink 2.2s ease-in-out infinite;
    }
    .roro-panel--minimized .roro-avatar,
    .roro-panel--minimized .roro-identity,
    .roro-panel--minimized .roro-controls { display: none; }
    .roro-panel--minimized .roro-minimized-label { display: flex; }

    /* ── Encryption notice bar ──────────────────────── */
    .roro-enc-bar {
      font-family: var(--ff-mono);
      font-size: 0.53rem;
      color: var(--text3);
      letter-spacing: 0.06em;
      padding: 4px 14px;
      border-bottom: 1px solid var(--border);
      text-align: center;
      flex-shrink: 0;
      background: var(--bg2);
    }
    .roro-panel--minimized .roro-enc-bar,
    .roro-panel--minimized .roro-chat,
    .roro-panel--minimized .roro-input-row { display: none; }

    /* ── Chat area ──────────────────────────────────── */
    .roro-chat {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 14px 14px 6px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      scrollbar-width: thin;
      scrollbar-color: var(--border2) transparent;
    }
    .roro-chat::-webkit-scrollbar       { width: 3px; }
    .roro-chat::-webkit-scrollbar-track { background: transparent; }
    .roro-chat::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }

    /* Date separator */
    .roro-separator {
      text-align: center;
      font-family: var(--ff-mono);
      font-size: 0.52rem;
      color: var(--text3);
      letter-spacing: 0.1em;
      text-transform: uppercase;
      opacity: 0.55;
      padding: 2px 0 6px;
      flex-shrink: 0;
    }

    /* ── Message rows ───────────────────────────────── */
    .roro-msg {
      display: flex;
      flex-direction: column;
      max-width: 84%;
      gap: 3px;
      animation: roroMsgIn 0.28s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes roroMsgIn {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0);    }
    }
    .roro-msg--bot  { align-self: flex-start; align-items: flex-start; }
    .roro-msg--user { align-self: flex-end;   align-items: flex-end;   }

    .roro-bubble {
      padding: 8px 12px;
      border-radius: 16px;
      font-size: 0.82rem;
      line-height: 1.65;
      font-family: var(--ff-body);
      word-break: break-word;
    }
    .roro-msg--bot  .roro-bubble {
      background: var(--bg3);
      border: 1px solid var(--border);
      color: var(--text);
      border-bottom-left-radius: 4px;
    }
    .roro-msg--user .roro-bubble {
      background: var(--accent);
      color: var(--bg);
      border-bottom-right-radius: 4px;
    }

    .roro-timestamp {
      font-family: var(--ff-mono);
      font-size: 0.52rem;
      color: var(--text3);
      letter-spacing: 0.04em;
      padding: 0 4px;
    }

    /* Typing dots */
    .roro-msg--typing .roro-bubble {
      display: flex;
      gap: 5px;
      align-items: center;
      padding: 10px 14px;
    }
    .roro-tdot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: var(--text3);
      animation: roroTypeDot 1.3s ease-in-out infinite;
    }
    .roro-tdot:nth-child(2) { animation-delay: 0.18s; }
    .roro-tdot:nth-child(3) { animation-delay: 0.36s; }
    @keyframes roroTypeDot {
      0%, 60%, 100% { transform: translateY(0);  opacity: 0.38; }
      30%            { transform: translateY(-5px); opacity: 1;   }
    }

    /* ── Quick option chips ─────────────────────────── */
    .roro-options {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      padding: 0 14px 10px;
      animation: roroMsgIn 0.28s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .roro-opt {
      font-family: var(--ff-mono);
      font-size: 0.62rem;
      letter-spacing: 0.06em;
      color: var(--text2);
      border: 1px solid var(--border2);
      background: var(--bg3);
      padding: 5px 11px;
      border-radius: 20px;
      cursor: pointer;
      transition: border-color 0.2s, color 0.2s, background 0.2s;
      outline: none;
      white-space: nowrap;
      line-height: 1;
    }
    .roro-opt:hover {
      border-color: var(--accent);
      color: var(--accent);
      background: var(--bg4);
    }

    /* ── Input row ──────────────────────────────────── */
    .roro-input-row {
      display: flex;
      gap: 8px;
      align-items: center;
      padding: 10px 12px 13px;
      border-top: 1px solid var(--border);
      flex-shrink: 0;
      background: var(--bg2);
    }
    .roro-input {
      flex: 1;
      background: var(--bg3);
      border: 1px solid var(--border2);
      border-radius: 20px;
      color: var(--text);
      font-family: var(--ff-body);
      font-size: 0.82rem;
      padding: 8px 14px;
      outline: none;
      transition: border-color 0.25s;
      resize: none;
      line-height: 1.4;
    }
    .roro-input::placeholder { color: var(--text3); }
    .roro-input:focus         { border-color: var(--accent); }

    .roro-send-btn {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      border: none;
      background: var(--accent);
      color: var(--bg);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: opacity 0.2s, transform 0.15s;
      outline: none;
    }
    .roro-send-btn:hover  { opacity: 0.82; }
    .roro-send-btn:active { transform: scale(0.88); }
    .roro-send-btn svg    { width: 14px; height: 14px; display: block; }

    /* ── Fullscreen layout adjustments ─────────────── */
    .roro-panel--fullscreen .roro-chat,
    .roro-panel--fullscreen .roro-options,
    .roro-panel--fullscreen .roro-input-row {
      max-width: 680px;
      width: 100%;
      margin-left:  auto;
      margin-right: auto;
    }

    /* ── Mobile ─────────────────────────────────────── */
    @media (max-width: 480px) {
      .roro-panel {
        width: calc(100vw - 20px);
        right: 10px;
        bottom: 10px;
      }
      .roro-panel.roro-panel--fullscreen {
        width:  100vw !important;
        right:  0    !important;
        bottom: 0    !important;
      }
    }
  `;

  /* ═══════════════════════════════════════════════════════
     § 1 — SITE KNOWLEDGE BASE
     Everything RoRo knows about MSM's site.
     Extend this section as the site grows.
  ═══════════════════════════════════════════════════════ */

  const KB = {

    owner: {
      name:       'Manomay Shailendra Misra',
      shortName:  'Manomay',
      born:       'August 29, 2008',
      birthplace: 'Andheri, Maharashtra, India',
      city:       'Mumbai',
      tagline:    'Born 2008 · Mumbai · Making something of it all',
      philosophy: 'Building legacy without losing softness.'
    },

    pages: {
      home: {
        label:   'Home',
        summary: "The entry point. Manomay's name, a short tagline, and a curated grid of navigation links covering every section. Clean, minimal, and intentional — the whole site distilled into one scroll.",
        features: ['Animated hero section', 'Theme switcher (4 themes)', 'Music player', 'Navigation grid']
      },
      about: {
        label:   'Identity',
        summary: "Manomay's identity in written form. Part biography, part philosophy — where he came from, what shaped him, and what drives him forward. There's a private layer that requires the site password.",
        features: ['Personal biography', 'Private section (password protected)', 'Portrait photo']
      },
      photos: {
        label:   'Photos',
        summary: "Curated visual moments — public albums open to all, private albums behind a password. Think selective visual diary, not social media feed.",
        features: ['Public photo albums', 'Private albums (password protected)', 'Full-screen viewer with navigation']
      },
      resume: {
        label:   'CV / Résumé',
        summary: "A clean, formal résumé. Experience, education, and skills — all in the same minimalist aesthetic as the rest of the site. A downloadable PDF version is at the bottom.",
        features: ['Work experience', 'Education history', 'Skills list', 'Downloadable PDF']
      },
      projects: {
        label:   'Projects',
        summary: "Where the actual work lives — four categories: Nationals (competition-level initiatives), an E-commerce App, an E-commerce Website, and the Iskon Centre Summer Camp project. Each entry carries a status: Completed, Ongoing, or Planned.",
        features: ['Nationals', 'E-commerce App', 'E-commerce Website', 'Iskon Centre Summer Camp']
      },
      profiles: {
        label:   'Profiles',
        summary: "All of Manomay's public internet presence in one place. LinkedIn, Instagram, and a direct résumé link. No clutter — just the relevant channels.",
        features: ['LinkedIn', 'Instagram', 'Résumé link']
      },
      journey: {
        label:   'Journey',
        summary: "A year-by-year timeline from 2008 to the present. Click any year — read a chapter. The story spans cities across India, tracing a nomadic, high-achieving childhood into a focused present. Some chapters are private.",
        features: ['Interactive timeline (2008 – 2026)', 'Chapter detail for each year', 'Private entries (password protected)']
      },
      birthday: {
        label:   'Clock',
        summary: "A live countdown to Manomay's next birthday — August 29th — running to the millisecond. Birth details are locked behind the site password. On August 29th itself, something in the page changes.",
        features: ['Millisecond countdown', 'Birthday: 29 August 2008', 'Birth details (password protected)', 'Special state on the day']
      },
      thoughts: {
        label:   'Thoughts',
        summary: "Six categories of written beliefs and opinions: Politics, God & Faith, Science, Life & Philosophy, Society & Culture, and Technology. Multiple posts per category. This is where Manomay thinks out loud, unfiltered.",
        features: ['Politics', 'God & Faith', 'Science', 'Life & Philosophy', 'Society & Culture', 'Technology']
      },
      contact: {
        label:   'Contact',
        summary: "A direct message form — name, email, subject, message. Manomay reads every submission. If you're reaching out for the password, explaining your reason significantly improves your chances. Powered by EmailJS.",
        features: ['Contact form', 'EmailJS integration', 'Password request channel']
      },
      lists: {
        label:   'Lists',
        summary: "Curated taste across four categories: Web Series, Books, Places, and Movies. The full list requires the site password. It's a window into what Manomay watches, reads, and wants to experience.",
        features: ['Web Series', 'Books', 'Places', 'Movies', 'Full list is password protected']
      },
      skills: {
        label:   'Traits',
        summary: "A skills matrix with animated progress bars, a running marquee of keywords, and a section on hobbies and interests. Less of a generic skills list — more of an honest map of capability and curiosity.",
        features: ['Animated skill bars', 'Hobbies & interests', 'Running marquee of traits and keywords']
      },
      games: {
        label:   'Games',
        summary: "Five mini-games built directly into the site: Snake, Memory Match, 2048, Reaction Time, and Word Scramble. There's also a private section with games built exclusively for family — accessible via password.",
        features: ['Snake', 'Memory Match', '2048', 'Reaction Time', 'Word Scramble', 'Private family games (password protected)']
      },
      social: {
        label:   'Social Proof',
        summary: "Credibility in one place — a scrolling marquee of organisations and brands Manomay has worked with, alongside written testimonials from collaborators.",
        features: ['Brand / company logos', 'Testimonials', 'Scrolling marquee']
      }
    },

    years: {
      2008: "The Beginning — Born in Maharashtra at the intersection of India's old soul and its financial ambition. The nomadic blueprint was set from day one.",
      2009: "Year One — A period of deep, silent growth. Developing early observation skills, absorbing structure and discipline from the household.",
      2010: "Growing Up — First major move to Jaipur. First school: Star Kids Pre-school. First real social ecosystem outside the family.",
      2011: "Discovery — Double promotion from LKG to UKG in six months. Teachers recognised an exceptional IQ and intrinsic motivation beyond his years.",
      2012: "Early Years — 1st Rank for academic and behavioral excellence. His father was honoured with the school's Best Father Award that same year.",
      2013: "Shifting — Details being written.",
      2014: "New Ground — Details being written.",
      2015: "The Turn — Details being written.",
      2016: "Momentum — Details being written.",
      2017: "Building — Details being written.",
      2018: "Defining — Details being written.",
      2019: "Expanding — Details being written.",
      2020: "The Pause — The year the world stopped. Something changed internally too.",
      2021: "Rebuilding — Details being written.",
      2022: "Acceleration — Details being written.",
      2023: "Clarity — Details being written.",
      2024: "Intention — Details being written.",
      2025: "Transformation — Details being written.",
      2026: "Present — This website exists. That already means something."
    },

    design: {
      summary: "Built entirely from scratch — no templates, no frameworks. Pure HTML, CSS, and JavaScript. Four themes: Noir, Ivory, Slate, Forest. The aesthetic is typographic, geometric, and deliberately minimal. Every animation is hand-coded.",
      stack: ['Vanilla HTML', 'Vanilla CSS', 'Vanilla JavaScript', 'EmailJS for contact form', 'Web Audio API for sound', 'No frameworks']
    },

    password: {
      hint: "Multiple sections carry a password lock — certain photo albums, journal chapters, the full curated lists, and more. The password isn't publicly distributed. Your best route is the Contact page — explain why you want access, and Manomay decides."
    },

    features: {
      music:  "The site has a built-in music player with two tracks — background ambience and a hidden easter-egg song. The vinyl record in the bottom-left corner unlocks after you click the name on the homepage seven times.",
      themes: "Four visual themes: Noir (dark), Ivory (light), Slate (cool grey), and Forest (muted green). The four coloured dots in the top-right switch between them.",
      roro:   "That's me. I'm RoRo — the site's intelligence layer. I know every section, can navigate for you, and can tell you about anything on this site."
    }
  };

  /* ═══════════════════════════════════════════════════════
     § 2 — RESPONSE VARIATION POOLS
     Multiple phrasings per scenario — random selection
     prevents repetition and creates an AI-like feel.
  ═══════════════════════════════════════════════════════ */

  const POOL = {

    /* First visit intro sequence */
    first_hello:  ["Hello.", "Hello there.", "Good to have you here."],
    first_intro:  ["I'm RoRo — I manage everything on this site.", "The name's RoRo. I run the intelligence layer here.", "RoRo. I know every corner of this place."],
    first_name_q: ["Before we go further — what should I call you?", "One thing first. What's your name?", "I like to know who I'm talking to. What should I call you?", "What do people call you?"],

    /* Name acknowledgement */
    name_ack:     [(n) => `Nice to meet you, ${n}.`, (n) => `${n}. Good.`, (n) => `Got it. ${n}.`, (n) => `${n}. I'll remember that.`],
    name_followup:["Ask me anything about the site. I know all of it.", "This place has more layers than it looks. I can guide you.", "I have full access to everything here. Where do you want to start?"],

    /* Returning user */
    return_greet: [(n) => `Welcome back, ${n}.`, (n) => `${n}. You're back.`, (n) => `Good to see you again, ${n}.`, (n) => `Back again, ${n}.`],
    return_prompt:[
      "What would you like to explore today?",
      "Where should we go this time?",
      "What are you looking for?",
      "What brings you back?",
      "Anything specific you want to dive into?"
    ],

    /* Navigation confirmation */
    nav_confirm:  [(p) => `Taking you to ${p}.`, (p) => `Opening ${p}.`, (p) => `${p}. On it.`, (p) => `Navigating to ${p} now.`],

    /* Utility */
    thanks:       ["Any time.", "Of course.", "That's what I'm here for.", "Always.", "Sure thing."],
    compliment:   ["The credit goes to Manomay.", "I just run the systems. He built everything else.", "I'll pass that on.", "Noted. It's his work — I just know it well."],
    surprise:     ["Picking somewhere you might not have been.", "Let's go off-script.", "Random destination incoming."],

    /* Unknown input */
    unknown:      [
      "That's outside my current scope — I'm wired specifically to this site.",
      "I don't have an answer for that. My knowledge is bounded to what's here.",
      "Interesting. But I'm built for this site, not general conversation.",
      "I can't get to that one. My access is specific."
    ],
    unknown_redir:[
      "If you need a real answer, I can route you to the Contact page.",
      "You could always ask Manomay directly — want me to open Contact?",
      "The Contact form is the right channel for things outside my knowledge. Want to go there?"
    ],
    redir_confirm:["Shall I take you to Contact?", "Should I open the Contact page for you?", "Want me to redirect you?"]
  };

  /* ── Helper: pick random item from pool ───────────── */
  function pick(arr, ...args) {
    const item = arr[Math.floor(Math.random() * arr.length)];
    return typeof item === 'function' ? item(...args) : item;
  }

  /* ═══════════════════════════════════════════════════════
     § 3 — NLP-LITE ENGINE
     Token scoring + intent classification + context injection.
     No external library. Handles fuzzy matches, partial words,
     year detection, and page-context awareness.
  ═══════════════════════════════════════════════════════ */

  /* Tokenise input to lowercase word array */
  function tokenise(str) {
    return str.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  }

  /* Score a token array against a keyword list */
  function scoreTokens(tokens, keywords) {
    let score = 0;
    for (const t of tokens) {
      for (const kw of keywords) {
        if (typeof kw === 'string') {
          if (t === kw)              score += 10;
          else if (t.startsWith(kw) || kw.startsWith(t)) score += 4;
        } else if (kw instanceof RegExp && kw.test(t)) {
          score += 10;
        }
      }
    }
    return score;
  }

  /* Intent definitions — each has an id, keyword list, and optional target page */
  const INTENTS = [
    /* — Navigation — */
    { id: 'nav_home',     kw: ['home','main','start','beginning','front','landing'],                          page: 'home' },
    { id: 'nav_about',    kw: ['about','identity','who','person','bio','biography','story','background'],     page: 'about' },
    { id: 'nav_photos',   kw: ['photo','photos','picture','pictures','image','images','gallery','album'],     page: 'photos' },
    { id: 'nav_resume',   kw: ['resume','cv','curriculum','experience','work','career','download','pdf'],     page: 'resume' },
    { id: 'nav_projects', kw: ['project','projects','national','nationals','ecommerce','commerce','iskon','iskcon','camp','build','built'], page: 'projects' },
    { id: 'nav_profiles', kw: ['profiles','profile','linkedin','instagram','social','handle','handles','accounts','links'], page: 'profiles' },
    { id: 'nav_journey',  kw: ['journey','timeline','year','years','history','childhood','past','chapter','2008','2009','2010','2011','2012','2013','2020','2026'], page: 'journey' },
    { id: 'nav_birthday', kw: ['birthday','clock','countdown','timer','born','age','birth','august','29'],   page: 'birthday' },
    { id: 'nav_thoughts', kw: ['thought','thoughts','belief','beliefs','opinion','politics','faith','god','science','philosophy','life','society','culture','tech','technology','blog','post'],  page: 'thoughts' },
    { id: 'nav_contact',  kw: ['contact','message','email','reach','write','talk','send','inbox','form'],    page: 'contact' },
    { id: 'nav_lists',    kw: ['list','lists','series','books','movie','movies','places','watch','read','curation','recommend'], page: 'lists' },
    { id: 'nav_skills',   kw: ['skill','skills','trait','traits','ability','abilities','hobby','hobbies','interest','talent'], page: 'skills' },
    { id: 'nav_games',    kw: ['game','games','play','snake','memory','2048','reaction','word','scramble','fun'], page: 'games' },
    { id: 'nav_social',   kw: ['social','proof','testimonial','testimonials','company','companies','brand','brands','collab'], page: 'social' },

    /* — Information — */
    { id: 'info_current',  kw: ['where','looking','page','current','here','viewing','see','seeing','am i','what is this','open'] },
    { id: 'info_password', kw: ['password','pw','pass','access','private','locked','unlock','key','secret','restricted','gate'] },
    { id: 'info_owner',    kw: ['manomay','he','him','his','who','maker','creator','owner','about him','tell me about'] },
    { id: 'info_site',     kw: ['site','website','this site','built','made','tech','stack','design','aesthetic','how','framework','theme','themes'] },
    { id: 'info_music',    kw: ['music','song','audio','sound','play','track','vinyl','easter'] },
    { id: 'info_design',   kw: ['design','look','aesthetic','theme','colour','color','dark','light','font','style'] },
    { id: 'info_year',     kw: [/^20(0[89]|1[0-9]|2[0-6])$/] },

    /* — Utility — */
    { id: 'thanks',     kw: ['thanks','thank','ty','appreciate','thx','cheers','helpful'] },
    { id: 'compliment', kw: ['nice','great','cool','amazing','love','beautiful','awesome','incredible','good','wow','impressive','perfect','gorgeous','stunning'] },
    { id: 'greeting',   kw: ['hi','hello','hey','sup','yo','hola','howdy','greetings','good morning','good evening'] },
    { id: 'help',       kw: ['help','assist','guide','lost','navigate','how','explain','show me','tell me','what can','options'] },
    { id: 'password_req', kw: ['want','need','request','can i have','give me','get','obtain'] },
    { id: 'surprise',   kw: ['surprise','random','anywhere','whatever','anything','dunno','idk','choose','pick'] },
  ];

  /* Classify best intent from raw input */
  function detectIntent(input) {
    const tokens = tokenise(input);
    let best = null, bestScore = 0;
    for (const intent of INTENTS) {
      const s = scoreTokens(tokens, intent.kw);
      if (s > bestScore) { bestScore = s; best = intent; }
    }
    return bestScore >= 4 ? best : null;
  }

  /* Extract a year (2008–2026) from input, if present */
  function extractYear(input) {
    const m = input.match(/\b(20(0[89]|1[0-9]|2[0-6]))\b/);
    return m ? parseInt(m[1]) : null;
  }

  /* ═══════════════════════════════════════════════════════
     § 4 — RoRoManager CLASS
  ═══════════════════════════════════════════════════════ */

  class RoRoManager {

    constructor() {

      /* Panel and conversation state */
      this._state = {
        isOpen:               false,
        isMinimized:          false,
        isFullscreen:         false,
        hasStarted:           false,
        awaitingName:         false,
        awaitingRedirect:     false,
        lastIntent:           null
      };

      this._userData   = this._loadUser();
      this._queue      = [];          // message queue
      this._queueBusy  = false;       // queue processor lock
      this._optionsEl  = null;        // reference to current options DOM node

      /* Boot sequence */
      this._injectStyles();
      this._buildPanel();
      this._injectNavButton();
      this._bindEvents();
    }

    /* ── § 4.1 Persistence ──────────────────────────── */

    _loadUser() {
      try {
        const raw = localStorage.getItem('roroUser');
        return raw ? JSON.parse(raw) : null;
      } catch { return null; }
    }

    _saveUser(data) {
      try { localStorage.setItem('roroUser', JSON.stringify(data)); } catch {}
    }

    /* ── § 4.2 Style injection ──────────────────────── */

    _injectStyles() {
      if (document.getElementById('roro-styles')) return;
      const el = document.createElement('style');
      el.id          = 'roro-styles';
      el.textContent = RORO_CSS;
      document.head.appendChild(el);
    }

    /* ── § 4.3 Panel DOM construction ───────────────── */

    _buildPanel() {
      this._panel = document.createElement('div');
      this._panel.className   = 'roro-panel';
      this._panel.setAttribute('role', 'dialog');
      this._panel.setAttribute('aria-label', 'RoRo — Website Intelligence');

      this._panel.innerHTML = `
        <div class="roro-header" id="roro-header">
          <div class="roro-avatar" aria-hidden="true">
            <div class="roro-avatar-pulse"></div>
            ${this._svgAvatar()}
          </div>
          <div class="roro-identity">
            <div class="roro-name">RoRo</div>
            <div class="roro-subtitle">Website Manager</div>
            <div class="roro-status">
              <div class="roro-status-dot"></div>
              <span>Active</span>
            </div>
          </div>
          <div class="roro-controls">
            <button class="roro-ctrl" id="roro-minimize"   title="Minimize"   aria-label="Minimize">−</button>
            <button class="roro-ctrl" id="roro-fullscreen" title="Fullscreen" aria-label="Toggle fullscreen">⤢</button>
            <button class="roro-ctrl" id="roro-close"      title="Close"      aria-label="Close">✕</button>
          </div>
          <div class="roro-minimized-label" aria-hidden="true">
            <div class="roro-minimized-dot"></div>
            <span>RoRo · Online</span>
          </div>
        </div>
        <div class="roro-enc-bar">End-to-end encrypted · Messages disappear on reload</div>
        <div class="roro-chat" id="roro-chat" aria-live="polite"></div>
        <div class="roro-input-row">
          <input
            class="roro-input"
            id="roro-input"
            type="text"
            placeholder="Ask anything about this site…"
            autocomplete="off"
            maxlength="320"
            aria-label="Message RoRo"
          />
          <button class="roro-send-btn" id="roro-send" aria-label="Send message">
            ${this._svgSend()}
          </button>
        </div>
      `;

      document.body.appendChild(this._panel);

      /* Cache frequently-used elements */
      this._chatEl  = this._panel.querySelector('#roro-chat');
      this._inputEl = this._panel.querySelector('#roro-input');
    }

    /* ── § 4.4 SVG assets (inline, theme-aware) ──────── */

    _svgAvatar() {
      /* Crosshair / target-ring motif — minimal, not cartoonish */
      return `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9"   stroke="var(--accent)" stroke-width="1"/>
        <circle cx="12" cy="12" r="4.5" stroke="var(--accent)" stroke-width="0.75" opacity="0.5"/>
        <circle cx="12" cy="12" r="1.5" fill="var(--accent)"/>
        <line x1="12" y1="3"  x2="12" y2="7.5" stroke="var(--accent)" stroke-width="0.8"/>
        <line x1="12" y1="16.5" x2="12" y2="21" stroke="var(--accent)" stroke-width="0.8"/>
        <line x1="3"  y1="12" x2="7.5" y2="12" stroke="var(--accent)" stroke-width="0.8"/>
        <line x1="16.5" y1="12" x2="21" y2="12" stroke="var(--accent)" stroke-width="0.8"/>
      </svg>`;
    }

    _svgSend() {
      return `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="22" y1="2" x2="11" y2="13"/>
        <polygon points="22 2 15 22 11 13 2 9 22 2"/>
      </svg>`;
    }

    _svgRoroBtn() {
      /* Person silhouette with a subtle orbit ring — represents an AI assistant */
      return `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" aria-hidden="true">
        <circle cx="12" cy="8.5" r="3.5" stroke="var(--accent)" stroke-width="1.2"/>
        <path d="M5.5 20c0-3.59 2.91-6.5 6.5-6.5s6.5 2.91 6.5 6.5"
          stroke="var(--accent)" stroke-width="1.2" stroke-linecap="round"/>
        <circle cx="12" cy="12" r="10.5" stroke="var(--accent)" stroke-width="0.5" opacity="0.3"/>
      </svg>`;
    }

    /* ── § 4.5 Nav button injection ─────────────────── */

    _injectNavButton() {
      if (document.getElementById('roro-btn')) return;

      const btn = document.createElement('button');
      btn.id    = 'roro-btn';
      btn.title = 'RoRo — Website Assistant';
      btn.setAttribute('aria-label', 'Open RoRo assistant');
      btn.innerHTML = `${this._svgRoroBtn()}<div class="roro-badge" aria-hidden="true"></div>`;

      /* Insert before #music-toggle if it exists, else append to .nav-right */
      const anchor = document.getElementById('music-toggle');
      if (anchor && anchor.parentNode) {
        anchor.parentNode.insertBefore(btn, anchor);
      } else {
        const navRight = document.querySelector('.nav-right');
        if (navRight) navRight.appendChild(btn);
        else document.body.appendChild(btn);
      }
    }

    /* ── § 4.6 Event binding ────────────────────────── */

    _bindEvents() {
      /* Nav button — click anywhere because it may not exist at bind time */
      document.addEventListener('click', (e) => {
        if (e.target.closest('#roro-btn')) this._onNavBtnClick();
      });

      /* Panel controls */
      this._panel.querySelector('#roro-close').addEventListener('click',      (e) => { e.stopPropagation(); this.close(); });
      this._panel.querySelector('#roro-minimize').addEventListener('click',   (e) => { e.stopPropagation(); this.minimize(); });
      this._panel.querySelector('#roro-fullscreen').addEventListener('click', (e) => { e.stopPropagation(); this.toggleFullscreen(); });

      /* Minimized pill click → restore */
      this._panel.querySelector('#roro-header').addEventListener('click', () => {
        if (this._state.isMinimized) this.restore();
      });

      /* Input */
      this._panel.querySelector('#roro-send').addEventListener('click', () => this._submitInput());
      this._inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this._submitInput(); }
      });

      /* ESC closes (unless fullscreen) */
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this._state.isOpen && !this._state.isFullscreen) this.close();
      });
    }

    /* ── § 4.7 Panel mode management ────────────────── */

    _onNavBtnClick() {
      const btn = document.getElementById('roro-btn');
      if (btn) btn.classList.remove('roro-has-unread');

      if (!this._state.isOpen) {
        this.open();
      } else if (this._state.isMinimized) {
        this.restore();
      } else {
        this.minimize();
      }
    }

    open() {
      this._state.isOpen      = true;
      this._state.isMinimized = false;
      this._panel.classList.add('roro-panel--open');
      this._panel.classList.remove('roro-panel--minimized');
      const btn = document.getElementById('roro-btn');
      if (btn) btn.classList.add('roro-btn--active');

      if (!this._state.hasStarted) {
        this._state.hasStarted = true;
        this._addSeparator();
        this._startConversation();
      }

      setTimeout(() => { this._inputEl.focus(); }, 380);
    }

    close() {
      this._state.isOpen       = false;
      this._state.isMinimized  = false;
      this._state.isFullscreen = false;
      this._panel.classList.remove('roro-panel--open', 'roro-panel--minimized', 'roro-panel--fullscreen');
      const btn = document.getElementById('roro-btn');
      if (btn) btn.classList.remove('roro-btn--active');
    }

    minimize() {
      this._state.isMinimized = true;
      this._panel.classList.add('roro-panel--minimized');
      this._panel.classList.remove('roro-panel--fullscreen');
      this._state.isFullscreen = false;
    }

    restore() {
      this._state.isMinimized = false;
      this._panel.classList.remove('roro-panel--minimized');
      setTimeout(() => { this._inputEl.focus(); }, 200);
    }

    toggleFullscreen() {
      this._state.isFullscreen = !this._state.isFullscreen;
      this._state.isMinimized  = false;
      this._panel.classList.remove('roro-panel--minimized');
      this._panel.classList.toggle('roro-panel--fullscreen', this._state.isFullscreen);
      const fsBtn = this._panel.querySelector('#roro-fullscreen');
      if (fsBtn) fsBtn.textContent = this._state.isFullscreen ? '⤡' : '⤢';
    }

    /* ── § 4.8 Conversation flow ─────────────────────── */

    _startConversation() {
      if (this._userData && this._userData.name) {
        /* Returning user */
        const n = this._userData.name;
        this._enqueue(pick(POOL.return_greet, n));
        this._enqueue(pick(POOL.return_prompt));
        this._enqueue(null, () => this._renderOptions(this._contextualOptions()));
      } else {
        /* First visit */
        this._enqueue(pick(POOL.first_hello));
        this._enqueue(pick(POOL.first_intro));
        this._enqueue(pick(POOL.first_name_q));
        this._state.awaitingName = true;
      }
    }

    /* ── § 4.9 Input processing ──────────────────────── */

    _submitInput() {
      const text = this._inputEl.value.trim();
      if (!text) return;
      this._inputEl.value = '';
      this._clearOptions();
      this._addUserMsg(text);
      this._route(text);
    }

    _route(text) {

      /* Name capture */
      if (this._state.awaitingName) {
        this._state.awaitingName = false;
        const name = this._parseName(text);
        this._userData = { name, visited: true };
        this._saveUser(this._userData);
        this._enqueue(pick(POOL.name_ack, name));
        this._enqueue(pick(POOL.name_followup));
        this._enqueue(null, () => this._renderOptions(this._contextualOptions()));
        return;
      }

      /* Contact redirect confirmation */
      if (this._state.awaitingRedirect) {
        this._state.awaitingRedirect = false;
        if (/^(yes|sure|ok|yeah|yep|please|go|take|open|redirect|y)$/i.test(text.trim())) {
          this._enqueue(pick(POOL.nav_confirm, 'Contact'));
          this._enqueue(null, () => this._go('contact'));
        } else {
          this._enqueue("Understood. Ask me anything else.");
          this._enqueue(null, () => this._renderOptions(this._contextualOptions().slice(0, 4)));
        }
        return;
      }

      /* Main engine */
      const resp = this.getBotResponse(text, this._currentPage());
      this._dispatchResponse(resp);
    }

    /* ── § 4.10 Response dispatch ────────────────────── */

    _dispatchResponse(resp) {
      if (!resp) return;

      if (typeof resp === 'string') {
        this._enqueue(resp);
        return;
      }

      if (resp.messages) resp.messages.forEach(m => this._enqueue(m));

      if (resp.navigate) {
        this._enqueue(null, () => this._go(resp.navigate));
        /* Post-navigation context note */
        const pd = KB.pages[resp.navigate];
        if (pd) {
          const note = `You're now on ${pd.label}.`;
          this._enqueue(null, () => {
            setTimeout(() => {
              this._enqueue(note);
              if (resp.options) this._enqueue(null, () => this._renderOptions(resp.options));
            }, 600);
          });
          return;
        }
      }

      if (resp.awaitRedirect) {
        this._state.awaitingRedirect = true;
      }

      if (resp.options) {
        this._enqueue(null, () => this._renderOptions(resp.options));
      }
    }

    /* ── § 4.11 Core response engine ─────────────────── */

    getBotResponse(input, context) {
      const intent = detectIntent(input);
      const page   = context || this._currentPage();
      const year   = extractYear(input);

      /* Year query on journey page or elsewhere */
      if (year && KB.years[year]) {
        return {
          messages: [
            `${year} — ${KB.years[year]}`,
            "You can explore the full timeline on the Journey page."
          ],
          options: ["Show me the Journey", "Tell me about another year", "Who is Manomay?"]
        };
      }

      if (!intent) {
        return {
          messages: [pick(POOL.unknown), pick(POOL.unknown_redir)],
          awaitRedirect: true
        };
      }

      /* — Navigation intents — */
      if (intent.id.startsWith('nav_') && intent.page) {
        const pd = KB.pages[intent.page];
        if (!pd) return { messages: ["On it."], navigate: intent.page };
        return {
          messages: [pick(POOL.nav_confirm, pd.label), pd.summary],
          navigate: intent.page,
          options:  this._pageFollowOptions(intent.page)
        };
      }

      /* — Current page info — */
      if (intent.id === 'info_current') {
        const pd = KB.pages[page];
        if (pd) {
          return {
            messages: [`You're currently on the ${pd.label} page.`, pd.summary],
            options:  this._pageFollowOptions(page)
          };
        }
        return { messages: ["You're on the site. Use the navigation above to explore any section."] };
      }

      /* — Password — */
      if (intent.id === 'info_password' || intent.id === 'password_req') {
        return {
          messages: [
            "Several sections carry a password lock.",
            KB.password.hint
          ],
          options: ["Take me to Contact", "What sections are locked?", "Who is Manomay?"]
        };
      }

      /* — Owner / Manomay — */
      if (intent.id === 'info_owner') {
        const o = KB.owner;
        return {
          messages: [
            `${o.name}. Born ${o.born}, ${o.birthplace}.`,
            `"${o.philosophy}"`,
            "The Identity and Journey pages tell the full story."
          ],
          options: ["Show me Identity", "Show me the Journey", "Show me Projects"]
        };
      }

      /* — Site info — */
      if (intent.id === 'info_site') {
        return {
          messages: [
            `${KB.owner.name}'s personal site — built from scratch, no templates, no frameworks.`,
            KB.design.summary,
            "It has 14 sections, four themes, a music player, mini-games, and a few things that only appear under specific conditions."
          ],
          options: ["Show me Projects", "Tell me about the design", "Show me the Journey", "Take me to Games"]
        };
      }

      /* — Design / themes — */
      if (intent.id === 'info_design') {
        return {
          messages: [
            "Four visual themes: Noir, Ivory, Slate, and Forest. The four coloured dots in the top-right corner switch between them.",
            "The aesthetic is typographic, geometric, deliberately minimal. Everything you see is hand-coded."
          ],
          options: ["What else is here?", "Show me Projects", "Who is Manomay?"]
        };
      }

      /* — Music / easter egg — */
      if (intent.id === 'info_music') {
        return {
          messages: [
            "There's a built-in music player — background ambience loops by default.",
            "There's also a hidden easter-egg song. It unlocks when you click Manomay's name on the homepage exactly seven times. A vinyl record then appears in the bottom-left corner."
          ],
          options: ["Take me to Home", "What other secrets are there?", "Show me Games"]
        };
      }

      /* — Greeting — */
      if (intent.id === 'greeting') {
        const n = this._userData?.name;
        return {
          messages: [n ? `${n}.` : "Hello.", "What do you need?"],
          options: this._contextualOptions()
        };
      }

      /* — Thanks — */
      if (intent.id === 'thanks') {
        return {
          messages: [pick(POOL.thanks)],
          options: this._contextualOptions().slice(0, 4)
        };
      }

      /* — Compliment — */
      if (intent.id === 'compliment') {
        return {
          messages: [pick(POOL.compliment)],
          options: this._contextualOptions().slice(0, 3)
        };
      }

      /* — Help — */
      if (intent.id === 'help') {
        return {
          messages: [
            "I can describe any section of this site, navigate there, answer questions about Manomay, or point you to the contact form.",
            "Try: 'What is this site?', 'Show me Projects', 'How do I get the password?', or just tell me where you want to go."
          ],
          options: ["What is this site?", "Who is Manomay?", "Take me to Contact", "Show me Projects", "Surprise me"]
        };
      }

      /* — Surprise — */
      if (intent.id === 'surprise') {
        const ids     = Object.keys(KB.pages);
        const randId  = ids[Math.floor(Math.random() * ids.length)];
        const pd      = KB.pages[randId];
        return {
          messages: [pick(POOL.surprise), `Let's go to ${pd.label}.`, pd.summary],
          navigate: randId
        };
      }

      /* — Year intent from intent map — */
      if (intent.id === 'info_year') {
        return {
          messages: ["Which year are you curious about? I have information from 2008 to 2026."],
          options: ["2008", "2010", "2011", "2012", "2020", "Show me Journey"]
        };
      }

      /* — Fallback — */
      return {
        messages: [pick(POOL.unknown), pick(POOL.unknown_redir)],
        awaitRedirect: true
      };
    }

    /* ── § 4.12 Quick options ─────────────────────────── */

    _contextualOptions() {
      const page = this._currentPage();

      const shared = [
        "Who is Manomay?",
        "What is this site?",
        "Show me Projects",
        "Take me to Contact",
        "Show me Games",
        "Surprise me"
      ];

      const pageSpecific = {
        home:     ["Explore the site", "Tell me about the design"],
        about:    ["Show me the Journey", "How do I get the password?"],
        resume:   ["See Projects too", "Take me to Contact"],
        projects: ["Show me the CV", "More about Manomay"],
        journey:  ["Tell me about 2008", "Tell me about 2020"],
        birthday: ["When is the birthday?", "What happens on the day?"],
        thoughts: ["Show me the Politics section", "Show me the Tech section"],
        games:    ["What games are here?", "Show me Projects"],
        photos:   ["How do I access private albums?", "Take me to Contact"],
        contact:  ["What can I ask you?", "Show me Projects"],
        lists:    ["How do I unlock the full list?", "Show me Games"],
        skills:   ["Show me Projects", "Show me the Journey"],
        profiles: ["Show me CV", "Take me to Contact"],
        social:   ["Show me Projects", "Who is Manomay?"]
      };

      return [...(pageSpecific[page] || []), ...shared].slice(0, 6);
    }

    _pageFollowOptions(pageId) {
      const others = Object.values(KB.pages)
        .filter(p => p.label !== KB.pages[pageId]?.label)
        .slice(0, 2)
        .map(p => `Show me ${p.label}`);
      return ["What else is here?", ...others, "Take me to Contact"].slice(0, 4);
    }

    _renderOptions(options) {
      this._clearOptions();
      if (!options || !options.length) return;

      const wrap = document.createElement('div');
      wrap.className = 'roro-options';

      options.forEach(text => {
        const btn = document.createElement('button');
        btn.className   = 'roro-opt';
        btn.textContent = text;
        btn.addEventListener('click', () => {
          this._clearOptions();
          this._addUserMsg(text);
          this._route(text);
        });
        wrap.appendChild(btn);
      });

      this._chatEl.appendChild(wrap);
      this._optionsEl = wrap;
      this._scrollBottom();
    }

    _clearOptions() {
      if (this._optionsEl && this._optionsEl.parentNode) {
        this._optionsEl.remove();
      }
      this._optionsEl = null;
    }

    /* ── § 4.13 Message queue & rendering ───────────── */

    /* Queue a bot message (text) with optional callback after render */
    _enqueue(text, callback) {
      this._queue.push({ text, callback });
      if (!this._queueBusy) this._processQueue();
    }

    _processQueue() {
      if (!this._queue.length) { this._queueBusy = false; return; }
      this._queueBusy = true;

      const { text, callback } = this._queue.shift();

      /* Callback-only slot (used to trigger options/navigation after text) */
      if (!text && callback) {
        setTimeout(() => { callback(); this._processQueue(); }, 150);
        return;
      }

      /* Show typing indicator */
      const typing = this._addTypingIndicator();
      this._scrollBottom();

      /* Delay scales with message length, bounded to feel natural */
      const delay = Math.min(420 + Math.random() * 480 + (text?.length || 0) * 14, 2100);

      setTimeout(() => {
        typing.remove();
        this._addBotMsg(text || '', callback, () => this._processQueue());
      }, delay);
    }

    _addTypingIndicator() {
      const wrap = document.createElement('div');
      wrap.className = 'roro-msg roro-msg--bot roro-msg--typing';
      wrap.innerHTML = `<div class="roro-bubble"><div class="roro-tdot"></div><div class="roro-tdot"></div><div class="roro-tdot"></div></div>`;
      this._chatEl.appendChild(wrap);
      this._scrollBottom();
      return wrap;
    }

    _addBotMsg(text, preCallback, done) {
      const wrap   = document.createElement('div');
      wrap.className = 'roro-msg roro-msg--bot';

      const bubble = document.createElement('div');
      bubble.className = 'roro-bubble';

      const ts = document.createElement('div');
      ts.className   = 'roro-timestamp';
      ts.textContent = this._now();

      wrap.appendChild(bubble);
      wrap.appendChild(ts);
      this._chatEl.appendChild(wrap);
      this._scrollBottom();

      if (preCallback) preCallback();

      /* Character-by-character typing effect */
      this._type(bubble, text, () => {
        this._scrollBottom();
        done && done();
      });
    }

    _type(el, text, done) {
      const chars = [...text];
      let i = 0;
      const tick = () => {
        if (i >= chars.length) { done && done(); return; }
        el.textContent += chars[i++];
        this._scrollBottom();
        setTimeout(tick, 10 + Math.random() * 20);
      };
      tick();
    }

    _addUserMsg(text) {
      const wrap = document.createElement('div');
      wrap.className = 'roro-msg roro-msg--user';
      wrap.innerHTML = `
        <div class="roro-bubble">${this._esc(text)}</div>
        <div class="roro-timestamp">${this._now()}</div>
      `;
      this._chatEl.appendChild(wrap);
      this._scrollBottom();
    }

    _addSeparator() {
      const sep = document.createElement('div');
      sep.className   = 'roro-separator';
      sep.textContent = this._today();
      this._chatEl.appendChild(sep);
    }

    /* ── § 4.14 Navigation ───────────────────────────── */

    _go(pageId) {
      if (typeof window.navigateTo === 'function') {
        window.navigateTo(pageId);
      }
    }

    /* ── § 4.15 Utilities ────────────────────────────── */

    _currentPage() {
      const active = document.querySelector('.page.active');
      if (!active) return 'home';
      return active.id.replace('page-', '') || 'home';
    }

    _parseName(input) {
      const cleaned = input
        .replace(/^(i am|i'm|im|my name is|call me|it's|its|they call me|name's|names|just)\s+/i, '')
        .replace(/[^a-zA-Z\s'-]/g, '')
        .trim();
      const words = cleaned.split(/\s+/).slice(0, 2);
      return words.map(w => w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : '').join(' ').trim() || 'friend';
    }

    _scrollBottom() {
      requestAnimationFrame(() => {
        this._chatEl.scrollTop = this._chatEl.scrollHeight;
      });
    }

    _now() {
      return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    _today() {
      return new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
    }

    _esc(str) {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

  } // end class RoRoManager

  /* ═══════════════════════════════════════════════════════
     § 5 — EXPORT & AUTO-INITIALISATION
  ═══════════════════════════════════════════════════════ */

  window.RoRoManager = RoRoManager;

  document.addEventListener('DOMContentLoaded', () => {
    window.roro = new RoRoManager();
  });

})(); // end IIFE
