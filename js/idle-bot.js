const bot = document.getElementById('idle-bot');
let isBotPresent = false;
let knockInterval;
let idleTimeout;

function initBot() {
  resetIdleTimer();
  // If user moves, he runs away
  window.addEventListener('mousemove', scareBot);
  window.addEventListener('click', scareBot);
}

function spawnBot() {
  if (isBotPresent) return;
  isBotPresent = true;
  bot.classList.remove('bot-fleeing');
  bot.classList.add('bot-appearing');
  
  setTimeout(() => {
    bot.classList.add('is-nervous');
    performKnock();
    knockInterval = setInterval(performKnock, 20000); // Repeat every 20s
  }, 1200);
}

function performKnock() {
  if (!isBotPresent) return;
  bot.classList.remove('is-knocking');
  void bot.offsetWidth; // Reset animation
  bot.classList.add('is-knocking');
}

function scareBot() {
  if (!isBotPresent) {
    resetIdleTimer();
    return;
  }
  clearInterval(knockInterval);
  isBotPresent = false;
  bot.classList.remove('is-nervous', 'is-knocking');
  bot.classList.add('bot-fleeing');
  setTimeout(() => {
    bot.classList.remove('bot-appearing');
    resetIdleTimer();
  }, 1000);
}

function resetIdleTimer() {
  clearTimeout(idleTimeout);
  idleTimeout = setTimeout(spawnBot, 15000); 
}

document.addEventListener('DOMContentLoaded', initBot);
