// script.js
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth > 800 ? 800 : window.innerWidth;
canvas.height = window.innerHeight > 600 ? 600 : window.innerHeight;

const audio = document.getElementById('music');
const highScoreSpan = document.getElementById('highScore');

// Colors - Customizable
let colors = {
    bg: '#320032',
    flash: '#960096',
    wave: '#c864c8',
    deco: '#643264',
    particle: '#ff96ff',
    fake: '#500050',
    glow: 'rgba(255, 150, 255, 0.5)'
};

// Wave class enhanced with better physics, anti-lag velocity smoothing
class Wave {
    constructor(isDual = false) {
        this.posX = 100;
        this.posY = canvas.height / 2 + (isDual ? 150 : 0);
        this.size = 20;
        this.gravity = 1;
        this.velY = 0;
        this.acc = 0.6;
        this.maxVel = 12;
        this.isMini = false;
        this.particles = [];
        this.trail = []; // For smooth trail effect
    }

    update(holding, autoMode = false, dt) {
        let direction = holding ? -1 : 1;
        if (autoMode) {
            const targetY = (currentTop + currentBottom) / 2 + (Math.sin(scrollX / 100) * 50);
            direction = (this.posY > targetY) ? -1 : 1;
        }
        this.velY += this.acc * direction * this.gravity * dt * 60; // Time-based
        this.velY = Math.max(Math.min(this.velY, this.maxVel), -this.maxVel);
        this.posY += this.velY * dt * 60;

        // Trail
        this.trail.push({x: this.posX, y: this.posY});
        if (this.trail.length > 20) this.trail.shift();

        // Particles (reduced chance for less lag)
        if (Math.random() < 0.1) {
            this.particles.push({x: this.posX, y: this.posY, life: Math.random() * 15 + 10, color: colors.particle, vx: Math.random() * 2 - 1, vy: Math.random() * 2 - 1});
        }
        this.particles = this.particles.filter(p => {
            p.x += p.vx * dt * 60;
            p.y += p.vy * dt * 60;
            p.life -= 1 * dt * 60;
            return p.life > 0;
        });
    }

    flipGravity() {
        this.gravity *= -1;
        this.velY *= -1;
        for (let i = 0; i < 15; i++) { // Fixed loop bug
            this.particles.push({x: this.posX, y: this.posY, life: 20, color: '#ffffff', vx: Math.random() * 4 - 2, vy: Math.random() * 4 - 2});
        }
    }

    setMini(mini) {
        this.isMini = mini;
        this.size = mini ? 10 : 20;
        this.acc = mini ? 0.8 : 0.6;
        this.maxVel = mini ? 15 : 12;
    }

    checkCollision(bounds, noclip) {
        if (noclip) return false;
        const halfSize = this.size / 2 * 0.9;
        return this.posY - halfSize < bounds[0] || this.posY + halfSize > bounds[1];
    }

    draw() {
        // Trail
        ctx.beginPath();
        this.trail.forEach((point, i) => {
            if (i === 0) ctx.moveTo(Math.floor(point.x), Math.floor(point.y));
            else ctx.lineTo(Math.floor(point.x), Math.floor(point.y));
        });
        ctx.strokeStyle = colors.glow;
        ctx.lineWidth = this.size / 2;
        ctx.stroke();

        // Wave triangle
        ctx.beginPath();
        ctx.moveTo(Math.floor(this.posX - this.size / 2), Math.floor(this.posY));
        ctx.lineTo(Math.floor(this.posX + this.size / 2), Math.floor(this.posY - this.size / 2 * this.gravity));
        ctx.lineTo(Math.floor(this.posX + this.size / 2), Math.floor(this.posY + this.size / 2 * this.gravity));
        ctx.closePath();
        ctx.fillStyle = colors.wave;
        ctx.fill();

        // Glow (batch shadow if possible, but selective)
        ctx.shadowColor = colors.glow;
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Particles (use rect for faster draw instead of arc)
        this.particles.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.fillRect(Math.floor(p.x - p.life / 6), Math.floor(p.y - p.life / 6), p.life / 3, p.life / 3);
        });
    }
}

