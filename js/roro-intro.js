/* ═══════════════════════════════════════════════════════════════════════
   js/roro-intro.js  ·  MSM Cinematic Experience  ·  v4.0
   ────────────────────────────────────────────────────────────────────
   PHASE 1 — Cinematic Intro
     · Atmospheric particle canvas (mouse-aware dust, golden)
     · M · S · M materialises from blur with chromatic aberration
     · Cinematic scan-flash + camera shake (Math.sin organic motion)
     · Smooth crossfade → MANOMAY SHAILENDRA MISRA on ONE LINE
     · Typewriter reveal for tails (anomay / hailendra / isra)
     · Spotlight vignette, film grain, breathing glow

   PHASE 2 — Loading Screen
     · Ghost clock · Welcome · Facts · Progress bar
     · Terminal log — CLICK TO EXPAND/COLLAPSE (messages in random order)
     · Continue → page transition

   Dependency: GSAP 3.12.5 injected dynamically from cdnjs.
   Fallback mini-tween engine activates if CDN fails.
   ────────────────────────────────────────────────────────────────────
   index.html checklist (same as v3 — no changes needed):
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

  window._roroActive = true;
  var _origPlay = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () {
    if (window._roroActive && (this.id === 'bg-music' || this.id === 'rain-song')) {
      return Promise.resolve();
    }
    return _origPlay.apply(this, arguments);
  };

  /* ─────────────────────────────────────────────────────────────────
     GSAP — load from CDN, fall back to mini-tween engine
  ───────────────────────────────────────────────────────────────── */
  var _gsapReady = false;
  var _gsapQueue = [];

  function whenGsap(fn) {
    if (_gsapReady) { fn(); return; }
    _gsapQueue.push(fn);
  }

  (function injectGsap() {
    if (window.gsap) { _gsapReady = true; return; }
    var sc = document.createElement('script');
    sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js';
    function activate() {
      if (!window.gsap) window.gsap = _buildMiniGsap();
      _gsapReady = true;
      _gsapQueue.forEach(function (f) { f(); });
      _gsapQueue = [];
    }
    sc.onload = activate;
    sc.onerror = activate;
    document.head.appendChild(sc);
  })();

  /* ── Lightweight fallback animation engine (used only if CDN fails) ── */
  function _buildMiniGsap() {
    var tweens = [];
    var rafId  = null;

    function easeOut3(t) { return 1 - Math.pow(1 - t, 3); }
    function easeExpo(t) { return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t); }
    function easeBack(t) { var c = 1.70158 + 1; return c * t * t * t - 1.70158 * t * t; }
    function easeOutBack(t) { return 1 + easeBack(t - 1); }
    function resolveEase(s) {
      if (!s) return function (t) { return t; };
      if (s === 'power3.out' || s === 'expo.out') return s === 'expo.out' ? easeExpo : easeOut3;
      if (s === 'back.out(1.7)') return easeOutBack;
      if (s === 'power2.out')    return function (t) { return 1 - Math.pow(1 - t, 2); };
      if (s === 'power2.in')     return function (t) { return t * t; };
      if (s === 'power3.in')     return function (t) { return t * t * t; };
      if (s === 'sine.inOut')    return function (t) { return -(Math.cos(Math.PI * t) - 1) / 2; };
      return function (t) { return t; };
    }

    function cssApply(el, key, val) {
      if (!el || !el.style) return;
      if (key === 'opacity') { el.style.opacity = val; return; }
      if (key === 'y')       { el._rsY = val; el.style.transform = _buildTransform(el); return; }
      if (key === 'scale')   { el._rsSc = val; el.style.transform = _buildTransform(el); return; }
      if (key === 'x')       { el._rsX = val; el.style.transform = _buildTransform(el); return; }
    }
    function _buildTransform(el) {
      var t = '';
      if (el._rsX  != null) t += 'translateX(' + el._rsX  + 'px) ';
      if (el._rsY  != null) t += 'translateY(' + el._rsY  + 'px) ';
      if (el._rsSc != null) t += 'scale('      + el._rsSc + ') ';
      return t.trim();
    }
    function getFrom(el, key) {
      if (key === 'opacity') return parseFloat(el.style.opacity) || 0;
      if (key === 'y')       return el._rsY  || 0;
      if (key === 'x')       return el._rsX  || 0;
      if (key === 'scale')   return el._rsSc || 1;
      return 0;
    }

    function tick() {
      var now = performance.now();
      var alive = [];
      tweens.forEach(function (tw) {
        var elapsed = now - tw.start;
        var t = Math.min(elapsed / tw.dur, 1);
        var e = tw.easeF(t);
        Object.keys(tw.to).forEach(function (k) {
          cssApply(tw.el, k, tw.from[k] + (tw.to[k] - tw.from[k]) * e);
        });
        if (t < 1) { alive.push(tw); }
        else if (tw.onComplete) { try { tw.onComplete(); } catch (er) {} }
      });
      tweens = alive;
      rafId = tweens.length ? requestAnimationFrame(tick) : null;
    }

    function kick() { if (!rafId) rafId = requestAnimationFrame(tick); }

    function addTween(el, fromObj, toObj, opts) {
      var dur   = Math.max(1, (opts.duration || 0.5) * 1000);
      var delay = (opts.delay   || 0) * 1000;
      var from  = {};
      Object.keys(toObj).forEach(function (k) {
        from[k] = fromObj && fromObj[k] != null ? fromObj[k] : getFrom(el, k);
      });
      setTimeout(function () {
        tweens.push({ el: el, from: from, to: toObj, dur: dur,
          start: performance.now(), easeF: resolveEase(opts.ease),
          onComplete: opts.onComplete });
        kick();
      }, delay);
    }

    var api = {
      set: function (el, props) {
        ['opacity','y','x','scale'].forEach(function (k) {
          if (props[k] != null) cssApply(el, k, props[k]);
        });
        if (props.filter != null && el && el.style) el.style.filter = props.filter;
        if (props.width  != null && el && el.style) el.style.width  = props.width;
      },
      to: function (el, props) {
        var toObj = {}; var opts = {};
        ['opacity','y','x','scale'].forEach(function (k) { if (props[k] != null) toObj[k] = props[k]; });
        ['duration','delay','ease','onComplete','onStart'].forEach(function (k) { if (props[k] != null) opts[k] = props[k]; });
        if (props.onStart) { setTimeout(function () { try { props.onStart(); } catch(e) {} }, (opts.delay || 0) * 1000); }
        addTween(el, null, toObj, opts);
      },
      fromTo: function (el, from, to, opts) {
        if (from.opacity != null) el.style.opacity = from.opacity;
        if (from.y  != null) { el._rsY  = from.y;  el.style.transform = _buildTransform(el); }
        if (from.scale != null) { el._rsSc = from.scale; el.style.transform = _buildTransform(el); }
        var toObj = {}; ['opacity','y','x','scale'].forEach(function (k) { if (to[k] != null) toObj[k] = to[k]; });
        addTween(el, from, toObj, opts || to);
      },
      timeline: function () {
        var cursor = 0;
        var tl = {
          to: function (el, props, pos) {
            var t = _resolvePos(pos, cursor, props.duration || 0.5);
            cursor = t + (props.duration || 0.5);
            api.to(el, Object.assign({}, props, { delay: t }));
            return tl;
          },
          fromTo: function (el, from, to, pos) {
            var dur = to.duration || 0.5;
            var t = _resolvePos(pos, cursor, dur);
            cursor = t + dur;
            api.fromTo(el, from, Object.assign({}, to, { delay: t }), to);
            return tl;
          },
          set: function (el, props) { api.set(el, props); return tl; },
          call: function (fn, args, pos) {
            var t = _resolvePos(pos, cursor, 0);
            setTimeout(function () { try { fn.apply(null, args || []); } catch(e) {} }, t * 1000);
            return tl;
          },
          add: function (fnOrLabel, pos) {
            if (typeof fnOrLabel === 'function') {
              var t = _resolvePos(pos, cursor, 0);
              setTimeout(function () { try { fnOrLabel(); } catch (e) {} }, t * 1000);
            }
            return tl;
          }
        };
        function _resolvePos(pos, cur, dur) {
          if (pos == null) return cur;
          if (typeof pos === 'number') return pos;
          if (typeof pos === 'string' && pos.startsWith('+=')) return cur + parseFloat(pos.slice(2));
          return parseFloat(pos) || cur;
        }
        return tl;
      }
    };
    return api;
  }

  /* ═════════════════════════════════════════════════════════════════════
     CSS — all styles injected, zero external dependencies
  ═════════════════════════════════════════════════════════════════════ */
  var CSS = `
    #cursor-dot, #cursor-ring { z-index: 9999999 !important; }

    /* ── Root splash wrapper ── */
    #roro-splash {
      position: fixed; inset: 0; z-index: 999998;
      background: var(--bg, #080808);
      overflow: hidden;
      opacity: 0;
      transition: opacity 0.4s ease;
    }
    #roro-splash.rs-show { opacity: 1; }

    /* ── Particle canvas ── */
    #rs-canvas {
      position: absolute; inset: 0;
      width: 100%; height: 100%;
      pointer-events: none; z-index: 0;
    }

    /* ── Film grain ── */
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

    /* ════════════════════════════════════════
       PHASE 1 — Cinematic Intro
    ════════════════════════════════════════ */

    #rs-intro {
      position: absolute; inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2;
      pointer-events: none;
    }

    .rs-intro-stage {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0;
    }

    /* ── Opening accent line ── */
    #rs-intro-line {
      height: 1px; width: 0; opacity: 0;
      background: linear-gradient(90deg,
        transparent 0%,
        var(--accent, #c8a96e) 50%,
        transparent 100%
      );
      box-shadow:
        0 0 12px var(--accent, #c8a96e),
        0 0 40px rgba(200,169,110,0.25),
        0 0 80px rgba(200,169,110,0.08);
      margin-bottom: 2.8rem;
    }

    /* ── Name zone: shared grid so initials + fullname overlap cleanly ── */
    .rs-name-zone {
      display: grid;
      place-items: center;
      position: relative;
    }
    .rs-name-zone > * { grid-area: 1 / 1; }

    /* ── M · S · M initials ── */
    #rs-initials {
      display: flex;
      align-items: center;
      gap: clamp(1rem, 3.2vw, 2.6rem);
      opacity: 0;
      will-change: transform, opacity, filter;
      position: relative;
    }

    /* Radial bloom behind initials */
    #rs-initials::before {
      content: '';
      position: absolute;
      inset: -80px;
      background: radial-gradient(ellipse 65% 55% at 50% 50%,
        rgba(200,169,110,0.09) 0%, transparent 70%);
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.8s ease;
      z-index: -1;
    }
    #rs-initials.bloom-on::before { opacity: 1; }

    .rs-letter {
      font-family: var(--ff-display, 'Playfair Display', serif);
      font-size: clamp(5.5rem, 13vw, 11rem);
      font-weight: 300;
      font-style: italic;
      color: var(--accent, #c8a96e);
      line-height: 1;
      display: block;
      will-change: transform, opacity, filter, text-shadow;
    }

    .rs-dot {
      font-family: var(--ff-display, 'Playfair Display', serif);
      font-size: clamp(2.2rem, 5.5vw, 5rem);
      color: var(--text3, #555);
      opacity: 0.3;
      line-height: 1;
      align-self: center;
      margin-bottom: 0.04em;
    }

    /* ── Horizontal scan flash (theatrical projector burst) ── */
    #rs-scan-flash {
      position: absolute;
      left: 0; right: 0;
      top: 50%;
      height: 3px;
      background: linear-gradient(90deg,
        transparent 0%,
        rgba(200,169,110,0.7) 30%,
        rgba(255,255,255,0.5) 50%,
        rgba(200,169,110,0.7) 70%,
        transparent 100%
      );
      box-shadow: 0 0 30px rgba(200,169,110,0.4);
      pointer-events: none;
      z-index: 5;
      opacity: 0;
      transform-origin: left center;
    }

    /* ── Full name — ONE HORIZONTAL LINE ── */
    #rs-fullname {
      display: flex;
      align-items: baseline;
      gap: 0.25em;
      opacity: 0;
      white-space: nowrap;
      will-change: transform, opacity, filter;
      flex-wrap: nowrap;
    }

    .rs-fn-word {
      display: inline-flex;
      align-items: baseline;
    }

    /* Highlighted initial: accent gold, slightly larger weight */
    .rs-fn-initial {
      font-family: var(--ff-display, 'Playfair Display', serif);
      font-size: clamp(2rem, 5.4vw, 5rem);
      font-weight: 400;
      font-style: italic;
      color: var(--accent, #c8a96e);
      line-height: 1;
      display: inline-block;
      will-change: opacity, transform, filter;
      opacity: 0;
      /* Subtle glow on initials */
      text-shadow:
        0 0 20px rgba(200,169,110,0.35),
        0 0 60px rgba(200,169,110,0.12);
    }

    /* Typed tail letters: theme white */
    .rs-fn-tail {
      font-family: var(--ff-display, 'Playfair Display', serif);
      font-size: clamp(2rem, 5.4vw, 5rem);
      font-weight: 300;
      font-style: italic;
      color: var(--text, #f0ebe0);
      line-height: 1;
      display: inline;
      letter-spacing: 0.005em;
    }

    /* Individual typed character — fades + slides up from 6px */
    .rs-char {
      display: inline-block;
      opacity: 0;
      transform: translateY(6px);
      will-change: opacity, transform;
    }

    /* ── Underline below full name ── */
    #rs-intro-underline {
      height: 1px;
      width: 0;
      opacity: 0;
      margin-top: 1.2rem;
      background: var(--accent, #c8a96e);
      box-shadow:
        0 0 10px var(--accent, #c8a96e),
        0 0 30px rgba(200,169,110,0.2);
    }

    /* ════════════════════════════════════════
       PHASE 2 — Loading Screen
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

    /* Grid overlay */
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

    /* Grain re-applied in loader (same class) */

    /* CRT scan */
    .rs-scan {
      position: absolute; left: 0; right: 0;
      height: 120px; pointer-events: none; z-index: 1; top: -120px;
      background: linear-gradient(to bottom,
        transparent 0%,
        rgba(255,255,255,0.011) 50%,
        transparent 100%
      );
      animation: rsScanMove 9s linear infinite;
    }
    @keyframes rsScanMove { 0% { top: -120px; } 100% { top: 100%; } }

    /* Film strips */
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

    /* ── Ghost clock ── */
    .rs-ghost {
      position: absolute; top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      display: flex; flex-direction: column; align-items: center;
      gap: 2.4rem;
      opacity: 0; user-select: none; pointer-events: none; z-index: 0;
      transition: opacity 2.5s ease;
    }
    .rs-ghost.rs-on { opacity: 0.036; }

    .rs-ghost-time-row {
      display: flex; align-items: flex-start; line-height: 1;
    }
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

    /* ── Inner content column ── */
    .rs-inner {
      position: relative; z-index: 2;
      width: 100%; max-width: 520px; padding: 0 3rem;
      display: flex; flex-direction: column; align-items: center;
    }

    /* ── Welcome ── */
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

    /* ── Facts / hints ── */
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

    /* ── Progress bar ── */
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
      width: 0%;
      background: var(--accent, #c8a96e);
      transition: width 0.38s cubic-bezier(0.4,0,0.2,1);
    }
    .rs-fill::after {
      content: ''; position: absolute;
      top: 0; bottom: 0; right: -60px; width: 60px;
      background: linear-gradient(90deg,
        transparent, rgba(255,255,255,0.38), transparent);
      animation: rsShimmer 2s ease-in-out infinite;
    }
    @keyframes rsShimmer { 0%,100% { opacity:0; } 50% { opacity:1; } }
    .rs-pct {
      font-family: var(--ff-mono, monospace); font-size: 0.54rem;
      color: var(--text3, #555); letter-spacing: 0.06em;
      min-width: 3.5ch; text-align: right; flex-shrink: 0;
    }

    /* ════════════════════════════════════════
       TERMINAL + LOG PANEL
    ════════════════════════════════════════ */

    /* Outer wrapper that holds both panel and bar */
    .rs-terminal-wrap {
      width: 100%;
      margin-bottom: 1.6rem;
      opacity: 0; transition: opacity 0.4s ease;
    }
    .rs-terminal-wrap.rs-on { opacity: 1; }

    /* Log panel — expands above terminal bar when clicked */
    .rs-log-panel {
      width: 100%;
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.45s cubic-bezier(0.16,1,0.3,1);
      border: 1px solid transparent;
      border-bottom: none;
      border-radius: 4px 4px 0 0;
      background: rgba(200,169,110,0.018);
    }
    .rs-log-panel.rs-open {
      max-height: 240px;
      overflow-y: auto;
      border-color: var(--border2, #222);
    }
    .rs-log-panel::-webkit-scrollbar { width: 3px; }
    .rs-log-panel::-webkit-scrollbar-track { background: transparent; }
    .rs-log-panel::-webkit-scrollbar-thumb {
      background: var(--border2, #222); border-radius: 2px;
    }

    /* Panel header */
    .rs-log-header {
      display: flex; align-items: center;
      justify-content: space-between;
      padding: 0.55rem 0.85rem 0.4rem;
      border-bottom: 1px solid var(--border2, #222);
    }
    .rs-log-title {
      font-family: var(--ff-mono, monospace);
      font-size: 0.52rem;
      color: var(--accent, #c8a96e);
      letter-spacing: 0.14em;
      text-transform: uppercase;
    }
    .rs-log-close {
      font-family: var(--ff-mono, monospace);
      font-size: 0.5rem;
      color: var(--text3, #555);
      letter-spacing: 0.08em;
    }

    /* Entries */
    .rs-log-entries {
      padding: 0.55rem 0.85rem 0.7rem;
      display: flex; flex-direction: column; gap: 0.38rem;
    }
    .rs-log-entry {
      font-family: var(--ff-mono, monospace);
      font-size: 0.545rem;
      color: var(--text3, #555);
      letter-spacing: 0.05em;
      line-height: 1.5;
      opacity: 0;
      transform: translateY(4px);
      transition: opacity 0.18s ease, transform 0.18s ease;
    }
    .rs-log-entry.rs-on {
      opacity: 1; transform: translateY(0);
    }
    .rs-log-entry::before {
      content: '  › ';
      color: var(--accent, #c8a96e);
      opacity: 0.45;
    }
    .rs-log-entry.rs-log-done { color: var(--text, #f0ebe0); opacity: 0; }
    .rs-log-entry.rs-log-done.rs-on { opacity: 1; }
    .rs-log-entry.rs-log-done::before {
      content: '  ✓ ';
      color: var(--accent, #c8a96e);
      opacity: 0.85;
    }

    /* Terminal bar itself — clickable */
    .rs-terminal {
      display: flex; align-items: center; gap: 0.65rem;
      padding: 0.52rem 0.8rem;
      border-left: 2px solid var(--accent, #c8a96e);
      background: rgba(200,169,110,0.026);
      cursor: pointer;
      user-select: none;
      transition: background 0.25s ease;
    }
    .rs-terminal:hover { background: rgba(200,169,110,0.052); }

    /* When log open: top border connects panel to bar */
    .rs-terminal-wrap.rs-log-open .rs-terminal {
      border-top: 1px solid var(--border2, #222);
    }

    .rs-term-prefix {
      font-family: var(--ff-mono, monospace); font-size: 0.65rem;
      color: var(--accent, #c8a96e); flex-shrink: 0; line-height: 1;
    }
    .rs-term-msg {
      font-family: var(--ff-mono, monospace); font-size: 0.57rem;
      color: var(--text3, #555); letter-spacing: 0.055em;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      flex: 1;
      opacity: 1; transition: opacity 0.09s ease;
    }
    .rs-term-msg.rs-fade { opacity: 0; }
    .rs-term-cursor {
      font-family: var(--ff-mono, monospace); font-size: 0.57rem;
      color: var(--accent, #c8a96e); flex-shrink: 0;
      animation: rsBlink 1.1s step-end infinite;
    }
    @keyframes rsBlink { 0%,100% { opacity:0; } 50% { opacity:1; } }

    /* Chevron rotates when panel is open */
    .rs-term-chevron {
      font-size: 0.48rem;
      color: var(--text3, #555); flex-shrink: 0;
      transition: transform 0.35s cubic-bezier(0.16,1,0.3,1), color 0.2s ease;
      opacity: 0.55;
      margin-left: 2px;
    }
    .rs-terminal-wrap.rs-log-open .rs-term-chevron {
      transform: rotate(180deg);
      color: var(--accent, #c8a96e);
      opacity: 1;
    }

    /* ── Continue button ── */
    .rs-continue {
      width: 100%; background: none; border: none;
      color: var(--text3, #555);
      font-family: var(--ff-mono, monospace); font-size: 0.63rem;
      letter-spacing: 0.32em; text-transform: uppercase;
      padding: 13px 0; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      opacity: 0; pointer-events: none; outline: none;
      transform: translateY(8px);
      transition:
        opacity 0.75s ease,
        transform 0.75s cubic-bezier(0.16,1,0.3,1),
        color 0.3s ease;
    }
    .rs-continue.rs-show { opacity: 1; pointer-events: all; transform: translateY(0); }
    .rs-continue:hover { color: var(--text, #f0ebe0); }
    .rs-continue:hover .rs-dash { background: var(--accent, #c8a96e); opacity: 0.4; }
    .rs-dash {
      flex: 1; height: 1px;
      background: var(--border2, #222);
      max-width: 80px;
      transition: background 0.3s, opacity 0.3s;
    }
    .rs-cword { padding: 0 16px; flex-shrink: 0; }

    /* ── Mobile ── */
    @media (max-width: 540px) {
      .rs-inner { padding: 0 1.4rem; }
      .rs-film--l, .rs-film--r { display: none; }
      .rs-fn-initial, .rs-fn-tail {
        font-size: clamp(1.4rem, 7vw, 2.2rem);
      }
      .rs-letter { font-size: clamp(4rem, 16vw, 6rem); }
    }
  `;

  /* ═════════════════════════════════════════════════════════════════════
     DATA — messages, welcome, facts, milestones
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

  /* Milestones: [ms, percent] — reaches 100% at 4500ms */
  var MILESTONES = [
    [0,    0],  [320,  7],  [640,  16], [1030, 29], [1480, 43],
    [2000, 57], [2500, 68], [3020, 78], [3470, 87], [3860, 93],
    [4240, 97], [4500, 100]
  ];

  /* ═════════════════════════════════════════════════════════════════════
     PARTICLE CANVAS
     Atmospheric gold dust — slow organic drift, mouse-aware repulsion,
     radial spotlight vignette rendered each frame via Canvas 2D API.
  ═════════════════════════════════════════════════════════════════════ */
  function ParticleCanvas(canvas) {
    this.canvas = canvas;
    this.ctx    = canvas.getContext('2d');
    this.W      = 0;
    this.H      = 0;
    this.mouse  = { x: -9999, y: -9999 };
    this.parts  = [];
    this._alive = true;
    this._rafId = null;

    /* Resolve accent color from CSS variable */
    this._ar = 200; this._ag = 169; this._ab = 110;
    try {
      var raw = getComputedStyle(document.documentElement)
        .getPropertyValue('--accent').trim();
      if (/^#[0-9a-f]{6}$/i.test(raw)) {
        this._ar = parseInt(raw.slice(1,3), 16);
        this._ag = parseInt(raw.slice(3,5), 16);
        this._ab = parseInt(raw.slice(5,7), 16);
      }
    } catch (e) {}

    var self = this;
    this._onMove = function (e) {
      self.mouse.x = e.clientX;
      self.mouse.y = e.clientY;
    };
    window.addEventListener('mousemove', this._onMove, { passive: true });

    this._onResize = function () { self._resize(); };
    window.addEventListener('resize', this._onResize);

    this._resize();
    for (var i = 0; i < 90; i++) { this._spawn(true); }
    this._loop();
  }

  ParticleCanvas.prototype._resize = function () {
    this.W = this.canvas.width  = window.innerWidth;
    this.H = this.canvas.height = window.innerHeight;
  };

  ParticleCanvas.prototype._spawn = function (scatter) {
    var W = this.W, H = this.H;
    this.parts.push({
      x:       scatter ? Math.random() * W : (Math.random() > 0.5 ? -5 : W + 5),
      y:       scatter ? Math.random() * H : Math.random() * H,
      r:       0.35 + Math.random() * 1.4,
      vx:      (Math.random() - 0.5) * 0.22,
      vy:      (Math.random() - 0.5) * 0.14 - 0.055, /* slight upward drift */
      phase:   Math.random() * Math.PI * 2,
      speed:   0.00038 + Math.random() * 0.00032,
      life:    scatter ? Math.random() * 0.8 : 0,
      maxLife: 0.65 + Math.random() * 0.35
    });
  };

  ParticleCanvas.prototype._loop = function () {
    if (!this._alive) return;
    var self = this;
    this._rafId = requestAnimationFrame(function () { self._loop(); });

    var ctx = this.ctx;
    var W = this.W, H = this.H;
    var now = performance.now();
    var mx = this.mouse.x, my = this.mouse.y;
    var R = this._ar, G = this._ag, B = this._ab;

    ctx.clearRect(0, 0, W, H);

    /* Vignette — theatrical darkness at edges, open center spotlight */
    var vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.05, W / 2, H / 2, Math.min(W, H) * 0.78);
    vg.addColorStop(0,   'rgba(0,0,0,0)');
    vg.addColorStop(0.6, 'rgba(0,0,0,0.18)');
    vg.addColorStop(1,   'rgba(0,0,0,0.65)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);

    /* Particles */
    var alive = [];
    for (var i = 0; i < this.parts.length; i++) {
      var p = this.parts[i];
      p.life += p.speed;

      /* Organic sine-wave wobble (Math.sin — the "hand-held camera" effect) */
      var wobble = Math.sin(now * 0.00075 + p.phase) * 0.11;
      p.x += p.vx + wobble;
      p.y += p.vy;

      /* Mouse repulsion — particles drift away from cursor */
      var dx = p.x - mx, dy = p.y - my;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 130 && dist > 0.5) {
        var force = (130 - dist) / 130 * 0.16;
        p.x += (dx / dist) * force;
        p.y += (dy / dist) * force;
      }

      /* Opacity envelope — smooth fade in/out */
      var t = p.life / p.maxLife;
      var alpha;
      if      (t < 0.15) { alpha = t / 0.15; }
      else if (t < 0.78) { alpha = 1; }
      else               { alpha = 1 - (t - 0.78) / 0.22; }
      alpha = Math.max(0, Math.min(1, alpha)) * 0.26;

      /* Radial gradient per particle for soft glow */
      var gr = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
      gr.addColorStop(0,   'rgba(' + R + ',' + G + ',' + B + ',' + alpha + ')');
      gr.addColorStop(0.45,'rgba(' + R + ',' + G + ',' + B + ',' + (alpha * 0.6) + ')');
      gr.addColorStop(1,   'rgba(' + R + ',' + G + ',' + B + ',0)');

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
      ctx.fillStyle = gr;
      ctx.fill();

      if (p.life < p.maxLife && p.x > -25 && p.x < W + 25 && p.y > -25 && p.y < H + 25) {
        alive.push(p);
      }
    }
    this.parts = alive;

    /* Replenish */
    var need = 90 - this.parts.length;
    for (var j = 0; j < Math.min(need, 4); j++) { this._spawn(false); }
  };

  ParticleCanvas.prototype.destroy = function () {
    this._alive = false;
    if (this._rafId) cancelAnimationFrame(this._rafId);
    window.removeEventListener('mousemove', this._onMove);
    window.removeEventListener('resize', this._onResize);
  };

  /* ═════════════════════════════════════════════════════════════════════
     RORO SPLASH — main class
  ═════════════════════════════════════════════════════════════════════ */
  function RoroSplash() {
    this._user       = this._readUser();
    this._msgIdx     = 0;
    this._factIdx    = Math.floor(Math.random() * FACTS.length);
    this._factTimer  = null;
    this._msgTimer   = null;
    this._clockInt   = null;
    this._isDone     = false;
    this._logOpen    = false;
    this._logData    = [];  /* { text, done } records for the panel */
    this._particles  = null;
    this._shakeRaf   = null;
    this._chromaRaf  = null;

    this._injectCSS();
    this._dom();
    this._revealSplash();

    var self = this;
    whenGsap(function () { self._runIntroTimeline(); });
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

  /* ── Film strip builder (unchanged from v3) ── */
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

  /* ══════════════════════════════════════════════════════════════════
     DOM BUILD
  ══════════════════════════════════════════════════════════════════ */
  RoroSplash.prototype._dom = function () {
    var root = document.createElement('div');
    root.id = 'roro-splash';

    /* Canvas */
    var canvas = document.createElement('canvas');
    canvas.id = 'rs-canvas';
    root.appendChild(canvas);
    this._canvas = canvas;

    /* Film grain overlay */
    var grain = document.createElement('div');
    grain.className = 'rs-grain';
    grain.setAttribute('aria-hidden', 'true');
    root.appendChild(grain);

    /* Scan flash element */
    var scanFlash = document.createElement('div');
    scanFlash.id = 'rs-scan-flash';
    root.appendChild(scanFlash);

    /* ─────────────────────────────────────
       PHASE 1: Intro
    ───────────────────────────────────── */
    var intro = document.createElement('div');
    intro.id = 'rs-intro';

    var stage = document.createElement('div');
    stage.className = 'rs-intro-stage';

    /* Accent top-line */
    var topLine = document.createElement('div');
    topLine.id = 'rs-intro-line';
    stage.appendChild(topLine);

    /* Name zone — CSS Grid so initials and fullname share same cell */
    var nameZone = document.createElement('div');
    nameZone.className = 'rs-name-zone';

    /* M · S · M */
    var initials = document.createElement('div');
    initials.id = 'rs-initials';
    initials.innerHTML =
      '<span class="rs-letter" id="rs-l1">M</span>' +
      '<span class="rs-dot">&middot;</span>' +
      '<span class="rs-letter" id="rs-l2">S</span>' +
      '<span class="rs-dot">&middot;</span>' +
      '<span class="rs-letter" id="rs-l3">M</span>';
    nameZone.appendChild(initials);

    /* MANOMAY SHAILENDRA MISRA — one line */
    var fullname = document.createElement('div');
    fullname.id = 'rs-fullname';
    /* Each word: [highlighted initial] + [typed tail] */
    fullname.innerHTML =
      '<span class="rs-fn-word">' +
        '<span class="rs-fn-initial" id="rs-ini-1">M</span>' +
        '<span class="rs-fn-tail" id="rs-tail-1"></span>' +
      '</span>' +
      '<span class="rs-fn-word">' +
        '<span class="rs-fn-initial" id="rs-ini-2">S</span>' +
        '<span class="rs-fn-tail" id="rs-tail-2"></span>' +
      '</span>' +
      '<span class="rs-fn-word">' +
        '<span class="rs-fn-initial" id="rs-ini-3">M</span>' +
        '<span class="rs-fn-tail" id="rs-tail-3"></span>' +
      '</span>';
    nameZone.appendChild(fullname);

    stage.appendChild(nameZone);

    /* Underline */
    var underline = document.createElement('div');
    underline.id = 'rs-intro-underline';
    stage.appendChild(underline);

    intro.appendChild(stage);
    root.appendChild(intro);

    /* ─────────────────────────────────────
       PHASE 2: Loader
    ───────────────────────────────────── */
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

    /* Grid + scan */
    var ldGrid = document.createElement('div'); ldGrid.className = 'rs-ld-grid';
    loader.appendChild(ldGrid);
    var scan = document.createElement('div'); scan.className = 'rs-scan';
    scan.setAttribute('aria-hidden', 'true');
    loader.appendChild(scan);

    /* Film strips */
    loader.appendChild(this._strip('l'));
    loader.appendChild(this._strip('r'));

    /* Inner content */
    var inner = document.createElement('div');
    inner.className = 'rs-inner';
    inner.innerHTML =
      /* Welcome */
      '<div class="rs-welcome-shell" id="rs-ws">' +
        '<div class="rs-welcome" id="rs-welcome"></div>' +
      '</div>' +
      /* Facts */
      '<div class="rs-facts-shell" id="rs-facts-shell">' +
        '<div class="rs-fact-txt" id="rs-fact-txt"></div>' +
      '</div>' +
      /* Progress */
      '<div class="rs-bar-shell">' +
        '<div class="rs-bar-row">' +
          '<div class="rs-track" id="rs-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">' +
            '<div class="rs-fill" id="rs-fill"></div>' +
          '</div>' +
          '<div class="rs-pct" id="rs-pct">0%</div>' +
        '</div>' +
      '</div>' +
      /* Terminal wrap + collapsible log panel */
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

    /* ── Element references ── */
    this._intro     = intro;
    this._topLine   = topLine;
    this._initials  = initials;
    this._fullname  = fullname;
    this._underline = underline;
    this._scanFlash = scanFlash;

    this._ghost      = document.getElementById('rs-ghost');
    this._ghostTime  = document.getElementById('rs-ghost-time');
    this._ghostAmpm  = document.getElementById('rs-ghost-ampm');
    this._ghostMeta  = document.getElementById('rs-ghost-meta');
    this._ws         = document.getElementById('rs-ws');
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

  /* ── Reveal splash, remove cover ── */
  RoroSplash.prototype._revealSplash = function () {
    var self = this;
    var oldLS = document.getElementById('loading-screen');
    if (oldLS) oldLS.style.cssText = 'display:none!important';

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        self._root.classList.add('rs-show');
        self._particles = new ParticleCanvas(self._canvas);
        var cover = document.getElementById('roro-cover');
        if (cover) {
          setTimeout(function () { if (cover.parentNode) cover.remove(); }, 460);
        }
      });
    });
  };

  /* ════════════════════════════════════════════════════════════════
     PHASE 1: CINEMATIC INTRO TIMELINE (GSAP)

     STORYBOARD
     ──────────────────────────────────────────────────────────────
     0.00s  Void. Particles alive. Vignette canvas.
     0.28s  Golden accent line draws from center outward.
     0.72s  M · S · M materialises from blur (scale 1.35 → 1.0).
            Chromatic aberration flash on entry (600ms, fades out).
            Bloom glow activates behind letters.
     0.82s  Theatrical scan-flash sweeps across screen (bright line).
     1.45s  Letters breathe: subtle scale pulse (1.0 → 1.02 → 1.0).
     1.85s  Cinematic camera shake — Math.sin organic micro-movement.
     2.25s  M · S · M exit: scale ↑ + blur ↑ + opacity → 0.
            Accent line retracts. Aberration stopped.
     2.70s  Full name container fades up (blur → sharp).
            M, S, M initials pop in with back-ease.
     2.85s  "anomay" types in (62ms / char).
     3.20s  S initial pops. "hailendra" types (58ms / char).
     3.92s  M initial pops. "isra" types (70ms / char).
     4.38s  Accent underline draws under name.
     5.20s  Crossfade → loading screen begins.
     ──────────────────────────────────────────────────────────────
  ════════════════════════════════════════════════════════════════ */
  RoroSplash.prototype._runIntroTimeline = function () {
    var self      = this;
    var gsap      = window.gsap;
    var intro     = this._intro;
    var topLine   = this._topLine;
    var initials  = this._initials;
    var fullname  = this._fullname;
    var underline = this._underline;
    var scanFlash = this._scanFlash;

    var l1 = document.getElementById('rs-l1');
    var l2 = document.getElementById('rs-l2');
    var l3 = document.getElementById('rs-l3');

    var ini1  = document.getElementById('rs-ini-1');
    var ini2  = document.getElementById('rs-ini-2');
    var ini3  = document.getElementById('rs-ini-3');
    var tail1 = document.getElementById('rs-tail-1');
    var tail2 = document.getElementById('rs-tail-2');
    var tail3 = document.getElementById('rs-tail-3');

    /* ─── Initial states ─── */
    gsap.set(intro,    { opacity: 1 });
    gsap.set(topLine,  { width: 0, opacity: 0 });
    gsap.set(initials, { opacity: 0, scale: 1.35 });
    if (initials.style) initials.style.filter = 'blur(28px)';
    gsap.set(fullname, { opacity: 0, scale: 0.93 });
    if (fullname.style) fullname.style.filter = 'blur(10px)';
    gsap.set(underline,{ width: 0, opacity: 0 });
    gsap.set(scanFlash,{ opacity: 0 });
    gsap.set([ini1, ini2, ini3], { opacity: 0, scale: 0.65 });
    if (ini1) ini1.style.filter = 'blur(8px)';
    if (ini2) ini2.style.filter = 'blur(8px)';
    if (ini3) ini3.style.filter = 'blur(8px)';

    var tl = gsap.timeline();

    /* t=0.28 — accent line draws */
    tl.to(topLine, {
      duration: 0.72,
      width: 'clamp(44px, 9vw, 92px)',
      opacity: 1,
      ease: 'power3.out'
    }, 0.28);

    /* t=0.72 — M · S · M materialises from blur */
    tl.to(initials, {
      duration: 0.95,
      opacity: 1,
      scale: 1.0,
      ease: 'expo.out',
      onStart: function () {
        /* Activate glow bloom */
        initials.classList.add('bloom-on');
        /* Remove blur via transition */
        initials.style.transition = 'filter 0.9s ease';
        initials.style.filter = 'blur(0px)';
        /* Start chromatic aberration */
        self._startChroma([l1, l2, l3]);
      }
    }, 0.72);

    /* t=0.82 — scan flash sweeps (projector warmup moment) */
    tl.to(scanFlash, {
      duration: 0.28,
      opacity: 1,
      ease: 'power2.out',
      onComplete: function () {
        gsap.to(scanFlash, { duration: 0.45, opacity: 0, ease: 'power2.in' });
      }
    }, 0.82);

    /* t=1.45 — breathing pulse (GSAP yoyo) */
    tl.to(initials, {
      duration: 0.65,
      scale: 1.026,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: 1
    }, 1.45);

    /* t=1.85 — organic camera shake */
    tl.call(function () {
      self._cameraShake(intro, 0.45, 3.5);
    }, [], 1.85);

    /* t=2.25 — M · S · M exit: scale up, blur up, opacity 0 */
    tl.to(initials, {
      duration: 0.52,
      opacity: 0,
      scale: 1.22,
      ease: 'power3.in',
      onStart: function () {
        initials.classList.remove('bloom-on');
        self._stopChroma([l1, l2, l3]);
        initials.style.transition = 'filter 0.5s ease';
        initials.style.filter = 'blur(22px)';
      }
    }, 2.25);

    /* t=2.25 — accent line retracts */
    tl.to(topLine, {
      duration: 0.38,
      width: 0,
      opacity: 0,
      ease: 'power2.in'
    }, 2.25);

    /* t=2.70 — fullname container fades in */
    tl.to(fullname, {
      duration: 0.70,
      opacity: 1,
      scale: 1.0,
      ease: 'expo.out',
      onStart: function () {
        fullname.style.transition = 'filter 0.7s ease';
        fullname.style.filter = 'blur(0px)';
      }
    }, 2.70);

    /* t=2.72 — M initial (Manomay) pops in */
    tl.to(ini1, {
      duration: 0.48,
      opacity: 1,
      scale: 1.0,
      ease: 'back.out(1.7)',
      onStart: function () {
        if (ini1) { ini1.style.transition = 'filter 0.4s ease'; ini1.style.filter = 'blur(0px)'; }
      }
    }, 2.72);

    /* t=2.88 — "anomay" typewriter */
    tl.call(function () { self._typeWriter(tail1, 'anomay', 62); }, [], 2.88);

    /* t=3.22 — S initial pops in */
    tl.to(ini2, {
      duration: 0.48,
      opacity: 1,
      scale: 1.0,
      ease: 'back.out(1.7)',
      onStart: function () {
        if (ini2) { ini2.style.transition = 'filter 0.4s ease'; ini2.style.filter = 'blur(0px)'; }
      }
    }, 3.22);

    /* t=3.38 — "hailendra" typewriter */
    tl.call(function () { self._typeWriter(tail2, 'hailendra', 58); }, [], 3.38);

    /* t=3.94 — M initial (Misra) pops in */
    tl.to(ini3, {
      duration: 0.48,
      opacity: 1,
      scale: 1.0,
      ease: 'back.out(1.7)',
      onStart: function () {
        if (ini3) { ini3.style.transition = 'filter 0.4s ease'; ini3.style.filter = 'blur(0px)'; }
      }
    }, 3.94);

    /* t=4.10 — "isra" typewriter */
    tl.call(function () { self._typeWriter(tail3, 'isra', 70); }, [], 4.10);

    /* t=4.40 — underline draws below full name */
    tl.to(underline, {
      duration: 0.65,
      width: 'clamp(160px, 38vw, 400px)',
      opacity: 0.52,
      ease: 'power3.out'
    }, 4.40);

    /* t=5.20 — crossfade to loading screen */
    tl.call(function () { self._showLoader(); }, [], 5.20);
  };

  /* ─────────────────────────────────────────────────────────────
     CHROMATIC ABERRATION
     Animates text-shadow on M · S · M letters using requestAnimationFrame.
     Intensity peaks on entry and decays over `duration` ms.
     Uses Math.sin for organic RGB offset flicker.
  ───────────────────────────────────────────────────────────── */
  RoroSplash.prototype._startChroma = function (letters) {
    var self      = this;
    var startTime = performance.now();
    var duration  = 620; /* ms before fading to zero */

    function frame() {
      var elapsed  = performance.now() - startTime;
      var t        = Math.min(elapsed / duration, 1);
      var envelope = Math.pow(1 - t, 1.6); /* aggressive falloff */
      var intensity = envelope * 5.5;
      /* Flicker via sin wave — simulates hand-held camera + lens breathing */
      var flicker = Math.sin(elapsed * 0.072) * 0.55 + Math.sin(elapsed * 0.031) * 0.35;
      var ox = intensity + flicker;
      var oy = intensity * 0.28;

      letters.forEach(function (el) {
        if (!el) return;
        el.style.textShadow =
          (-ox).toFixed(2) + 'px ' + (-oy).toFixed(2) + 'px 0 rgba(255,25,25,' + (0.50 * envelope).toFixed(3) + '),' +
          (ox).toFixed(2)  + 'px ' + (oy).toFixed(2)  + 'px 0 rgba(25,75,255,' + (0.50 * envelope).toFixed(3) + ')';
      });

      if (t < 1) {
        self._chromaRaf = requestAnimationFrame(frame);
      } else {
        letters.forEach(function (el) { if (el) el.style.textShadow = 'none'; });
        self._chromaRaf = null;
      }
    }
    this._chromaRaf = requestAnimationFrame(frame);
  };

  RoroSplash.prototype._stopChroma = function (letters) {
    if (this._chromaRaf) {
      cancelAnimationFrame(this._chromaRaf);
      this._chromaRaf = null;
    }
    if (letters) {
      letters.forEach(function (el) { if (el) el.style.textShadow = 'none'; });
    }
  };

  /* ─────────────────────────────────────────────────────────────
     CAMERA SHAKE
     Math.sin with two frequencies for organic, non-repeating motion.
     Applied as translateX/Y on the intro stage — fades with falloff.
  ───────────────────────────────────────────────────────────── */
  RoroSplash.prototype._cameraShake = function (el, durationSec, magnitude) {
    var start = performance.now();
    var dur   = durationSec * 1000;
    var self  = this;

    function frame() {
      var elapsed = performance.now() - start;
      var t       = Math.min(elapsed / dur, 1);
      var falloff = Math.pow(1 - t, 1.8);
      /* Two-frequency sine for organic non-periodic shake */
      var tx = (Math.sin(elapsed * 0.115) * 0.7 + Math.sin(elapsed * 0.053) * 0.3) * magnitude * falloff;
      var ty = (Math.sin(elapsed * 0.092 + 1.3) * 0.6 + Math.sin(elapsed * 0.041) * 0.4) * magnitude * 0.55 * falloff;
      el.style.transform = 'translate(' + tx.toFixed(2) + 'px,' + ty.toFixed(2) + 'px)';

      if (t < 1) {
        self._shakeRaf = requestAnimationFrame(frame);
      } else {
        el.style.transform = 'translate(0,0)';
        self._shakeRaf = null;
      }
    }
    this._shakeRaf = requestAnimationFrame(frame);
  };

  /* ─────────────────────────────────────────────────────────────
     TYPEWRITER
     Creates individual <span class="rs-char"> elements for each letter.
     GSAP fades + translates each one in with a staggered setTimeout.
     All characters go into `container` inline — stays on ONE LINE.
  ───────────────────────────────────────────────────────────── */
  RoroSplash.prototype._typeWriter = function (container, text, charDelayMs) {
    var gsap = window.gsap;
    text.split('').forEach(function (ch, i) {
      setTimeout(function () {
        var span = document.createElement('span');
        span.className   = 'rs-char';
        span.textContent = ch;
        container.appendChild(span);
        /* Each character fades in + slides up from 6px */
        span.style.opacity   = '0';
        span.style.transform = 'translateY(6px)';
        gsap.to(span, {
          duration: 0.20,
          opacity:  1,
          y:        0,
          ease:     'power2.out'
        });
      }, i * charDelayMs);
    });
  };

  /* ─────────────────────────────────────────────────────────────
     INTRO → LOADER TRANSITION
  ───────────────────────────────────────────────────────────── */
  RoroSplash.prototype._showLoader = function () {
    var self   = this;
    var gsap   = window.gsap;
    var intro  = this._intro;
    var loader = document.getElementById('rs-loader');

    gsap.to(intro, {
      duration: 0.70,
      opacity:  0,
      ease:     'power2.in',
      onComplete: function () {
        intro.style.display = 'none';
        loader.style.display = 'flex';
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            loader.classList.add('rs-show');
            self._runLoader();
          });
        });
      }
    });
  };

  /* ════════════════════════════════════════════════════════════════
     PHASE 2: LOADING SCREEN
  ════════════════════════════════════════════════════════════════ */
  RoroSplash.prototype._runLoader = function () {
    var self = this;

    /* Clock */
    this._tick();
    this._clockInt = setInterval(function () { self._tick(); }, 1000);

    /* Ghost fades in */
    setTimeout(function () { self._ghost.classList.add('rs-on'); }, 200);

    /* Terminal: first message */
    var firstMsg = MSGS[this._msgIdx % MSGS.length];
    this._msgIdx++;
    this._termMsg.textContent = firstMsg;
    this._logData.push({ text: firstMsg, done: false });
    this._termWrap.classList.add('rs-on');

    /* Message cycling — 700ms interval */
    this._msgTimer = setInterval(function () { self._nextMsg(); }, 700);

    /* Progress bar */
    this._progress();

    /* Facts — first shown immediately */
    this._factsT.textContent = FACTS[this._factIdx];
    this._factTimer = setInterval(function () { self._nextFact(); }, 2400);

    /* Welcome text */
    setTimeout(function () {
      self._welcome.textContent = self._getWelcome();
      self._welcome.classList.add('rs-on');
    }, 250);

    /* Facts line becomes visible */
    setTimeout(function () { self._factsS.classList.add('rs-on'); }, 550);

    /* Terminal click → toggle log panel */
    this._terminal.addEventListener('click', function () {
      self._toggleLogPanel();
    });
    this._terminal.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); self._toggleLogPanel(); }
    });

    /* Continue */
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
        if (m[1] === 100) {
          setTimeout(function () { self._done(); }, 300);
        }
      }, m[0]);
    });
  };

  /* ── 100% → READY ── */
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
      self._logData.push({ text: text, done: false });
      if (self._logOpen) { self._renderLogPanel(); }
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

  /* ─────────────────────────────────────────────────────────────
     TERMINAL LOG PANEL
     Click terminal bar → expand panel showing ALL logged messages
     in randomised order. Click again → collapse. Like a thinking tab.
  ───────────────────────────────────────────────────────────── */
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

  /* Shuffle array (Fisher-Yates) and render into panel */
  RoroSplash.prototype._renderLogPanel = function () {
    var entries = this._logData.slice();

    /* Fisher-Yates shuffle for random order */
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
      /* Staggered fade-in for each entry */
      setTimeout(function () { div.classList.add('rs-on'); }, idx * 28 + 20);
    });
  };

  /* ── Ghost clock ── */
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

  /* ── Welcome / context text ── */
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

  /* ── CONTINUE → page transition (same mechanism as v3) ── */
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

    setTimeout(function () {
      HTMLMediaElement.prototype.play = _origPlay;
    }, 500);
  };

  /* ── Cleanup all timers, rAFs, DOM, CSS ── */
  RoroSplash.prototype._cleanup = function () {
    clearInterval(this._clockInt);
    clearInterval(this._factTimer);
    clearInterval(this._msgTimer);
    if (this._shakeRaf)   cancelAnimationFrame(this._shakeRaf);
    if (this._chromaRaf)  cancelAnimationFrame(this._chromaRaf);
    if (this._particles)  this._particles.destroy();
    if (this._root && this._root.parentNode) this._root.remove();
    var css = document.getElementById('rs-css');
    if (css) css.remove();
  };

  /* ═════════════════════════════════════════════════════════════════════
     BOOT — DOMContentLoaded
  ═════════════════════════════════════════════════════════════════════ */
  document.addEventListener('DOMContentLoaded', function () {
    /* Intercept startHeroAnimations so homepage stays hidden behind splash */
    var _oh = window.startHeroAnimations;
    window.startHeroAnimations = function () { /* noop during splash */ };
    window._roroRunHero = function () {
      window.startHeroAnimations = _oh;
      if (typeof _oh === 'function') _oh();
    };
    window._roroSplashInstance = new RoroSplash();
  });

  /* Manual trigger (for hot-reload or testing) */
  window.initRoroSplash = function () {
    window._roroSplashInstance = new RoroSplash();
  };

})();

