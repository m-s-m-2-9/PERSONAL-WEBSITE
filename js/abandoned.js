/* ═══════════════════════════════════════════════════════════
   abandoned.js — Ruins Easter Egg
   
   UPDATED LOGIC:
   1. Vines now spawn from the TOP (below nav) and grow DOWN.
   2. Canvas is pinned behind all elements (z-index: -1).
   3. Restore button appears immediately when growth starts.
   4. Logic persists across all active pages via MutationObserver.
═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ─── TIMING ─── */
  const IDLE_MS      = 10 * 1000;  
  const SPAWN_MS     =  5 * 60 * 1000;  
  const RESTORE_MS   =  5 * 60 * 1000;  

  /* ─── VINE GROWTH PARAMS ─── */
  const MAX_VINES     = 10;
  const VINE_GAP_MS   = Math.floor(SPAWN_MS / MAX_VINES); 
  const STEP_PX       = 2;      
  const TICK_MS       = window.innerWidth < 768 ? 80 : 40;     
  const LEAF_EVERY    = 8;      
  const FLOWER_EVERY  = 24;     

  /* ─── MOSS ─── */
  const MOSS_DELAY_MS = 1000;  /* Spawns almost immediately */
  const MAX_MOSS      = 14;
  const MOSS_GAP_MS   = (SPAWN_MS - MOSS_DELAY_MS) / MAX_MOSS;

  /* ─── STATE ─── */
  let ruinMode    = false;
  let restoring   = false;
  let ruinStart   = 0;
  let restoreStart= 0;
  let idleTimer   = null;
  let spawnTimer  = null;
  let mossTimer   = null;
  let growInterval= null;
  let rafId       = null;
  let lastScrollTop = 0; 

  const vines      = [];
  const mossSpots  = [];
  const cracks      = [];

  /* ─── CANVAS REFS ─── */
  let vineCanvas = null;
  let vineCtx    = null;
  let crackCanvas= null;
  let crackCtx   = null;
  let currentPage= null;  

  /* ─── DOM REFS ─── */
  let overlay    = null;
  let restoreBtn = null;

  /* ─── BOOKKEEPING ─── */
  let spawnCount = 0;
  let anchorsPool= [];

  const PALETTES = {
    dark:   [{ p:'#4d7fff', c:'#cce' }, { p:'#8833ee', c:'#edd' }, { p:'#2299dd', c:'#cef' }],
    light:  [{ p:'#ff9bcc', c:'#fff' }, { p:'#ffbb44', c:'#ffe' }, { p:'#ee6699', c:'#fee' }],
    slate:  [{ p:'#7799bb', c:'#ddf' }, { p:'#99bbcc', c:'#eff' }, { p:'#7788aa', c:'#eef' }],
    forest: [{ p:'#ddcc00', c:'#ffd' }, { p:'#ff8800', c:'#ffe' }, { p:'#eeaa00', c:'#ffd' }],
  };

  function getPalette() {
    const t = document.documentElement.getAttribute('data-theme') || 'dark';
    return PALETTES[t] || PALETTES.dark;
  }

  const TAU = Math.PI * 2;
  function rng(lo, hi) { return lo + Math.random() * (hi - lo); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function easeOut(t) { const u = 1 - t; return 1 - u * u; }
  function easeIn(t) { return t * t; }
  function easeInOut(t) { return t < 0.5 ? 2*t*t : 1-(Math.pow(-2*t+2,2))/2; }

  /* ═══════════════════════════════════════════════
     ANCHOR DISCOVERY (RE-WIRED FOR TOP-DOWN)
  ═══════════════════════════════════════════════ */
  function discoverAnchors(pageEl) {
    const W = pageEl.clientWidth;
    const anchors = [];
    
    // Create random start points just below the navbar (approx 60px - 100px from top)
    for(let i=0; i < 20; i++) {
        anchors.push({
            x: rng(20, W - 20),
            y: rng(60, 110),
            side: 'top'
        });
    }

    return anchors;
  }

  function makeVine(anchor, idx) {
    // Force angle to point DOWN (Math.PI / 2 is 90 degrees)
    let initAngle = (Math.PI / 2) + rng(-0.4, 0.4);

    const palette = getPalette();
    const col = palette[idx % palette.length];

    return {
      pts:          [{ x: anchor.x, y: anchor.y }],
      angle:        initAngle,
      momentum:      0,
      maxSteps:      Math.floor(rng(150, 400)), // Longer vines to reach down
      step:          0,
      done:          false,
      alpha:        0,
      thick:        rng(1.1, 2.2),
      col,
      leaves:        [],
      flowers:      [],
      sinceLeaf:     0,
      leafCount:     0,
      restoring:     false,
      restoreStart: 0,
      startAlpha:    0,
    };
  }

  function stepVine(v) {
    if (v.done || v.restoring) return;
    if (v.step >= v.maxSteps) { v.done = true; return; }

    const drift   = (Math.random() - 0.5) * 0.24;
    // Gravity pulls DOWN (+ value in Y-axis)
    const gravity = 0.012 + Math.sin(v.step * 0.05) * 0.01;
    v.momentum    = v.momentum * 0.80 + drift * 0.20;
    v.angle      += v.momentum + gravity;

    // Constrain to generally downward arc
    v.angle = clamp(v.angle, 0.5, Math.PI - 0.5);

    const last = v.pts[v.pts.length - 1];
    const nx = last.x + Math.cos(v.angle) * STEP_PX;
    const ny = last.y + Math.sin(v.angle) * STEP_PX;

    if (!vineCanvas) return;
    const W = vineCanvas.width, H = vineCanvas.height;
    v.pts.push({ x: clamp(nx, -60, W + 60), y: clamp(ny, -60, H + 60) });
    v.step++;
    v.sinceLeaf++;

    if (v.sinceLeaf >= LEAF_EVERY && v.step > 4 && Math.random() > 0.32) {
      addLeaf(v);
    }
    if (v.leafCount >= 2 && Math.random() > 0.965) {
      addFlower(v);
    }
  }

  function addLeaf(v) {
    const i = v.pts.length - 1;
    const p = v.pts[i];
    const prev = v.pts[Math.max(0, i - 4)];
    const stemAng = Math.atan2(p.y - prev.y, p.x - prev.x);
    const side = v.leafCount % 2 === 0 ? 1 : -1;
    const leafAng = stemAng + (Math.PI / 2) * side + rng(-0.3, 0.3);
    v.leaves.push({
      x: p.x, y: p.y, angle: leafAng, t: 0, growMs: rng(2500, 5500),
      size: rng(7, 15), side, restoring: false, restoreStart: 0, startT: 0,
    });
    v.leafCount++;
    v.sinceLeaf = 0;
  }

  function addFlower(v) {
    const p = v.pts[v.pts.length - 1];
    v.flowers.push({
      x: p.x, y: p.y, t: 0, growMs: rng(4000, 8500), petals: Math.floor(rng(4, 7)),
      radius: rng(4, 8), col: v.col, rotOff: Math.random() * TAU, restoring: false, restoreStart: 0, startT: 0,
    });
  }

  /* ─── DRAW ROUTINES (VISUALS KEPT EXACT) ─── */
  function drawStem(ctx, v, alpha) {
    if (v.pts.length < 2 || alpha < 0.01) return;
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.globalAlpha = alpha;
    for (let i = 1; i < v.pts.length; i++) {
      const t = i / v.maxSteps;
      const w = Math.max(0.4, v.thick * (1 - t * 0.62));
      const r0 = Math.floor(lerp(14, 20, t)), g0 = Math.floor(lerp(34, 58, t)), b0 = Math.floor(lerp(8, 18, t));
      ctx.beginPath(); ctx.moveTo(v.pts[i - 1].x, v.pts[i - 1].y);
      ctx.lineTo(v.pts[i].x, v.pts[i].y);
      ctx.strokeStyle = `rgb(${r0},${g0},${b0})`; ctx.lineWidth = w; ctx.stroke();
    }
    ctx.restore();
  }

  function drawLeaf(ctx, lf, alpha) {
    const progress = clamp(lf.t / lf.growMs, 0, 1);
    if (progress < 0.02 || alpha < 0.01) return;
    const s = lf.size * easeOut(progress);
    const a = lf.angle;
    const nx = Math.cos(a), ny = Math.sin(a);
    const tx = lf.x + nx * s, ty = lf.y + ny * s;
    const px2 = -ny, py2 = nx;
    const w = s * 0.44;
    const mx = lf.x + nx * s * 0.52;
    const my = lf.y + ny * s * 0.52;
    const l1x = mx + px2 * w, l1y = my + py2 * w;
    const r1x = mx - px2 * w, r1y = my - py2 * w;
    ctx.save();
    ctx.globalAlpha = alpha * Math.min(1, lf.t / 700);
    const grad = ctx.createLinearGradient(lf.x, lf.y, tx, ty);
    grad.addColorStop(0, '#1b4409'); grad.addColorStop(0.4, '#286514'); grad.addColorStop(1, '#35801d');
    ctx.fillStyle = grad; ctx.strokeStyle = '#122e06'; ctx.lineWidth = 0.4;
    ctx.beginPath(); ctx.moveTo(lf.x, lf.y);
    ctx.bezierCurveTo(l1x, l1y, tx, ty, tx, ty); ctx.bezierCurveTo(tx, ty, r1x, r1y, lf.x, lf.y);
    ctx.fill(); ctx.stroke(); ctx.restore();
  }

  function drawFlower(ctx, fl, alpha) {
    const prog = clamp(fl.t / fl.growMs, 0, 1);
    if (prog < 0.04 || alpha < 0.01) return;
    const r = fl.radius * easeOut(prog);
    const n = fl.petals;
    ctx.save();
    ctx.globalAlpha = alpha * Math.min(1, fl.t / 1100);
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * TAU + fl.rotOff;
      const px2 = fl.x + Math.cos(ang) * r;
      const py2 = fl.y + Math.sin(ang) * r;
      ctx.save(); ctx.translate(px2, py2); ctx.rotate(ang + Math.PI / 2); ctx.scale(1, 0.52);
      const petalR = r * 0.56;
      ctx.fillStyle = fl.col.p; ctx.beginPath(); ctx.arc(0, 0, petalR, 0, TAU); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  function drawMoss(ctx, ms, alpha) {
    const progress = clamp(ms.t / ms.growMs, 0, 1);
    if (progress < 0.02 || alpha < 0.01) return;
    const r = ms.radius * easeOut(progress);
    ctx.save();
    ctx.globalAlpha = alpha * 0.5 * Math.min(1, ms.t / 2000);
    const mg = ctx.createRadialGradient(ms.x, ms.y, 0, ms.x, ms.y, r);
    mg.addColorStop(0, `rgba(18,50,10,0.55)`); mg.addColorStop(1, `rgba(8,20,4,0.00)`);
    ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(ms.x, ms.y, r, 0, TAU); ctx.fill();
    ctx.restore();
  }

  /* ─── OVERLAY + RESTORE BUTTON (DELAY REMOVED) ─── */
  function showRestoreButton() {
    if (restoreBtn) return;
    restoreBtn = document.createElement('button');
    restoreBtn.className = 'ruins-restore-btn';
    restoreBtn.innerHTML = '<span class="ruins-restore-text">Restore System</span>';
    restoreBtn.addEventListener('click', restoreInstant);
    document.body.appendChild(restoreBtn);
    // Instant Fade In
    requestAnimationFrame(() => restoreBtn.classList.add('visible'));
  }

  function hideRestoreButton() {
    if (!restoreBtn) return;
    const btn = restoreBtn; restoreBtn = null;
    btn.classList.remove('visible');
    setTimeout(() => { if (btn.parentNode) btn.remove(); }, 900);
  }

  /* ─── ENGINE ─── */
  function renderLoop(ts) {
    rafId = requestAnimationFrame(renderLoop);
    const dt = Math.min(ts - lastTs, 80);
    lastTs = ts;
    const elapsed = ruinMode ? (Date.now() - ruinStart) : 0;
    const restoreElapsed = restoring ? (Date.now() - restoreStart) : 0;

    if (vineCtx && vineCanvas) {
      vineCtx.clearRect(0, 0, vineCanvas.width, vineCanvas.height);
      vines.forEach(v => {
        if (!restoring && v.alpha < 0.88) v.alpha += dt * 0.0002;
        if (restoring) {
          const ve2 = Date.now() - v.restoreStart;
          v.alpha = v.startAlpha * (1 - easeIn(clamp(ve2 / RESTORE_MS, 0, 1)));
        }
        drawStem(vineCtx, v, v.alpha);
        v.leaves.forEach(lf => {
          if (lf.restoring) {
            const le2 = Date.now() - lf.restoreStart;
            lf.t = lf.startT * (1 - easeIn(clamp(le2 / (RESTORE_MS * 0.8), 0, 1)));
          } else if (lf.t < lf.growMs) lf.t += dt;
          drawLeaf(vineCtx, lf, v.alpha);
        });
        v.flowers.forEach(fl => {
          if (fl.restoring) {
            const fe2 = Date.now() - fl.restoreStart;
            fl.t = fl.startT * (1 - easeIn(clamp(fe2 / (RESTORE_MS * 0.7), 0, 1)));
          } else if (fl.t < fl.growMs) fl.t += dt;
          drawFlower(vineCtx, fl, v.alpha);
        });
      });
    }
  }

  function enterRuinMode() {
    if (ruinMode) return;
    ruinMode = true; restoring = false; ruinStart = Date.now(); spawnCount = 0;
    ensureVineCanvas();
    if (!vineCanvas || !currentPage) return;
    anchorsPool = discoverAnchors(currentPage);
    showRestoreButton(); // APPEARS IMMEDIATELY
    spawnVine();
    spawnTimer = setInterval(spawnVine, VINE_GAP_MS);
    growInterval = setInterval(() => {
      if (!ruinMode) { clearInterval(growInterval); return; }
      vines.forEach(v => stepVine(v));
    }, TICK_MS);
  }

  function spawnVine() {
    if (!ruinMode || spawnCount >= MAX_VINES || !vineCanvas || !currentPage) {
      clearInterval(spawnTimer); return;
    }
    const anchor = anchorsPool[spawnCount % anchorsPool.length];
    vines.push(makeVine(anchor, spawnCount));
    spawnCount++;
  }

  function beginRestore() {
    if (!ruinMode) return;
    ruinMode = false; restoring = true;
    const now = Date.now();
    restoreStart = now;
    clearInterval(spawnTimer); clearInterval(growInterval);
    vines.forEach(v => {
      v.restoring = true;
      v.restoreStart = now + Math.random() * 800;
      v.startAlpha = v.alpha;
      v.leaves.forEach(lf => { lf.restoring = true; lf.restoreStart = now; lf.startT = lf.t; });
      v.flowers.forEach(fl => { fl.restoring = true; fl.restoreStart = now; fl.startT = fl.t; });
    });
    hideRestoreButton();
  }

  function restoreInstant() {
    ruinMode = false; restoring = false;
    clearInterval(spawnTimer); clearInterval(growInterval);
    vines.length = 0;
    if (vineCtx && vineCanvas) vineCtx.clearRect(0, 0, vineCanvas.width, vineCanvas.height);
    hideRestoreButton(); resetIdle();
  }

  /* ─── CANVAS BOILERPLATE (BACK-PINNED) ─── */
  function ensureVineCanvas() {
    const pg = document.querySelector('.page.active') || document.body;
    if (vineCanvas && currentPage === pg) return;
    if (vineCanvas && vineCanvas.parentNode) vineCanvas.parentNode.removeChild(vineCanvas);
    vineCanvas = document.createElement('canvas');
    // z-index: -1 ensures it stays BEHIND content
    vineCanvas.style.cssText = `position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: -1; pointer-events: none;`;
    vineCanvas.width = pg.clientWidth; vineCanvas.height = pg.scrollHeight;
    vineCtx = vineCanvas.getContext('2d');
    pg.style.position = 'relative'; // Anchor for absolute canvas
    pg.insertBefore(vineCanvas, pg.firstChild);
    currentPage = pg;
  }

  function resetIdle() { clearTimeout(idleTimer); idleTimer = setTimeout(enterRuinMode, IDLE_MS); }
  function onActivity() { if (ruinMode) beginRestore(); if (!restoring) resetIdle(); }

  let lastTs = 0;
  const EVTS = ['mousemove','mousedown','keydown','touchstart','touchmove','scroll','wheel','click'];
  EVTS.forEach(ev => document.addEventListener(ev, onActivity, { passive: true }));

  // Page tracking to move canvas to new active sections
  const pageObserver = new MutationObserver(() => {
    if (ruinMode) ensureVineCanvas();
  });
  pageObserver.observe(document.body, { subtree: true, attributeFilter: ['class'] });

  rafId = requestAnimationFrame(renderLoop);
  resetIdle();
})();
