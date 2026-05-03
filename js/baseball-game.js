/* ═══════════════════════════════════════════════════════════
   BASEBALL MINI-GAME — MSM Portfolio
   Inspired by Google Doodle Baseball
   Self-contained module. No frameworks. No dependencies.
   Reads CSS variables from the active theme automatically.
═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ─── STATE ─── */
  let canvas, ctx;
  let gameState = 'idle'; // idle | pitching | swinging | result | gameover
  let score = 0;
  let strikes = 0;
  let outs = 0;
  let inning = 1;
  let combo = 0;
  let highScore = 0;
  let animId = null;
  let lastTs = 0;

  /* ─── BALL STATE ─── */
  let ball = {
    x: 0, y: 0,
    vx: 0, vy: 0,
    radius: 10,
    visible: false,
    hit: false,
    spin: 0,
    spinRate: 0,
    trail: [],
  };

  /* ─── BAT STATE ─── */
  let bat = {
    swinging: false,
    angle: 0,          // current angle (radians)
    targetAngle: 0,
    speed: 0,
    progress: 0,       // 0 → 1 swing animation
    contact: false,
  };

  /* ─── PITCHER STATE ─── */
  let pitcher = {
    windupProgress: 0,
    windupDir: 1,
    windupAngle: 0,
    throwing: false,
    throwProgress: 0,
    armAngle: 0,
  };

  /* ─── CROWD ─── */
  let crowd = [];
  let crowdAnim = 0;
  let showResult = false;
  let resultText = '';
  let resultAlpha = 0;
  let resultColor = '';
  let resultTimer = 0;

  /* ─── DIFFICULTY ─── */
  let difficultyLevel = 1;
  let pitchCount = 0;

  /* ─── FIELD / LAYOUT ─── */
  let W, H;
  let plateX, plateY;
  let moundX, moundY;
  let batterX, batterY;

  /* ─── PITCH TYPES ─── */
  const PITCH_TYPES = [
    { name: 'Fastball',   speed: 5.2, curve: 0.01,  dip: 0.12 },
    { name: 'Curveball',  speed: 4.0, curve: 0.045, dip: 0.14 },
    { name: 'Slider',     speed: 4.5, curve: 0.03,  dip: 0.10 },
    { name: 'Changeup',   speed: 3.2, curve: 0.02,  dip: 0.16 },
    { name: 'Sinker',     speed: 4.8, curve: 0.01,  dip: 0.22 },
  ];

  /* ─── HIT RESULT ZONES ─── */
  const HIT_RESULTS = [
    { label: 'SINGLE!',       points: 1,  combo: 1,  color: '#7ec8e3' },
    { label: 'DOUBLE!!',      points: 2,  combo: 2,  color: '#a8e6cf' },
    { label: 'TRIPLE!!!',     points: 3,  combo: 3,  color: '#ffd700' },
    { label: 'HOME RUN!!!!',  points: 4,  combo: 4,  color: '#ff6b6b' },
    { label: 'GRAND SLAM!!',  points: 6,  combo: 5,  color: '#ff4757' },
  ];

  /* ─── STARS / PARTICLES ─── */
  let particles = [];

  /* ═══ INIT ═══ */
  function init(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = buildHTML();
    canvas = container.querySelector('#baseball-canvas');
    ctx = canvas.getContext('2d');

    bindEvents(container);
    resize(container);
    window.addEventListener('resize', () => resize(container));

    loadHighScore();
    buildCrowd();
    resetGame();
    startLoop();
  }

  function buildHTML() {
    return `
<div class="bb-wrapper" id="bb-wrapper">

  <!-- HUD top bar -->
  <div class="bb-hud">
    <div class="bb-hud-group">
      <span class="bb-hud-label">INNING</span>
      <span class="bb-hud-val" id="bb-inning">1</span>
    </div>
    <div class="bb-hud-center">
      <span class="bb-hud-label">SCORE</span>
      <span class="bb-hud-val bb-score-big" id="bb-score">0</span>
    </div>
    <div class="bb-hud-group bb-hud-right">
      <span class="bb-hud-label">BEST</span>
      <span class="bb-hud-val" id="bb-best">0</span>
    </div>
  </div>

  <!-- Strikes / Outs -->
  <div class="bb-counts">
    <div class="bb-count-group">
      <span class="bb-count-label">STRIKES</span>
      <div class="bb-dots" id="bb-strikes">
        <span class="bb-dot"></span>
        <span class="bb-dot"></span>
      </div>
    </div>
    <div class="bb-count-group bb-outs-group">
      <span class="bb-count-label">OUTS</span>
      <div class="bb-dots" id="bb-outs">
        <span class="bb-dot"></span>
        <span class="bb-dot"></span>
        <span class="bb-dot"></span>
      </div>
    </div>
    <div class="bb-count-group bb-combo-group" id="bb-combo-group">
      <span class="bb-count-label">COMBO</span>
      <span class="bb-combo-val" id="bb-combo">x0</span>
    </div>
  </div>

  <!-- Canvas -->
  <canvas id="baseball-canvas"></canvas>

  <!-- Action area -->
  <div class="bb-action-area">
    <div class="bb-pitch-label" id="bb-pitch-label">Tap / Click or Press SPACE to pitch</div>
    <div class="bb-swing-hint" id="bb-swing-hint">Tap / Click or Press SPACE to swing!</div>
  </div>

  <!-- Start overlay -->
  <div class="bb-overlay" id="bb-overlay">
    <div class="bb-overlay-inner">
      <div class="bb-overlay-icon">⚾</div>
      <div class="bb-overlay-title">Baseball</div>
      <div class="bb-overlay-sub">Time your swing. 3 strikes = 1 out. 3 outs = game over.</div>
      <button class="bb-btn-play" id="bb-play-btn">Play Ball</button>
    </div>
  </div>

  <!-- Game Over overlay -->
  <div class="bb-overlay bb-gameover hidden" id="bb-gameover">
    <div class="bb-overlay-inner">
      <div class="bb-gameover-label">GAME OVER</div>
      <div class="bb-final-score-label">Final Score</div>
      <div class="bb-final-score" id="bb-final-score">0</div>
      <div class="bb-new-best hidden" id="bb-new-best">★ New Best! ★</div>
      <button class="bb-btn-play" id="bb-retry-btn">Play Again</button>
    </div>
  </div>

</div>`;
  }

  /* ═══ RESIZE ═══ */
  function resize(container) {
    const rect = container.getBoundingClientRect();
    W = Math.min(rect.width || 580, 580);
    H = Math.min(window.innerHeight * 0.55, 320);
    H = Math.max(H, 200);

    canvas.width  = W;
    canvas.height = H;

    /* Layout positions */
    plateX  = W * 0.78;
    plateY  = H * 0.72;
    moundX  = W * 0.22;
    moundY  = H * 0.58;
    batterX = W * 0.76;
    batterY = H * 0.60;

    if (ball.visible && !ball.hit) {
      ball.x = moundX;
      ball.y = moundY;
    }
  }

  /* ═══ EVENTS ═══ */
  function bindEvents(container) {
    const handler = () => onAction();
    canvas.addEventListener('click', handler);
    canvas.addEventListener('touchstart', (e) => { e.preventDefault(); handler(); }, { passive: false });
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && document.getElementById('bb-wrapper')) {
        e.preventDefault();
        handler();
      }
    });

    container.querySelector('#bb-play-btn').addEventListener('click', () => startGame());
    container.querySelector('#bb-retry-btn').addEventListener('click', () => {
      container.querySelector('#bb-gameover').classList.add('hidden');
      startGame();
    });
  }

  function onAction() {
    if (gameState === 'idle') return;
    if (gameState === 'pitching') {
      // Wait for pitch
      return;
    }
    if (gameState === 'ready') {
      throwPitch();
      return;
    }
    if (gameState === 'incoming') {
      swing();
      return;
    }
  }

  /* ═══ GAME FLOW ═══ */
  function startGame() {
    document.getElementById('bb-overlay').classList.add('hidden');
    resetGame();
    gameState = 'ready';
    showPitchHint(true);
    showSwingHint(false);
  }

  function resetGame() {
    score = 0;
    strikes = 0;
    outs = 0;
    inning = 1;
    combo = 0;
    pitchCount = 0;
    difficultyLevel = 1;
    particles = [];
    ball.visible = false;
    ball.hit = false;
    bat.swinging = false;
    bat.progress = 0;
    bat.angle = 0;
    showResult = false;
    resultAlpha = 0;
    pitcher.windupProgress = 0;
    pitcher.throwing = false;
    pitcher.throwProgress = 0;
    updateHUD();
  }

  function throwPitch() {
    if (gameState !== 'ready') return;
    gameState = 'pitching';
    showPitchHint(false);
    showSwingHint(false);

    pitchCount++;
    difficultyLevel = 1 + Math.floor(pitchCount / 5) * 0.3;

    /* Choose pitch type */
    const typeIndex = Math.min(
      Math.floor(Math.random() * Math.min(pitchCount + 1, PITCH_TYPES.length)),
      PITCH_TYPES.length - 1
    );
    const type = PITCH_TYPES[typeIndex];

    /* Target zone — add slight randomness */
    const zoneOffsetY = (Math.random() - 0.5) * H * 0.18;
    const zoneOffsetX = (Math.random() - 0.5) * W * 0.04;
    const targetX = plateX + zoneOffsetX;
    const targetY = plateY + zoneOffsetY;

    const dx = targetX - moundX;
    const dy = targetY - moundY;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const speed = type.speed * difficultyLevel * 0.9;
    const frames = dist / speed;

    ball.x = moundX;
    ball.y = moundY - 5;
    ball.vx = dx / frames;
    ball.vy = dy / frames;
    ball.radius = 10;
    ball.visible = true;
    ball.hit = false;
    ball.spin = Math.random() * Math.PI * 2;
    ball.spinRate = (Math.random() - 0.5) * 0.3;
    ball.trail = [];
    ball.curve = type.curve * (Math.random() > 0.5 ? 1 : -1);
    ball.dip = type.dip;
    ball.totalFrames = frames;
    ball.framesElapsed = 0;
    ball.pitchName = type.name;

    bat.swinging = false;
    bat.angle = 0.5;     // rest angle
    bat.progress = 0;

    gameState = 'incoming';

    /* Show swing hint after short delay */
    setTimeout(() => {
      if (gameState === 'incoming') showSwingHint(true);
    }, 300);

    /* Pitcher windup anim */
    pitcher.throwing = true;
    pitcher.throwProgress = 0;
  }

  function swing() {
    if (gameState !== 'incoming') return;
    if (bat.swinging) return;

    bat.swinging = true;
    bat.progress = 0;

    /* Check timing — was ball near the zone? */
    const dx = ball.x - plateX;
    const dy = ball.y - plateY;
    const dist = Math.sqrt(dx*dx + dy*dy);

    // Will resolve in update loop once swing completes
  }

  function resolveHit(dist) {
    showSwingHint(false);

    const hitWindow   = W * 0.14;
    const perfectWindow = W * 0.06;

    if (dist < perfectWindow) {
      // Perfect hit — distance-based result
      const power = Math.random();
      let resultIndex;
      if (combo >= 4 && power > 0.6)      resultIndex = 4; // Grand slam
      else if (power > 0.75)              resultIndex = 3; // Home run
      else if (power > 0.50)              resultIndex = 2; // Triple
      else if (power > 0.25)              resultIndex = 1; // Double
      else                                resultIndex = 0; // Single

      const result = HIT_RESULTS[resultIndex];
      const comboMult = 1 + combo * 0.5;
      const pts = Math.round(result.points * comboMult);
      score += pts;
      combo += result.combo;
      spawnHitParticles(ball.x, ball.y, result.color);
      launchBall(result.label);
      showResultText(result.label + (combo > 1 ? ` ×${combo}` : ''), result.color);

    } else if (dist < hitWindow) {
      // Weak hit — foul or single
      const result = HIT_RESULTS[0];
      score += result.points;
      combo = Math.max(0, combo - 1);
      spawnHitParticles(ball.x, ball.y, '#aaa');
      launchBall('FOUL');
      showResultText('FOUL BALL', '#aaa');
      strikes = Math.min(strikes + 1, 2); // foul = strike (max 2)

    } else {
      // Miss
      combo = 0;
      strikes++;
      showResultText('STRIKE!', '#ff6b6b');
      ball.visible = false;
    }

    updateHUD();
    checkInning();
    gameState = 'result';
    setTimeout(() => {
      if (gameState !== 'gameover') {
        gameState = 'ready';
        showPitchHint(true);
        showSwingHint(false);
      }
    }, 1400);
  }

  function resolveMiss() {
    // Ball passed plate without swing
    showSwingHint(false);
    combo = 0;
    strikes++;
    showResultText('STRIKE!', '#ff6b6b');
    ball.visible = false;
    updateHUD();
    checkInning();
    gameState = 'result';
    setTimeout(() => {
      if (gameState !== 'gameover') {
        gameState = 'ready';
        showPitchHint(true);
        showSwingHint(false);
      }
    }, 1200);
  }

  function launchBall(type) {
    ball.hit = true;
    const angle = -(Math.PI / 4 + Math.random() * Math.PI / 6);
    const power = type === 'FOUL' ? 3 : 6 + Math.random() * 5;
    ball.vx = Math.cos(angle) * power;
    ball.vy = Math.sin(angle) * power;
    ball.trail = [];
  }

  function checkInning() {
    if (strikes >= 3) {
      strikes = 0;
      outs++;
      spawnStrikeParticles();
    }
    if (outs >= 3) {
      outs = 0;
      inning++;
      if (inning > 9) {
        endGame();
        return;
      }
    }
    updateHUD();
  }

  function endGame() {
    gameState = 'gameover';
    showSwingHint(false);
    showPitchHint(false);

    const newBest = score > highScore;
    if (newBest) {
      highScore = score;
      saveHighScore();
    }

    const go = document.getElementById('bb-gameover');
    document.getElementById('bb-final-score').textContent = score;
    const nbEl = document.getElementById('bb-new-best');
    newBest ? nbEl.classList.remove('hidden') : nbEl.classList.add('hidden');
    go.classList.remove('hidden');
    updateHUD();
  }

  /* ═══ UPDATE LOOP ═══ */
  function startLoop() {
    if (animId) cancelAnimationFrame(animId);
    lastTs = performance.now();
    animId = requestAnimationFrame(loop);
  }

  function loop(ts) {
    animId = requestAnimationFrame(loop);
    const dt = Math.min(ts - lastTs, 50);
    lastTs = ts;

    update(dt);
    render();
  }

  function update(dt) {
    const dts = dt / 16.67; // normalise to 60fps

    /* Pitcher windup */
    if (pitcher.throwing) {
      pitcher.throwProgress = Math.min(pitcher.throwProgress + 0.04 * dts, 1);
      if (pitcher.throwProgress >= 1) pitcher.throwing = false;
    } else {
      pitcher.windupProgress += 0.025 * dts;
      pitcher.windupAngle = Math.sin(pitcher.windupProgress) * 0.3;
    }

    /* Ball movement */
    if (ball.visible && !ball.hit && (gameState === 'incoming' || gameState === 'result')) {
      ball.trail.push({ x: ball.x, y: ball.y });
      if (ball.trail.length > 10) ball.trail.shift();

      /* Curve & dip */
      ball.vx += ball.curve * dts;
      ball.vy += ball.dip * 0.1 * dts;
      ball.x  += ball.vx * dts;
      ball.y  += ball.vy * dts;
      ball.spin += ball.spinRate * dts;
      ball.framesElapsed += dts;

      /* Grew closer → scale up slightly */
      const progress = Math.min(ball.framesElapsed / ball.totalFrames, 1);
      ball.radius = 7 + progress * 5;

      /* Did ball pass plate? */
      if (ball.x >= plateX + ball.radius * 2 && gameState === 'incoming') {
        if (!bat.swinging) {
          resolveMiss();
        }
      }
    }

    if (ball.hit) {
      ball.trail.push({ x: ball.x, y: ball.y });
      if (ball.trail.length > 18) ball.trail.shift();
      ball.vy += 0.35 * dts; // gravity
      ball.x  += ball.vx * dts;
      ball.y  += ball.vy * dts;
      if (ball.y > H + 50 || ball.x > W + 50 || ball.x < -50) {
        ball.visible = false;
        ball.hit = false;
      }
    }

    /* Bat swing animation */
    if (bat.swinging) {
      bat.progress = Math.min(bat.progress + 0.1 * dts, 1);
      /* Swing arc: 0.5 → -0.5 radians fast */
      bat.angle = 0.5 - bat.progress * 1.0;

      if (bat.progress >= 0.45 && bat.progress <= 0.55 && ball.visible && !ball.hit) {
        /* Check contact */
        const dx = ball.x - plateX;
        const dy = ball.y - plateY;
        const dist = Math.sqrt(dx*dx + dy*dy);
        resolveHit(dist);
      }

      if (bat.progress >= 1) {
        bat.swinging = false;
        bat.angle = -0.5;
        if (gameState === 'incoming') resolveMiss(); // missed
      }
    }

    /* Result text fade */
    if (showResult) {
      resultTimer -= dt;
      if (resultTimer < 600) {
        resultAlpha = Math.max(0, resultAlpha - 0.04 * dts);
      }
      if (resultTimer <= 0) {
        showResult = false;
        resultAlpha = 0;
      }
    }

    /* Particles */
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => {
      p.x   += p.vx * dts;
      p.y   += p.vy * dts;
      p.vy  += 0.25 * dts;
      p.life -= dts * 1.5;
      p.size = Math.max(0, p.size - 0.04 * dts);
    });

    /* Crowd sway */
    crowdAnim += 0.02 * dts;
  }

  /* ═══ RENDER ═══ */
  function render() {
    ctx.clearRect(0, 0, W, H);

    /* ── Background sky gradient ── */
    const theme = document.documentElement.getAttribute('data-theme') || 'dark';
    drawBackground(theme);

    /* ── Field ── */
    drawField();

    /* ── Crowd ── */
    drawCrowd();

    /* ── Pitcher mound ── */
    drawMound();

    /* ── Pitcher character ── */
    drawPitcher();

    /* ── Home plate ── */
    drawPlate();

    /* ── Batter ── */
    drawBatter();

    /* ── Ball trail ── */
    drawTrail();

    /* ── Ball ── */
    if (ball.visible) drawBall();

    /* ── Particles ── */
    drawParticles();

    /* ── Result text ── */
    if (showResult && resultAlpha > 0) drawResultText();

    /* ── Strike zone indicator (subtle) ── */
    if (gameState === 'incoming') drawStrikeZone();
  }

  /* ─── DRAW BACKGROUND ─── */
  function drawBackground(theme) {
    let skyTop, skyBot, groundColor, standColor;
    switch (theme) {
      case 'light':
        skyTop = '#b8daf5'; skyBot = '#ddeeff';
        groundColor = '#4a7c3f'; standColor = '#d4c5b0';
        break;
      case 'slate':
        skyTop = '#0d1520'; skyBot = '#1a2840';
        groundColor = '#1a3028'; standColor = '#1c2535';
        break;
      case 'forest':
        skyTop = '#0a1a08'; skyBot = '#152812';
        groundColor = '#1a3510'; standColor = '#1a2510';
        break;
      default: // dark
        skyTop = '#090910'; skyBot = '#111824';
        groundColor = '#0a1a10'; standColor = '#111118';
    }

    const skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.65);
    skyGrad.addColorStop(0, skyTop);
    skyGrad.addColorStop(1, skyBot);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H * 0.65);

    /* Stands */
    ctx.fillStyle = standColor;
    ctx.fillRect(0, H * 0.10, W, H * 0.40);

    /* Ground */
    const groundGrad = ctx.createLinearGradient(0, H * 0.55, 0, H);
    groundGrad.addColorStop(0, groundColor);
    groundGrad.addColorStop(1, '#061008');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, H * 0.55, W, H * 0.45);
  }

  /* ─── DRAW FIELD ─── */
  function drawField() {
    const theme = document.documentElement.getAttribute('data-theme') || 'dark';
    const isDark = theme === 'dark' || theme === 'slate' || theme === 'forest';

    /* Infield dirt circle */
    ctx.beginPath();
    ctx.ellipse(W * 0.55, H * 0.70, W * 0.35, H * 0.18, 0, 0, Math.PI * 2);
    ctx.fillStyle = isDark ? 'rgba(80,50,25,0.55)' : 'rgba(140,90,40,0.45)';
    ctx.fill();

    /* Grass stripes */
    const stripeColors = isDark
      ? ['rgba(20,55,18,0.7)', 'rgba(15,42,14,0.7)']
      : ['rgba(58,100,48,0.7)', 'rgba(44,82,36,0.7)'];
    const numStripes = 7;
    for (let i = 0; i < numStripes; i++) {
      ctx.fillStyle = stripeColors[i % 2];
      ctx.fillRect(i * (W / numStripes), H * 0.55, W / numStripes, H * 0.45);
    }

    /* Foul lines */
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(plateX, plateY);
    ctx.lineTo(W * 0.05, H * 0.20);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(plateX, plateY);
    ctx.lineTo(W * 0.95, H * 0.22);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  /* ─── DRAW CROWD ─── */
  function buildCrowd() {
    crowd = [];
    const rows = 3;
    for (let row = 0; row < rows; row++) {
      const count = 18 + row * 4;
      for (let i = 0; i < count; i++) {
        crowd.push({
          x: (i / count) * W * 1.05 - W * 0.025,
          y: H * (0.10 + row * 0.065),
          phase: Math.random() * Math.PI * 2,
          size: 5 + row * 1.5 + Math.random() * 3,
          color: `hsl(${Math.random() * 360}, 45%, ${35 + Math.random() * 25}%)`,
          hatColor: `hsl(${Math.random() * 360}, 60%, 25%)`,
          happy: Math.random() > 0.5,
        });
      }
    }
  }

  function drawCrowd() {
    crowd.forEach(p => {
      const sway = Math.sin(crowdAnim + p.phase) * 1.5;
      const headY = p.y + sway;

      /* Body */
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.ellipse(p.x, headY + p.size * 1.6, p.size * 0.8, p.size * 1.2, 0, 0, Math.PI * 2);
      ctx.fill();

      /* Head */
      ctx.fillStyle = '#e8c8a0';
      ctx.beginPath();
      ctx.arc(p.x, headY, p.size * 0.7, 0, Math.PI * 2);
      ctx.fill();

      /* Hat */
      ctx.fillStyle = p.hatColor;
      ctx.beginPath();
      ctx.ellipse(p.x, headY - p.size * 0.4, p.size * 0.9, p.size * 0.25, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(p.x - p.size * 0.45, headY - p.size * 1.05, p.size * 0.9, p.size * 0.65);
    });
  }

  /* ─── DRAW MOUND ─── */
  function drawMound() {
    ctx.fillStyle = 'rgba(100,65,30,0.7)';
    ctx.beginPath();
    ctx.ellipse(moundX, moundY + 10, 28, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(120,80,40,0.5)';
    ctx.beginPath();
    ctx.ellipse(moundX, moundY + 6, 20, 7, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  /* ─── DRAW PITCHER (stick figure, styled) ─── */
  function drawPitcher() {
    const px = moundX;
    const py = moundY;
    const scale = 1.0;
    const wt = pitcher.throwing ? pitcher.throwProgress : 0;

    ctx.save();
    ctx.translate(px, py - 14 * scale);

    const theme = document.documentElement.getAttribute('data-theme') || 'dark';
    const uniformColor = theme === 'dark'   ? '#e8d5b7' :
                         theme === 'light'  ? '#1a3a6a' :
                         theme === 'slate'  ? '#8899ff' :
                                              '#b5d47a';
    const skinColor = '#e8c49a';

    /* Body */
    ctx.strokeStyle = uniformColor;
    ctx.lineWidth = 3 * scale;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    /* Legs */
    const legSplay = wt * 8;
    ctx.beginPath();
    ctx.moveTo(0, 12 * scale);
    ctx.lineTo(-5 * scale + legSplay, 26 * scale);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 12 * scale);
    ctx.lineTo(5 * scale - legSplay * 0.5, 26 * scale);
    ctx.stroke();

    /* Torso */
    const leanBack = wt * -5;
    ctx.beginPath();
    ctx.moveTo(0, 12 * scale);
    ctx.lineTo(leanBack, 0);
    ctx.stroke();

    /* Throw arm */
    const armRaise = wt * Math.PI * 0.9;
    const armX = Math.cos(-Math.PI / 2 + armRaise) * 14 * scale;
    const armY = Math.sin(-Math.PI / 2 + armRaise) * 14 * scale;
    ctx.beginPath();
    ctx.moveTo(leanBack, 5 * scale);
    ctx.lineTo(leanBack + armX, 5 * scale + armY);
    ctx.strokeStyle = uniformColor;
    ctx.stroke();

    /* Glove arm */
    ctx.beginPath();
    ctx.moveTo(leanBack, 5 * scale);
    ctx.lineTo(leanBack - 12 * scale, 10 * scale);
    ctx.stroke();

    /* Head */
    ctx.beginPath();
    ctx.arc(leanBack, -8 * scale, 7 * scale, 0, Math.PI * 2);
    ctx.fillStyle = skinColor;
    ctx.fill();
    ctx.strokeStyle = uniformColor;
    ctx.lineWidth = 1.5 * scale;
    ctx.stroke();

    /* Cap */
    ctx.fillStyle = uniformColor;
    ctx.beginPath();
    ctx.ellipse(leanBack, -14 * scale, 7 * scale, 3 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(leanBack - 6 * scale, -15 * scale, 12 * scale, 5 * scale);
    /* Brim */
    ctx.beginPath();
    ctx.moveTo(leanBack - 8 * scale, -11 * scale);
    ctx.lineTo(leanBack + 10 * scale, -11 * scale);
    ctx.lineWidth = 2 * scale;
    ctx.stroke();

    ctx.restore();
  }

  /* ─── DRAW PLATE ─── */
  function drawPlate() {
    ctx.fillStyle = 'rgba(255,255,255,0.90)';
    ctx.beginPath();
    ctx.moveTo(plateX - 15, plateY + 4);
    ctx.lineTo(plateX - 15, plateY - 4);
    ctx.lineTo(plateX, plateY - 10);
    ctx.lineTo(plateX + 15, plateY - 4);
    ctx.lineTo(plateX + 15, plateY + 4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(200,200,200,0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  /* ─── DRAW BATTER (stick figure) ─── */
  function drawBatter() {
    const bx = batterX;
    const by = batterY + 12;
    const scale = 1.05;

    ctx.save();
    ctx.translate(bx, by);

    const theme = document.documentElement.getAttribute('data-theme') || 'dark';
    const uniform = theme === 'dark'   ? '#c9a96e' :
                    theme === 'light'  ? '#8b0000' :
                    theme === 'slate'  ? '#6677ee' :
                                         '#8ab048';
    const skin = '#e8c49a';

    ctx.strokeStyle = uniform;
    ctx.lineWidth = 3 * scale;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    /* Legs — stance */
    ctx.beginPath(); ctx.moveTo(0, 10 * scale); ctx.lineTo(-8 * scale, 26 * scale); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 10 * scale); ctx.lineTo(6 * scale, 26 * scale);  ctx.stroke();

    /* Torso */
    ctx.beginPath(); ctx.moveTo(0, 10 * scale); ctx.lineTo(0, -2 * scale); ctx.stroke();

    /* Arms holding bat */
    const swingProg = bat.progress;
    const batAngle  = bat.angle;

    const armLen = 12 * scale;
    const handX = Math.cos(batAngle - 0.4) * armLen;
    const handY = Math.sin(batAngle - 0.4) * armLen;

    ctx.beginPath();
    ctx.moveTo(0, 4 * scale);
    ctx.lineTo(handX, handY);
    ctx.stroke();

    /* Bat */
    const batLen = 28 * scale;
    const bx2 = handX + Math.cos(batAngle) * batLen;
    const by2 = handY + Math.sin(batAngle) * batLen;
    ctx.beginPath();
    ctx.moveTo(handX, handY);
    ctx.lineTo(bx2, by2);
    ctx.strokeStyle = '#c8a060';
    ctx.lineWidth = 5 * scale;
    ctx.stroke();
    /* Bat barrel */
    ctx.beginPath();
    ctx.arc(bx2, by2, 5 * scale, 0, Math.PI * 2);
    ctx.fillStyle = '#c8a060';
    ctx.fill();

    /* Head */
    ctx.beginPath();
    ctx.arc(0, -10 * scale, 7 * scale, 0, Math.PI * 2);
    ctx.fillStyle = skin;
    ctx.fill();
    ctx.strokeStyle = uniform;
    ctx.lineWidth = 1.5 * scale;
    ctx.stroke();

    /* Batting helmet */
    ctx.fillStyle = uniform;
    ctx.beginPath();
    ctx.arc(0, -12 * scale, 7 * scale, Math.PI, 0);
    ctx.fill();
    /* Ear flap */
    ctx.beginPath();
    ctx.arc(-6 * scale, -8 * scale, 4 * scale, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /* ─── DRAW STRIKE ZONE (ghost box) ─── */
  function drawStrikeZone() {
    if (!ball.visible) return;
    const zw = 36, zh = 48;
    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(plateX - zw / 2, plateY - zh / 2, zw, zh);
    ctx.setLineDash([]);
  }

  /* ─── DRAW BALL ─── */
  function drawBall() {
    /* Trail */
    ball.trail.forEach((pt, i) => {
      const a = (i / ball.trail.length) * 0.35;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, ball.radius * (i / ball.trail.length) * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.fill();
    });

    /* Shadow */
    ctx.beginPath();
    ctx.ellipse(ball.x, plateY + 8, ball.radius * 0.8, ball.radius * 0.3, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fill();

    /* Ball base */
    const ballGrad = ctx.createRadialGradient(
      ball.x - ball.radius * 0.3, ball.y - ball.radius * 0.3, 1,
      ball.x, ball.y, ball.radius
    );
    ballGrad.addColorStop(0, '#fffff0');
    ballGrad.addColorStop(0.7, '#f0ede0');
    ballGrad.addColorStop(1, '#d8d0c0');
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = ballGrad;
    ctx.fill();

    /* Seams */
    ctx.save();
    ctx.translate(ball.x, ball.y);
    ctx.rotate(ball.spin);
    ctx.strokeStyle = 'rgba(200,60,50,0.85)';
    ctx.lineWidth = 1.2;

    ctx.beginPath();
    ctx.arc(0, 0, ball.radius * 0.72, -0.4, 1.2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, ball.radius * 0.72, Math.PI - 0.4, Math.PI + 1.2);
    ctx.stroke();

    /* Stitch dots */
    for (let i = 0; i < 5; i++) {
      const a = -0.4 + (i / 4) * 1.6;
      ctx.beginPath();
      ctx.arc(
        Math.cos(a) * ball.radius * 0.72 + Math.cos(a + Math.PI/2) * 1.5,
        Math.sin(a) * ball.radius * 0.72 + Math.sin(a + Math.PI/2) * 1.5,
        0.8, 0, Math.PI * 2
      );
      ctx.fillStyle = 'rgba(200,60,50,0.7)';
      ctx.fill();
    }

    ctx.restore();
  }

  /* ─── DRAW TRAIL (for hit ball) ─── */
  function drawTrail() {
    if (!ball.hit || ball.trail.length < 2) return;
    ctx.save();
    for (let i = 1; i < ball.trail.length; i++) {
      const t = i / ball.trail.length;
      ctx.beginPath();
      ctx.moveTo(ball.trail[i-1].x, ball.trail[i-1].y);
      ctx.lineTo(ball.trail[i].x,   ball.trail[i].y);
      ctx.strokeStyle = `rgba(255,230,120,${t * 0.55})`;
      ctx.lineWidth   = t * 3;
      ctx.stroke();
    }
    ctx.restore();
  }

  /* ─── DRAW PARTICLES ─── */
  function drawParticles() {
    particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.restore();
    });
  }

  /* ─── DRAW RESULT TEXT ─── */
  function drawResultText() {
    ctx.save();
    ctx.globalAlpha = resultAlpha;

    /* Glow */
    ctx.shadowColor  = resultColor;
    ctx.shadowBlur   = 30;

    /* Main text */
    const fontSize = Math.min(W * 0.085, 52);
    ctx.font = `900 ${fontSize}px 'Cormorant Garamond', Georgia, serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    /* Slight upward float */
    const floatY = H * 0.38 - (1 - resultAlpha) * 25;

    ctx.fillStyle = '#111';
    ctx.fillText(resultText, W / 2 + 2, floatY + 2);
    ctx.fillStyle = resultColor;
    ctx.fillText(resultText, W / 2, floatY);

    ctx.restore();
  }

  /* ═══ PARTICLES ═══ */
  function spawnHitParticles(x, y, color) {
    const count = 28;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        size: 2 + Math.random() * 4,
        color: i % 3 === 0 ? '#ffd700' : color,
        life: 60 + Math.random() * 40,
        maxLife: 100,
      });
    }
    /* Stars */
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 6;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 5,
        size: 3 + Math.random() * 3,
        color: '#fff',
        life: 40 + Math.random() * 30,
        maxLife: 70,
      });
    }
  }

  function spawnStrikeParticles() {
    for (let i = 0; i < 12; i++) {
      particles.push({
        x: batterX + (Math.random() - 0.5) * 40,
        y: batterY + (Math.random() - 0.5) * 30,
        vx: (Math.random() - 0.5) * 3,
        vy: -Math.random() * 4,
        size: 2 + Math.random() * 3,
        color: 'rgba(255,80,80,0.8)',
        life: 40,
        maxLife: 40,
      });
    }
  }

  /* ═══ RESULT TEXT DISPLAY ═══ */
  function showResultText(text, color) {
    resultText  = text;
    resultColor = color;
    resultAlpha = 1;
    resultTimer = 1500;
    showResult  = true;
  }

  /* ═══ HUD UPDATES ═══ */
  function updateHUD() {
    const scoreEl = document.getElementById('bb-score');
    const inningEl = document.getElementById('bb-inning');
    const bestEl = document.getElementById('bb-best');
    const comboEl = document.getElementById('bb-combo');
    const comboGroup = document.getElementById('bb-combo-group');

    if (scoreEl)  scoreEl.textContent  = score;
    if (inningEl) inningEl.textContent = inning;
    if (bestEl)   bestEl.textContent   = Math.max(highScore, score);
    if (comboEl) {
      comboEl.textContent = `x${combo}`;
      if (combo > 0) {
        comboGroup.classList.add('active');
      } else {
        comboGroup.classList.remove('active');
      }
    }

    /* Dots */
    updateDots('bb-strikes', strikes, 2);
    updateDots('bb-outs', outs, 3);
  }

  function updateDots(id, filled, total) {
    const el = document.getElementById(id);
    if (!el) return;
    const dots = el.querySelectorAll('.bb-dot');
    dots.forEach((d, i) => {
      d.classList.toggle('filled', i < filled);
    });
  }

  function showPitchHint(show) {
    const el = document.getElementById('bb-pitch-label');
    if (el) el.style.opacity = show ? '1' : '0';
  }

  function showSwingHint(show) {
    const el = document.getElementById('bb-swing-hint');
    if (el) el.style.opacity = show ? '1' : '0';
  }

  /* ═══ PERSISTENCE ═══ */
  function loadHighScore() {
    try {
      const v = localStorage.getItem('msm-baseball-best');
      if (v) highScore = parseInt(v, 10) || 0;
    } catch(e) {}
    const el = document.getElementById('bb-best');
    if (el) el.textContent = highScore;
  }

  function saveHighScore() {
    try { localStorage.setItem('msm-baseball-best', highScore); } catch(e) {}
  }

  /* ═══ PUBLIC API ═══ */
  window.MSMBaseball = { init };

})();
