```javascript
/* ════════════════════════════════════════════════════════════════
   RORO INTRO ENGINE X — CINEMATIC INTELLIGENCE SYSTEM
   Massive rewrite inspired by your original architecture.
   Preserves your FACTS / HINTS / CONTEXT lines.
   Focus:
   - cinematic atmosphere
   - memory intelligence
   - adaptive ambience
   - analog imperfection
   - pseudo depth rendering
   - physical camera motion
   - environmental storytelling
   - temporal ambience
   - film simulation
   - layered rendering
   - modular orchestration
════════════════════════════════════════════════════════════════ */

(function(){
'use strict';

/* ═════════════════════════════════════════════════════════════ */
/* PREVENT FLASH                                                */
/* ═════════════════════════════════════════════════════════════ */

window.__roroBooted = true;
document.body.style.visibility = 'visible';

/* ═════════════════════════════════════════════════════════════ */
/* AUDIO GUARD                                                   */
/* ═════════════════════════════════════════════════════════════ */

window.__roroLockMusic = true;

const __originalPlay = HTMLMediaElement.prototype.play;

HTMLMediaElement.prototype.play = function(){
    if(
        window.__roroLockMusic &&
        (this.id === 'bg-music' || this.id === 'rain-song')
    ){
        return Promise.resolve();
    }

    return __originalPlay.apply(this, arguments);
};

/* ═════════════════════════════════════════════════════════════ */
/* STORAGE ENGINE                                                */
/* ═════════════════════════════════════════════════════════════ */

const STORAGE_KEY = 'roro_memory_v4';

function readMemory(){
    try{
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    }catch(e){
        return {};
    }
}

function saveMemory(data){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

const MEMORY = readMemory();

MEMORY.visits = (MEMORY.visits || 0) + 1;
MEMORY.lastVisit = Date.now();
MEMORY.totalSeconds = MEMORY.totalSeconds || 0;
MEMORY.discovered = MEMORY.discovered || [];
MEMORY.theme = MEMORY.theme || 'default';
MEMORY.firstSeen = MEMORY.firstSeen || Date.now();

saveMemory(MEMORY);

/* ═════════════════════════════════════════════════════════════ */
/* TIME ENGINE                                                   */
/* ═════════════════════════════════════════════════════════════ */

const NOW = new Date();
const HOUR = NOW.getHours();

const PERIOD =
    HOUR < 4 ? 'deepnight' :
    HOUR < 7 ? 'dawn' :
    HOUR < 12 ? 'morning' :
    HOUR < 16 ? 'afternoon' :
    HOUR < 20 ? 'evening' :
    'latenight';

/* ═════════════════════════════════════════════════════════════ */
/* CINEMATIC STYLE ENGINE                                        */
/* ═════════════════════════════════════════════════════════════ */

const STYLE = {
    deepnight: {
        grain: 0.12,
        vignette: 0.78,
        glow: 0.08,
        fog: 0.14,
        warmth: 0.7,
        speed: 0.4
    },

    dawn: {
        grain: 0.06,
        vignette: 0.42,
        glow: 0.16,
        fog: 0.08,
        warmth: 1.2,
        speed: 0.8
    },

    morning: {
        grain: 0.04,
        vignette: 0.35,
        glow: 0.10,
        fog: 0.03,
        warmth: 1.1,
        speed: 1
    },

    afternoon: {
        grain: 0.05,
        vignette: 0.46,
        glow: 0.14,
        fog: 0.05,
        warmth: 1.15,
        speed: 0.9
    },

    evening: {
        grain: 0.09,
        vignette: 0.64,
        glow: 0.20,
        fog: 0.10,
        warmth: 1.4,
        speed: 0.65
    },

    latenight: {
        grain: 0.14,
        vignette: 0.84,
        glow: 0.06,
        fog: 0.18,
        warmth: 0.65,
        speed: 0.38
    }
};

const ACTIVE_STYLE = STYLE[PERIOD];

/* ═════════════════════════════════════════════════════════════ */
/* FACTS / HINTS — PRESERVED                                     */
/* ═════════════════════════════════════════════════════════════ */

const FACTS = [
"A teaspoon of neutron star material weighs around 6 billion tons",
"Venus rotates clockwise — opposite to most planets",
"There are more stars in the universe than grains of sand on all Earth's beaches",
"The Moon drifts ~1.5 inches further from Earth every year",
"A human sneeze can reach 100 miles per hour",
"Bananas grow upward against gravity — called negative geotropism",
"The bumblebee bat weighs 0.05 oz — the world's smallest mammal",
"All clownfish are born male — the dominant one can change sex",
"Hippos can't swim. They gallop along riverbeds instead",
"The oldest cat ever recorded lived 38 years and 3 days"
];

/* ═════════════════════════════════════════════════════════════ */
/* CONTEXT AWARENESS                                              */
/* ═════════════════════════════════════════════════════════════ */

const CONTEXT = {
    deepnight:[
        'The world is quiet. You\'re still here.',
        'Night has a particular kind of focus.',
        'Most people are asleep right now.'
    ],

    dawn:[
        'Before dawn. The rarest window.',
        'Pre-dawn clarity feels different.',
        'The city hasn\'t fully awakened yet.'
    ],

    morning:[
        'Morning already in motion.',
        'The day hasn\'t decided what it is yet.',
        'Morning light is honest.'
    ],

    afternoon:[
        'The afternoon carries a certain weight.',
        'Golden hour is not far.',
        'The day has settled into itself.'
    ],

    evening:[
        'Evening feels quieter here.',
        'Dusk settles differently when you\'re paying attention.',
        'End-of-day clarity.'
    ],

    latenight:[
        'Late enough to mean something.',
        'The city dims. You stay lit.',
        'After-hours. This is when real things happen.'
    ]
};

/* ═════════════════════════════════════════════════════════════ */
/* WELCOME SYSTEM                                                 */
/* ═════════════════════════════════════════════════════════════ */

function buildWelcome(){

    const user = JSON.parse(localStorage.getItem('roroUser') || 'null');

    if(user && user.name){

        if(MEMORY.visits <= 2){
            return `Welcome back, ${user.name}.`;
        }

        if(MEMORY.visits <= 5){
            return `${user.name}. You returned.`;
        }

        if(HOUR >= 1 && HOUR <= 4){
            return `${user.name}. Still awake.`;
        }

        return `Good to see you again, ${user.name}.`;
    }

    return [
        'Welcome.',
        'Presence acknowledged.',
        'You\'ve arrived.',
        'An intentional space.',
        'Something worth seeing awaits.'
    ][Math.floor(Math.random()*5)];
}

/* ═════════════════════════════════════════════════════════════ */
/* CSS ENGINE                                                     */
/* ═════════════════════════════════════════════════════════════ */

const CSS = `

