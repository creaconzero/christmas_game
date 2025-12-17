// ==================== CONFIGURACIÓN DEL JUEGO ====================
let gameConfig = {
    difficulty: 'easy',
    santaSpeed: 12,
    giftSpawnRate: 1200,
    fallSpeed: 3,
    powerupChance: 0.08
};

const difficultySettings = {
    easy: { santaSpeed: 12, giftSpawnRate: 1200, fallSpeed: 3, bombChance: 0.15, lives: 5 },
    normal: { santaSpeed: 10, giftSpawnRate: 1000, fallSpeed: 4, bombChance: 0.20, lives: 3 },
    hard: { santaSpeed: 9, giftSpawnRate: 800, fallSpeed: 5, bombChance: 0.25, lives: 3 },
    extreme: { santaSpeed: 8, giftSpawnRate: 600, fallSpeed: 6, bombChance: 0.30, lives: 2 }
};

// ==================== VARIABLES GLOBALES ====================
let score = 0;
let lives = 3;
let level = 1;
let gameActive = false;
let santaPos = 0;
let gifts = [];
let giftInterval = null;
let gameLoopInterval = null;
let combo = 0;
let bestCombo = 0;
let comboTimer = null;
let highscore = 0;
let giftsCaught = 0;

// Power-ups
let hasShield = false;
let hasSpeed = false;
let hasMagnet = false;
let shieldTimer = null;
let speedTimer = null;
let magnetTimer = null;

// ==================== ELEMENTOS DEL DOM ====================
const santa = document.getElementById('santa');
const gameArea = document.getElementById('gameArea');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const levelEl = document.getElementById('level');
const highscoreEl = document.getElementById('highscore');
const gameOverScreen = document.getElementById('gameOverScreen');
const startBtn = document.getElementById('startBtn');
const comboDisplay = document.getElementById('comboDisplay');
const comboCountEl = document.getElementById('comboCount');
const finalScoreEl = document.getElementById('finalScore');
const finalHighscoreEl = document.getElementById('finalHighscore');
const giftsCaughtEl = document.getElementById('giftsCaught');
const bestComboEl = document.getElementById('bestCombo');
const maxLevelEl = document.getElementById('maxLevel');
const shieldIndicator = document.getElementById('shieldIndicator');
const speedIndicator = document.getElementById('speedIndicator');
const magnetIndicator = document.getElementById('magnetIndicator');
const achievementPopup = document.getElementById('achievementPopup');
const achievementText = document.getElementById('achievementText');

// ==================== TIPOS DE OBJETOS ====================
const giftTypes = [
    { emoji: '🎁', points: 10, isBomb: false, isSpecial: false },
    { emoji: '🎀', points: 10, isBomb: false, isSpecial: false },
    { emoji: '⭐', points: 20, isBomb: false, isSpecial: false },
    { emoji: '🔔', points: 15, isBomb: false, isSpecial: false },
    { emoji: '💎', points: 50, isBomb: false, isSpecial: true },
    { emoji: '💣', points: 0, isBomb: true, isSpecial: false }
];

const powerupTypes = [
    { emoji: '🛡️', type: 'shield', duration: 8000 },
    { emoji: '⚡', type: 'speed', duration: 6000 },
    { emoji: '🧲', type: 'magnet', duration: 7000 },
    { emoji: '⏰', type: 'time', duration: 0 }
];

// ==================== INICIALIZACIÓN ====================
function init() {
    loadHighscore();
    createStars();
    createSnowflakes();
    santa.style.left = '0px';
}

function createStars() {
    const starsContainer = document.getElementById('stars');
    for (let i = 0; i < 100; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.width = star.style.height = Math.random() * 3 + 'px';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.animationDelay = Math.random() * 3 + 's';
        starsContainer.appendChild(star);
    }
}

function createSnowflakes() {
    for (let i = 0; i < 60; i++) {
        const snowflake = document.createElement('div');
        snowflake.className = 'snowflake';
        snowflake.textContent = '❄';
        snowflake.style.left = Math.random() * 100 + '%';
        snowflake.style.fontSize = (Math.random() * 15 + 12) + 'px';
        snowflake.style.animationDuration = (Math.random() * 4 + 3) + 's';
        snowflake.style.animationDelay = Math.random() * 5 + 's';
        document.body.appendChild(snowflake);
    }
}

function loadHighscore() {
    const saved = localStorage.getItem('santaChallengeHighscore');
    highscore = saved ? parseInt(saved) : 0;
    highscoreEl.textContent = highscore;
}