// Refined level sections...
const levelSections = [
    [0, 800, 100, 500, false, false, false, false],
    [800, 1200, 120, 480, true, false, false, false],
    [1200, 1600, 150, 450, false, false, true, false],
    [1600, 2400, 180, 420, false, true, false, false],
    [2400, 2800, 160, 440, true, false, false, false],
    [2800, 3200, 140, 460, false, false, true, false],
    [3200, 3600, 120, 480, true, false, false, false],
    [3600, 4000, 100, 500, false, false, true, false],
    [4000, 4800, 80, 520, false, false, true, false],
    [4800, 5200, 60, 540, true, true, true, false],
    [5200, 5600, 50, 550, false, false, true, false],
    [5600, 6400, 100, 500, false, false, false, true],
    [6400, 6800, 120, 480, true, false, false, false],
    [6800, 7200, 140, 460, false, false, true, false],
    [7200, 8000, 50, 550, false, false, false, false],
    [8000, 8800, 80, 520, true, false, true, false],
    [8800, 9600, 100, 500, false, true, false, false],
    [9600, 10400, 120, 480, true, false, false, false],
    [10400, 11200, 140, 460, false, false, true, false],
    [11200, 12000, 160, 440, true, true, false, false],
    [12000, 12800, 180, 420, false, false, true, false],
    [12800, 14000, 200, 400, false, false, false, false]
];

// Fake blocks and spikes...
const fakeBlocks = [
    {x: 900, y: 200, w: 50, h: 50, type: 'block'},
    {x: 1400, y: 300, w: 40, h: 40, type: 'block'},
    {x: 2600, y: 250, w: 60, h: 60, type: 'block'},
    {x: 4200, y: 350, w: 50, h: 50, type: 'block'},
    {x: 5800, y: 100, w: 70, h: 70, type: 'block'},
    {x: 7400, y: 400, w: 50, h: 50, type: 'block'},
    {x: 9000, y: 200, w: 60, h: 60, type: 'block'},
    {x: 11000, y: 300, w: 50, h: 50, type: 'block'},
    {x: 1100, y: 450, w: 30, h: 30, type: 'spike'},
    {x: 1900, y: 150, w: 30, h: 30, type: 'spike'},
    {x: 3000, y: 400, w: 30, h: 30, type: 'spike'},
    {x: 5000, y: 200, w: 30, h: 30, type: 'spike'},
    {x: 7000, y: 350, w: 30, h: 30, type: 'spike'},
    {x: 9500, y: 250, w: 30, h: 30, type: 'spike'},
    {x: 11500, y: 450, w: 30, h: 30, type: 'spike'}
];

// Deco...
let stars = [];
for (let i = 0; i < 50; i++) { // Reduced to 50 for less lag
    stars.push({x: Math.random() * 14000, y: Math.random() * canvas.height, size: Math.random() * 2 + 1});
}

const decoElements = [
    {x: 400, y: 300, type: 'arrow'},
    {x: 2000, y: 300, type: 'arrow'},
    {x: 3600, y: 300, type: 'arrow'},
    {x: 5200, y: 300, type: 'arrow'},
    {x: 6800, y: 300, type: 'arrow'},
    {x: 8400, y: 300, type: 'arrow'},
    {x: 10000, y: 300, type: 'arrow'},
    {x: 11600, y: 300, type: 'arrow'},
    {x: 1000, y: 300, type: 'pulse', radius: 50},
    {x: 3000, y: 300, type: 'pulse', radius: 60},
    {x: 5000, y: 300, type: 'pulse', radius: 50},
    {x: 7000, y: 300, type: 'pulse', radius: 70},
    {x: 9000, y: 300, type: 'pulse', radius: 50},
    {x: 11000, y: 300, type: 'pulse', radius: 60}
];

// Game vars
let player = new Wave();
let dualPlayer = null;
let scrollX = 0;
let baseSpeed = 10;
let currentSpeed = baseSpeed;
let flashTimer = 0;
let flashInterval = 30;
let checkpoint = 0;
let highScore = localStorage.getItem('fairydustHighScore') ? parseInt(localStorage.getItem('fairydustHighScore')) : 0;
highScoreSpan.textContent = Math.floor(highScore);
let crashed = false;
let crashParticles = [];
let keys = {};
let mouseDown = false;
let noclip = false;
let autoMode = false;
let godMode = false;
let pulseTimer = 0;
let currentSection = -1;

