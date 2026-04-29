/**
 * Idle Bot Brain
 * Handles: Stumbling entry, nervous looking, 20s knocking loop, and fleeing.
 */
const bot = document.getElementById('idle-bot');
let isBotPresent = false;
let knockInterval;
let idleTimeout;

function initBot() {
  // Start the bot after 5 seconds of total inactivity
  resetIdleTimer();
  
  // Listen for ANY movement to scare him away
  window.addEventListener('mousemove', scareBot);
  window.addEventListener('scroll', scareBot);
  window.addEventListener('click', scareBot);
  window.addEventListener('keydown', scareBot);
}

function spawnBot() {
  if (isBotPresent) return;
  isBotPresent = true;
  
  bot.classList.remove('bot-fleeing');
  bot.classList.add('bot-appearing');
  
  // After stumbling in, look nervous
  setTimeout(() => {
    bot.classList.add('is-nervous');
    
    // Start the knocking cycle
    performKnock();
    knockInterval = setInterval(performKnock, 20000); // Repeat every 20s
  }, 1200);
}

function performKnock() {
  if (!isBotPresent) return;
  bot.classList.remove('is-knocking');
  void bot.offsetWidth; // Trigger reflow
  bot.classList.add('is-knocking');
}

function scareBot() {
  if (!isBotPresent) {
    resetIdleTimer();
    return;
  }
  
  // Clear intervals so he stops knocking
  clearInterval(knockInterval);
  isBotPresent = false;
  
  // Animation: Flee
  bot.classList.remove('is-nervous', 'is-knocking');
  bot.classList.add('bot-fleeing');
  
  // Reset everything after he's gone
  setTimeout(() => {
    bot.classList.remove('bot-appearing');
    resetIdleTimer();
  }, 1000);
}

function resetIdleTimer() {
  clearTimeout(idleTimeout);
  // Bot spawns after 15 seconds of no activity
  idleTimeout = setTimeout(spawnBot, 15000); 
}

// Start the observer
document.addEventListener('DOMContentLoaded', initBot);