function saveHighscore() {
    if (score > highscore) {
        highscore = score;
        localStorage.setItem('santaChallengeHighscore', highscore.toString());
        highscoreEl.textContent = highscore;
        showAchievement('¡Nuevo Récord Personal! 🏆');
    }
}

// ==================== CONTROL DE DIFICULTAD ====================
function selectDifficulty(difficulty) {
    if (gameActive) return;
    
    gameConfig.difficulty = difficulty;
    const settings = difficultySettings[difficulty];
    gameConfig.santaSpeed = settings.santaSpeed;
    gameConfig.giftSpawnRate = settings.giftSpawnRate;
    gameConfig.fallSpeed = settings.fallSpeed;
    
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    event.target.classList.add('selected');
}

// ==================== MOVIMIENTO ====================
const keys = {};

document.addEventListener('keydown', (e) => {
    if (gameActive) keys[e.key] = true;
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

function moveSanta() {
    if (!gameActive) return;
    
    const speed = hasSpeed ? gameConfig.santaSpeed * 2 : gameConfig.santaSpeed;
    const maxPos = gameArea.offsetWidth - 80;
    
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
        santaPos = Math.max(0, santaPos - speed);
    }
    if (keys['ArrowRight'] || keys['d'] || keys['D']) {
        santaPos = Math.min(maxPos, santaPos + speed);
    }
    
    santa.style.left = santaPos + 'px';
}

// ==================== CREACIÓN DE OBJETOS ====================
function createGift() {
    if (!gameActive) return;

    const isPowerup = Math.random() < gameConfig.powerupChance;
    
    if (isPowerup) {
        createPowerup();
        return;
    }

    let giftType;
    const rand = Math.random();
    const bombChance = difficultySettings[gameConfig.difficulty].bombChance;
    
    if (rand < bombChance) {
        giftType = giftTypes[5]; // Bomba
    } else if (rand < bombChance + 0.05) {
        giftType = giftTypes[4]; // Diamante
    } else if (rand < bombChance + 0.15) {
        giftType = giftTypes[2]; // Estrella
    } else if (rand < bombChance + 0.25) {
        giftType = giftTypes[3]; // Campana
    } else {
        giftType = Math.random() < 0.5 ? giftTypes[0] : giftTypes[1]; // Regalos
    }

    const gift = document.createElement('div');
    gift.className = 'gift' + (giftType.isSpecial ? ' special' : '');
    gift.textContent = giftType.emoji;
    
    const maxLeft = gameArea.offsetWidth - 60;
    const xPos = Math.random() * maxLeft;
    
    gift.style.left = xPos + 'px';
    gift.style.top = '0px';
    
    gameArea.appendChild(gift);
    
    gifts.push({
        element: gift,
        x: xPos,
        y: 0,
        points: giftType.points,
        isBomb: giftType.isBomb,
        isSpecial: giftType.isSpecial,
        caught: false,
        isPowerup: false
    });
}

function createPowerup() {
    const powerup = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
    const powerupEl = document.createElement('div');
    powerupEl.className = 'powerup';
    powerupEl.textContent = powerup.emoji;
    
    const maxLeft = gameArea.offsetWidth - 60;
    const xPos = Math.random() * maxLeft;
    
    powerupEl.style.left = xPos + 'px';
    powerupEl.style.top = '0px';
    
    gameArea.appendChild(powerupEl);
    
    gifts.push({
        element: powerupEl,
        x: xPos,
        y: 0,
        powerupType: powerup.type,
        duration: powerup.duration,
        caught: false,
        isPowerup: true
    });
}

// ==================== POWER-UPS ====================
function activatePowerup(type, duration) {
    switch(type) {
        case 'shield':
            hasShield = true;
            shieldIndicator.classList.add('active');
            santa.classList.add('shield-active');
            if (shieldTimer) clearTimeout(shieldTimer);
            shieldTimer = setTimeout(() => {
                hasShield = false;
                shieldIndicator.classList.remove('active');
                santa.classList.remove('shield-active');
            }, duration);
            showAchievement('¡Escudo Activado! 🛡️');
            break;
            
        case 'speed':
            hasSpeed = true;
            speedIndicator.classList.add('active');
            santa.classList.add('speed-boost');
            if (speedTimer) clearTimeout(speedTimer);
            speedTimer = setTimeout(() => {
                hasSpeed = false;
                speedIndicator.classList.remove('active');
                santa.classList.remove('speed-boost');
            }, duration);
            showAchievement('¡Velocidad x2! ⚡');
            break;
            
        case 'magnet':
            hasMagnet = true;
            magnetIndicator.classList.add('active');
            if (magnetTimer) clearTimeout(magnetTimer);
            magnetTimer = setTimeout(() => {
                hasMagnet = false;
                magnetIndicator.classList.remove('active');
            }, duration);
            showAchievement('¡Imán Activado! 🧲');
            break;
            
        case 'time':
            lives = Math.min(5, lives + 1);
            updateLives();
            showAchievement('¡+1 Vida Extra! ⏰');
            break;
    }
}

// ==================== PARTÍCULAS Y EFECTOS ====================
function createParticle(x, y, text) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.textContent = text;
    particle.style.left = x + 'px';
    particle.style.top = y + 'px';
    gameArea.appendChild(particle);
    
    setTimeout(() => {
        if (particle.parentNode) particle.remove();
    }, 1200);
}