// Events...
window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (e.key === 'f' || e.key === 'F') canvas.requestFullscreen();
    if (e.key === 'n' || e.key === 'N') noclip = !noclip;
    if (e.key === 'a' || e.key === 'A') autoMode = !autoMode;
    if (e.key === 'g' || e.key === 'G') godMode = true;
    if (e.key === 'c' || e.key === 'C') {
        colors.wave = '#' + Math.floor(Math.random()*16777215).toString(16);
    }
});
window.addEventListener('keyup', e => keys[e.key] = false);
canvas.addEventListener('mousedown', () => mouseDown = true);
canvas.addEventListener('mouseup', () => mouseDown = false);
canvas.addEventListener('touchstart', () => mouseDown = true);
canvas.addEventListener('touchend', () => mouseDown = false);

// Music
audio.play().catch(() => {});

let currentTop = 50;
let currentBottom = canvas.height - 50;
let inSpam = false;

let lastTime = 0;

function update(dt) {
    if (keys['p'] || keys['P']) {
        checkpoint = scrollX;
        keys['p'] = keys['P'] = false;
    }
    if (keys['r'] || keys['R']) {
        scrollX = checkpoint;
        player = new Wave();
        dualPlayer = null;
        crashed = false;
        currentSection = -1;
        keys['r'] = keys['R'] = false;
    }
    if (keys['1']) currentSpeed = 5;
    if (keys['2']) currentSpeed = 10;
    if (keys['3']) currentSpeed = 15;
    if (keys['4']) currentSpeed = 20;
    if (keys['m'] || keys['M']) {
        audio.muted = !audio.muted;
        keys['m'] = keys['M'] = false;
    }

    if (crashed) {
        crashParticles = crashParticles.filter(p => {
            p.x += p.vx * dt * 60;
            p.y += p.vy * dt * 60;
            p.life -= 1 * dt * 60;
            return p.life > 0;
        });
        if (crashParticles.length === 0 || keys[' '] || keys['ArrowUp'] || mouseDown) {
            scrollX = 0;
            player = new Wave();
            dualPlayer = null;
            crashed = false;
            currentSection = -1;
        }
    } else {
        const holding = keys[' '] || keys['ArrowUp'] || mouseDown;
        player.update(holding, autoMode, dt);
        if (dualPlayer) dualPlayer.update(holding, autoMode, dt);

        scrollX += currentSpeed * dt * 60;
        if (godMode) scrollX += 20 * dt * 60;

        // Current section with change detection
        let sectionFound = false;
        for (let i = 0; i < levelSections.length; i++) {
            const section = levelSections[i];
            if (section[0] <= scrollX && scrollX < section[1]) {
                currentTop = section[2];
                currentBottom = section[3];
                if (currentSection !== i) {
                    currentSection = i;
                    if (section[4]) {
                        player.flipGravity();
                        if (dualPlayer) dualPlayer.flipGravity();
                    }
                    player.setMini(section[5]);
                    if (dualPlayer) dualPlayer.setMini(section[5]);
                    if (section[7] && !dualPlayer) dualPlayer = new Wave(true);
                    else if (!section[7] && dualPlayer) dualPlayer = null;
                }
                inSpam = section[6];
                sectionFound = true;
                break;
            }
        }
        if (!sectionFound) {
            currentTop = 50;
            currentBottom = canvas.height - 50;
            inSpam = false;
            if (currentSection !== -1) currentSection = -1;
        }

        // Spam
        if (inSpam) {
            currentTop += Math.floor(Math.random() * 50) - 25;
            currentBottom += Math.floor(Math.random() * 50) - 25;
            currentTop = Math.max(0, currentTop);
            currentBottom = Math.min(canvas.height, currentBottom);
        }

        // Collision
        if (player.checkCollision([currentTop, currentBottom], noclip) || (dualPlayer && dualPlayer.checkCollision([currentTop, currentBottom], noclip))) {
            crashed = true;
            const crashY = dualPlayer && Math.random() < 0.5 ? dualPlayer.posY : player.posY;
            for (let i = 0; i < 50; i++) { // Reduced for less lag
                crashParticles.push({x: player.posX, y: crashY, life: 30, color: colors.particle, vx: Math.random() * 6 - 3, vy: Math.random() * 6 - 3});
            }
        }

        highScore = Math.max(highScore, scrollX);
        highScoreSpan.textContent = Math.floor(highScore);
        localStorage.setItem('fairydustHighScore', Math.floor(highScore));
    }

    pulseTimer += 0.05 * dt * 60;
    flashTimer += dt * 60;
}

