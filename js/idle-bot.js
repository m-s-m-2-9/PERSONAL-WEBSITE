/* ═══════════════════════════════════════════════════════════
   idle-bot.js — Astro Bot Idle Easter Egg (Three.js 3D)
   Loads Three.js from CDN. Fully self-contained.
   Renders a premium 3D robot matching Astro Bot reference.
   
   PHASES: Entry → Recovery → Walk → Look → Knock x3 →
           Glass Break → Peek Loop → Flee on interaction
   
   Set IDLE_DELAY to 8000 for testing, 600000 for 10 min.
═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const IDLE_DELAY = 10 * 60 * 1000;

  /* ── State ── */
  let isActive = false, interacted = false;
  let currentPhase = 'none';
  let idleTimer = null, rafId = null;
  const pendingTimers = [];

  /* ── Three.js refs ── */
  let scene, camera, renderer, clock;
  let robotGroup, headGroup, bodyGroup;
  let armGroupL, armGroupR, legGroupL, legGroupR;
  let eyeL, eyeR, antOrb, capeMesh;
  let threeCanvas;

  /* ── Glass refs ── */
  let glassCanvas, glassCtx;
  let cracks = [], shards = [], hasHole = false;

  /* ── Walk state ── */
  let targetX = 8, walkSpeed = 0;

  /* ── Tweens ── */
  const tweens = [];

  /* ────────────────────────────────────────────────────────
     UTILS
  ──────────────────────────────────────────────────────── */
  function sleep(ms) {
    return new Promise(r => { const t = setTimeout(r, ms); pendingTimers.push(t); });
  }
  function clearPending() {
    pendingTimers.forEach(clearTimeout);
    pendingTimers.length = 0;
  }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function easeInOut(t) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }
  function easeOut3(t) { return 1 - Math.pow(1-t, 3); }

  function tween(obj, prop, to, dur) {
    return new Promise(res => {
      const from = obj[prop], t0 = performance.now();
      tweens.push({ obj, prop, from, to, dur, t0, res });
    });
  }
  function tickTweens() {
    const now = performance.now();
    for (let i = tweens.length - 1; i >= 0; i--) {
      const tw = tweens[i];
      const t = clamp((now - tw.t0) / tw.dur, 0, 1);
      tw.obj[tw.prop] = lerp(tw.from, tw.to, easeInOut(t));
      if (t >= 1) { tw.res(); tweens.splice(i, 1); }
    }
  }

  /* ────────────────────────────────────────────────────────
     SOUND ENGINE
  ──────────────────────────────────────────────────────── */
  let ac = null;
  function getAC() {
    if (!ac) try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
    return ac;
  }

  function noise(ctx, dur, freq, decay, vol) {
    try {
      const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) {
        const tt = i / ctx.sampleRate;
        d[i] = (Math.random() * 2 - 1) * Math.exp(-tt * decay) * vol;
        if (freq) d[i] += Math.sin(6.283 * freq * tt) * Math.exp(-tt * (decay * 1.4)) * vol * 0.5;
      }
      const src = ctx.createBufferSource();
      const g = ctx.createGain(); g.gain.value = 1;
      src.buffer = buf; src.connect(g); g.connect(ctx.destination); src.start();
    } catch (e) {}
  }

  function playSound(type) {
    const ctx = getAC(); if (!ctx) return;
    if (type === 'impact') {
      noise(ctx, 0.4, 70, 12, 0.7);
    } else if (type === 'step') {
      try {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.frequency.value = 200; o.type = 'sine';
        g.gain.setValueAtTime(0.13, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
        o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.09);
      } catch (e) {}
    } else if (type === 'knock1') {
      noise(ctx, 0.18, 1400, 45, 0.45);
    } else if (type === 'knock2') {
      noise(ctx, 0.22, 950, 30, 0.62);
    } else if (type === 'knock3') {
      noise(ctx, 0.38, 60, 10, 0.8);
      setTimeout(() => noise(ctx, 0.25, 800, 22, 0.4), 20);
    } else if (type === 'glass') {
      for (let k = 0; k < 9; k++) setTimeout(() => {
        const ctx2 = getAC(); if (!ctx2) return;
        noise(ctx2, 0.22, 500 + Math.random() * 3000, 18 + Math.random() * 25, 0.3 + Math.random() * 0.25);
      }, k * 28);
    } else if (type === 'panic') {
      for (let k = 0; k < 12; k++) setTimeout(() => {
        const ctx2 = getAC(); if (!ctx2) return;
        try {
          const o = ctx2.createOscillator(), g = ctx2.createGain();
          o.frequency.value = 140 + Math.random() * 120;
          g.gain.setValueAtTime(0.08, ctx2.currentTime);
          g.gain.exponentialRampToValueAtTime(0.001, ctx2.currentTime + 0.06);
          o.connect(g); g.connect(ctx2.destination); o.start(); o.stop(ctx2.currentTime + 0.06);
        } catch (e) {}
      }, k * 65);
    }
  }

  /* ────────────────────────────────────────────────────────
     LOAD THREE.JS
  ──────────────────────────────────────────────────────── */
  function loadThree(cb) {
    if (window.THREE) { cb(window.THREE); return; }
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    s.onload = () => cb(window.THREE);
    s.onerror = () => console.warn('[IdleBot] Three.js failed to load');
    document.head.appendChild(s);
  }

  /* ────────────────────────────────────────────────────────
     BUILD 3D ROBOT
     Matches Astro Bot: white ceramic, black visor, LED eyes,
     blue body panel, gold joints, blue boots, cape.
  ──────────────────────────────────────────────────────── */
  function buildRobot(T) {
    const root = new T.Group();

    /* ── Materials ── */
    const M = {
      ceramic: new T.MeshPhongMaterial({ color: 0xeef3f9, shininess: 180, specular: new T.Color(0.38,0.5,0.68) }),
      visor:   new T.MeshPhongMaterial({ color: 0x030c1a, shininess: 300, specular: new T.Color(0.1,0.3,0.65) }),
      blue:    new T.MeshPhongMaterial({ color: 0x1880d8, shininess: 90, emissive: new T.Color(0.04,0.18,0.44), emissiveIntensity: 0.35 }),
      blueDeep:new T.MeshPhongMaterial({ color: 0x0f5aa5, shininess: 70, emissive: new T.Color(0.02,0.1,0.28) }),
      gold:    new T.MeshPhongMaterial({ color: 0xc89400, shininess: 230, specular: new T.Color(1,0.88,0.18) }),
      chrome:  new T.MeshPhongMaterial({ color: 0x88a0b4, shininess: 270, specular: new T.Color(0.65,0.82,1) }),
      eyeGlow: new T.MeshBasicMaterial({ color: 0x1188ee }),
      eyeCtr:  new T.MeshBasicMaterial({ color: 0x77ddff }),
      antOrb:  new T.MeshBasicMaterial({ color: 0x00eeff }),
      core:    new T.MeshBasicMaterial({ color: 0x44ccff }),
      cape:    new T.MeshPhongMaterial({ color: 0x1880ee, transparent: true, opacity: 0.76, side: T.DoubleSide, shininess: 28, emissive: new T.Color(0.03,0.12,0.36) }),
      bootGlow:new T.MeshBasicMaterial({ color: 0x33ccff, transparent: true, opacity: 0.6 }),
    };

    /* ── HEAD ── */
    headGroup = new T.Group();
    headGroup.position.set(0, 2.12, 0);

    // Helmet shell — Astro Bot has a squarish rounded helmet
    // Use SphereGeometry scaled to look more like a rounded cube
    const helmetGeo = new T.SphereGeometry(0.56, 40, 30);
    const helmet = new T.Mesh(helmetGeo, M.ceramic);
    helmet.scale.set(1, 0.93, 0.87);
    headGroup.add(helmet);

    // Helmet highlight strip (ceramic rim around visor)
    const rimGeo = new T.TorusGeometry(0.44, 0.04, 12, 60);
    const rim = new T.Mesh(rimGeo, M.ceramic);
    rim.position.set(0, 0, 0.3);
    rim.rotation.x = Math.PI / 2;
    headGroup.add(rim);

    // Visor — large flat black glass, slightly inset
    const visorGeo = new T.BoxGeometry(0.84, 0.72, 0.07);
    const visor = new T.Mesh(visorGeo, M.visor);
    visor.position.set(0, -0.01, 0.44);
    headGroup.add(visor);

    // Visor chrome bezel
    const bezelGeo = new T.BoxGeometry(0.88, 0.76, 0.05);
    const bezel = new T.Mesh(bezelGeo, M.chrome);
    bezel.position.set(0, -0.01, 0.41);
    headGroup.add(bezel);

    // Visor glass glare
    const glareGeo = new T.PlaneGeometry(0.52, 0.12);
    const glareMat = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.12, side: T.DoubleSide });
    const glare = new T.Mesh(glareGeo, glareMat);
    glare.position.set(-0.1, 0.22, 0.48);
    glare.rotation.z = 0.18;
    headGroup.add(glare);

    // Eye LEFT — LED oval (Astro Bot has large hexagonal LED eyes)
    const eyeLGeo = new T.SphereGeometry(0.13, 20, 14);
    eyeL = new T.Mesh(eyeLGeo, M.eyeGlow);
    eyeL.scale.set(1.0, 0.70, 0.32);
    eyeL.position.set(-0.22, 0.04, 0.47);
    headGroup.add(eyeL);
    // Eye center (brighter LED core)
    const eyeLCGeo = new T.SphereGeometry(0.08, 16, 10);
    const eyeLC = new T.Mesh(eyeLCGeo, M.eyeCtr);
    eyeLC.scale.set(1.0, 0.68, 0.32);
    eyeLC.position.set(-0.22, 0.04, 0.49);
    headGroup.add(eyeLC);
    // Dot-matrix dots (6 dots per eye)
    const dotPositionsL = [[-0.26,0.08],[-0.22,0.08],[-0.18,0.08],[-0.26,0.0],[-0.22,0.0],[-0.18,0.0]];
    dotPositionsL.forEach(([dx,dy]) => {
      const dg = new T.SphereGeometry(0.02, 8, 6);
      const dot = new T.Mesh(dg, M.eyeCtr);
      dot.position.set(dx, dy, 0.495); dot.scale.set(1,1,0.4);
      headGroup.add(dot);
    });

    // Eye RIGHT
    const eyeRGeo = new T.SphereGeometry(0.13, 20, 14);
    eyeR = new T.Mesh(eyeRGeo, M.eyeGlow);
    eyeR.scale.set(1.0, 0.70, 0.32);
    eyeR.position.set(0.22, 0.04, 0.47);
    headGroup.add(eyeR);
    const eyeRCGeo = new T.SphereGeometry(0.08, 16, 10);
    const eyeRC = new T.Mesh(eyeRCGeo, M.eyeCtr);
    eyeRC.scale.set(1.0, 0.68, 0.32);
    eyeRC.position.set(0.22, 0.04, 0.49);
    headGroup.add(eyeRC);
    const dotPositionsR = [[0.18,0.08],[0.22,0.08],[0.26,0.08],[0.18,0.0],[0.22,0.0],[0.26,0.0]];
    dotPositionsR.forEach(([dx,dy]) => {
      const dg = new T.SphereGeometry(0.02, 8, 6);
      const dot = new T.Mesh(dg, M.eyeCtr);
      dot.position.set(dx, dy, 0.495); dot.scale.set(1,1,0.4);
      headGroup.add(dot);
    });

    // Antenna stem (thin curved wire)
    const antStemGeo = new T.CylinderGeometry(0.016, 0.022, 0.52, 8);
    const antStem = new T.Mesh(antStemGeo, M.ceramic);
    antStem.position.set(0.14, 0.65, -0.06);
    antStem.rotation.z = 0.22; antStem.rotation.x = -0.06;
    headGroup.add(antStem);

    // Antenna orb (glowing cyan)
    const antOrbGeo = new T.SphereGeometry(0.1, 20, 14);
    antOrb = new T.Mesh(antOrbGeo, M.antOrb);
    antOrb.position.set(0.25, 0.9, -0.1);
    headGroup.add(antOrb);

    root.add(headGroup);

    /* ── NECK ── */
    const neckGeo = new T.CylinderGeometry(0.12, 0.16, 0.2, 14);
    const neck = new T.Mesh(neckGeo, M.chrome);
    neck.position.set(0, 1.74, 0);
    root.add(neck);

    /* ── BODY ── */
    bodyGroup = new T.Group();
    bodyGroup.position.set(0, 1.08, 0);

    // Upper chest (smaller)
    const upperGeo = new T.SphereGeometry(0.38, 28, 20);
    const upper = new T.Mesh(upperGeo, M.ceramic);
    upper.position.set(0, 0.28, 0);
    upper.scale.set(1, 0.78, 0.9);
    bodyGroup.add(upper);

    // Lower torso (wider — pear shape)
    const lowerGeo = new T.SphereGeometry(0.47, 28, 20);
    const lower = new T.Mesh(lowerGeo, M.ceramic);
    lower.position.set(0, -0.1, 0);
    lower.scale.set(1, 0.62, 0.9);
    bodyGroup.add(lower);

    // Blue chest panel (large, like Astro Bot)
    const chestGeo = new T.BoxGeometry(0.56, 0.48, 0.09);
    const chest = new T.Mesh(chestGeo, M.blue);
    chest.position.set(0, 0.2, 0.28);
    chest.rotation.x = -0.1;
    bodyGroup.add(chest);

    // Chest panel border
    const chestBorderGeo = new T.BoxGeometry(0.6, 0.52, 0.06);
    const chestBorder = new T.Mesh(chestBorderGeo, M.blueDeep);
    chestBorder.position.set(0, 0.2, 0.25);
    chestBorder.rotation.x = -0.1;
    bodyGroup.add(chestBorder);

    // Chest core light (glowing circle)
    const coreGeo = new T.SphereGeometry(0.088, 16, 12);
    const core = new T.Mesh(coreGeo, M.core);
    core.position.set(0, 0.1, 0.36);
    bodyGroup.add(core);
    const coreRingGeo = new T.TorusGeometry(0.13, 0.018, 10, 32);
    const coreRing = new T.Mesh(coreRingGeo, M.blue);
    coreRing.position.set(0, 0.1, 0.35);
    coreRing.rotation.x = Math.PI / 2;
    bodyGroup.add(coreRing);

    root.add(bodyGroup);

    /* ── SHOULDER JOINTS (gold spheres) ── */
    [-0.52, 0.52].forEach(sx => {
      const sg = new T.SphereGeometry(0.1, 14, 10);
      const sm = new T.Mesh(sg, M.gold);
      sm.position.set(sx, 1.62, 0);
      root.add(sm);
    });

    /* ── ARM BUILDER ── */
    function buildArm(side) {
      // side = -1 (left) or 1 (right)
      const ag = new T.Group();
      ag.position.set(side * 0.52, 1.6, 0);

      // Upper arm
      const uaGeo = new T.CylinderGeometry(0.1, 0.09, 0.44, 14);
      const ua = new T.Mesh(uaGeo, M.ceramic);
      ua.position.set(side * 0.08, -0.24, 0);
      ua.rotation.z = side * 0.18;
      ag.add(ua);

      // Blue accent band on upper arm
      const bandGeo = new T.CylinderGeometry(0.105, 0.105, 0.06, 14);
      const band = new T.Mesh(bandGeo, M.blue);
      band.position.set(side * 0.08, -0.14, 0);
      band.rotation.z = side * 0.18;
      ag.add(band);

      // Elbow joint (chrome sphere)
      const ej = new T.SphereGeometry(0.1, 14, 10);
      const elm = new T.Mesh(ej, M.chrome);
      elm.position.set(side * 0.16, -0.49, 0);
      ag.add(elm);

      // Forearm
      const faGeo = new T.CylinderGeometry(0.09, 0.082, 0.38, 14);
      const fa = new T.Mesh(faGeo, M.ceramic);
      fa.position.set(side * 0.17, -0.72, 0.04);
      fa.rotation.z = side * 0.12; fa.rotation.x = 0.08;
      ag.add(fa);

      // Wrist chrome band
      const wristGeo = new T.CylinderGeometry(0.095, 0.095, 0.05, 14);
      const wrist = new T.Mesh(wristGeo, M.chrome);
      wrist.position.set(side * 0.17, -0.89, 0.04);
      wrist.rotation.z = side * 0.12;
      ag.add(wrist);

      // Hand (white rounded box)
      const hGeo = new T.BoxGeometry(0.22, 0.18, 0.15);
      const h = new T.Mesh(hGeo, M.ceramic);
      h.position.set(side * 0.18, -1.02, 0.05);
      ag.add(h);

      // 4 fingers with gold tips
      const fingerXs = side < 0
        ? [-0.28,-0.21,-0.14,-0.08]
        : [0.28, 0.21, 0.14, 0.08];
      fingerXs.forEach((fx, fi) => {
        const fingerGeo = new T.CylinderGeometry(0.028, 0.024, 0.12, 8);
        const finger = new T.Mesh(fingerGeo, M.ceramic);
        finger.position.set(fx, -1.09 - fi*0.005, 0.05);
        finger.rotation.z = side * (0.18 + fi * 0.04);
        ag.add(finger);
        // Gold tip
        const tipGeo = new T.SphereGeometry(0.032, 8, 6);
        const tip = new T.Mesh(tipGeo, M.gold);
        tip.position.set(fx + side*(-0.012), -1.15 - fi*0.005, 0.05);
        ag.add(tip);
      });

      // Thumb
      const thumbGeo = new T.CylinderGeometry(0.025, 0.022, 0.1, 8);
      const thumb = new T.Mesh(thumbGeo, M.ceramic);
      thumb.position.set(side * 0.06, -1.01, 0.11);
      thumb.rotation.x = 0.4; thumb.rotation.z = side * 0.6;
      ag.add(thumb);
      const thumbTipGeo = new T.SphereGeometry(0.028, 8, 6);
      const thumbTip = new T.Mesh(thumbTipGeo, M.gold);
      thumbTip.position.set(side * 0.07, -1.05, 0.13);
      ag.add(thumbTip);

      return ag;
    }

    armGroupL = buildArm(-1); root.add(armGroupL);
    armGroupR = buildArm( 1); root.add(armGroupR);

    /* ── LEG BUILDER ── */
    function buildLeg(side) {
      const lg = new T.Group();
      lg.position.set(side * 0.23, 0.58, 0);

      // Hip joint (gold)
      const hipGeo = new T.SphereGeometry(0.1, 14, 10);
      const hip = new T.Mesh(hipGeo, M.gold);
      hip.position.set(0, 0.04, 0);
      lg.add(hip);

      // Thigh
      const thighGeo = new T.CylinderGeometry(0.14, 0.12, 0.32, 14);
      const thigh = new T.Mesh(thighGeo, M.ceramic);
      thigh.position.set(0, -0.14, 0);
      lg.add(thigh);

      // Knee joint (chrome)
      const kneeGeo = new T.SphereGeometry(0.12, 14, 10);
      const knee = new T.Mesh(kneeGeo, M.chrome);
      knee.position.set(0, -0.33, 0);
      lg.add(knee);

      // Shin
      const shinGeo = new T.CylinderGeometry(0.11, 0.13, 0.26, 14);
      const shin = new T.Mesh(shinGeo, M.ceramic);
      shin.position.set(0, -0.54, 0);
      lg.add(shin);

      // Boot (blue, wider than leg — Astro Bot has chunky boots)
      const bootGeo = new T.BoxGeometry(0.32, 0.22, 0.42);
      const boot = new T.Mesh(bootGeo, M.blue);
      boot.position.set(0, -0.76, 0.06);
      // Round it slightly
      boot.scale.set(1, 1, 1);
      lg.add(boot);

      // Boot chrome band (top of boot)
      const bootBandGeo = new T.BoxGeometry(0.34, 0.05, 0.44);
      const bootBand = new T.Mesh(bootBandGeo, M.chrome);
      bootBand.position.set(0, -0.65, 0.06);
      lg.add(bootBand);

      // Boot toe cap (ceramic)
      const toeCap = new T.BoxGeometry(0.24, 0.14, 0.12);
      const toeCapM = new T.Mesh(toeCap, M.ceramic);
      toeCapM.position.set(0, -0.75, 0.25);
      lg.add(toeCapM);

      // Sole glow (bottom of boot)
      const soleGeo = new T.PlaneGeometry(0.24, 0.32);
      const sole = new T.Mesh(soleGeo, M.bootGlow);
      sole.position.set(0, -0.875, 0.06);
      sole.rotation.x = -Math.PI / 2;
      lg.add(sole);

      return lg;
    }

    legGroupL = buildLeg(-1); root.add(legGroupL);
    legGroupR = buildLeg( 1); root.add(legGroupR);

    /* ── CAPE (translucent blue, behind body) ── */
    // Build from subdivided plane with manual waviness
    const capeGeo = new T.PlaneGeometry(0.72, 1.0, 6, 12);
    const capePos = capeGeo.attributes.position;
    for (let i = 0; i < capePos.count; i++) {
      const y = capePos.getY(i), x = capePos.getX(i);
      capePos.setZ(i, Math.sin((y + 0.5) * 2.8) * 0.07 + Math.cos(x * 4.5) * 0.04);
    }
    capeGeo.computeVertexNormals();
    capeMesh = new T.Mesh(capeGeo, M.cape);
    capeMesh.position.set(-0.06, 1.08, -0.3);
    capeMesh.rotation.x = 0.07;
    root.add(capeMesh);

    /* ── Ground shadow ellipse ── */
    const shadowGeo = new T.CircleGeometry(0.55, 32);
    const shadowMat = new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22, depthWrite: false });
    const shadow = new T.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(0, 0.01, 0);
    root.add(shadow);

    return root;
  }

  /* ────────────────────────────────────────────────────────
     EYE STATE
  ──────────────────────────────────────────────────────── */
  function setEyeState(state) {
    if (!eyeL || !eyeR) return;
    const states = {
      calm:    [1.0, 0.70],
      nervous: [0.78, 0.35],
      shocked: [1.25, 1.2],
      panic:   [0.35, 0.35],
      search:  [1.0, 0.42],
    };
    const [sx, sy] = states[state] || states.calm;
    [eyeL, eyeR].forEach(e => e.scale.set(sx, sy, 0.32));

    // Eye color by state
    const colors = { calm: 0x1188ee, nervous: 0x0066cc, shocked: 0x22bbff, panic: 0xff4422, search: 0x00aaff };
    const col = colors[state] || 0x1188ee;
    [eyeL, eyeR].forEach(e => e.material.color.setHex(col));
  }

  let eyeDartDir = 0;
  function doEyeDart(headGrp) {
    if (!headGrp) return;
    const seq = [0.08, -0.08, 0.04, -0.04, 0];
    let i = 0;
    function next() {
      if (i >= seq.length) return;
      headGrp.position.x = seq[i++];
      setTimeout(next, 180);
    }
    next();
  }

  /* ────────────────────────────────────────────────────────
     SCREEN SHAKE
  ──────────────────────────────────────────────────────── */
  function screenShake(strength, dur) {
    const t0 = performance.now();
    function sh() {
      const el = performance.now() - t0;
      if (el < dur) {
        const s = strength * (1 - el / dur);
        document.body.style.transform = `translate(${(Math.random()-0.5)*s*2}px,${(Math.random()-0.5)*s*2}px)`;
        requestAnimationFrame(sh);
      } else { document.body.style.transform = ''; }
    }
    sh();
  }

  /* ────────────────────────────────────────────────────────
     GLASS CRACK CANVAS
  ──────────────────────────────────────────────────────── */
  function initGlass() {
    glassCanvas = document.createElement('canvas');
    glassCanvas.style.cssText = 'position:fixed;inset:0;z-index:999993;pointer-events:none;';
    glassCanvas.width  = window.innerWidth;
    glassCanvas.height = window.innerHeight;
    document.body.appendChild(glassCanvas);
    glassCtx = glassCanvas.getContext('2d');
  }

  function addCrack(cx, cy, severity) {
    const lines = [];
    const numRays = 5 + Math.floor(severity * 8);
    for (let i = 0; i < numRays; i++) {
      const baseAngle = (i / numRays) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const len = 30 + Math.random() * 95 * severity;
      const pts = [{ x: cx, y: cy }];
      let px = cx, py = cy;
      for (let j = 0; j < 6; j++) {
        const jitter = (Math.random() - 0.5) * 0.55;
        const d = (len / 6) * (0.55 + Math.random() * 0.75);
        px += Math.cos(baseAngle + jitter) * d;
        py += Math.sin(baseAngle + jitter) * d;
        pts.push({ x: px, y: py });
        // branch cracks
        if (severity > 1.0 && Math.random() > 0.5) {
          const ba = baseAngle + (Math.random() - 0.5) * 1.6;
          const bl = d * 0.45;
          lines.push([{ x: px, y: py }, { x: px + Math.cos(ba)*bl, y: py + Math.sin(ba)*bl }]);
        }
      }
      lines.push(pts);
    }
    const crack = { cx, cy, lines, alpha: 0 };
    cracks.push(crack);
    let a = 0;
    const anim = setInterval(() => {
      a += 0.1; crack.alpha = Math.min(1, a); drawGlass();
      if (a >= 1) clearInterval(anim);
    }, 16);
  }

  function spawnShards(cx, cy) {
    for (let i = 0; i < 24; i++) {
      const ang = Math.random() * Math.PI * 2;
      const sp  = 1.5 + Math.random() * 7;
      shards.push({
        x: cx + (Math.random() - 0.5) * 90, y: cy + (Math.random() - 0.5) * 55,
        vx: Math.cos(ang)*sp, vy: Math.sin(ang)*sp - 0.5,
        rot: Math.random() * 6.28, rotV: (Math.random()-0.5)*0.28,
        size: 3 + Math.random() * 18, alpha: 1, life: 1
      });
    }
    animShards();
  }

  function animShards() {
    shards.forEach(s => {
      s.x += s.vx; s.y += s.vy; s.vy += 0.45;
      s.rot += s.rotV; s.life -= 0.02; s.alpha = Math.max(0, s.life);
    });
    shards = shards.filter(s => s.life > 0);
    drawGlass();
    if (shards.length > 0) requestAnimationFrame(animShards);
    else drawGlass();
  }

  function drawGlass() {
    if (!glassCtx) return;
    const W = glassCanvas.width, H = glassCanvas.height;
    glassCtx.clearRect(0, 0, W, H);

    cracks.forEach(cr => {
      glassCtx.save(); glassCtx.globalAlpha = cr.alpha;
      cr.lines.forEach(pts => {
        if (pts.length < 2) return;
        glassCtx.beginPath(); glassCtx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) glassCtx.lineTo(pts[i].x, pts[i].y);
        glassCtx.strokeStyle = 'rgba(185,215,245,0.94)'; glassCtx.lineWidth = 1; glassCtx.stroke();
        glassCtx.strokeStyle = 'rgba(255,255,255,0.38)';  glassCtx.lineWidth = 0.3; glassCtx.stroke();
      });
      glassCtx.restore();
    });

    shards.forEach(s => {
      glassCtx.save();
      glassCtx.globalAlpha = s.alpha * 0.88;
      glassCtx.translate(s.x, s.y); glassCtx.rotate(s.rot);
      glassCtx.beginPath();
      glassCtx.moveTo(0, -s.size);
      glassCtx.lineTo(s.size * 0.52, s.size * 0.42);
      glassCtx.lineTo(-s.size * 0.48, s.size * 0.36);
      glassCtx.closePath();
      const gr = glassCtx.createLinearGradient(0, -s.size, 0, s.size);
      gr.addColorStop(0, 'rgba(195,228,255,0.92)');
      gr.addColorStop(1, 'rgba(135,188,228,0.28)');
      glassCtx.fillStyle = gr; glassCtx.fill();
      glassCtx.strokeStyle = 'rgba(255,255,255,0.7)'; glassCtx.lineWidth = 0.45; glassCtx.stroke();
      glassCtx.restore();
    });

    if (hasHole) {
      const cx = W / 2, cy = H / 2;
      glassCtx.save();
      glassCtx.globalCompositeOperation = 'destination-out';
      const gr = glassCtx.createRadialGradient(cx, cy, 0, cx, cy, 100);
      gr.addColorStop(0,   'rgba(0,0,0,1)');
      gr.addColorStop(0.6, 'rgba(0,0,0,0.92)');
      gr.addColorStop(1,   'rgba(0,0,0,0)');
      glassCtx.fillStyle = gr;
      glassCtx.beginPath(); glassCtx.arc(cx, cy, 100, 0, Math.PI*2); glassCtx.fill();
      glassCtx.restore();
    }
  }

  /* ────────────────────────────────────────────────────────
     THREE.JS SCENE SETUP
  ──────────────────────────────────────────────────────── */
  /* Robot animation state flags (read in render loop) */
  let state = {
    walking: false,
    panicking: false,
    nervousTremor: false,
    eyeDartActive: false,
    armRaised: false,       // right arm raised for knocking
    armKnock: 0,            // 0=rest, >0 = knock anim progress
    peekIn: 0,              // 0=out 1=in
    antMode: 'idle',        // 'idle'|'nervous'|'panic'
    walkT: 0,
    time: 0,
  };

  function initScene(T) {
    threeCanvas = document.createElement('canvas');
    threeCanvas.style.cssText = 'position:fixed;inset:0;z-index:999990;pointer-events:none;';
    threeCanvas.width  = window.innerWidth;
    threeCanvas.height = window.innerHeight;
    document.body.appendChild(threeCanvas);

    scene    = new T.Scene();
    renderer = new T.WebGLRenderer({ canvas: threeCanvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const aspect = window.innerWidth / window.innerHeight;
    camera = new T.PerspectiveCamera(50, aspect, 0.1, 100);
    camera.position.set(0, 2.5, 8.5);
    camera.lookAt(0, 1.5, 0);

    // Lights — match glossy Astro Bot look
    scene.add(new T.AmbientLight(0xffffff, 0.42));

    const sun = new T.DirectionalLight(0xffffff, 0.95);
    sun.position.set(-3, 7, 5); scene.add(sun);

    const fill = new T.DirectionalLight(0x8ab4f8, 0.28);
    fill.position.set(5, 2, 3); scene.add(fill);

    const blueKey = new T.PointLight(0x2277ff, 0.55, 14);
    blueKey.position.set(1, 3, 4); scene.add(blueKey);

    const backLight = new T.PointLight(0x4488ff, 0.3, 10);
    backLight.position.set(0, 2, -5); scene.add(backLight);

    // Build robot
    robotGroup = buildRobot(T);
    robotGroup.position.set(8.5, 0, 0);
    scene.add(robotGroup);

    // Render loop
    clock = new T.Clock();
    function renderLoop() {
      rafId = requestAnimationFrame(renderLoop);
      const dt = clock.getDelta();
      state.time += dt;
      const t = state.time;

      tickTweens();

      /* ── Robot X drift ── */
      if (robotGroup) {
        const dx = targetX - robotGroup.position.x;
        const spd = walkSpeed > 0 ? walkSpeed : 10;
        robotGroup.position.x += dx * Math.min(dt * spd, 1);
      }

      /* ── Walk animation ── */
      if (state.walking && robotGroup) {
        state.walkT += dt * 4.5;
        const wt = state.walkT;
        // Leg swing
        if (legGroupL) legGroupL.rotation.x = Math.sin(wt) * 0.38;
        if (legGroupR) legGroupR.rotation.x = Math.sin(wt + Math.PI) * 0.38;
        // Body bob
        if (bodyGroup) bodyGroup.position.y = 1.08 + Math.abs(Math.sin(wt)) * 0.07;
        // Head stay level
        if (headGroup) headGroup.position.y = 2.12 + Math.abs(Math.sin(wt)) * 0.05;
        // Arm counter swing
        if (armGroupL) armGroupL.rotation.x = Math.sin(wt + Math.PI) * 0.18;
        if (armGroupR) armGroupR.rotation.x = Math.sin(wt) * 0.18;
      } else {
        // Settle limbs
        if (legGroupL) legGroupL.rotation.x *= 0.88;
        if (legGroupR) legGroupR.rotation.x *= 0.88;
        if (bodyGroup) bodyGroup.position.y = lerp(bodyGroup.position.y, 1.08, dt*5);
        if (headGroup) headGroup.position.y = lerp(headGroup.position.y, 2.12, dt*4);
        if (!state.armRaised) {
          if (armGroupL) armGroupL.rotation.x *= 0.88;
          if (armGroupR) armGroupR.rotation.x *= 0.88;
        }
      }

      /* ── Panic run ── */
      if (state.panicking && robotGroup) {
        state.walkT += dt * 12;
        const wt = state.walkT;
        if (legGroupL) legGroupL.rotation.x = Math.sin(wt) * 0.65;
        if (legGroupR) legGroupR.rotation.x = Math.sin(wt + Math.PI) * 0.65;
        if (armGroupL) armGroupL.rotation.z = lerp(armGroupL.rotation.z, -1.8, dt * 8);
        if (armGroupR) armGroupR.rotation.z = lerp(armGroupR.rotation.z,  1.8, dt * 8);
        // Cape flies wildly
        if (capeMesh) capeMesh.rotation.z = Math.sin(t * 18) * 0.35;
      }

      /* ── Cape ambient sway ── */
      if (!state.panicking && capeMesh) {
        const capeIntensity = state.walking ? 0.1 : 0.03;
        capeMesh.rotation.z = Math.sin(t * 2.8) * capeIntensity;
        capeMesh.rotation.x = 0.07 + Math.sin(t * 2.1) * capeIntensity * 0.6;
      }

      /* ── Antenna orb pulse ── */
      if (antOrb) {
        if (state.antMode === 'nervous') {
          antOrb.material.color.setHex(Math.sin(t*20)>0 ? 0x00eeff : 0x003344);
        } else if (state.antMode === 'panic') {
          antOrb.material.color.setHex(Math.sin(t*50)>0 ? 0x00ffff : 0x001111);
        } else {
          const pulse = 0.5 + 0.5 * Math.sin(t * 2.8);
          const g2 = Math.floor(200 + pulse*55), b = Math.floor(230 + pulse*25);
          antOrb.material.color.setRGB(0.01, g2/255, b/255);
        }
      }

      /* ── Nervous tremor ── */
      if (state.nervousTremor && robotGroup) {
        robotGroup.rotation.z = Math.sin(t * 24) * 0.02;
      } else if (robotGroup) {
        robotGroup.rotation.z *= 0.9;
      }

      /* ── Arm raised for knock ── */
      if (state.armRaised && armGroupR) {
        armGroupR.rotation.z = lerp(armGroupR.rotation.z, -1.35, dt*6);
        armGroupR.rotation.x = lerp(armGroupR.rotation.x, -0.45, dt*6);
      }

      renderer.render(scene, camera);
    }
    renderLoop();
  }

  /* ────────────────────────────────────────────────────────
     FLEE HELPERS
  ──────────────────────────────────────────────────────── */
  function doFlee(afterGlass) {
    currentPhase = 'fleeing';
    clearPending();

    state.walking   = false;
    state.panicking = false;
    state.nervousTremor = false;
    state.antMode   = 'panic';

    setEyeState(afterGlass ? 'panic' : 'shocked');

    setTimeout(() => {
      if (!afterGlass && armGroupL && armGroupR) {
        armGroupL.rotation.z = -1.8;
        armGroupR.rotation.z =  1.8;
      }
      state.panicking = true;
      walkSpeed = 14;
      targetX   = -10;
      playSound('panic');

      setTimeout(() => {
        if (glassCanvas) {
          glassCanvas.style.transition = 'opacity 1.4s ease';
          glassCanvas.style.opacity    = '0';
        }
        setTimeout(cleanup, 1500);
      }, 750);
    }, afterGlass ? 280 : 180);
  }

  /* ────────────────────────────────────────────────────────
     CLEANUP
  ──────────────────────────────────────────────────────── */
  function cleanup() {
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    if (threeCanvas && threeCanvas.parentNode) threeCanvas.remove();
    if (glassCanvas && glassCanvas.parentNode) glassCanvas.remove();

    if (scene) { scene.traverse(o => { if(o.geometry) o.geometry.dispose(); }); }
    if (renderer) renderer.dispose();

    threeCanvas = glassCanvas = glassCtx = null;
    scene = camera = renderer = clock = null;
    robotGroup = headGroup = bodyGroup = null;
    armGroupL = armGroupR = legGroupL = legGroupR = null;
    eyeL = eyeR = antOrb = capeMesh = null;

    cracks = []; shards = []; hasHole = false;
    tweens.length = 0;
    isActive = false; interacted = false;
    currentPhase = 'none'; walkSpeed = 0; targetX = 8;
    Object.assign(state, { walking:false, panicking:false, nervousTremor:false,
      armRaised:false, antMode:'idle', walkT:0, time:0, peekIn:0, eyeDartActive:false });

    resetIdleTimer();
  }

  /* ────────────────────────────────────────────────────────
     MAIN SEQUENCE
  ──────────────────────────────────────────────────────── */
  async function runSequence() {
    if (!robotGroup) return;
    const W = window.innerWidth, H = window.innerHeight;
    const knockCX = W / 2, knockCY = H / 2;

    // Reset robot
    robotGroup.position.set(9, 0, 0);
    robotGroup.rotation.set(0, 0, 0);
    if (headGroup)  headGroup.position.set(0, 2.12, 0), headGroup.rotation.set(0,0,0);
    if (bodyGroup)  bodyGroup.position.set(0, 1.08, 0);
    if (armGroupL)  armGroupL.rotation.set(0,0,0);
    if (armGroupR)  armGroupR.rotation.set(0,0,0);
    if (legGroupL)  legGroupL.rotation.set(0,0,0);
    if (legGroupR)  legGroupR.rotation.set(0,0,0);
    setEyeState('shocked');
    state.antMode = 'nervous';

    /* ════ PHASE 1: FORCED ENTRY ════ */
    currentPhase = 'entry';
    walkSpeed = 0;

    // Shoved in — tumble with spin
    const entryDur = 580;
    const entryT0  = performance.now();
    await new Promise(resolve => {
      function entryFrame() {
        const elapsed = performance.now() - entryT0;
        const t = Math.min(elapsed / entryDur, 1);
        const ease = easeOut3(t);
        if (robotGroup) {
          robotGroup.position.x = lerp(9, 4.5, ease);
          robotGroup.position.y = Math.sin(t * Math.PI) * 1.6; // arc
          robotGroup.rotation.z = lerp(1.8, 0.12, ease); // tumble spin
          robotGroup.rotation.x = lerp(-0.4, 0, ease);
        }
        if (t < 1) requestAnimationFrame(entryFrame); else resolve();
      }
      entryFrame();
    });

    if (interacted) { doFlee(false); return; }

    /* Impact bounce */
    playSound('impact');
    screenShake(9, 380);
    const bounceT0 = performance.now();
    await new Promise(resolve => {
      function bounceFrame() {
        const elapsed = performance.now() - bounceT0;
        const t = Math.min(elapsed / 750, 1);
        if (robotGroup) {
          if      (t < 0.18) { robotGroup.scale.set(1.35,0.55,1); robotGroup.position.y = 0; }
          else if (t < 0.45) { const s=(t-0.18)/0.27; robotGroup.scale.set(lerp(1.35,0.92,s),lerp(0.55,1.18,s),1); robotGroup.position.y = s*0.42; }
          else if (t < 0.7)  { const s=(t-0.45)/0.25; robotGroup.scale.set(lerp(0.92,1.08,s),lerp(1.18,0.9,s),1);  robotGroup.position.y = lerp(0.42,0,s); }
          else               { const s=(t-0.7)/0.3; robotGroup.scale.set(lerp(1.08,1,s),lerp(0.9,1,s),1); robotGroup.rotation.z=lerp(0.12,0,s); }
        }
        if (t < 1) requestAnimationFrame(bounceFrame); else resolve();
      }
      bounceFrame();
    });
    if (interacted) { doFlee(false); return; }

    /* ════ PHASE 2: RECOVERY ════ */
    currentPhase = 'recovery';
    state.antMode = 'nervous';
    setEyeState('nervous');

    // Motionless 0.8s (antenna flickers)
    await sleep(800);
    if (interacted) { doFlee(false); return; }

    // Get up
    const getUpT0 = performance.now();
    await new Promise(resolve => {
      function getUpFrame() {
        const elapsed = performance.now() - getUpT0;
        const t = Math.min(elapsed / 900, 1);
        if (robotGroup) {
          robotGroup.position.y = lerp(-0.25, 0, easeInOut(t));
          robotGroup.rotation.z = lerp(-0.3, 0.04, easeInOut(t));
        }
        if (t < 1) requestAnimationFrame(getUpFrame); else resolve();
      }
      getUpFrame();
    });
    await sleep(250);
    if (interacted) { doFlee(false); return; }

    // Dust off (small shake)
    const dustT0 = performance.now();
    await new Promise(resolve => {
      function dustFrame() {
        const elapsed = performance.now() - dustT0;
        const t = Math.min(elapsed / 700, 1);
        if (robotGroup) {
          robotGroup.rotation.x = Math.sin(elapsed / 70) * 0.04 * (1-t);
          robotGroup.rotation.z = lerp(0.04, 0, t);
        }
        if (t < 1) requestAnimationFrame(dustFrame); else { if(robotGroup) robotGroup.rotation.x=0; resolve(); }
      }
      dustFrame();
    });
    setEyeState('calm');
    await sleep(200);
    if (interacted) { doFlee(false); return; }

    /* ════ PHASE 3: NERVOUS TIPTOE WALK ════ */
    currentPhase = 'walking';
    state.nervousTremor = true;
    state.walking       = true;
    state.antMode       = 'nervous';
    setEyeState('nervous');

    // Arms near chest (anxious)
    if (armGroupL) armGroupL.rotation.z = -0.45;
    if (armGroupR) armGroupR.rotation.z =  0.45;

    // Walk in segments with nervous glances back
    async function walkSegment(tx, dur, numSteps) {
      targetX = tx;
      for (let i = 0; i < numSteps; i++) {
        if (interacted) return;
        playSound('step');
        await sleep(dur / numSteps);
      }
    }
    async function glanceRight() {
      if (interacted) return;
      state.walking = false;
      if (headGroup) headGroup.rotation.y = -0.7;
      setEyeState('nervous');
      await sleep(480);
      if (headGroup) headGroup.rotation.y = 0;
      await sleep(160);
      state.walking = true;
    }

    await walkSegment(2.8, 900, 3);
    if (interacted) { doFlee(false); return; }
    await glanceRight();
    if (interacted) { doFlee(false); return; }
    await walkSegment(1.1, 650, 2);
    if (interacted) { doFlee(false); return; }
    await glanceRight();
    if (interacted) { doFlee(false); return; }
    await walkSegment(0, 550, 2);
    if (interacted) { doFlee(false); return; }

    state.walking = false;
    walkSpeed     = 0;
    await sleep(200);
    if (interacted) { doFlee(false); return; }

    /* ════ PHASE 4: LOOK AT USER ════ */
    currentPhase = 'looking';
    state.nervousTremor = false;
    if (armGroupL) armGroupL.rotation.z = 0;
    if (armGroupR) armGroupR.rotation.z = 0;
    if (headGroup) headGroup.rotation.y = 0;
    setEyeState('search');

    // Head tilts slightly toward camera
    if (headGroup) headGroup.rotation.x = -0.12;
    await sleep(400);
    setEyeState('calm');
    await sleep(1100);
    if (interacted) { doFlee(false); return; }

    /* ════ PHASE 5: SCREEN KNOCK ════ */
    currentPhase = 'knocking';
    if (headGroup) headGroup.rotation.x = 0;
    setEyeState('search');

    // Raise right arm slowly
    state.armRaised = true;
    await sleep(520);
    if (interacted) { doFlee(false); return; }

    // ── KNOCK 1 (light tap) ──
    let k1T0 = performance.now();
    await new Promise(resolve => {
      function k1() {
        const t = Math.min((performance.now()-k1T0)/280, 1);
        if (armGroupR) armGroupR.rotation.z = lerp(-1.35, -1.68, Math.sin(t*Math.PI));
        if (t < 1) requestAnimationFrame(k1); else resolve();
      }
      k1();
    });
    playSound('knock1'); screenShake(3, 220);
    addCrack(knockCX, knockCY, 0.62);
    await sleep(220);
    // Peer through crack
    setEyeState('search');
    if (headGroup) headGroup.rotation.x = -0.16;
    await sleep(750);
    if (headGroup) headGroup.rotation.x = 0;
    await sleep(200);
    if (interacted) { doFlee(true); return; }

    // ── KNOCK 2 (harder) ──
    let k2T0 = performance.now();
    await new Promise(resolve => {
      function k2() {
        const t = Math.min((performance.now()-k2T0)/250, 1);
        if (armGroupR) armGroupR.rotation.z = lerp(-1.35, -1.72, Math.sin(t*Math.PI));
        if (t < 1) requestAnimationFrame(k2); else resolve();
      }
      k2();
    });
    playSound('knock2'); screenShake(5.5, 280);
    addCrack(knockCX + 28, knockCY - 14, 1.35);
    addCrack(knockCX - 22, knockCY + 28, 1.05);
    await sleep(200);
    setEyeState('shocked');
    await sleep(600);
    if (interacted) { doFlee(true); return; }

    // ── KNOCK 3 (heavy blow) ──
    setEyeState('calm');
    let k3T0 = performance.now();
    await new Promise(resolve => {
      function k3() {
        const t = Math.min((performance.now()-k3T0)/220, 1);
        if (armGroupR) armGroupR.rotation.z = lerp(-1.35, -1.78, Math.sin(t*Math.PI));
        if (t < 1) requestAnimationFrame(k3); else resolve();
      }
      k3();
    });
    playSound('knock3'); screenShake(11, 480);
    addCrack(knockCX, knockCY, 2.9);
    addCrack(knockCX+55, knockCY+38, 2.1);
    addCrack(knockCX-58, knockCY-22, 1.75);
    await sleep(190);
    playSound('glass');
    hasHole = true;
    spawnShards(knockCX, knockCY);

    await sleep(420);
    if (interacted) { doFlee(true); return; }

    // Lower arm
    state.armRaised = false;
    await sleep(300);
    if (armGroupR) {
      const lowerT0 = performance.now();
      await new Promise(resolve => {
        function lowerArm() {
          const t = Math.min((performance.now()-lowerT0)/400, 1);
          if (armGroupR) {
            armGroupR.rotation.z = lerp(-1.35, 0, easeInOut(t));
            armGroupR.rotation.x = lerp(-0.45, 0, easeInOut(t));
          }
          if (t < 1) requestAnimationFrame(lowerArm); else resolve();
        }
        lowerArm();
      });
    }
    if (interacted) { doFlee(true); return; }

    /* ════ PHASE 6: FOURTH WALL BREAK — PEEK ════ */
    currentPhase = 'peeking';
    await sleep(300);
    if (interacted) { doFlee(true); return; }

    while (!interacted && currentPhase === 'peeking') {
      // Lean head through hole
      setEyeState('search');
      const leanInT0 = performance.now();
      await new Promise(resolve => {
        function leanIn() {
          const t = Math.min((performance.now()-leanInT0)/520, 1);
          if (headGroup) {
            headGroup.position.z = lerp(0, 0.55, easeOut3(t));
            headGroup.position.y = lerp(2.12, 2.24, t);
            headGroup.scale.setScalar(lerp(1, 1.1, easeOut3(t)));
          }
          if (t < 1) requestAnimationFrame(leanIn); else resolve();
        }
        leanIn();
      });
      if (interacted) break;

      // Look LEFT
      if (headGroup) headGroup.rotation.y = 0.55;
      await sleep(620);
      if (interacted) break;
      // Look RIGHT
      if (headGroup) headGroup.rotation.y = -0.55;
      await sleep(570);
      if (interacted) break;
      // Look CENTER (at user)
      if (headGroup) headGroup.rotation.y = 0;
      setEyeState('calm');
      await sleep(1500);
      if (interacted) break;

      // Pull head back
      const leanOutT0 = performance.now();
      await new Promise(resolve => {
        function leanOut() {
          const t = Math.min((performance.now()-leanOutT0)/420, 1);
          if (headGroup) {
            headGroup.position.z = lerp(0.55, 0, easeInOut(t));
            headGroup.position.y = lerp(2.24, 2.12, t);
            headGroup.scale.setScalar(lerp(1.1, 1, easeInOut(t)));
          }
          if (t < 1) requestAnimationFrame(leanOut); else resolve();
        }
        leanOut();
      });
      if (interacted) break;

      // Nervous glance right (checking if pusher returns)
      if (headGroup) headGroup.rotation.y = -0.42;
      setEyeState('nervous');
      state.nervousTremor = true;
      await sleep(520);
      if (headGroup) headGroup.rotation.y = 0;
      state.nervousTremor = false;
      await sleep(3600);
    }

    if (interacted) doFlee(true);
  }

  /* ────────────────────────────────────────────────────────
     ENTRY POINT
  ──────────────────────────────────────────────────────── */
  function startIdleBot() {
    if (isActive) return;
    isActive = true; interacted = false;

    loadThree(T => {
      initScene(T);
      initGlass();
      setTimeout(() => runSequence(), 400);
    });
  }

  /* ────────────────────────────────────────────────────────
     IDLE DETECTION
  ──────────────────────────────────────────────────────── */
  function onActivity() {
    if (isActive && currentPhase !== 'none' && currentPhase !== 'fleeing') {
      interacted = true;
    }
    resetIdleTimer();
  }

  function resetIdleTimer() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(startIdleBot, IDLE_DELAY);
  }

  ['mousemove','mousedown','keydown','touchstart','touchmove','scroll','wheel','click']
    .forEach(ev => document.addEventListener(ev, onActivity, { passive: true }));

  resetIdleTimer();

  window.addEventListener('resize', () => {
    if (camera && renderer) {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    if (glassCanvas) {
      glassCanvas.width  = window.innerWidth;
      glassCanvas.height = window.innerHeight;
      drawGlass();
    }
  });

})();
