(function () {
  'use strict';

  const IDLE_DELAY = 10000;

  let isActive = false;
  let interacted = false;
  let idleTimer = null;

  let scene, camera, renderer, clock;
  let robotGroup, headGroup, eyeL, eyeR, antOrb;

  let rafId = null;

  /* ─────────────────────────────────────────
     THEME COLORS (connected to your switcher)
  ───────────────────────────────────────── */
  const THEMES = {
    dark:   { primary: 0x1880d8, eye: 0x1188ee },
    light:  { primary: 0x6ec6ff, eye: 0x3399ff },
    slate:  { primary: 0x4f6d7a, eye: 0x88c0ff },
    forest: { primary: 0x2e7d32, eye: 0x66ff99 }
  };

  function getTheme() {
    return document.documentElement.getAttribute('data-theme') || 'dark';
  }

  function applyTheme() {
    const t = THEMES[getTheme()] || THEMES.dark;

    if (!robotGroup) return;

    robotGroup.traverse(obj => {
      if (obj.material) {
        if (obj.material.name === 'blue') {
          obj.material.color.setHex(t.primary);
        }
      }
    });

    if (eyeL && eyeR) {
      eyeL.material.color.setHex(t.eye);
      eyeR.material.color.setHex(t.eye);
    }

    if (antOrb) {
      antOrb.material.color.setHex(t.eye);
    }
  }

  /* ─────────────────────────────────────────
     LOAD THREE
  ───────────────────────────────────────── */
  function loadThree(cb) {
    if (window.THREE) return cb(window.THREE);

    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    s.onload = () => cb(window.THREE);
    document.head.appendChild(s);
  }

  /* ─────────────────────────────────────────
     BUILD ROBOT (SIMPLIFIED HEAD FOCUS)
  ───────────────────────────────────────── */
  function buildRobot(T) {
    const root = new T.Group();

    const ceramic = new T.MeshPhongMaterial({ color: 0xffffff });
    const visorMat = new T.MeshPhongMaterial({ color: 0x000000 });
    const blue = new T.MeshPhongMaterial({ color: 0x1880d8 });
    blue.name = 'blue';

    const eyeMat = new T.MeshBasicMaterial({ color: 0x1188ee });

    // HEAD
    headGroup = new T.Group();
    headGroup.position.set(0, 2, 0);

    const head = new T.Mesh(
      new T.SphereGeometry(0.6, 32, 32),
      ceramic
    );
    head.scale.set(1, 0.9, 0.8);
    headGroup.add(head);

    const visor = new T.Mesh(
      new T.BoxGeometry(0.8, 0.6, 0.05),
      visorMat
    );
    visor.position.z = 0.45;
    headGroup.add(visor);

    eyeL = new T.Mesh(
      new T.SphereGeometry(0.1, 16, 16),
      eyeMat
    );
    eyeL.position.set(-0.2, 0, 0.5);

    eyeR = eyeL.clone();
    eyeR.position.x = 0.2;

    headGroup.add(eyeL, eyeR);

    root.add(headGroup);

    // ANTENNA
    antOrb = new T.Mesh(
      new T.SphereGeometry(0.08, 16, 16),
      new T.MeshBasicMaterial({ color: 0x00eeff })
    );
    antOrb.position.set(0.2, 2.9, 0);
    root.add(antOrb);

    return root;
  }

  /* ─────────────────────────────────────────
     SCENE
  ───────────────────────────────────────── */
  function initScene(T) {
    const canvas = document.createElement('canvas');
    canvas.style.cssText = `
      position:fixed;
      inset:0;
      z-index:999999;
      pointer-events:none;
    `;
    document.body.appendChild(canvas);

    scene = new T.Scene();

    camera = new T.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 100);
    camera.position.set(0, 2.5, 8);

    renderer = new T.WebGLRenderer({ canvas, alpha: true });
    renderer.setSize(innerWidth, innerHeight);

    scene.add(new T.AmbientLight(0xffffff, 0.6));

    robotGroup = buildRobot(T);
    robotGroup.position.set(10, 0, 0); // hidden right
    scene.add(robotGroup);

    clock = new T.Clock();

    function loop() {
      rafId = requestAnimationFrame(loop);

      // idle floating
      const t = clock.getElapsedTime();
      headGroup.rotation.y = Math.sin(t * 2) * 0.2;

      renderer.render(scene, camera);
    }

    loop();
  }

  /* ─────────────────────────────────────────
     PEEK SEQUENCE
  ───────────────────────────────────────── */
  async function peekFrom(side = 'right') {
    if (!robotGroup) return;

    const startX = side === 'right' ? 10 : -10;
    const peekX  = side === 'right' ? 3.8 : -3.8;

    robotGroup.position.x = startX;

    // enter
    for (let i = 0; i <= 1; i += 0.05) {
      robotGroup.position.x = startX + (peekX - startX) * i;
      await sleep(16);
      if (interacted) return flee();
    }

    // pause + look
    await sleep(800);

    headGroup.rotation.y = side === 'right' ? -0.5 : 0.5;
    await sleep(600);

    headGroup.rotation.y = 0;
    await sleep(1200);

    // exit
    for (let i = 0; i <= 1; i += 0.05) {
      robotGroup.position.x = peekX + (startX - peekX) * i;
      await sleep(16);
    }
  }

  async function runSequence() {
    applyTheme();

    while (!interacted) {
      await peekFrom('right');
      await sleep(2000);

      await peekFrom('left');
      await sleep(4000);
    }
  }

  /* ─────────────────────────────────────────
     FLEE
  ───────────────────────────────────────── */
  function flee() {
    if (!robotGroup) return;

    for (let i = 0; i <= 1; i += 0.1) {
      robotGroup.position.x += 2;
    }

    cleanup();
  }

  /* ───────────────────────────────────────── */
  function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  function cleanup() {
    cancelAnimationFrame(rafId);
    isActive = false;
  }

  /* ─────────────────────────────────────────
     START
  ───────────────────────────────────────── */
  function start() {
    if (isActive) return;
    isActive = true;
    interacted = false;

    loadThree(T => {
      initScene(T);
      runSequence();
    });
  }

  function resetTimer() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(start, IDLE_DELAY);
  }

  function onActivity() {
    if (isActive) interacted = true;
    resetTimer();
  }

  ['mousemove','click','scroll','keydown','touchstart']
    .forEach(e => document.addEventListener(e, onActivity));

  /* ─────────────────────────────────────────
     THEME OBSERVER (AUTO UPDATE)
  ───────────────────────────────────────── */
  const observer = new MutationObserver(applyTheme);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
  });

  resetTimer();

})();