function draw() {
    // BG flash
    ctx.fillStyle = (flashTimer % flashInterval < flashInterval / 2) ? colors.flash : colors.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Stars (use rect for faster)
    stars.forEach(star => {
        const adjX = Math.floor(star.x - scrollX * 0.5);
        if (adjX > 0 && adjX < canvas.width) {
            ctx.fillStyle = colors.deco;
            ctx.fillRect(adjX - star.size / 2, star.y - star.size / 2, star.size, star.size);
        }
    });

    // Fake blocks/spikes
    ctx.shadowColor = colors.glow;
    ctx.shadowBlur = 8;
    fakeBlocks.forEach(fake => {
        const adjX = Math.floor(fake.x - scrollX);
        if (adjX > -fake.w && adjX < canvas.width) {
            if (fake.type === 'block') {
                ctx.fillStyle = colors.fake;
                ctx.fillRect(adjX, fake.y, fake.w, fake.h);
            } else if (fake.type === 'spike') {
                ctx.beginPath();
                ctx.moveTo(adjX, fake.y + fake.h);
                ctx.lineTo(adjX + fake.w / 2, fake.y);
                ctx.lineTo(adjX + fake.w, fake.y + fake.h);
                ctx.closePath();
                ctx.fillStyle = colors.fake;
                ctx.fill();
            }
        }
    });
    ctx.shadowBlur = 0;

    // Deco
    decoElements.forEach(deco => {
        const adjX = Math.floor(deco.x - scrollX);
        if (adjX > -50 && adjX < canvas.width) {
            if (deco.type === 'arrow') {
                ctx.beginPath();
                ctx.moveTo(adjX, deco.y);
                ctx.lineTo(adjX + 30, deco.y - 15);
                ctx.lineTo(adjX + 30, deco.y + 15);
                ctx.closePath();
                ctx.fillStyle = colors.deco;
                ctx.fill();
            } else if (deco.type === 'pulse') {
                const pulseSize = deco.radius * (1 + Math.sin(pulseTimer) * 0.3);
                ctx.beginPath();
                ctx.arc(adjX, deco.y, pulseSize, 0, Math.PI * 2);
                ctx.strokeStyle = colors.glow;
                ctx.lineWidth = 5;
                ctx.stroke();
            }
        }
    });

    // Bounds with simpler deco (reduced sawtooth count for less lag)
    ctx.strokeStyle = colors.deco;
    ctx.lineWidth = 5;
    // Top bound simpler lines instead of many sawtooth
    ctx.beginPath();
    ctx.moveTo(0, currentTop);
    ctx.lineTo(canvas.width, currentTop);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, currentBottom);
    ctx.lineTo(canvas.width, currentBottom);
    ctx.stroke();
    // Add glow
    ctx.shadowColor = colors.glow;
    ctx.shadowBlur = 10;
    ctx.strokeStyle = colors.deco; // Re-stroke for glow
    ctx.beginPath();
    ctx.moveTo(0, currentTop);
    ctx.lineTo(canvas.width, currentTop);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, currentBottom);
    ctx.lineTo(canvas.width, currentBottom);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Players
    player.draw();
    if (dualPlayer) dualPlayer.draw();

    // Crash
    if (crashed) {
        crashParticles.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.fillRect(Math.floor(p.x - p.life / 6), Math.floor(p.y - p.life / 6), p.life / 3, p.life / 3);
        });
    }

    // Win
    if (scrollX > 14000 || godMode) {
        ctx.font = '40px Arial';
        ctx.fillStyle = '#ffff00';
        ctx.fillText('Complete! Better than GD Ever!', canvas.width / 2 - 250, canvas.height / 2);
        ctx.font = '20px Arial';
        ctx.fillText(`Distance: ${Math.floor(scrollX)} | Attempts: N/A`, canvas.width / 2 - 150, canvas.height / 2 + 50);
    }
}

function gameLoop(time) {
    if (!lastTime) lastTime = time;
    const dt = (time - lastTime) / 1000;
    lastTime = time;

    update(dt);
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();

// Resize
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth > 800 ? 800 : window.innerWidth;
    canvas.height = window.innerHeight > 600 ? 600 : window.innerHeight;
    // Adjust positions if needed, but for simplicity, restart on resize
    player.posY = canvas.height / 2;
    if (dualPlayer) dualPlayer.posY = canvas.height / 2 + 150;
});
