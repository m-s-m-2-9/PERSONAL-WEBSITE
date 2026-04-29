(function () {
  'use strict';

  const IDLE_TIME = 15000; // 15 seconds for testing. Change to 600000 for 10 mins.
  let idleTimer, knockInterval, botActive = false;

  // 1. INJECT BOT STYLES (Self-contained)
  const style = document.createElement('style');
  style.textContent = `
    #astro-idle-bot {
      position: fixed;
      bottom: -300px;
      left: 50%;
      transform: translateX(-50%);
      width: 180px;
      height: 220px;
      z-index: 999999;
      pointer-events: none;
      transition: bottom 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .bot-shell {
      width: 140px;
      height: 160px;
      background: var(--accent, #ffffff);
      border: 4px solid var(--text, #000);
      border-radius: 50px 50px 40px 40px;
      position: relative;
      box-shadow: 0 20px 50px rgba(0,0,0,0.3);
      margin: 0 auto;
    }

    /* Astro Visor */
    .bot-visor {
      width: 80%;
      height: 45%;
      background: #0a0a0a;
      margin: 20px auto;
      border-radius: 20px;
      display: flex;
      justify-content: space-around;
      align-items: center;
      padding: 0 10px;
      border: 1px solid #333;
    }

    .bot-eye {
      width: 18px;
      height: 18px;
      background: #00d2ff;
      border-radius: 50%;
      box-shadow: 0 0 15px #00d2ff;
      transition: transform 0.2s ease;
    }

    /* Hand for Knocking (Enlarges significantly) */
    .bot-hand-knock {
      position: absolute;
      top: 20%;
      right: -10px;
      width: 35px;
      height: 35px;
      background: var(--accent, #fff);
      border: 3px solid var(--text, #000);
      border-radius: 50%;
      opacity: 0;
      transform: scale(0);
    }

    /* ANIMATIONS */
    @keyframes stumbleIn {
      0% { transform: translate(-50%, 300px) rotate(-40deg); }
      60% { transform: translate(-50%, -20px) rotate(15deg); }
      100% { transform: translate(-50%, 0) rotate(0deg); }
    }

    @keyframes realisticKnock {
      0% { transform: scale(0) translate(0,0); opacity: 0; }
      20% { transform: scale(4) translate(-15px, -15px); opacity: 1; }
      30% { transform: scale(4) translate(5px, 5px); } 
      45% { transform: scale(4) translate(0, 0); }
      100% { transform: scale(0) translate(0,0); opacity: 0; }
    }

    @keyframes runningAway {
      0% { transform: translateX(-50%) scale(1); }
      100% { transform: translateX(150vw) scale(0.5) rotate(20deg); }
    }

    .animate-stumble { animation: stumbleIn 1.2s forwards; }
    .animate-knock { animation: realisticKnock 0.8s ease-out; }
    .animate-flee { animation: runningAway 0.8s ease-in forwards; }
  `;
  document.head.appendChild(style);

  // 2. CREATE BOT DOM
  function createBot() {
    const container = document.createElement('div');
    container.id = 'astro-idle-bot';
    container.innerHTML = `
      <div class="bot-shell">
        <div class="bot-hand-knock"></div>
        <div class="bot-visor">
          <div class="bot-eye"></div>
          <div class="bot-eye"></div>
        </div>
      </div>
    `;
    document.body.appendChild(container);
    return container;
  }

  const bot = createBot();
  const hand = bot.querySelector('.bot-hand-knock');
  const eyes = bot.querySelectorAll('.bot-eye');

  // 3. LOGIC
  function startBotSequence() {
    if (botActive) return;
    botActive = true;

    // Enter & Stumble
    bot.style.display = 'block';
    bot.style.bottom = '50px';
    bot.classList.add('animate-stumble');

    setTimeout(() => {
      // Look Nervous
      nervousGlance();
      
      // Start Knocking Loop
      performKnock();
      knockInterval = setInterval(performKnock, 20000);
    }, 1300);
  }

  function performKnock() {
    if (!botActive) return;
    hand.classList.remove('animate-knock');
    void hand.offsetWidth; // Trigger reflow
    hand.classList.add('animate-knock');
    
    // Slight zoom on the whole bot during knock
    bot.style.transform = 'translateX(-50%) scale(1.1)';
    setTimeout(() => bot.style.transform = 'translateX(-50%) scale(1)', 300);
  }

  function nervousGlance() {
    if (!botActive) return;
    eyes.forEach(eye => eye.style.transform = 'translateX(-8px)');
    setTimeout(() => {
      eyes.forEach(eye => eye.style.transform = 'translateX(5px)');
      setTimeout(() => {
        eyes.forEach(eye => eye.style.transform = 'translateX(0)');
      }, 500);
    }, 1000);
  }

  function scareAway() {
    if (!botActive) {
      resetTimer();
      return;
    }
    
    clearInterval(knockInterval);
    botActive = false;
    
    bot.classList.remove('animate-stumble');
    bot.classList.add('animate-flee');

    setTimeout(() => {
      bot.style.bottom = '-300px';
      bot.classList.remove('animate-flee');
      resetTimer();
    }, 800);
  }

  function resetTimer() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(startBotSequence, IDLE_TIME);
  }

  // 4. EVENT LISTENERS
  ['mousemove', 'scroll', 'click', 'keydown'].forEach(evt => {
    window.addEventListener(evt, scareAway);
  });

  resetTimer();
})();
