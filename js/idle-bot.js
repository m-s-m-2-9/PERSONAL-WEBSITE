/* ═══════════════════════════════════════════════════════════
   idle-bot.js — Idle Robot Easter Egg
   Triggers after 10 minutes of zero user activity.
   Self-contained: injects its own CSS, builds its own DOM.
   No external files needed.
   
   To test faster: change IDLE_DELAY to 5000 (5 seconds)
═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const IDLE_DELAY = 1 * 60 * 1000; /* 10 minutes in ms */
  let idleTimer   = null;
  let robotActive = false;

  /* ─────────────────────────────────────────────────────
     INJECT CSS
  ───────────────────────────────────────────────────── */
  const styleEl = document.createElement('style');
  styleEl.textContent = `

    #idle-robot {
      position: fixed;
      bottom: 0;
      z-index: 99995;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 80px;
    }

    #idle-robot * { box-sizing: border-box; }

    /* Antenna */
    .ir-antenna-stem {
      width: 3px;
      height: 16px;
      background: linear-gradient(#4a7a9b, #2a5a7b);
      border-radius: 2px;
      margin-left: 8px;
      position: relative;
    }
    .ir-antenna-ball {
      width: 11px; height: 11px;
      background: radial-gradient(circle at 35% 35%, #6ef, #0af);
      border-radius: 50%;
      position: absolute;
      top: -8px; left: 50%;
      transform: translateX(-50%);
      box-shadow: 0 0 8px #0af, 0 0 16px rgba(0,170,255,0.4);
      animation: irAntBlink 2s ease-in-out infinite;
    }
    @keyframes irAntBlink {
      0%, 88%, 100% { opacity: 1; }
      94%            { opacity: 0.15; }
    }

    /* Head */
    .ir-head {
      width: 62px; height: 50px;
      background: linear-gradient(160deg, #1a2a3f 0%, #0f1c2e 100%);
      border-radius: 14px 14px 10px 10px;
      border: 1.5px solid #2a4a6a;
      position: relative;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 0 0 1px rgba(255,255,255,0.04) inset, 0 4px 12px rgba(0,0,0,0.5);
      transition: transform 0.3s ease;
    }
    /* ear nubs */
    .ir-head::before, .ir-head::after {
      content: '';
      position: absolute;
      top: 14px;
      width: 9px; height: 14px;
      background: #0f1c2e;
      border: 1.5px solid #2a4a6a;
      border-radius: 3px;
    }
    .ir-head::before { left: -9px; }
    .ir-head::after  { right: -9px; }

    /* Visor */
    .ir-visor {
      width: 46px; height: 21px;
      background: linear-gradient(135deg, #001428, #002a55, #001428);
      border-radius: 7px;
      border: 1px solid rgba(0,180,255,0.35);
      display: flex; align-items: center; justify-content: space-around;
      padding: 0 7px;
      position: relative;
      overflow: hidden;
      box-shadow: 0 0 10px rgba(0,170,255,0.2) inset;
    }
    .ir-visor::after {
      content: '';
      position: absolute;
      top: 3px; left: 5px; right: 18px; height: 2px;
      background: rgba(255,255,255,0.1);
      border-radius: 2px;
    }

    /* Eyes */
    .ir-eye {
      width: 13px; height: 13px;
      background: radial-gradient(circle at 35% 35%, #7ef, #0af 55%, #006b99);
      border-radius: 50%;
      box-shadow: 0 0 8px #0af, 0 0 14px rgba(0,150,255,0.5);
      transition: transform 0.25s ease, box-shadow 0.25s ease;
    }

    /* Neck */
    .ir-neck {
      width: 18px; height: 5px;
      background: #0a1525;
      border-left: 1.5px solid #2a4a6a;
      border-right: 1.5px solid #2a4a6a;
    }

    /* Body */
    .ir-body {
      width: 54px; height: 46px;
      background: linear-gradient(160deg, #1a2a3f, #0f1c2e);
      border-radius: 10px;
      border: 1.5px solid #2a4a6a;
      position: relative;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 0 0 1px rgba(255,255,255,0.03) inset, 0 4px 12px rgba(0,0,0,0.4);
    }
    /* shoulder pads */
    .ir-body::before, .ir-body::after {
      content: '';
      position: absolute;
      top: -5px;
      width: 16px; height: 10px;
      background: #1a2a3f;
      border: 1.5px solid #2a4a6a;
      border-radius: 4px 4px 0 0;
    }
    .ir-body::before { left: 4px; }
    .ir-body::after  { right: 4px; }

    /* Chest light */
    .ir-chest {
      width: 22px; height: 14px;
      background: linear-gradient(135deg, #0af, #07c);
      border-radius: 5px;
      box-shadow: 0 0 10px #0af, 0 0 20px rgba(0,170,255,0.3);
      animation: irChestPulse 2.5s ease-in-out infinite;
    }
    @keyframes irChestPulse {
      0%, 100% { opacity: 0.7; }
      50%       { opacity: 1; box-shadow: 0 0 16px #0af, 0 0 30px rgba(0,170,255,0.5); }
    }

    /* Arms wrapper */
    .ir-arms-wrap {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      pointer-events: none;
    }

    /* Individual arms */
    .ir-arm {
      position: absolute;
      top: 8px;
      width: 11px; height: 26px;
      background: linear-gradient(180deg, #1e3a5a, #0f1c2e);
      border: 1.5px solid #2a4a6a;
      border-radius: 5px;
      transform-origin: top center;
    }
    .ir-arm-l { left: -12px; }
    .ir-arm-r { right: -12px; }
    .ir-arm::after {
      content: '';
      position: absolute; bottom: -7px; left: 50%;
      transform: translateX(-50%);
      width: 13px; height: 13px;
      background: #1a2a3f;
      border: 1.5px solid #2a4a6a;
      border-radius: 50%;
    }

    /* Legs wrapper */
    .ir-legs-wrap {
      display: flex;
      gap: 6px;
    }
    .ir-leg {
      width: 16px; height: 22px;
      background: linear-gradient(180deg, #1a2a3f, #0f1c2e);
      border: 1.5px solid #2a4a6a;
      border-radius: 5px;
      position: relative;
      transform-origin: top center;
    }
    .ir-leg::after {
      content: '';
      position: absolute; bottom: -6px; left: 50%;
      transform: translateX(-50%);
      width: 22px; height: 9px;
      background: #1a2a3f;
      border: 1.5px solid #2a4a6a;
      border-radius: 3px;
    }

    /* ════════════════════════════════
       ANIMATION STATES
    ════════════════════════════════ */

    /* Eyes look right */
    .ir-state-look-right .ir-eye { transform: translateX(3px); }

    /* Eyes wide (scared) */
    .ir-state-wide-eyes .ir-eye {
      box-shadow: 0 0 14px #0af, 0 0 24px rgba(0,150,255,0.7);
      transform: scale(1.18);
    }

    /* Head tilt right */
    .ir-state-head-right .ir-head { transform: rotate(16deg); }

    /* Head center */
    .ir-state-head-center .ir-head { transform: rotate(0deg); }

    /* Walking legs */
    .ir-state-walking .ir-leg-l { animation: irLegL 0.28s ease-in-out infinite alternate; }
    .ir-state-walking .ir-leg-r { animation: irLegR 0.28s ease-in-out infinite alternate; }

    /* Fast running legs */
    .ir-state-running .ir-leg-l { animation: irLegL 0.11s ease-in-out infinite alternate; }
    .ir-state-running .ir-leg-r { animation: irLegR 0.11s ease-in-out infinite alternate; }

    @keyframes irLegL { from { transform: rotate(-20deg); } to { transform: rotate(16deg); } }
    @keyframes irLegR { from { transform: rotate(16deg);  } to { transform: rotate(-20deg); } }

    /* Arms up panic */
    .ir-state-panic .ir-arm-l { animation: irPanicL 0.2s ease forwards; }
    .ir-state-panic .ir-arm-r { animation: irPanicR 0.2s 0.06s ease forwards; }
    @keyframes irPanicL { from { transform: rotate(0deg); } to { transform: rotate(-155deg); } }
    @keyframes irPanicR { from { transform: rotate(0deg); } to { transform: rotate(155deg);  } }

    /* Knocking (right arm taps) */
    .ir-state-knock .ir-arm-r {
      animation: irKnock 0.36s ease-in-out 3;
    }
    @keyframes irKnock {
      0%   { transform: rotate(0deg); }
      40%  { transform: rotate(-68deg); }
      70%  { transform: rotate(-58deg); }
      100% { transform: rotate(0deg); }
    }

    /* Nervous full-body shake */
    .ir-state-nervous { animation: irNervShake 0.3s ease-in-out infinite; }
    @keyframes irNervShake {
      0%, 100% { transform: translateX(0); }
      33%       { transform: translateX(-2px); }
      66%       { transform: translateX(2px); }
    }

    /* Stumble on entry */
    .ir-state-stumble {
      animation: irStumble 0.55s cubic-bezier(0.36, 0.07, 0.19, 0.97) forwards;
    }
    @keyframes irStumble {
      0%   { transform: rotate(0deg) translateX(0); }
      18%  { transform: rotate(-15deg) translateX(-9px); }
      52%  { transform: rotate(11deg) translateX(5px); }
      78%  { transform: rotate(-4deg) translateX(-1px); }
      100% { transform: rotate(0deg) translateX(0); }
    }

  `;
  document.head.appendChild(styleEl);

  /* ─────────────────────────────────────────────────────
     BUILD ROBOT DOM
  ───────────────────────────────────────────────────── */
  function buildRobot() {
    const el = document.createElement('div');
    el.id = 'idle-robot';
    el.innerHTML = `
      <div class="ir-antenna-stem">
        <div class="ir-antenna-ball"></div>
      </div>
      <div class="ir-head-wrap">
        <div class="ir-head">
          <div class="ir-visor">
            <div class="ir-eye ir-eye-l"></div>
            <div class="ir-eye ir-eye-r"></div>
          </div>
        </div>
      </div>
      <div class="ir-neck"></div>
      <div class="ir-body-wrap" style="position:relative;">
        <div class="ir-body">
          <div class="ir-arms-wrap">
            <div class="ir-arm ir-arm-l"></div>
            <div class="ir-arm ir-arm-r"></div>
          </div>
          <div class="ir-chest"></div>
        </div>
      </div>
      <div class="ir-legs-wrap">
        <div class="ir-leg ir-leg-l"></div>
        <div class="ir-leg ir-leg-r"></div>
      </div>
    `;
    document.body.appendChild(el);
    return el;
  }

  /* ─────────────────────────────────────────────────────
     KNOCK SOUND — Web Audio API, no audio file needed
  ───────────────────────────────────────────────────── */
  function playKnock() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.22, 0.44].forEach(function(t) {
        var buf  = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.06), ctx.sampleRate);
        var data = buf.getChannelData(0);
        for (var i = 0; i < data.length; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2.5);
        }
        var src    = ctx.createBufferSource();
        var gain   = ctx.createGain();
        var filter = ctx.createBiquadFilter();
        src.buffer = buf;
        gain.gain.value = 0.5;
        filter.type = 'lowpass';
        filter.frequency.value = 480;
        src.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        src.start(ctx.currentTime + t);
      });
    } catch (e) {
      /* silently fail if Web Audio not available */
    }
  }

  /* ─────────────────────────────────────────────────────
     UTILITIES
  ───────────────────────────────────────────────────── */
  function sleep(ms) {
    return new Promise(function(resolve) { setTimeout(resolve, ms); });
  }

  /* Apply a list of state classes to a target element
     Removes any previously applied ir-state-* classes first */
  function setState(el, states) {
    var classes = Array.from(el.classList);
    classes.forEach(function(c) {
      if (c.startsWith('ir-state-')) el.classList.remove(c);
    });
    states.forEach(function(s) {
      if (s) el.classList.add(s);
    });
  }

  /* ─────────────────────────────────────────────────────
     MAIN ROBOT SEQUENCE
  ───────────────────────────────────────────────────── */
  async function runRobot() {
    if (robotActive) return;
    robotActive = true;

    var W     = window.innerWidth;
    var robot = buildRobot();
    var headWrap = robot.querySelector('.ir-head-wrap');
    var visor    = robot.querySelector('.ir-visor');
    var bodyWrap = robot.querySelector('.ir-body-wrap');
    var legsWrap = robot.querySelector('.ir-legs-wrap');

    /* ── Start: off-screen right, no transition ── */
    robot.style.left       = (W + 140) + 'px';
    robot.style.bottom     = '0px';
    robot.style.transition = 'none';
    robot.style.transform  = 'none';

    await sleep(100);

    /* ── Phase 1: Slide in from right ── */
    setState(legsWrap, ['ir-state-walking']);
    robot.style.transition = 'left 1.0s cubic-bezier(0.16, 1, 0.3, 1)';
    robot.style.left       = (W - 150) + 'px';
    await sleep(1100);

    setState(legsWrap, []);

    /* ── Phase 2: Stumble (someone shoved him in) ── */
    setState(robot, ['ir-state-stumble']);
    await sleep(600);
    setState(robot, []);
    robot.style.transform = '';
    await sleep(250);

    /* ── Phase 3: Look nervous, glance back right ── */
    setState(robot,    ['ir-state-nervous']);
    setState(headWrap, ['ir-state-head-right']);
    setState(visor,    ['ir-state-look-right', 'ir-state-wide-eyes']);
    await sleep(650);

    setState(headWrap, ['ir-state-head-center']);
    setState(visor,    ['ir-state-wide-eyes']);
    await sleep(400);

    /* glance right again */
    setState(headWrap, ['ir-state-head-right']);
    setState(visor,    ['ir-state-look-right', 'ir-state-wide-eyes']);
    await sleep(550);

    setState(headWrap, ['ir-state-head-center']);
    setState(visor,    []);
    setState(robot,    []);
    await sleep(300);

    /* ── Phase 4: Walk toward center of screen ── */
    setState(legsWrap, ['ir-state-walking']);
    robot.style.transition = 'left 1.3s cubic-bezier(0.16, 1, 0.3, 1)';
    robot.style.left       = (W / 2 - 40) + 'px';
    await sleep(1400);
    setState(legsWrap, []);
    await sleep(350);

    /* ── Phase 5: Knock 3 times + play sound ── */
    setState(bodyWrap, ['ir-state-knock']);
    playKnock();
    await sleep(1200);
    setState(bodyWrap, []);
    await sleep(350);

    /* ── Phase 6: Look at user (camera) ── */
    setState(headWrap, ['ir-state-head-center']);
    setState(visor,    []);
    await sleep(800);

    /* ── Phase 7: One more nervous glance right ── */
    setState(robot,    ['ir-state-nervous']);
    setState(headWrap, ['ir-state-head-right']);
    setState(visor,    ['ir-state-look-right', 'ir-state-wide-eyes']);
    await sleep(500);
    setState(robot,    []);
    setState(headWrap, ['ir-state-head-center']);
    setState(visor,    []);
    await sleep(250);

    /* ── Phase 8: Panic — arms up, sprint off left ── */
    setState(bodyWrap, ['ir-state-panic']);
    await sleep(150);
    setState(legsWrap, ['ir-state-running']);
    robot.style.transition = 'left 0.65s cubic-bezier(0.76, 0, 0.24, 1)';
    robot.style.left       = (-200) + 'px';
    await sleep(700);

    /* ── Cleanup ── */
    robot.remove();
    robotActive = false;
  }

  /* ─────────────────────────────────────────────────────
     IDLE DETECTION
     Resets the timer on ANY user interaction
  ───────────────────────────────────────────────────── */
  function resetIdleTimer() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(runRobot, IDLE_DELAY);
  }

  var activityEvents = [
    'mousemove', 'mousedown', 'keydown',
    'touchstart', 'touchmove',
    'scroll', 'wheel', 'click'
  ];

  activityEvents.forEach(function(ev) {
    document.addEventListener(ev, resetIdleTimer, { passive: true });
  });

  /* Kick off the first timer */
  resetIdleTimer();

})();