/* ═══════════════════════════════════════════════════════════════════════
   COMPLETE TIMING WALKTHROUGH (v4.0)
   ─────────────────────────────────────────────────────────────────────
   0ms      #roro-cover blankets everything. Particles boot.
   460ms    Cover removed; splash fully opaque.

   INTRO TIMELINE (GSAP)
   280ms    Accent line draws in.
   720ms    M · S · M materialises from blur (scale+filter).
   720ms    Chromatic aberration begins — RGB offset fades over 620ms.
   820ms    Scan flash sweeps screen (theatrical projector moment).
   1450ms   Letters breathe (scale pulse × 2, yoyo).
   1850ms   Camera shake — Math.sin dual-frequency, 450ms, 3.5px.
   2250ms   M · S · M exits: scale ↑ blur ↑ opacity → 0.
   2700ms   "MANOMAY SHAILENDRA MISRA" container fades up.
   2720ms   M (initial) pops in with back-ease.
   2880ms   "anomay" types in at 62ms/char → ~372ms total.
   3220ms   S initial pops in.
   3380ms   "hailendra" types in at 58ms/char → ~522ms total.
   3940ms   M initial (Misra) pops in.
   4100ms   "isra" types in at 70ms/char → ~280ms total.
   4400ms   Accent underline draws under full name.
   5200ms   GSAP crossfade → loading screen begins.
   5920ms   Loading screen fully visible.

   LOADING SCREEN
   ~5920ms  Terminal: first message. Welcome text. Ghost clock.
   ~6470ms  Facts line appears.
   ~10420ms Progress → 100% → "READY." in terminal.
   ~10920ms CONTINUE button fades in.
   click    Transition overlay wipes. Music plays. Hero animations fire.

   TERMINAL LOG PANEL
   Click terminal bar → expands panel with all logged messages in
   RANDOM order (Fisher-Yates shuffle). Click again → collapses.
   Chevron rotates 180° on open, back on close.
   ─────────────────────────────────────────────────────────────────────
   DEPENDENCIES (auto-injected):
   · GSAP 3.12.5 from cdnjs.cloudflare.com
   · Falls back to built-in mini-tween engine if CDN unreachable.
═══════════════════════════════════════════════════════════════════════ */
