/* ═══════════════════════════════════════════════════════════
   ASTRO-BOT IDLE SCREENSAVER (PRO VERSION)
   - Larger Scale (Astro Bot Proportions)
   - Dynamic LED Eyes (Astro Style)
   - Premium White/Gold/Blue Palette
   - Physics-based stumbling animation
═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const IDLE_DELAY = 1 * 60 * 1000; // 1 Minute for testing (Change to 10 * 60 * 1000 for 10 mins)
  let idleTimer   = null;
  let robotActive = false;

  /* ─────────────────────────────────────────────────────
      INJECT PREMIUM ASTRO CSS
  ───────────────────────────────────────────────────── */
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    #astro-bot {
      position: fixed;
      bottom: 20px;
      z-index: 100000;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 140px; /* Increased size */
      filter: drop-shadow(0 10px 20px rgba(0,0,0,0.5));
    }

    /* Astro Bot Body Parts */
    .astro-head {
      width: 100px; height: 85px;
      background: #ffffff;
      border-radius: 40px 40px 30px 30px;
      position: relative;
      border: 2px solid #e0e0e0;
      display: flex; align-items: center; justify-content: center;
      z-index: 2;
    }

    .astro-visor {
      width: 85%; height: 60%;
      background: #050505;
      border-radius: 20px;
      position: relative;
      overflow: hidden;
      display: flex; justify-content: space-around; align-items: center;
      padding: 0 10px;
      border: 1px solid #333;
    }

    /* THE EYES (Astro Style LED) */
    .astro-eye {
      width: 22px; height: 22px;
      background: #00d2ff;
      border-radius: 50%;
      box-shadow: 0 0 15px #00d2ff, 0 0 30px rgba(0,210,255,0.6);
      transition: all 0.2s ease;
      position: relative;
    }

    /* Body & Limbs */
    .astro-body {
      width: 70px; height: 75px;
      background: #ffffff;
      border-radius: 25px;
      margin-top: -10px;
      border: 2px solid #e0e0e0;
      position: relative;
      display: flex; justify-content: center;
    }

    .astro-chest-core {
      width: 25px; height: 25px;
      background: #00d2ff;
      border-radius: 50%;
      margin-top: 15px;
      box-shadow: 0 0 10px #00d2ff;
      animation: corePulse 2s infinite;
    }

    .astro-arm {
      width: 18px; height: 45px;
      background: #ffffff;
      border: 2px solid #e0e0e0;
      border-radius: 10px;
      position: absolute;
      top: 10px;
      transform-origin: top center;
    }
    .arm-l { left: -22px; }
    .arm-r { right: -22px; }

    .astro-leg {
      width: 22px; height: 30px;
      background: #ffffff;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      position: absolute;
      bottom: -20px;
    }
    .leg-l { left: 10px; }
    .leg-r { right: 10px; }

    /* Jetpack (Luxury Gold/Blue Detail) */
    .astro-pack {
      position: absolute;
      width: 50px; height: 40px;
      background: #0046ad;
      border-radius: 10px;
      z-index: -1;
      top: 10px;
      border: 2px solid #00d2ff;
    }

    /* ─────────────────────────────────────────────────────
        ANIMATION STATES
    ───────────────────────────────────────────────────── */
    
    @keyframes corePulse {
      0%, 100% { opacity: 0.5; transform: scale(0.9); }
      50% { opacity: 1; transform: scale(1.1); }
    }

    .state-look-right .astro-eye { transform: translateX(8px); }
    .state-look-left .astro-eye { transform: translateX(-8px); }
    .state-wide-eyes .astro-eye { transform: scale(1.3); height: 25px; }
    .state-squint .astro-eye { height: 4px; border-radius: 2px; }

    .state-panic .arm-l { animation: panicArm 0.1s infinite alternate; }
    .state-panic .arm-r { animation: panicArm 0.1s infinite alternate-reverse; }
    @keyframes panicArm { from { transform: rotate(-140deg); } to { transform: rotate(-180deg); } }

    .state-walking .leg-l { animation: walk 0.2s infinite alternate; }
    .state-walking .leg-r { animation: walk 0.2s infinite alternate-reverse; }
    @keyframes walk { from { transform: translateY(0); } to { transform: translateY(-10px); } }

    .state-knock .arm-r { animation: knock 0.4s 3 ease-in-out; }
    @keyframes knock {
      0%, 100% { transform: rotate(0); }
      50% { transform: rotate(-90deg) translateX(-10px); }
    }

    .state-stumble { animation: stumble 0.6s ease; }
    @keyframes stumble {
      0% { transform: rotate(0); }
      30% { transform: rotate(-20deg) translateX(-20px); }
      70% { transform: rotate(10deg); }
      100% { transform: rotate(0); }
    }
  `;
  document.head.appendChild(styleEl);

  /* ─────────────────────────────────────────────────────
      ROBOT BUILDER
  ───────────────────────────────────────────────────── */
  function buildAstro() {
    const el = document.createElement('div');
    el.id = 'astro-bot';
    el.innerHTML = `
      <div class="astro-head">
        <div class="astro-visor">
          <div class="astro-eye eye-l"></div>
          <div class="astro-eye eye-r"></div>
        </div>
      </div>
      <div class="astro-body">
        <div class="astro-pack"></div>
        <div class="astro-arm arm-l"></div>
        <div class="astro-arm arm-r"></div>
        <div class="astro-chest-core"></div>
        <div class="astro-leg leg-l"></div>
        <div class="astro-leg leg-r"></div>
      </div>
    `;
    document.body.appendChild(el);
    return el;
  }

  function playKnock() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const play = (t) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(ctx.currentTime + t); osc.stop(ctx.currentTime + t + 0.1);
      };
      [0, 0.2, 0.4].forEach(play);
    } catch (e) {}
  }

  /* ─────────────────────────────────────────────────────
      SEQUENCE LOGIC
  ───────────────────────────────────────────────────── */
  async function runSequence() {
    if (robotActive) return;
    robotActive = true;

    const bot = buildAstro();
    const W = window.innerWidth;

    // 1. Enter and Stumble
    bot.style.left = W + 'px';
    bot.style.transition = 'left 0.8s cubic-bezier(0.2, 0, 0.2, 1)';
    await new Promise(r => setTimeout(r, 100));
    bot.style.left = (W - 180) + 'px';
    bot.classList.add('state-walking');
    
    await new Promise(r => setTimeout(r, 800));
    bot.classList.remove('state-walking');
    bot.classList.add('state-stumble');
    await new Promise(r => setTimeout(r, 600));

    // 2. Nervous Glances
    bot.classList.add('state-look-right', 'state-wide-eyes');
    await new Promise(r => setTimeout(r, 800));
    bot.classList.remove('state-look-right');
    await new Promise(r => setTimeout(r, 400));
    bot.classList.add('state-look-right');
    await new Promise(r => setTimeout(r, 600));

    // 3. Walk to center
    bot.classList.remove('state-look-right', 'state-wide-eyes');
    bot.classList.add('state-walking');
    bot.style.transition = 'left 1.5s ease-in-out';
    bot.style.left = (W/2 - 70) + 'px';
    await new Promise(r => setTimeout(r, 1500));
    bot.classList.remove('state-walking');

    // 4. Knock
    await new Promise(r => setTimeout(r, 500));
    bot.classList.add('state-knock');
    playKnock();
    await new Promise(r => setTimeout(r, 1500));

    // 5. Look at user
    bot.classList.remove('state-knock');
    bot.classList.add('state-squint'); // Adorable squinting
    await new Promise(r => setTimeout(r, 1000));
    bot.classList.remove('state-squint');
    bot.classList.add('state-wide-eyes');
    await new Promise(r => setTimeout(r, 500));

    // 6. PANIC and RUN
    bot.classList.add('state-panic', 'state-walking');
    bot.style.transition = 'left 0.6s cubic-bezier(0.7, 0, 0.3, 1)';
    bot.style.left = '-200px';
    
    await new Promise(r => setTimeout(r, 800));
    bot.remove();
    robotActive = false;
  }

  /* IDLE MONITOR */
  function resetTimer() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(runSequence, IDLE_DELAY);
  }

  ['mousemove', 'scroll', 'keydown', 'click', 'touchstart'].forEach(ev => {
    document.addEventListener(ev, resetTimer, { passive: true });
  });

  resetTimer();
})();