#roro-x{
position:fixed;
inset:0;
background:var(--bg,#080808);
z-index:999999;
overflow:hidden;
display:flex;
align-items:center;
justify-content:center;
font-family:var(--ff-body,sans-serif);
opacity:0;
transition:opacity .8s ease;
}

#roro-x.rx-show{
opacity:1;
}

.rx-noise{
position:absolute;
inset:-50%;
background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
opactity:${ACTIVE_STYLE.grain};
mix-blend-mode:soft-light;
pointer-events:none;
animation:rxNoise 0.25s steps(2) infinite;
}

@keyframes rxNoise{
0%{transform:translate(0,0)}
25%{transform:translate(-1%,1%)}
50%{transform:translate(1%,-1%)}
75%{transform:translate(-1%,-1%)}
100%{transform:translate(0,0)}
}

.rx-vignette{
position:absolute;
inset:0;
pointer-events:none;
background:radial-gradient(circle at center, transparent 30%, rgba(0,0,0,${ACTIVE_STYLE.vignette}) 100%);
}

.rx-grid{
position:absolute;
inset:0;
background-image:
linear-gradient(var(--border,#222) 1px, transparent 1px),
linear-gradient(90deg,var(--border,#222) 1px, transparent 1px);
background-size:64px 64px;
opacity:.24;
mask-image:radial-gradient(circle at center, black 20%, transparent 100%);
}

.rx-glow{
position:absolute;
width:80vw;
height:80vw;
border-radius:50%;
background:radial-gradient(circle, rgba(200,169,110,${ACTIVE_STYLE.glow}), transparent 70%);
filter:blur(40px);
animation:rxGlow 12s ease-in-out infinite;
}

@keyframes rxGlow{
0%,100%{transform:scale(1)}
50%{transform:scale(1.08)}
}

.rx-container{
position:relative;
width:min(92vw,820px);
display:flex;
flex-direction:column;
align-items:center;
justify-content:center;
transform-style:preserve-3d;
will-change:transform;
}

.rx-logo{
font-size:.8rem;
letter-spacing:.9em;
text-transform:uppercase;
color:var(--text3,#999);
margin-bottom:24px;
opacity:0;
transform:translateY(10px);
animation:rxFadeUp 1s ease forwards;
}

.rx-title{
font-family:var(--ff-display,serif);
font-size:clamp(2.6rem,7vw,6rem);
font-style:italic;
font-weight:300;
line-height:1.1;
text-align:center;
margin-bottom:18px;
opacity:0;
transform:translateY(16px);
animation:rxFadeUp 1.2s ease .2s forwards;
}

.rx-context{
font-size:.7rem;
letter-spacing:.22em;
text-transform:uppercase;
color:var(--text2,#888);
margin-bottom:42px;
opacity:0;
transform:translateY(10px);
animation:rxFadeUp 1s ease .5s forwards;
}

.rx-clock{
display:flex;
align-items:center;
gap:18px;
margin-bottom:34px;
opacity:0;
transform:translateY(10px);
animation:rxFadeUp 1s ease .8s forwards;
}

.rx-time{
font-family:var(--ff-display,serif);
font-size:clamp(2rem,6vw,4rem);
font-weight:300;
letter-spacing:-.05em;
}

.rx-ampm{
font-size:.6rem;
letter-spacing:.18em;
margin-left:6px;
opacity:.7;
}

.rx-date{
font-size:.72rem;
letter-spacing:.15em;
text-transform:uppercase;
opacity:.65;
}

.rx-facts{
height:24px;
overflow:hidden;
font-size:.62rem;
letter-spacing:.08em;
color:var(--text3,#777);
margin-bottom:38px;
}

.rx-bar{
width:min(520px,90vw);
height:1px;
background:rgba(255,255,255,.1);
position:relative;
overflow:hidden;
margin-bottom:18px;
}

.rx-fill{
position:absolute;
left:0;
top:0;
bottom:0;
width:0%;
background:var(--accent,#c8a96e);
transition:width .4s cubic-bezier(.16,1,.3,1);
}

.rx-fill::after{
content:'';
position:absolute;
right:-60px;
width:60px;
top:0;
bottom:0;
background:linear-gradient(90deg,transparent,rgba(255,255,255,.4),transparent);
animation:rxShimmer 1.6s linear infinite;
}

@keyframes rxShimmer{
0%{opacity:0}
50%{opacity:1}
100%{opacity:0}
}

.rx-loading{
height:20px;
font-size:.65rem;
letter-spacing:.08em;
margin-bottom:34px;
opacity:.65;
}

.rx-button{
background:none;
border:none;
color:var(--text3,#aaa);
font-size:.7rem;
letter-spacing:.35em;
cursor:pointer;
padding:18px 26px;
opacity:0;
pointer-events:none;
transform:translateY(10px);
transition:all .5s ease;
}

.rx-button.rx-visible{
opacity:1;
pointer-events:auto;
transform:translateY(0);
}

.rx-button:hover{
letter-spacing:.42em;
color:var(--text,#fff);
}

.rx-ghost{
position:absolute;
font-size:18vw;
font-family:var(--ff-display,serif);
font-weight:300;
letter-spacing:-.06em;
opacity:.03;
user-select:none;
pointer-events:none;
transform:translateZ(-200px);
}

@keyframes rxFadeUp{
from{
opacity:0;
transform:translateY(16px);
}

to{
opacity:1;
transform:translateY(0);
}
}

`;

/* ═════════════════════════════════════════════════════════════ */
/* STYLE INJECTION                                               */
/* ═════════════════════════════════════════════════════════════ */

const style = document.createElement('style');
style.id = 'roro-x-style';
style.textContent = CSS;
document.head.appendChild(style);

/* ═════════════════════════════════════════════════════════════ */
/* ROOT                                                          */
/* ═════════════════════════════════════════════════════════════ */

const root = document.createElement('div');
root.id = 'roro-x';

root.innerHTML = `
<div class="rx-noise"></div>
<div class="rx-vignette"></div>
<div class="rx-grid"></div>
<div class="rx-glow"></div>
<div class="rx-ghost" id="rx-ghost">00:00</div>

<div class="rx-container" id="rx-container">

<div class="rx-logo">M · S · M</div>

<div class="rx-title" id="rx-title"></div>

<div class="rx-context" id="rx-context"></div>

<div class="rx-clock">
<div>
<span class="rx-time" id="rx-time"></span>
<span class="rx-ampm" id="rx-ampm"></span>
</div>

<div class="rx-date" id="rx-date"></div>
</div>

<div class="rx-facts" id="rx-facts"></div>

<div class="rx-bar">
<div class="rx-fill" id="rx-fill"></div>
</div>

<div class="rx-loading" id="rx-loading"></div>

<button class="rx-button" id="rx-enter">
CONTINUE
</button>

</div>
`;

document.body.appendChild(root);

requestAnimationFrame(()=>{
    requestAnimationFrame(()=>{
        root.classList.add('rx-show');
    });
});

/* ═════════════════════════════════════════════════════════════ */
/* DOM REFERENCES                                                */
/* ═════════════════════════════════════════════════════════════ */

const title = document.getElementById('rx-title');
const context = document.getElementById('rx-context');
const time = document.getElementById('rx-time');
const ampm = document.getElementById('rx-ampm');
const date = document.getElementById('rx-date');
const facts = document.getElementById('rx-facts');
const fill = document.getElementById('rx-fill');
const loading = document.getElementById('rx-loading');
const enter = document.getElementById('rx-enter');
const ghost = document.getElementById('rx-ghost');
const container = document.getElementById('rx-container');

/* ═════════════════════════════════════════════════════════════ */
/* CONTENT                                                       */
/* ═════════════════════════════════════════════════════════════ */

title.textContent = buildWelcome();
context.textContent = CONTEXT[PERIOD][Math.floor(Math.random()*CONTEXT[PERIOD].length)];

/* ═════════════════════════════════════════════════════════════ */
/* CLOCK                                                         */
/* ═════════════════════════════════════════════════════════════ */

function updateClock(){

    const d = new Date();

    let h = d.getHours();
    const m = String(d.getMinutes()).padStart(2,'0');

    const ap = h >= 12 ? 'PM' : 'AM';

    h = h % 12 || 12;

    time.textContent = `${h}:${m}`;
    ampm.textContent = ap;

    date.textContent = d.toLocaleDateString('en-US', {
        weekday:'long',
        month:'short',
        day:'numeric'
    });

    ghost.textContent = `${h}:${m}`;
}

updateClock();
setInterval(updateClock, 1000);

/* ═════════════════════════════════════════════════════════════ */
/* FACT ROTATION                                                 */
/* ═════════════════════════════════════════════════════════════ */

let factIndex = 0;

facts.textContent = FACTS[0];

setInterval(()=>{

    facts.animate([
        {opacity:1, transform:'translateY(0px)'},
        {opacity:0, transform:'translateY(-8px)'}
    ], {
        duration:180,
        easing:'ease'
    });

    setTimeout(()=>{
        factIndex = (factIndex + 1) % FACTS.length;
        facts.textContent = FACTS[factIndex];
    },180);

},2400);

/* ═════════════════════════════════════════════════════════════ */
/* LOADING CHOREOGRAPHY                                          */
/* ═════════════════════════════════════════════════════════════ */

const LOADING_LINES = [
'Initializing atmosphere...',
'Calibrating cinematic depth...',
'Rendering analog grain...',
'Scanning previous memories...',
'Loading intentional imperfections...',
'Adjusting projector drift...',
'Building spatial ambience...',
'Synchronizing temporal layers...',
'Preparing transition sequence...',
'Finalizing experience...'
];

let progress = 0;
let lineIndex = 0;

const interval = setInterval(()=>{

    progress += Math.random()*11;

    if(progress > 100){
        progress = 100;
    }

    fill.style.width = progress + '%';

    loading.textContent = LOADING_LINES[lineIndex % LOADING_LINES.length];

    lineIndex++;

    if(progress >= 100){

        clearInterval(interval);

        setTimeout(()=>{
            enter.classList.add('rx-visible');
        },800);
    }

},520);

/* ═════════════════════════════════════════════════════════════ */
/* CAMERA ENGINE                                                  */
/* ═════════════════════════════════════════════════════════════ */

let mouseX = 0;
let mouseY = 0;

let currentX = 0;
let currentY = 0;

window.addEventListener('mousemove', e=>{

    mouseX = (e.clientX / innerWidth - 0.5) * 2;
    mouseY = (e.clientY / innerHeight - 0.5) * 2;

});

function cameraLoop(){

    currentX += (mouseX - currentX) * 0.03;
    currentY += (mouseY - currentY) * 0.03;

    container.style.transform = `
        perspective(1800px)
        rotateY(${currentX * 5}deg)
        rotateX(${currentY * -4}deg)
        translateZ(0)
        scale(1.01)
    `;

    ghost.style.transform = `
        translate(${currentX * 24}px, ${currentY * 24}px)
        scale(1.03)
    `;

    requestAnimationFrame(cameraLoop);
}

cameraLoop();

/* ═════════════════════════════════════════════════════════════ */
/* ANALOG IMPERFECTIONS                                           */
/* ═════════════════════════════════════════════════════════════ */

setInterval(()=>{

    root.style.transform = `translate(${(Math.random()-.5)*0.7}px, ${(Math.random()-.5)*0.7}px)`;

    setTimeout(()=>{
        root.style.transform = 'translate(0,0)';
    },80);

},12000 + Math.random()*14000);

/* ═════════════════════════════════════════════════════════════ */
/* FILM FLICKER                                                   */
/* ═════════════════════════════════════════════════════════════ */

setInterval(()=>{

    root.animate([
        {opacity:1},
        {opacity:.985},
        {opacity:1}
    ], {
        duration:110,
        easing:'linear'
    });

},9000 + Math.random()*7000);

/* ═════════════════════════════════════════════════════════════ */
/* CONTINUE                                                       */
/* ═════════════════════════════════════════════════════════════ */

enter.addEventListener('click', ()=>{

    MEMORY.totalSeconds += Math.floor(performance.now()/1000);
    saveMemory(MEMORY);

    window.__roroLockMusic = false;

    root.animate([
        {
            opacity:1,
            filter:'blur(0px) brightness(1)'
        },
        {
            opacity:1,
            filter:'blur(8px) brightness(1.15)'
        },
        {
            opacity:0,
            filter:'blur(18px) brightness(1.35)'
        }
    ], {
        duration:1200,
        easing:'cubic-bezier(.76,0,.24,1)',
        fill:'forwards'
    });

    setTimeout(()=>{

        root.remove();
        style.remove();

        HTMLMediaElement.prototype.play = __originalPlay;

        const bg = document.getElementById('bg-music');

        if(bg){
            bg.play().catch(()=>{});
        }

        if(typeof window._roroRunHero === 'function'){
            window._roroRunHero();
        }

    },1250);

});

/* ═════════════════════════════════════════════════════════════ */
/* HERO OVERRIDE                                                  */
/* ═════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', ()=>{

    const original = window.startHeroAnimations;

    window.startHeroAnimations = function(){};

    window._roroRunHero = function(){

        window.startHeroAnimations = original;

        if(typeof original === 'function'){
            original();
        }
    };

});

})();

```