function createExplosion(x, y) {
    const explosion = document.createElement('div');
    explosion.className = 'explosion';
    explosion.textContent = '💥';
    explosion.style.left = x + 'px';
    explosion.style.top = y + 'px';
    gameArea.appendChild(explosion);
    
    setTimeout(() => {
        if (explosion.parentNode) explosion.remove();
    }, 500);
}

// ==================== COMBO SYSTEM ====================
function updateCombo(isGood) {
    if (isGood) {
        combo++;
        if (combo > bestCombo) bestCombo = combo;
        
        if (combo > 1) {
            comboDisplay.style.display = 'block';
            comboCountEl.textContent = combo;
            
            if (combo === 5) showAchievement('¡Combo x5! 🔥');
            if (combo === 10) showAchievement('¡INCREÍBLE! Combo x10! 🔥🔥');
            if (combo === 20) showAchievement('¡LEGENDARIO! Combo x20! 🔥🔥🔥');
            
            if (comboTimer) clearTimeout(comboTimer);
            comboTimer = setTimeout(() => {
                combo = 0;
                comboDisplay.style.display = 'none';
            }, 2500);
        }
    } else {
        combo = 0;
        comboDisplay.style.display = 'none';
        if (comboTimer) clearTimeout(comboTimer);
    }
}

// ==================== ACTUALIZACIÓN DE STATS ====================
function updateLives() {
    livesEl.textContent = '❤️'.repeat(Math.max(0, lives));
}

function addScore(points) {
    const comboMultiplier = combo > 1 ? combo * 0.5 : 1;
    const totalPoints = Math.floor(points * comboMultiplier);
    score += totalPoints;
    scoreEl.textContent = score;
    
    // Logros por puntuación
    if (score >= 1000 && score - totalPoints < 1000) {
        showAchievement('¡1000 Puntos! Eres una estrella! ⭐');
    }
    if (score >= 5000 && score - totalPoints < 5000) {
        showAchievement('¡5000 Puntos! ¡Maestro de la Navidad! 🎄');
    }
    
    // Actualizar nivel
    const newLevel = Math.floor(score / 150) + 1;
    if (newLevel > level) {
        level = newLevel;
        levelEl.textContent = level;
        showAchievement(`¡Nivel ${level} Alcanzado! 🎯`);
        
        if (giftInterval) {
            clearInterval(giftInterval);
            const newSpeed = Math.max(400, gameConfig.giftSpawnRate - (level * 50));
            giftInterval = setInterval(createGift, newSpeed);
        }
    }
}

