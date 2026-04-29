/* ═══════════════════════════════════════════════════════════
   idle-bot.js — Astro Bot Idle Easter Egg
   Self-contained. Injects its own CSS. No external files.
   Triggers after IDLE_DELAY ms of zero user activity.

   PHASES:
   1. Forced entry — shoved from right, tumbles, hits floor
   2. Recovery — gets up, dusts off
   3. Walk to center — nervous tiptoe, glances back
   4. Look at user
   5. Screen knock x3 — crack effects build up
   6. Fourth wall break — head pokes through
   7. Loop until interaction

   USER INTERACTION:
   - Before knock phase → !! panic eyes, flee left
   - After glass breaks → tiny dot eyes, panic flee left
═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── CONFIG ── */
  const IDLE_DELAY = 10 * 60 * 1000; /* 10 minutes. Set to e.g. 8000 to test */

  /* ── STATE ── */
  let idleTimer    = null;
  let botActive    = false;
  let phase        = 'none'; /* none | entry | recovery | walking | looking | knocking | peeking | fleeing */
  let glassShattered = false;
  let interacted   = false;
  let phaseTimers  = [];

  /* ════════════════════════════════════════════════════════
     INJECT CSS
  ════════════════════════════════════════════════════════ */
  const CSS = `
    /* ── SCENE CONTAINER ── */
    #ibot-scene {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 100vh;
      pointer-events: none;
      z-index: 999990;
      overflow: hidden;
    }

    /* ── GLASS OVERLAY (sits on top of scene) ── */
    #ibot-glass {
      position: fixed;
      inset: 0;
      z-index: 999991;
      pointer-events: none;
    }

    /* ── ROBOT WRAPPER ── */
    #ibot-robot {
      position: absolute;
      bottom: 0;
      width: 120px;
      height: 180px;
      transform-origin: bottom center;
      pointer-events: none;
      will-change: transform, left;
    }

    /* ── SVG fills wrapper ── */
    #ibot-robot svg {
      width: 100%;
      height: 100%;
      overflow: visible;
    }

    /* ── ANIMATION KEYFRAMES ── */

    /* Entry tumble in air */
    @keyframes ibot-tumble {
      0%   { transform: translateX(0) rotate(0deg); }
      30%  { transform: translateX(-40px) rotate(180deg) scale(1.05); }
      60%  { transform: translateX(-10px) rotate(300deg) scale(1.1); }
      80%  { transform: translateX(5px) rotate(340deg); }
      100% { transform: translateX(0) rotate(360deg); }
    }

    /* Hit floor bounce */
    @keyframes ibot-bounce {
      0%   { transform: scaleY(1) translateY(0); }
      10%  { transform: scaleX(1.3) scaleY(0.55) translateY(0); }
      25%  { transform: scaleX(0.9) scaleY(1.15) translateY(-18px); }
      45%  { transform: scaleX(1.1) scaleY(0.8) translateY(0); }
      65%  { transform: scaleX(0.95) scaleY(1.05) translateY(-6px); }
      80%  { transform: scaleY(1) translateY(0); }
      100% { transform: scaleY(1) translateY(0); }
    }

    /* Nervous body tremor */
    @keyframes ibot-tremor {
      0%,100% { transform: translateX(0); }
      25%     { transform: translateX(-2px) rotate(-1deg); }
      75%     { transform: translateX(2px) rotate(1deg); }
    }

    /* Leg walk cycle left */
    @keyframes ibot-walk-l {
      0%,100% { transform: rotate(0deg); }
      50%     { transform: rotate(22deg) translateY(-4px); }
    }

    /* Leg walk cycle right */
    @keyframes ibot-walk-r {
      0%,100% { transform: rotate(0deg); }
      50%     { transform: rotate(-22deg) translateY(-4px); }
    }

    /* Tiptoe bounce of full body */
    @keyframes ibot-tiptoe {
      0%,100% { transform: translateY(0); }
      50%     { transform: translateY(-5px); }
    }

    /* Cape flap normal */
    @keyframes ibot-cape-idle {
      0%,100% { transform: skewY(0deg) scaleX(1); }
      50%     { transform: skewY(3deg) scaleX(0.95); }
    }

    /* Cape flap run */
    @keyframes ibot-cape-run {
      0%,100% { transform: skewX(-20deg) scaleX(1.3); }
      50%     { transform: skewX(-30deg) scaleX(1.5); }
    }

    /* Arm raise for knock */
    @keyframes ibot-arm-raise {
      0%   { transform: rotate(0deg); }
      100% { transform: rotate(-110deg) translateX(8px); }
    }

    /* Knock fist tap */
    @keyframes ibot-knock {
      0%   { transform: rotate(-110deg) translateX(8px) scale(1); }
      30%  { transform: rotate(-115deg) translateX(16px) scale(1.15); }
      55%  { transform: rotate(-108deg) translateX(14px) scale(1.1); }
      100% { transform: rotate(-110deg) translateX(8px) scale(1); }
    }

    /* Screen shake */
    @keyframes ibot-shake {
      0%,100% { transform: translate(0,0); }
      20%     { transform: translate(-6px, 3px); }
      40%     { transform: translate(5px, -4px); }
      60%     { transform: translate(-4px, 5px); }
      80%     { transform: translate(6px, -2px); }
    }

    /* Antenna flicker */
    @keyframes ibot-ant-flicker {
      0%,100%  { opacity: 1; }
      25%      { opacity: 0.2; }
      50%      { opacity: 0.8; }
      75%      { opacity: 0.1; }
    }

    /* Antenna panic flash */
    @keyframes ibot-ant-panic {
      0%,100%  { opacity: 1; filter: brightness(1); }
      50%      { opacity: 0.3; filter: brightness(3); }
    }

    /* Peek lean */
    @keyframes ibot-peek-in {
      0%   { transform: translateX(60px) translateY(-10px) rotate(10deg); }
      100% { transform: translateX(0px) translateY(0px) rotate(0deg); }
    }
    @keyframes ibot-peek-out {
      0%   { transform: translateX(0px) translateY(0px) rotate(0deg); }
      100% { transform: translateX(60px) translateY(-10px) rotate(10deg); }
    }

    /* Panic arm flail */
    @keyframes ibot-arm-flail-l {
      0%,100% { transform: rotate(0deg); }
      50%     { transform: rotate(70deg); }
    }
    @keyframes ibot-arm-flail-r {
      0%,100% { transform: rotate(0deg); }
      50%     { transform: rotate(-70deg); }
    }

    /* Run legs */
    @keyframes ibot-run-l {
      0%,100% { transform: rotate(-30deg); }
      50%     { transform: rotate(30deg); }
    }
    @keyframes ibot-run-r {
      0%,100% { transform: rotate(30deg); }
      50%     { transform: rotate(-30deg); }
    }

    /* Eye blink */
    @keyframes ibot-blink {
      0%,90%,100% { transform: scaleY(1); }
      95%         { transform: scaleY(0.05); }
    }

    /* Eye nervous dart */
    @keyframes ibot-eye-dart {
      0%,100% { transform: translateX(0); }
      20%     { transform: translateX(-5px); }
      40%     { transform: translateX(5px); }
      60%     { transform: translateX(-3px); }
      80%     { transform: translateX(3px); }
    }

    /* Glass crack appearing */
    @keyframes ibot-crack-appear {
      0%   { opacity: 0; stroke-dashoffset: 200; }
      100% { opacity: 1; stroke-dashoffset: 0; }
    }

    /* Glass shard fall */
    @keyframes ibot-shard-fall {
      0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
      100% { transform: translateY(120px) rotate(45deg); opacity: 0; }
    }
  `;

  const styleEl = document.createElement('style');
  styleEl.textContent = CSS;
  document.head.appendChild(styleEl);

  /* ════════════════════════════════════════════════════════
     SOUND ENGINE — Web Audio API, no files needed
  ════════════════════════════════════════════════════════ */
  let audioCtx = null;

  function getAudioCtx() {
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
    }
    return audioCtx;
  }

  function playSound(type) {
    const ctx = getAudioCtx();
    if (!ctx) return;

    try {
      if (type === 'impact') {
        /* Metal + ceramic thud */
        const buf  = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
          const t = i / ctx.sampleRate;
          data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 18) * 0.8
                  + Math.sin(2 * Math.PI * 80 * t) * Math.exp(-t * 12) * 0.5;
        }
        const src = ctx.createBufferSource();
        const gain = ctx.createGain(); gain.gain.value = 0.6;
        const comp = ctx.createDynamicsCompressor();
        src.buffer = buf;
        src.connect(comp); comp.connect(gain); gain.connect(ctx.destination);
        src.start();

      } else if (type === 'step') {
        /* Soft robotic tap */
        const osc = ctx.createOscillator();
        const g   = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.06);
        g.gain.setValueAtTime(0.15, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.connect(g); g.connect(ctx.destination);
        osc.start(); osc.stop(ctx.currentTime + 0.08);

      } else if (type === 'knock1') {
        /* Light tap on glass */
        const buf  = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
          const t = i / ctx.sampleRate;
          data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 50) * 0.5
                  + Math.sin(2 * Math.PI * 1200 * t) * Math.exp(-t * 40) * 0.3;
        }
        const src = ctx.createBufferSource();
        const g   = ctx.createGain(); g.gain.value = 0.4;
        const filt = ctx.createBiquadFilter(); filt.type = 'highpass'; filt.frequency.value = 800;
        src.buffer = buf; src.connect(filt); filt.connect(g); g.connect(ctx.destination);
        src.start();

      } else if (type === 'knock2') {
        /* Harder tap */
        const buf  = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
          const t = i / ctx.sampleRate;
          data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 35) * 0.7
                  + Math.sin(2 * Math.PI * 900 * t) * Math.exp(-t * 28) * 0.4;
        }
        const src = ctx.createBufferSource();
        const g   = ctx.createGain(); g.gain.value = 0.55;
        src.buffer = buf; src.connect(g); g.connect(ctx.destination);
        src.start();

      } else if (type === 'knock3') {
        /* Heavy knock + bass */
        const buf  = ctx.createBuffer(1, ctx.sampleRate * 0.4, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
          const t = i / ctx.sampleRate;
          data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 20) * 0.9
                  + Math.sin(2 * Math.PI * 60 * t) * Math.exp(-t * 8) * 0.7
                  + Math.sin(2 * Math.PI * 700 * t) * Math.exp(-t * 25) * 0.3;
        }
        const src = ctx.createBufferSource();
        const g   = ctx.createGain(); g.gain.value = 0.75;
        const comp = ctx.createDynamicsCompressor();
        src.buffer = buf; src.connect(comp); comp.connect(g); g.connect(ctx.destination);
        src.start();

      } else if (type === 'glass') {
        /* Glass shatter */
        for (let k = 0; k < 6; k++) {
          setTimeout(() => {
            const ctx2 = getAudioCtx();
            if (!ctx2) return;
            const buf  = ctx2.createBuffer(1, ctx2.sampleRate * 0.25, ctx2.sampleRate);
            const data = buf.getChannelData(0);
            const freq = 800 + Math.random() * 3000;
            for (let i = 0; i < data.length; i++) {
              const t = i / ctx2.sampleRate;
              data[i] = (Math.random() * 2 - 1) * Math.exp(-t * (15 + Math.random() * 30)) * 0.5
                      + Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 20) * 0.2;
            }
            const src = ctx2.createBufferSource();
            const g   = ctx2.createGain(); g.gain.value = 0.3 + Math.random() * 0.3;
            src.buffer = buf; src.connect(g); g.connect(ctx2.destination);
            src.start();
          }, k * 30);
        }

      } else if (type === 'panic_steps') {
        /* Rapid robotic feet */
        for (let k = 0; k < 8; k++) {
          setTimeout(() => {
            const ctx2 = getAudioCtx(); if (!ctx2) return;
            const osc = ctx2.createOscillator();
            const g   = ctx2.createGain();
            osc.type = 'sine';
            osc.frequency.value = 180 + Math.random() * 80;
            g.gain.setValueAtTime(0.12, ctx2.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, ctx2.currentTime + 0.05);
            osc.connect(g); g.connect(ctx2.destination);
            osc.start(); osc.stop(ctx2.currentTime + 0.05);
          }, k * 80);
        }
      }
    } catch(e) {}
  }

  /* ════════════════════════════════════════════════════════
     BUILD ROBOT SVG
     White ceramic body, black visor, blue LED eyes,
     blue cape, gold fingertips, chrome joints, antenna
  ════════════════════════════════════════════════════════ */
  function buildRobotSVG() {
    return `
    <svg viewBox="0 0 120 180" xmlns="http://www.w3.org/2000/svg" overflow="visible">
      <defs>
        <!-- Glossy white gradient for ceramic parts -->
        <radialGradient id="ib-ceramic" cx="38%" cy="30%" r="65%">
          <stop offset="0%"   stop-color="#ffffff"/>
          <stop offset="60%"  stop-color="#dde8f0"/>
          <stop offset="100%" stop-color="#b8ccd8"/>
        </radialGradient>
        <!-- Blue glow gradient for accents -->
        <radialGradient id="ib-blue" cx="50%" cy="40%" r="60%">
          <stop offset="0%"   stop-color="#5dd8ff"/>
          <stop offset="100%" stop-color="#0077cc"/>
        </radialGradient>
        <!-- Visor dark glass -->
        <radialGradient id="ib-visor" cx="40%" cy="35%" r="65%">
          <stop offset="0%"   stop-color="#0a1a2e" stop-opacity="1"/>
          <stop offset="100%" stop-color="#000508" stop-opacity="1"/>
        </radialGradient>
        <!-- Gold for fingertips -->
        <linearGradient id="ib-gold" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stop-color="#ffd700"/>
          <stop offset="50%"  stop-color="#c8a000"/>
          <stop offset="100%" stop-color="#a07800"/>
        </linearGradient>
        <!-- Chrome for joints -->
        <linearGradient id="ib-chrome" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stop-color="#e8edf0"/>
          <stop offset="50%"  stop-color="#9aabba"/>
          <stop offset="100%" stop-color="#607080"/>
        </linearGradient>
        <!-- Blue accent body -->
        <linearGradient id="ib-bodyblue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stop-color="#3399ff"/>
          <stop offset="100%" stop-color="#005ab5"/>
        </linearGradient>
        <!-- Eye glow filter -->
        <filter id="ib-eye-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <!-- Ant glow -->
        <filter id="ib-ant-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <!-- Soft shadow -->
        <filter id="ib-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000" flood-opacity="0.35"/>
        </filter>
      </defs>

      <!-- ── CAPE (behind body) ── -->
      <g id="ibot-cape" transform="translate(60,90)">
        <path d="M -14,-30 Q -28,0 -22,40 Q -12,50 -2,40 Q 4,20 2,-25 Z"
              fill="#1a90ff" fill-opacity="0.72" stroke="#0055cc" stroke-width="0.5"/>
        <path d="M -14,-30 Q -20,0 -16,35"
              fill="none" stroke="#66bbff" stroke-width="0.8" stroke-opacity="0.5"/>
      </g>

      <!-- ── LEGS ── -->
      <!-- Left leg -->
      <g id="ibot-leg-l" transform="translate(44,140)" transform-origin="44 140">
        <rect x="-9" y="0" width="18" height="26" rx="9" fill="url(#ib-ceramic)" filter="url(#ib-shadow)"/>
        <!-- Blue boot -->
        <ellipse cx="0" cy="28" rx="12" ry="8" fill="url(#ib-blue)"/>
        <!-- Sole glow -->
        <ellipse cx="0" cy="30" rx="8" ry="3" fill="#5dd8ff" fill-opacity="0.6"/>
        <!-- Chrome joint band -->
        <rect x="-9" y="22" width="18" height="4" rx="2" fill="url(#ib-chrome)"/>
      </g>
      <!-- Right leg -->
      <g id="ibot-leg-r" transform="translate(76,140)" transform-origin="76 140">
        <rect x="-9" y="0" width="18" height="26" rx="9" fill="url(#ib-ceramic)" filter="url(#ib-shadow)"/>
        <ellipse cx="0" cy="28" rx="12" ry="8" fill="url(#ib-blue)"/>
        <ellipse cx="0" cy="30" rx="8" ry="3" fill="#5dd8ff" fill-opacity="0.6"/>
        <rect x="-9" y="22" width="18" height="4" rx="2" fill="url(#ib-chrome)"/>
      </g>

      <!-- ── BODY (torso, pear-shaped) ── -->
      <g id="ibot-body" filter="url(#ib-shadow)">
        <!-- Lower torso wider -->
        <ellipse cx="60" cy="130" rx="30" ry="18" fill="url(#ib-ceramic)"/>
        <!-- Upper torso narrower -->
        <rect x="34" y="100" width="52" height="38" rx="18" fill="url(#ib-ceramic)"/>
        <!-- Blue chest panel -->
        <rect x="44" y="108" width="32" height="22" rx="8" fill="url(#ib-bodyblue)"/>
        <!-- Chest core light -->
        <circle cx="60" cy="119" r="7" fill="#33aaff" fill-opacity="0.9"/>
        <circle cx="60" cy="119" r="4" fill="#99ddff"/>
        <circle cx="60" cy="119" r="2" fill="#ffffff"/>
        <!-- Gold shoulder joints -->
        <circle cx="34" cy="108" r="7" fill="url(#ib-gold)"/>
        <circle cx="86" cy="108" r="7" fill="url(#ib-gold)"/>
        <!-- Chrome body rim -->
        <ellipse cx="60" cy="130" rx="30" ry="18" fill="none" stroke="url(#ib-chrome)" stroke-width="1.5"/>
      </g>

      <!-- ── ARM LEFT ── -->
      <g id="ibot-arm-l" transform="translate(34,112)" transform-origin="0 0">
        <!-- Upper arm -->
        <rect x="-18" y="-6" width="18" height="28" rx="9" fill="url(#ib-ceramic)" filter="url(#ib-shadow)"/>
        <!-- Chrome elbow -->
        <ellipse cx="-9" cy="24" rx="10" ry="8" fill="url(#ib-chrome)"/>
        <!-- Forearm -->
        <rect x="-17" y="26" width="16" height="22" rx="8" fill="url(#ib-ceramic)"/>
        <!-- Hand (fist shape) -->
        <g id="ibot-hand-l">
          <rect x="-19" y="46" width="20" height="16" rx="6" fill="url(#ib-ceramic)"/>
          <!-- Fingers -->
          <rect x="-19" y="40" width="5" height="12" rx="2.5" fill="url(#ib-ceramic)"/>
          <rect x="-13" y="38" width="5" height="14" rx="2.5" fill="url(#ib-ceramic)"/>
          <rect x="-7"  y="38" width="5" height="14" rx="2.5" fill="url(#ib-ceramic)"/>
          <rect x="-1"  y="40" width="5" height="12" rx="2.5" fill="url(#ib-ceramic)"/>
          <!-- Gold fingertips -->
          <rect x="-19" y="40" width="5" height="4" rx="2" fill="url(#ib-gold)"/>
          <rect x="-13" y="38" width="5" height="4" rx="2" fill="url(#ib-gold)"/>
          <rect x="-7"  y="38" width="5" height="4" rx="2" fill="url(#ib-gold)"/>
          <rect x="-1"  y="40" width="5" height="4" rx="2" fill="url(#ib-gold)"/>
        </g>
      </g>

      <!-- ── ARM RIGHT ── -->
      <g id="ibot-arm-r" transform="translate(86,112)" transform-origin="0 0">
        <rect x="0" y="-6" width="18" height="28" rx="9" fill="url(#ib-ceramic)" filter="url(#ib-shadow)"/>
        <ellipse cx="9" cy="24" rx="10" ry="8" fill="url(#ib-chrome)"/>
        <rect x="1" y="26" width="16" height="22" rx="8" fill="url(#ib-ceramic)"/>
        <g id="ibot-hand-r">
          <rect x="-1" y="46" width="20" height="16" rx="6" fill="url(#ib-ceramic)"/>
          <rect x="14" y="40" width="5" height="12" rx="2.5" fill="url(#ib-ceramic)"/>
          <rect x="8"  y="38" width="5" height="14" rx="2.5" fill="url(#ib-ceramic)"/>
          <rect x="2"  y="38" width="5" height="14" rx="2.5" fill="url(#ib-ceramic)"/>
          <rect x="-4" y="40" width="5" height="12" rx="2.5" fill="url(#ib-ceramic)"/>
          <rect x="14" y="40" width="5" height="4" rx="2" fill="url(#ib-gold)"/>
          <rect x="8"  y="38" width="5" height="4" rx="2" fill="url(#ib-gold)"/>
          <rect x="2"  y="38" width="5" height="4" rx="2" fill="url(#ib-gold)"/>
          <rect x="-4" y="40" width="5" height="4" rx="2" fill="url(#ib-gold)"/>
        </g>
      </g>

      <!-- ── NECK ── -->
      <rect x="52" y="92" width="16" height="12" rx="5" fill="url(#ib-chrome)" filter="url(#ib-shadow)"/>

      <!-- ── HEAD (oversized smooth oval helmet) ── -->
      <g id="ibot-head">
        <!-- Helmet white ceramic -->
        <ellipse cx="60" cy="68" rx="35" ry="34" fill="url(#ib-ceramic)" filter="url(#ib-shadow)"/>
        <!-- Helmet highlight -->
        <ellipse cx="48" cy="52" rx="14" ry="10" fill="white" fill-opacity="0.45"/>

        <!-- Visor — black glass curved front -->
        <rect x="30" y="52" width="60" height="38" rx="12" fill="url(#ib-visor)"/>
        <!-- Visor glass reflection -->
        <path d="M 34,56 Q 55,50 82,58" stroke="rgba(255,255,255,0.18)" stroke-width="2" fill="none" stroke-linecap="round"/>

        <!-- ── EYEBROWS (LED strips) ── -->
        <g id="ibot-eyebrows">
          <rect id="ibot-brow-l" x="34" y="56" width="20" height="3" rx="1.5"
                fill="#44aaff" fill-opacity="0.85" filter="url(#ib-eye-glow)"/>
          <rect id="ibot-brow-r" x="66" y="56" width="20" height="3" rx="1.5"
                fill="#44aaff" fill-opacity="0.85" filter="url(#ib-eye-glow)"/>
        </g>

        <!-- ── EYES (LED ovals inside visor) ── -->
        <g id="ibot-eyes">
          <!-- Left eye -->
          <g id="ibot-eye-l" filter="url(#ib-eye-glow)">
            <ellipse id="ibot-eye-l-shape" cx="44" cy="70" rx="11" ry="9"
                     fill="#003366" fill-opacity="0.4"/>
            <ellipse id="ibot-eye-l-led" cx="44" cy="70" rx="8" ry="7"
                     fill="#1a88ff"/>
            <!-- LED dot matrix pattern -->
            <circle cx="40" cy="68" r="1.5" fill="#66ccff" fill-opacity="0.9"/>
            <circle cx="44" cy="68" r="1.5" fill="#66ccff" fill-opacity="0.9"/>
            <circle cx="48" cy="68" r="1.5" fill="#66ccff" fill-opacity="0.9"/>
            <circle cx="40" cy="72" r="1.5" fill="#44aaff" fill-opacity="0.7"/>
            <circle cx="44" cy="72" r="1.5" fill="#44aaff" fill-opacity="0.7"/>
            <circle cx="48" cy="72" r="1.5" fill="#44aaff" fill-opacity="0.7"/>
            <!-- Eye shine -->
            <ellipse cx="40" cy="66" rx="3" ry="2" fill="white" fill-opacity="0.35"/>
          </g>
          <!-- Right eye -->
          <g id="ibot-eye-r" filter="url(#ib-eye-glow)">
            <ellipse id="ibot-eye-r-shape" cx="76" cy="70" rx="11" ry="9"
                     fill="#003366" fill-opacity="0.4"/>
            <ellipse id="ibot-eye-r-led" cx="76" cy="70" rx="8" ry="7"
                     fill="#1a88ff"/>
            <circle cx="72" cy="68" r="1.5" fill="#66ccff" fill-opacity="0.9"/>
            <circle cx="76" cy="68" r="1.5" fill="#66ccff" fill-opacity="0.9"/>
            <circle cx="80" cy="68" r="1.5" fill="#66ccff" fill-opacity="0.9"/>
            <circle cx="72" cy="72" r="1.5" fill="#44aaff" fill-opacity="0.7"/>
            <circle cx="76" cy="72" r="1.5" fill="#44aaff" fill-opacity="0.7"/>
            <circle cx="80" cy="72" r="1.5" fill="#44aaff" fill-opacity="0.7"/>
            <ellipse cx="72" cy="66" rx="3" ry="2" fill="white" fill-opacity="0.35"/>
          </g>
        </g>

        <!-- Visor rim -->
        <rect x="30" y="52" width="60" height="38" rx="12" fill="none"
              stroke="rgba(100,180,255,0.3)" stroke-width="1.5"/>
      </g>

      <!-- ── ANTENNA ── -->
      <g id="ibot-antenna">
        <path d="M 60,34 Q 64,18 68,10" stroke="#ccdde8" stroke-width="2.5"
              stroke-linecap="round" fill="none"/>
        <circle id="ibot-ant-orb" cx="68" cy="10" r="7"
                fill="#00ccff" filter="url(#ib-ant-glow)"
                stroke="#00aaee" stroke-width="1"/>
        <circle cx="68" cy="10" r="3.5" fill="#aaeeff"/>
      </g>

      <!-- Ground shadow -->
      <ellipse cx="60" cy="178" rx="36" ry="5" fill="rgba(0,0,0,0.18)"/>
    </svg>
    `;
  }

  /* ════════════════════════════════════════════════════════
     BUILD GLASS CANVAS
  ════════════════════════════════════════════════════════ */
  let glassCanvas = null;
  let glassCtx    = null;
  let cracks      = [];
  let shards      = [];

  function buildGlass() {
    glassCanvas = document.createElement('canvas');
    glassCanvas.id = 'ibot-glass';
    glassCanvas.width  = window.innerWidth;
    glassCanvas.height = window.innerHeight;
    glassCanvas.style.cssText = 'position:fixed;inset:0;z-index:999991;pointer-events:none;';
    document.body.appendChild(glassCanvas);
    glassCtx = glassCanvas.getContext('2d');
  }

  function addCrack(centerX, centerY, severity) {
    /* Generate realistic spider crack lines */
    const numLines = 4 + Math.floor(severity * 6);
    const crack = { lines: [], center: { x: centerX, y: centerY }, alpha: 0 };

    for (let i = 0; i < numLines; i++) {
      const angle  = (i / numLines) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const length = 40 + Math.random() * (80 * severity);
      const points = [{ x: centerX, y: centerY }];
      let cx = centerX, cy = centerY;

      for (let j = 0; j < 4; j++) {
        const jitter = (Math.random() - 0.5) * 0.4;
        const dist   = (length / 4) * (0.7 + Math.random() * 0.6);
        cx += Math.cos(angle + jitter) * dist;
        cy += Math.sin(angle + jitter) * dist;
        points.push({ x: cx, y: cy });

        /* Branch cracks */
        if (severity > 1.5 && Math.random() > 0.5) {
          const bAngle  = angle + (Math.random() - 0.5) * 1.2;
          const bLength = dist * 0.5;
          const bx = cx + Math.cos(bAngle) * bLength;
          const by = cy + Math.sin(bAngle) * bLength;
          crack.lines.push([{ x: cx, y: cy }, { x: bx, y: by }]);
        }
      }
      crack.lines.push(points);
    }
    cracks.push(crack);

    /* Animate crack in */
    let alpha = 0;
    const anim = setInterval(() => {
      alpha += 0.08;
      crack.alpha = Math.min(1, alpha);
      drawGlass();
      if (alpha >= 1) clearInterval(anim);
    }, 16);
  }

  function spawnShards(cx, cy) {
    for (let i = 0; i < 18; i++) {
      const angle  = Math.random() * Math.PI * 2;
      const speed  = 2 + Math.random() * 5;
      const size   = 4 + Math.random() * 14;
      shards.push({
        x: cx + (Math.random() - 0.5) * 60,
        y: cy + (Math.random() - 0.5) * 40,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed + 2,
        rot: Math.random() * Math.PI * 2,
        rotV: (Math.random() - 0.5) * 0.3,
        size: size,
        alpha: 1,
        life: 1
      });
    }
    animateShards();
  }

  function animateShards() {
    if (shards.length === 0) return;
    shards.forEach(s => {
      s.x   += s.vx;
      s.y   += s.vy;
      s.vy  += 0.4; /* gravity */
      s.rot += s.rotV;
      s.life -= 0.025;
      s.alpha = Math.max(0, s.life);
    });
    shards = shards.filter(s => s.life > 0);
    drawGlass();
    if (shards.length > 0) requestAnimationFrame(animateShards);
    else { drawGlass(); }
  }

  function drawHole(cx, cy, r) {
    if (!glassCtx) return;
    glassCtx.save();
    /* Dark hole punch */
    glassCtx.globalCompositeOperation = 'destination-out';
    const g = glassCtx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0,   'rgba(0,0,0,1)');
    g.addColorStop(0.6, 'rgba(0,0,0,0.85)');
    g.addColorStop(1,   'rgba(0,0,0,0)');
    glassCtx.fillStyle = g;
    glassCtx.beginPath();
    glassCtx.arc(cx, cy, r, 0, Math.PI * 2);
    glassCtx.fill();
    glassCtx.restore();
  }

  function drawGlass() {
    if (!glassCtx) return;
    glassCtx.clearRect(0, 0, glassCanvas.width, glassCanvas.height);

    /* Draw cracks */
    cracks.forEach(crack => {
      glassCtx.save();
      glassCtx.globalAlpha = crack.alpha;
      crack.lines.forEach(pts => {
        glassCtx.beginPath();
        glassCtx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          glassCtx.lineTo(pts[i].x, pts[i].y);
        }
        glassCtx.strokeStyle = 'rgba(200,220,240,0.9)';
        glassCtx.lineWidth   = 0.8 + Math.random() * 0.4;
        glassCtx.stroke();

        /* Inner highlight */
        glassCtx.strokeStyle = 'rgba(255,255,255,0.4)';
        glassCtx.lineWidth   = 0.3;
        glassCtx.stroke();
      });
      glassCtx.restore();
    });

    /* Draw shards */
    shards.forEach(s => {
      glassCtx.save();
      glassCtx.globalAlpha = s.alpha * 0.85;
      glassCtx.translate(s.x, s.y);
      glassCtx.rotate(s.rot);
      glassCtx.beginPath();
      /* Irregular triangle shard */
      glassCtx.moveTo(0, -s.size);
      glassCtx.lineTo(s.size * 0.6,  s.size * 0.5);
      glassCtx.lineTo(-s.size * 0.5, s.size * 0.4);
      glassCtx.closePath();
      const g = glassCtx.createLinearGradient(0, -s.size, 0, s.size);
      g.addColorStop(0, 'rgba(200,230,255,0.9)');
      g.addColorStop(1, 'rgba(150,200,230,0.3)');
      glassCtx.fillStyle = g;
      glassCtx.fill();
      glassCtx.strokeStyle = 'rgba(255,255,255,0.6)';
      glassCtx.lineWidth   = 0.5;
      glassCtx.stroke();
      glassCtx.restore();
    });

    /* Draw hole if shattered */
    if (glassShattered && glassCanvas) {
      const cx = glassCanvas.width / 2;
      const cy = glassCanvas.height / 2;
      drawHole(cx, cy, 90);
    }
  }

  /* ════════════════════════════════════════════════════════
     EYE / EYEBROW STATE HELPERS
  ════════════════════════════════════════════════════════ */
  function setEyeState(state) {
    const elL = document.getElementById('ibot-eye-l-led');
    const elR = document.getElementById('ibot-eye-r-led');
    const blL = document.getElementById('ibot-brow-l');
    const blR = document.getElementById('ibot-brow-r');
    if (!elL || !elR) return;

    /* Reset */
    [elL, elR].forEach(e => { e.setAttribute('rx','8'); e.setAttribute('ry','7'); });
    if (blL) { blL.setAttribute('transform', ''); }
    if (blR) { blR.setAttribute('transform', ''); }

    /* Remove any running eye animations */
    const eyeG = document.getElementById('ibot-eyes');
    if (eyeG) eyeG.style.animation = '';

    if (state === 'calm') {
      [elL, elR].forEach(e => { e.setAttribute('rx','8'); e.setAttribute('ry','7'); });

    } else if (state === 'nervous') {
      /* Narrow eyes */
      [elL, elR].forEach(e => { e.setAttribute('rx','7'); e.setAttribute('ry','4'); });
      /* Brows tilt inward */
      if (blL) blL.setAttribute('transform', 'rotate(-12, 44, 58)');
      if (blR) blR.setAttribute('transform', 'rotate(12, 76, 58)');
      /* Dart animation */
      if (eyeG) eyeG.style.animation = 'ibot-eye-dart 1.2s ease-in-out infinite';

    } else if (state === 'shocked') {
      [elL, elR].forEach(e => { e.setAttribute('rx','11'); e.setAttribute('ry','11'); });
      if (blL) blL.setAttribute('transform', 'translate(0,-4)');
      if (blR) blR.setAttribute('transform', 'translate(0,-4)');

    } else if (state === 'panic') {
      [elL, elR].forEach(e => { e.setAttribute('rx','3'); e.setAttribute('ry','3'); });
      if (blL) blL.setAttribute('transform', 'rotate(-25, 44, 58)');
      if (blR) blR.setAttribute('transform', 'rotate(25, 76, 58)');

    } else if (state === 'exclaim') {
      /* Show !! as text inside visor */
      const visorText = document.getElementById('ibot-exclaim');
      if (!visorText) {
        const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        txt.id = 'ibot-exclaim';
        txt.setAttribute('x', '60');
        txt.setAttribute('y', '76');
        txt.setAttribute('text-anchor', 'middle');
        txt.setAttribute('font-size', '22');
        txt.setAttribute('font-weight', 'bold');
        txt.setAttribute('fill', '#ff4444');
        txt.setAttribute('filter', 'url(#ib-eye-glow)');
        txt.textContent = '!!';
        document.getElementById('ibot-eyes')?.appendChild(txt);
      }
      [elL, elR].forEach(e => { e.setAttribute('rx','0'); e.setAttribute('ry','0'); });

    } else if (state === 'search') {
      /* Squint */
      [elL, elR].forEach(e => { e.setAttribute('rx','8'); e.setAttribute('ry','3.5'); });
      if (blL) blL.setAttribute('transform', 'translate(0,2)');
      if (blR) blR.setAttribute('transform', 'translate(0,2)');
    }
  }

  function clearExclaim() {
    const v = document.getElementById('ibot-exclaim');
    if (v) v.remove();
  }

  function setHeadLook(dir) {
    /* dir = 'left' | 'right' | 'center' */
    const head = document.getElementById('ibot-head');
    const eyes = document.getElementById('ibot-eyes');
    if (!head) return;
    head.style.transition = 'transform 0.4s ease';
    if (dir === 'right') {
      head.style.transform = 'rotate(18deg)';
      if (eyes) eyes.style.transform = 'translateX(4px)';
    } else if (dir === 'left') {
      head.style.transform = 'rotate(-12deg)';
      if (eyes) eyes.style.transform = 'translateX(-4px)';
    } else {
      head.style.transform = '';
      if (eyes) eyes.style.transform = '';
    }
  }

  function antFlicker(mode) {
    const orb = document.getElementById('ibot-ant-orb');
    if (!orb) return;
    if (mode === 'flicker') {
      orb.style.animation = 'ibot-ant-flicker 0.18s ease-in-out infinite';
    } else if (mode === 'panic') {
      orb.style.animation = 'ibot-ant-panic 0.08s ease-in-out infinite';
    } else {
      orb.style.animation = '';
    }
  }

  /* ════════════════════════════════════════════════════════
     SLEEP UTILITY
  ════════════════════════════════════════════════════════ */
  function sleep(ms) {
    return new Promise(resolve => {
      const t = setTimeout(resolve, ms);
      phaseTimers.push(t);
    });
  }

  function clearAllTimers() {
    phaseTimers.forEach(t => clearTimeout(t));
    phaseTimers = [];
  }

  /* ════════════════════════════════════════════════════════
     MAIN SCENE — async sequence
  ════════════════════════════════════════════════════════ */
  async function runScene() {
    if (botActive) return;
    botActive    = true;
    interacted   = false;
    glassShattered = false;
    phase        = 'entry';
    cracks       = [];
    shards       = [];

    const W = window.innerWidth;
    const H = window.innerHeight;

    /* Build scene */
    const scene = document.createElement('div');
    scene.id = 'ibot-scene';
    document.body.appendChild(scene);

    /* Build glass canvas */
    buildGlass();

    /* Build robot */
    const robot = document.createElement('div');
    robot.id    = 'ibot-robot';
    robot.innerHTML = buildRobotSVG();
    robot.style.cssText = `
      position: absolute;
      bottom: 0;
      left: ${W + 200}px;
      width: 120px;
      height: 180px;
      transform-origin: bottom center;
      pointer-events: none;
      will-change: transform, left;
    `;
    scene.appendChild(robot);

    const legL = robot.querySelector('#ibot-leg-l');
    const legR = robot.querySelector('#ibot-leg-r');
    const armL = robot.querySelector('#ibot-arm-l');
    const armR = robot.querySelector('#ibot-arm-r');
    const cape = robot.querySelector('#ibot-cape');

    /* ────────────────────────────────────────────────────
       PHASE 1: FORCED ENTRY — shoved from right
    ──────────────────────────────────────────────────── */
    phase = 'entry';
    setEyeState('shocked');
    antFlicker('flicker');

    /* Arms flailing */
    if (armL) armL.style.animation = 'ibot-arm-flail-l 0.2s ease-in-out infinite';
    if (armR) armR.style.animation = 'ibot-arm-flail-r 0.2s ease-in-out 0.1s infinite';

    /* Fly in from right with tumble */
    robot.style.transition = 'left 0.55s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    robot.style.left       = (W * 0.72) + 'px';
    robot.style.animation  = 'ibot-tumble 0.55s ease-in forwards';

    await sleep(560);
    if (interacted) { flee(robot, scene); return; }

    /* Hit floor */
    playSound('impact');
    robot.style.animation  = 'ibot-bounce 0.65s cubic-bezier(0.36, 0.07, 0.19, 0.97) forwards';
    robot.style.transition = 'none';

    /* Screen shake */
    document.body.style.animation = 'ibot-shake 0.35s ease forwards';
    setTimeout(() => { document.body.style.animation = ''; }, 360);

    await sleep(700);
    if (interacted) { flee(robot, scene); return; }

    /* ────────────────────────────────────────────────────
       PHASE 2: RECOVERY
    ──────────────────────────────────────────────────── */
    phase = 'recovery';
    antFlicker('');
    setEyeState('calm');

    /* Arms push off floor */
    if (armL) armL.style.animation = '';
    if (armR) armR.style.animation = '';
    robot.style.animation = '';

    /* Stand up slowly */
    robot.style.transition = 'transform 0.8s ease';
    robot.style.transform  = 'scaleY(0.8) translateY(10px)';
    await sleep(300);
    robot.style.transform  = 'scaleY(1) translateY(0)';
    await sleep(600);
    if (interacted) { flee(robot, scene); return; }

    /* Dust off — slight shake */
    setEyeState('nervous');
    for (let i = 0; i < 3; i++) {
      robot.style.transform = `translateX(${i % 2 === 0 ? -3 : 3}px) rotate(${i % 2 === 0 ? -2 : 2}deg)`;
      await sleep(120);
    }
    robot.style.transform = '';
    await sleep(300);
    if (interacted) { flee(robot, scene); return; }

    /* ────────────────────────────────────────────────────
       PHASE 3: NERVOUS WALK TO CENTER
    ──────────────────────────────────────────────────── */
    phase = 'walking';
    setEyeState('nervous');
    antFlicker('');

    /* Hands near chest trembling */
    if (armL) { armL.style.animation = ''; armL.style.transform = 'rotate(35deg)'; }
    if (armR) { armR.style.animation = ''; armR.style.transform = 'rotate(-35deg)'; }

    const centerX = W / 2 - 60;
    const startX  = parseFloat(robot.style.left);
    const steps   = 6;
    const stepDist = (centerX - startX) / steps;

    for (let s = 0; s < steps; s++) {
      if (interacted) { flee(robot, scene); return; }

      /* Walk step */
      const targetX = startX + stepDist * (s + 1);
      robot.style.transition = 'left 0.45s cubic-bezier(0.4, 0, 0.6, 1)';
      robot.style.left = targetX + 'px';

      /* Leg cycle */
      if (legL) legL.style.animation = 'ibot-walk-l 0.45s ease-in-out';
      if (legR) legR.style.animation = 'ibot-walk-r 0.45s ease-in-out';
      /* Tiptoe body bounce */
      robot.style.animation = 'ibot-tiptoe 0.45s ease-in-out';

      playSound('step');
      await sleep(460);
      robot.style.animation = '';
      if (legL) legL.style.animation = '';
      if (legR) legR.style.animation = '';

      /* Every 2 steps: nervous glance back right */
      if (s % 2 === 1) {
        setHeadLook('right');
        setEyeState('nervous');
        await sleep(400);
        if (interacted) { flee(robot, scene); return; }
        setHeadLook('center');
        await sleep(200);
      }
    }

    await sleep(200);
    if (interacted) { flee(robot, scene); return; }

    /* ────────────────────────────────────────────────────
       PHASE 4: LOOK AT USER
    ──────────────────────────────────────────────────── */
    phase = 'looking';
    setHeadLook('center');
    setEyeState('search');

    /* Head slowly tilts toward "camera" */
    const head = robot.querySelector('#ibot-head');
    if (head) {
      head.style.transition = 'transform 0.6s ease';
      head.style.transform  = 'translateY(-4px) rotate(-3deg)';
    }

    await sleep(800);
    if (interacted) { flee(robot, scene); return; }

    setEyeState('calm');
    await sleep(1000);
    if (interacted) { flee(robot, scene); return; }

    /* ────────────────────────────────────────────────────
       PHASE 5: SCREEN KNOCK x3
    ──────────────────────────────────────────────────── */
    phase = 'knocking';
    if (head) head.style.transform = '';

    /* Raise right arm for knocking */
    if (armR) {
      armR.style.animation  = 'ibot-arm-raise 0.5s ease forwards';
      armR.style.transition = 'transform 0.5s ease';
    }
    await sleep(550);
    if (interacted) { flee(robot, scene); return; }

    const knockCX = W / 2;
    const knockCY = H / 2;

    /* KNOCK 1 — light tap */
    if (armR) armR.style.animation = 'ibot-knock 0.35s ease';
    await sleep(100);
    playSound('knock1');
    /* Screen micro-shake */
    document.body.style.animation = 'ibot-shake 0.2s ease';
    setTimeout(() => { document.body.style.animation = ''; }, 210);
    /* Small crack */
    addCrack(knockCX, knockCY, 0.6);
    await sleep(500);
    if (interacted) { fleeAfterGlass(robot, scene); return; }

    /* Look through crack — lean in */
    setEyeState('search');
    if (head) { head.style.transition = 'transform 0.4s ease'; head.style.transform = 'translateY(-8px) scale(1.05)'; }
    await sleep(700);
    if (head) head.style.transform = '';
    await sleep(300);
    if (interacted) { fleeAfterGlass(robot, scene); return; }

    /* KNOCK 2 — harder */
    if (armR) armR.style.animation = 'ibot-knock 0.32s ease';
    await sleep(100);
    playSound('knock2');
    document.body.style.animation = 'ibot-shake 0.22s ease';
    setTimeout(() => { document.body.style.animation = ''; }, 230);
    addCrack(knockCX + 20, knockCY - 10, 1.2);
    addCrack(knockCX - 15, knockCY + 20, 0.9);
    await sleep(550);
    if (interacted) { fleeAfterGlass(robot, scene); return; }

    /* Look excited */
    setEyeState('shocked');
    await sleep(600);
    if (interacted) { fleeAfterGlass(robot, scene); return; }

    /* KNOCK 3 — heavy blow */
    setEyeState('calm');
    if (armR) armR.style.animation = 'ibot-knock 0.28s ease';
    await sleep(80);
    playSound('knock3');
    /* Big screen shake */
    document.body.style.animation = 'ibot-shake 0.45s ease';
    setTimeout(() => { document.body.style.animation = ''; }, 460);
    /* Massive cracks */
    addCrack(knockCX, knockCY, 2.5);
    addCrack(knockCX + 40, knockCY + 30, 1.8);
    addCrack(knockCX - 50, knockCY - 20, 1.5);
    await sleep(200);
    /* Glass shatter */
    playSound('glass');
    glassShattered = true;
    spawnShards(knockCX, knockCY);
    drawGlass();

    await sleep(400);
    if (interacted) { fleeAfterGlass(robot, scene); return; }

    /* Arm down after knocking */
    if (armR) { armR.style.animation = ''; armR.style.transform = ''; }

    /* ────────────────────────────────────────────────────
       PHASE 6: FOURTH WALL BREAK — peek through hole
    ──────────────────────────────────────────────────── */
    phase = 'peeking';

    /* Robot moves toward center of hole */
    robot.style.transition = 'left 0.6s ease, bottom 0.6s ease';
    robot.style.left   = (knockCX - 60) + 'px';
    robot.style.bottom = '0px';
    await sleep(650);
    if (interacted) { fleeAfterGlass(robot, scene); return; }

    /* PEEK LOOP */
    let peekCount = 0;
    while (!interacted && phase === 'peeking') {
      peekCount++;
      setEyeState('search');

      /* Lean head "through" the hole — scale up head */
      if (head) {
        head.style.transition = 'transform 0.5s ease';
        head.style.transform  = 'translateY(-12px) scale(1.15)';
      }

      /* Look left */
      setHeadLook('left');
      await sleep(700);
      if (interacted) break;

      /* Look right */
      setHeadLook('right');
      await sleep(600);
      if (interacted) break;

      /* Look center — at user */
      setHeadLook('center');
      setEyeState('calm');
      await sleep(1200);
      if (interacted) break;

      /* Pull back */
      if (head) head.style.transform = '';
      setHeadLook('center');
      await sleep(400);
      if (interacted) break;

      /* Glance back right nervously */
      setHeadLook('right');
      setEyeState('nervous');
      await sleep(500);
      setHeadLook('center');
      await sleep(300);

      /* Small loop pause */
      await sleep(3500);
    }

    /* ────────────────────────────────────────────────────
       FLEE (triggered by interaction during peeking)
    ──────────────────────────────────────────────────── */
    if (interacted) {
      fleeAfterGlass(robot, scene);
    }
  }

  /* ════════════════════════════════════════════════════════
     FLEE — before glass break
  ════════════════════════════════════════════════════════ */
  function flee(robot, scene) {
    if (!robot || !scene) return;
    clearAllTimers();
    phase = 'fleeing';

    const armL = robot.querySelector('#ibot-arm-l');
    const armR = robot.querySelector('#ibot-arm-r');
    const legL = robot.querySelector('#ibot-leg-l');
    const legR = robot.querySelector('#ibot-leg-r');
    const cape = robot.querySelector('#ibot-cape');

    setEyeState('exclaim');
    antFlicker('panic');

    /* Arms shoot up */
    if (armL) armL.style.animation = 'ibot-arm-flail-l 0.12s ease-in-out infinite';
    if (armR) armR.style.animation = 'ibot-arm-flail-r 0.12s ease-in-out infinite';
    /* Cape flying */
    if (cape) cape.style.animation = 'ibot-cape-run 0.2s ease-in-out infinite';

    setTimeout(() => {
      /* Sprint left */
      if (legL) legL.style.animation = 'ibot-run-l 0.12s ease-in-out infinite';
      if (legR) legR.style.animation = 'ibot-run-r 0.12s ease-in-out infinite';
      playSound('panic_steps');

      robot.style.transition = 'left 0.7s cubic-bezier(0.55, 0, 1, 0.45)';
      robot.style.left = '-300px';

      setTimeout(() => {
        cleanup(scene);
      }, 750);
    }, 250);
  }

  /* ════════════════════════════════════════════════════════
     FLEE AFTER GLASS — tiny panic dots, scramble
  ════════════════════════════════════════════════════════ */
  function fleeAfterGlass(robot, scene) {
    if (!robot || !scene) return;
    clearAllTimers();
    phase = 'fleeing';

    const armL = robot.querySelector('#ibot-arm-l');
    const armR = robot.querySelector('#ibot-arm-r');
    const legL = robot.querySelector('#ibot-leg-l');
    const legR = robot.querySelector('#ibot-leg-r');
    const cape = robot.querySelector('#ibot-cape');
    const head = robot.querySelector('#ibot-head');

    /* Panic dot eyes */
    setEyeState('panic');
    antFlicker('panic');

    /* Drop backward slightly */
    if (head) { head.style.transition = 'transform 0.2s ease'; head.style.transform = 'rotate(-15deg)'; }
    robot.style.transition = 'transform 0.2s ease';
    robot.style.transform  = 'rotate(-8deg) translateY(10px)';

    setTimeout(() => {
      /* Scramble up */
      robot.style.transition = 'transform 0.25s ease';
      robot.style.transform  = '';
      if (head) head.style.transform = '';

      setTimeout(() => {
        /* Full sprint left */
        if (armL) armL.style.animation = 'ibot-arm-flail-l 0.1s ease-in-out infinite';
        if (armR) armR.style.animation = 'ibot-arm-flail-r 0.1s ease-in-out infinite';
        if (legL) legL.style.animation = 'ibot-run-l 0.1s ease-in-out infinite';
        if (legR) legR.style.animation = 'ibot-run-r 0.1s ease-in-out infinite';
        if (cape) cape.style.animation = 'ibot-cape-run 0.15s ease-in-out infinite';
        playSound('panic_steps');

        robot.style.transition = 'left 0.65s cubic-bezier(0.55, 0, 1, 0.45)';
        robot.style.left = '-300px';

        setTimeout(() => {
          /* Fade out glass */
          if (glassCanvas) {
            glassCanvas.style.transition = 'opacity 1.2s ease';
            glassCanvas.style.opacity    = '0';
          }
          cleanup(scene);
        }, 700);
      }, 280);
    }, 220);
  }

  /* ════════════════════════════════════════════════════════
     CLEANUP
  ════════════════════════════════════════════════════════ */
  function cleanup(scene) {
    setTimeout(() => {
      if (scene && scene.parentNode) scene.remove();
      if (glassCanvas && glassCanvas.parentNode) glassCanvas.remove();
      glassCanvas    = null;
      glassCtx       = null;
      cracks         = [];
      shards         = [];
      glassShattered = false;
      botActive      = false;
      interacted     = false;
      phase          = 'none';

      /* Restart idle timer */
      resetIdleTimer();
    }, 1300);
  }

  /* ════════════════════════════════════════════════════════
     IDLE DETECTION
  ════════════════════════════════════════════════════════ */
  function onUserActivity() {
    if (botActive && phase !== 'none' && phase !== 'fleeing') {
      interacted = true;
    }
    resetIdleTimer();
  }

  function resetIdleTimer() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(runScene, IDLE_DELAY);
  }

  const activityEvents = [
    'mousemove', 'mousedown', 'keydown',
    'touchstart', 'touchmove',
    'scroll', 'wheel', 'click'
  ];

  activityEvents.forEach(ev => {
    document.addEventListener(ev, onUserActivity, { passive: true });
  });

  /* Kick off first timer */
  resetIdleTimer();

  /* Handle window resize for glass canvas */
  window.addEventListener('resize', () => {
    if (glassCanvas) {
      glassCanvas.width  = window.innerWidth;
      glassCanvas.height = window.innerHeight;
      drawGlass();
    }
  });

})();