// ==================== LOOP PRINCIPAL ====================
function gameLoop() {
    if (!gameActive) return;

    moveSanta();

    const santaRect = santa.getBoundingClientRect();
    const fallSpeed = gameConfig.fallSpeed + (level * 0.3);
    const magnetRange = hasMagnet ? 150 : 0;

    for (let i = gifts.length - 1; i >= 0; i--) {
        const gift = gifts[i];
        
        if (gift.caught) continue;

        // Mover objeto
        gift.y += fallSpeed;
        gift.element.style.top = gift.y + 'px';

        // Efecto imán
        if (hasMagnet && !gift.isBomb && !gift.isPowerup) {
            const distX = (santaPos + 40) - (gift.x + 25);
            const distY = (gameArea.offsetHeight - 70) - gift.y;
            const distance = Math.sqrt(distX * distX + distY * distY);
            
            if (distance < magnetRange) {
                gift.x += distX * 0.08;
                gift.element.style.left = gift.x + 'px';
            }
        }

        const giftRect = gift.element.getBoundingClientRect();

        // Colisión con Santa
        if (!gift.caught &&
            giftRect.bottom >= santaRect.top + 10 &&
            giftRect.top <= santaRect.bottom - 10 &&
            giftRect.left + 20 < santaRect.right &&
            giftRect.right - 20 > santaRect.left) {
            
            gift.caught = true;

            if (gift.isPowerup) {
                activatePowerup(gift.powerupType, gift.duration);
                createParticle(gift.x, gift.y, '✨');
            } else if (gift.isBomb) {
                if (!hasShield) {
                    lives--;
                    updateLives();
                    createExplosion(gift.x, gift.y);
                    updateCombo(false);
                    
                    if (lives <= 0) {
                        endGame();
                    }
                } else {
                    createParticle(gift.x, gift.y, '🛡️ BLOQUEADO');
                }
            } else {
                giftsCaught++;
                addScore(gift.points);
                const comboMult = combo > 1 ? combo * 0.5 : 1;
                const totalPts = Math.floor(gift.points * comboMult);
                createParticle(gift.x, gift.y, `+${totalPts}`);
                updateCombo(true);
            }

            gift.element.remove();
            gifts.splice(i, 1);
            continue;
        }

        // Fuera de pantalla
        if (gift.y > gameArea.offsetHeight) {
            if (!gift.isBomb && !gift.caught && !gift.isPowerup) {
                lives--;
                updateLives();
                updateCombo(false);
                
                if (lives <= 0) {
                    endGame();
                }
            }
            
            gift.element.remove();
            gifts.splice(i, 1);
        }
    }
}

// ==================== LOGROS ====================
function showAchievement(text) {
    achievementText.textContent = text;
    achievementPopup.style.display = 'block';
    
    setTimeout(() => {
        achievementPopup.style.display = 'none';
    }, 3000);
}

// ==================== CONTROL DEL JUEGO ====================
function startGame() {
    // Limpiar estado anterior
    if (giftInterval) clearInterval(giftInterval);
    if (gameLoopInterval) clearInterval(gameLoopInterval);
    if (comboTimer) clearTimeout(comboTimer);
    if (shieldTimer) clearTimeout(shieldTimer);
    if (speedTimer) clearTimeout(speedTimer);
    if (magnetTimer) clearTimeout(magnetTimer);

    gifts.forEach(g => {
        if (g.element.parentNode) g.element.remove();
    });
    gifts = [];

    // Reiniciar variables
    const settings = difficultySettings[gameConfig.difficulty];
    score = 0;
    lives = settings.lives;
    level = 1;
    combo = 0;
    bestCombo = 0;
    giftsCaught = 0;
    gameActive = true;
    santaPos = (gameArea.offsetWidth - 80) / 2;
    hasShield = false;
    hasSpeed = false;
    hasMagnet = false;

    // Actualizar UI
    scoreEl.textContent = '0';
    levelEl.textContent = '1';
    updateLives();
    santa.style.left = santaPos + 'px';
    comboDisplay.style.display = 'none';
    gameOverScreen.style.display = 'none';
    shieldIndicator.classList.remove('active');
    speedIndicator.classList.remove('active');
    magnetIndicator.classList.remove('active');
    santa.classList.remove('shield-active', 'speed-boost');
    startBtn.textContent = '🔄 Reiniciar';
    startBtn.disabled = true;
    document.getElementById('difficultySelector').style.display = 'none';

    // Iniciar juego
    giftInterval = setInterval(createGift, gameConfig.giftSpawnRate);
    gameLoopInterval = setInterval(gameLoop, 1000 / 60);

    setTimeout(() => {
        startBtn.disabled = false;
    }, 500);
}

function endGame() {
    gameActive = false;
    
    if (giftInterval) clearInterval(giftInterval);
    if (gameLoopInterval) clearInterval(gameLoopInterval);
    if (comboTimer) clearTimeout(comboTimer);
    if (shieldTimer) clearTimeout(shieldTimer);
    if (speedTimer) clearTimeout(speedTimer);
    if (magnetTimer) clearTimeout(magnetTimer);

    saveHighscore();

    finalScoreEl.textContent = score;
    finalHighscoreEl.textContent = highscore;
    giftsCaughtEl.textContent = giftsCaught;
    bestComboEl.textContent = bestCombo;
    maxLevelEl.textContent = level;
    gameOverScreen.style.display = 'block';
    startBtn.textContent = '🎮 Jugar de Nuevo';
    startBtn.disabled = false;
    document.getElementById('difficultySelector').style.display = 'flex';
}

// ==================== INICIAR ====================
init();