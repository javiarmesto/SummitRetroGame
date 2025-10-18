// ========================================
// FRUIT SHOOTER - Retro Arcade Game
// ========================================

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// ========================================
// GAME STATE MANAGEMENT
// ========================================

const GAME_STATES = {
  START: 'start',
  PLAYING: 'playing',
  LEVEL_COMPLETE: 'levelcomplete',
  GAME_OVER: 'gameover',
  HISTORY: 'history'
};

let gameState = GAME_STATES.START;
let score = 0;
let highScore = localStorage.getItem('spaceShooterHighScore') || 0;
let playerLives = 3;
let currentLevel = 1;
let enemiesDefeated = 0;
let enemiesRequiredForLevel = 10; // Enemies needed to complete a level

// ========================================
// INPUT HANDLING
// ========================================

const keys = {
  ArrowLeft: false,
  ArrowRight: false,
  ArrowUp: false,
  ArrowDown: false,
  w: false,
  a: false,
  s: false,
  d: false,
  ' ': false, // Spacebar
  h: false // History screen
};

document.addEventListener('keydown', (e) => {
  if (e.key in keys) {
    e.preventDefault();
    keys[e.key] = true;

    // Start game on spacebar from start screen
    if (gameState === GAME_STATES.START && e.key === ' ') {
      startGame();
    }

    // Continue to next level
    if (gameState === GAME_STATES.LEVEL_COMPLETE && e.key === ' ') {
      nextLevel();
    }

    // Restart game on spacebar from game over screen
    if (gameState === GAME_STATES.GAME_OVER && e.key === ' ') {
      startGame();
    }

    // Show history screen
    if (gameState === GAME_STATES.START && e.key === 'h') {
      gameState = GAME_STATES.HISTORY;
    }

    // Return from history screen
    if (gameState === GAME_STATES.HISTORY && e.key === ' ') {
      gameState = GAME_STATES.START;
    }
  }
});

document.addEventListener('keyup', (e) => {
  if (e.key in keys) {
    e.preventDefault();
    keys[e.key] = false;
  }
});

// ========================================
// UTILITY FUNCTIONS
// ========================================

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function randInt(min, max) {
  return Math.floor(rand(min, max + 1));
}

function checkCollision(a, b) {
  return a.x < b.x + b.width &&
         a.x + a.width > b.x &&
         a.y < b.y + b.height &&
         a.y + a.height > b.y;
}

// ========================================
// ANIMATED STARFIELD BACKGROUND
// ========================================

class Star {
  constructor() {
    this.reset();
    this.y = rand(0, HEIGHT);
  }

  reset() {
    this.x = rand(0, WIDTH);
    this.y = 0;
    this.speed = rand(0.5, 3);
    this.size = rand(1, 3);

    // Colorful stars with different hues
    const hue = randInt(0, 360);
    this.color = `hsl(${hue}, 80%, 70%)`;
    this.alpha = rand(0.3, 1);
  }

  update() {
    this.y += this.speed;

    if (this.y > HEIGHT) {
      this.reset();
    }
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 4;
    ctx.shadowColor = this.color;
    ctx.fillRect(this.x, this.y, this.size, this.size);
    ctx.restore();
  }
}

// Create starfield
const stars = [];
for (let i = 0; i < 150; i++) {
  stars.push(new Star());
}

// ========================================
// PARTICLE SYSTEM FOR EXPLOSIONS
// ========================================

class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.vx = rand(-3, 3);
    this.vy = rand(-3, 3);
    this.life = 1;
    this.decay = rand(0.015, 0.03);
    this.size = rand(2, 5);
    this.color = color;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life -= this.decay;
    this.vy += 0.1; // Gravity
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = this.life;
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  isDead() {
    return this.life <= 0;
  }
}

const particles = [];

function createExplosion(x, y, color) {
  const particleCount = randInt(20, 40);
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle(x, y, color));
  }
}

// ========================================
// PLAYER WATERMELON
// ========================================

class Player {
  constructor() {
    this.width = 45;
    this.height = 45;
    this.x = WIDTH / 2 - this.width / 2;
    this.y = HEIGHT - this.height - 30;
    this.speed = 5;
    this.shootCooldown = 0;
    this.shootDelay = 10; // Frames between shots
  }

  update() {
    // Movement
    if ((keys.ArrowLeft || keys.a) && this.x > 0) {
      this.x -= this.speed;
    }
    if ((keys.ArrowRight || keys.d) && this.x < WIDTH - this.width) {
      this.x += this.speed;
    }
    if ((keys.ArrowUp || keys.w) && this.y > 0) {
      this.y -= this.speed;
    }
    if ((keys.ArrowDown || keys.s) && this.y < HEIGHT - this.height) {
      this.y += this.speed;
    }

    // Shooting
    if (this.shootCooldown > 0) {
      this.shootCooldown--;
    }

    if (keys[' '] && this.shootCooldown === 0) {
      this.shoot();
      this.shootCooldown = this.shootDelay;
    }
  }

  shoot() {
    playerBullets.push(new PlayerBullet(this.x + this.width / 2, this.y));
  }

  draw() {
    ctx.save();

    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    const radius = this.width / 2;

    // Glow effect
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#ff1493';

    // Watermelon body (green outer)
    ctx.fillStyle = '#2d5016';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    // Light green stripe
    ctx.fillStyle = '#3a7022';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 3, 0, Math.PI * 2);
    ctx.fill();

    // Pink/red inside
    ctx.fillStyle = '#ff1493';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff1493';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 6, 0, Math.PI * 2);
    ctx.fill();

    // Seeds (black dots)
    ctx.fillStyle = '#000000';
    ctx.shadowBlur = 0;
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 * i) / 6;
      const seedX = centerX + Math.cos(angle) * (radius - 12);
      const seedY = centerY + Math.sin(angle) * (radius - 12);
      ctx.beginPath();
      ctx.arc(seedX, seedY, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(centerX - 8, centerY - 8, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

// ========================================
// PLAYER BULLETS
// ========================================

class PlayerBullet {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 4;
    this.height = 15;
    this.speed = 8;
    this.color = '#00ff00';
  }

  update() {
    this.y -= this.speed;
  }

  draw() {
    ctx.save();
    ctx.shadowBlur = 15;
    ctx.shadowColor = this.color;
    ctx.fillStyle = this.color;

    // Bullet shape
    ctx.fillRect(this.x - this.width / 2, this.y, this.width, this.height);

    // Bullet trail
    ctx.globalAlpha = 0.5;
    ctx.fillRect(this.x - this.width / 2, this.y + this.height, this.width, 10);

    ctx.restore();
  }

  isOffScreen() {
    return this.y < -this.height;
  }
}

const playerBullets = [];

// ========================================
// ENEMY FRUITS
// ========================================

class Enemy {
  constructor(type = 0) {
    this.width = 38;
    this.height = 38;
    this.x = rand(0, WIDTH - this.width);
    this.y = -this.height;
    this.type = type;

    // Different fruit types with different colors and behaviors
    const types = [
      { name: 'strawberry', color: '#ff1744', accent: '#c41c00', speed: 2, health: 1, points: 100 },     // Strawberry - Fast
      { name: 'orange', color: '#ff9100', accent: '#ff6d00', speed: 1.5, health: 2, points: 200 },       // Orange - Tough
      { name: 'lemon', color: '#ffeb3b', accent: '#fdd835', speed: 2.5, health: 1, points: 150 },        // Lemon - Very Fast
      { name: 'grape', color: '#9c27b0', accent: '#7b1fa2', speed: 1.8, health: 1, points: 120 }         // Grape - Medium
    ];

    const selectedType = types[this.type % types.length];
    this.name = selectedType.name;
    this.color = selectedType.color;
    this.accent = selectedType.accent;
    
    // Scale difficulty with level
    const levelMultiplier = 1 + (currentLevel - 1) * 0.15; // 15% increase per level
    this.speed = selectedType.speed * levelMultiplier;
    this.health = selectedType.health + Math.floor((currentLevel - 1) / 2); // +1 health every 2 levels
    this.maxHealth = this.health;
    this.points = selectedType.points * currentLevel; // Points scale with level

    // Movement pattern
    this.amplitude = rand(20, 60);
    this.frequency = rand(0.01, 0.03);
    this.offset = rand(0, Math.PI * 2);
  }

  update() {
    // Sine wave movement
    this.y += this.speed;
    this.x += Math.sin(this.y * this.frequency + this.offset) * 2;

    // Keep within bounds
    this.x = Math.max(0, Math.min(WIDTH - this.width, this.x));
  }

  draw() {
    ctx.save();

    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    const radius = this.width / 2;

    // Glow effect
    ctx.shadowBlur = 15;
    ctx.shadowColor = this.color;

    if (this.name === 'strawberry') {
      // Strawberry shape (heart-like)
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(centerX - 6, centerY - 3, radius * 0.6, 0, Math.PI * 2);
      ctx.arc(centerX + 6, centerY - 3, radius * 0.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(centerX - radius + 2, centerY);
      ctx.lineTo(centerX, centerY + radius + 2);
      ctx.lineTo(centerX + radius - 2, centerY);
      ctx.closePath();
      ctx.fill();

      // Seeds
      ctx.fillStyle = '#ffeb3b';
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8;
        const seedX = centerX + Math.cos(angle) * (radius - 8);
        const seedY = centerY + Math.sin(angle) * (radius - 8);
        ctx.beginPath();
        ctx.arc(seedX, seedY, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Leaf
      ctx.fillStyle = '#2e7d32';
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - radius);
      ctx.lineTo(centerX - 5, centerY - radius - 5);
      ctx.lineTo(centerX + 5, centerY - radius - 5);
      ctx.closePath();
      ctx.fill();

    } else if (this.name === 'orange') {
      // Orange (circle with texture)
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();

      // Texture lines
      ctx.strokeStyle = this.accent;
      ctx.lineWidth = 1;
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius);
        ctx.stroke();
      }

      // Highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(centerX - 6, centerY - 6, 5, 0, Math.PI * 2);
      ctx.fill();

    } else if (this.name === 'lemon') {
      // Lemon (oval shape)
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radius * 0.8, radius * 1.1, 0, 0, Math.PI * 2);
      ctx.fill();

      // Lemon texture
      ctx.strokeStyle = this.accent;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.5;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(centerX + i * 5, centerY - radius);
        ctx.lineTo(centerX + i * 5, centerY + radius);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.beginPath();
      ctx.arc(centerX - 5, centerY - 8, 4, 0, Math.PI * 2);
      ctx.fill();

    } else if (this.name === 'grape') {
      // Grape cluster (3 circles)
      ctx.fillStyle = this.color;

      ctx.beginPath();
      ctx.arc(centerX - 7, centerY - 3, radius * 0.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(centerX + 7, centerY - 3, radius * 0.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(centerX, centerY + 5, radius * 0.6, 0, Math.PI * 2);
      ctx.fill();

      // Highlights on each grape
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.arc(centerX - 9, centerY - 5, 3, 0, Math.PI * 2);
      ctx.arc(centerX + 5, centerY - 5, 3, 0, Math.PI * 2);
      ctx.arc(centerX - 2, centerY + 3, 3, 0, Math.PI * 2);
      ctx.fill();

      // Stem
      ctx.strokeStyle = '#795548';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - radius);
      ctx.lineTo(centerX, centerY - radius - 5);
      ctx.stroke();
    }

    // Health bar (if damaged)
    if (this.health < this.maxHealth) {
      const barWidth = this.width;
      const barHeight = 4;
      const healthPercent = this.health / this.maxHealth;

      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(this.x, this.y - 10, barWidth, barHeight);

      ctx.fillStyle = '#00ff00';
      ctx.fillRect(this.x, this.y - 10, barWidth * healthPercent, barHeight);
    }

    ctx.restore();
  }

  takeDamage() {
    this.health--;
    return this.health <= 0;
  }

  isOffScreen() {
    return this.y > HEIGHT;
  }
}

const enemies = [];

// ========================================
// ENEMY SPAWNING SYSTEM
// ========================================

let spawnTimer = 0;
let spawnRate = 60; // Frames between spawns
let waveNumber = 0;

function spawnEnemy() {
  const type = randInt(0, 3);
  enemies.push(new Enemy(type));
}

function updateSpawning() {
  spawnTimer++;

  if (spawnTimer >= spawnRate) {
    spawnEnemy();
    spawnTimer = 0;

    // Increase difficulty over time within a level
    if (score > 0 && score % 1000 === 0) {
      spawnRate = Math.max(30, spawnRate - 2);
    }
  }

  // Spawn waves occasionally
  if (score > 0 && score % 2000 === 0 && waveNumber !== score) {
    waveNumber = score;
    for (let i = 0; i < 5; i++) {
      setTimeout(() => spawnEnemy(), i * 200);
    }
  }
}

// ========================================
// GAME HISTORY MANAGEMENT
// ========================================

function getGameHistory() {
  const historyJSON = localStorage.getItem('fruitShooterHistory');
  return historyJSON ? JSON.parse(historyJSON) : [];
}

function saveGameToHistory(finalScore, level, lives) {
  const history = getGameHistory();
  const gameRecord = {
    score: finalScore,
    level: level,
    lives: lives,
    date: new Date().toISOString(),
    timestamp: Date.now()
  };
  
  history.unshift(gameRecord); // Add to beginning
  
  // Keep only last 20 games
  if (history.length > 20) {
    history.length = 20;
  }
  
  localStorage.setItem('fruitShooterHistory', JSON.stringify(history));
}

function getHistoryStats() {
  const history = getGameHistory();
  
  if (history.length === 0) {
    return {
      gamesPlayed: 0,
      bestScore: 0,
      bestLevel: 0,
      avgScore: 0,
      totalScore: 0
    };
  }
  
  const totalScore = history.reduce((sum, game) => sum + game.score, 0);
  const bestScore = Math.max(...history.map(g => g.score));
  const bestLevel = Math.max(...history.map(g => g.level));
  
  return {
    gamesPlayed: history.length,
    bestScore: bestScore,
    bestLevel: bestLevel,
    avgScore: Math.floor(totalScore / history.length),
    totalScore: totalScore
  };
}

// ========================================
// GAME LOGIC
// ========================================

const player = new Player();

function startGame() {
  gameState = GAME_STATES.PLAYING;
  score = 0;
  playerLives = 3;
  currentLevel = 1;
  enemiesDefeated = 0;

  // Clear arrays
  enemies.length = 0;
  playerBullets.length = 0;
  particles.length = 0;

  // Reset spawn timer with initial rate
  spawnTimer = 0;
  spawnRate = 60;
  waveNumber = 0;

  // Reset player position
  player.x = WIDTH / 2 - player.width / 2;
  player.y = HEIGHT - player.height - 30;
}

function nextLevel() {
  currentLevel++;
  enemiesDefeated = 0;
  gameState = GAME_STATES.PLAYING;
  
  // Clear enemies and bullets for fresh start
  enemies.length = 0;
  playerBullets.length = 0;
  
  // Adjust spawn rate for new level (faster spawning)
  spawnRate = Math.max(30, 60 - (currentLevel - 1) * 5);
  spawnTimer = 0;
  
  // Bonus lives every 3 levels
  if (currentLevel % 3 === 0) {
    playerLives = Math.min(5, playerLives + 1); // Max 5 lives
  }
}

function updateGame() {
  // Update player
  player.update();

  // Update bullets
  for (let i = playerBullets.length - 1; i >= 0; i--) {
    playerBullets[i].update();

    // Remove off-screen bullets
    if (playerBullets[i].isOffScreen()) {
      playerBullets.splice(i, 1);
    }
  }

  // Update enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    enemies[i].update();

    // Check collision with player
    if (checkCollision(player, enemies[i])) {
      createExplosion(enemies[i].x + enemies[i].width / 2,
                     enemies[i].y + enemies[i].height / 2,
                     enemies[i].color);
      enemies.splice(i, 1);
      playerLives--;

      if (playerLives <= 0) {
        gameOver();
      }
      continue;
    }

    // Remove off-screen enemies
    if (enemies[i].isOffScreen()) {
      enemies.splice(i, 1);
      continue;
    }

    // Check collision with bullets
    for (let j = playerBullets.length - 1; j >= 0; j--) {
      if (checkCollision(playerBullets[j], enemies[i])) {
        // Hit enemy
        const destroyed = enemies[i].takeDamage();

        if (destroyed) {
          score += enemies[i].points;
          enemiesDefeated++;
          
          // Check for level completion
          if (enemiesDefeated >= enemiesRequiredForLevel) {
            levelComplete();
          }
          
          createExplosion(enemies[i].x + enemies[i].width / 2,
                         enemies[i].y + enemies[i].height / 2,
                         enemies[i].color);
          enemies.splice(i, 1);
        }

        playerBullets.splice(j, 1);
        break;
      }
    }
  }

  // Update particles
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    if (particles[i].isDead()) {
      particles.splice(i, 1);
    }
  }

  // Spawn enemies
  updateSpawning();
}

function levelComplete() {
  gameState = GAME_STATES.LEVEL_COMPLETE;
}

function gameOver() {
  gameState = GAME_STATES.GAME_OVER;

  // Save game to history
  saveGameToHistory(score, currentLevel, playerLives);

  if (score > highScore) {
    highScore = score;
    localStorage.setItem('spaceShooterHighScore', highScore);
  }
}

// ========================================
// RENDERING
// ========================================

function drawStartScreen() {
  ctx.save();

  // Title
  ctx.font = 'bold 60px "Courier New"';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ff1744';
  ctx.shadowBlur = 30;
  ctx.shadowColor = '#ff1744';
  ctx.fillText('FRUIT', WIDTH / 2, HEIGHT / 2 - 80);

  ctx.fillStyle = '#ffeb3b';
  ctx.shadowColor = '#ffeb3b';
  ctx.fillText('SHOOTER', WIDTH / 2, HEIGHT / 2 - 20);

  // Instructions
  ctx.font = '24px "Courier New"';
  ctx.fillStyle = '#ff9100';
  ctx.shadowBlur = 15;
  ctx.shadowColor = '#ff9100';
  ctx.fillText('Press SPACEBAR to Start', WIDTH / 2, HEIGHT / 2 + 60);

  // Controls
  ctx.font = '18px "Courier New"';
  ctx.fillStyle = '#9c27b0';
  ctx.shadowBlur = 10;
  ctx.fillText('Arrow Keys or WASD - Move', WIDTH / 2, HEIGHT / 2 + 120);
  ctx.fillText('SPACEBAR - Shoot', WIDTH / 2, HEIGHT / 2 + 150);

  // History prompt
  ctx.font = '20px "Courier New"';
  ctx.fillStyle = '#00ffff';
  ctx.fillText('Press H to View History', WIDTH / 2, HEIGHT / 2 + 190);

  // High Score
  if (highScore > 0) {
    ctx.font = '20px "Courier New"';
    ctx.fillStyle = '#00ff88';
    ctx.fillText(`High Score: ${highScore}`, WIDTH / 2, HEIGHT - 50);
  }

  ctx.restore();
}

function drawLevelComplete() {
  ctx.save();

  // Semi-transparent overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Level Complete text
  ctx.font = 'bold 60px "Courier New"';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#00ff00';
  ctx.shadowBlur = 40;
  ctx.shadowColor = '#00ff00';
  ctx.fillText('LEVEL COMPLETE!', WIDTH / 2, HEIGHT / 2 - 80);

  // Level info
  ctx.font = '30px "Courier New"';
  ctx.fillStyle = '#ffff00';
  ctx.shadowBlur = 20;
  ctx.shadowColor = '#ffff00';
  ctx.fillText(`Level ${currentLevel} Cleared!`, WIDTH / 2, HEIGHT / 2 - 20);

  // Score
  ctx.fillStyle = '#ff9100';
  ctx.shadowColor = '#ff9100';
  ctx.fillText(`Score: ${score}`, WIDTH / 2, HEIGHT / 2 + 30);

  // Next level info
  ctx.font = '24px "Courier New"';
  ctx.fillStyle = '#00ffff';
  ctx.shadowBlur = 15;
  ctx.shadowColor = '#00ffff';
  ctx.fillText(`Next: Level ${currentLevel + 1}`, WIDTH / 2, HEIGHT / 2 + 80);

  // Bonus info
  if (currentLevel % 3 === 2) { // Next level will give bonus
    ctx.fillStyle = '#ff00ff';
    ctx.shadowColor = '#ff00ff';
    ctx.fillText('Bonus Life on Next Level!', WIDTH / 2, HEIGHT / 2 + 120);
  }

  // Continue instruction
  ctx.font = '26px "Courier New"';
  ctx.fillStyle = '#00ff88';
  ctx.shadowBlur = 15;
  ctx.fillText('Press SPACEBAR to Continue', WIDTH / 2, HEIGHT / 2 + 160);

  ctx.restore();
}

function drawHistory() {
  ctx.save();

  // Background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Title
  ctx.font = 'bold 50px "Courier New"';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#00ffff';
  ctx.shadowBlur = 30;
  ctx.shadowColor = '#00ffff';
  ctx.fillText('GAME HISTORY', WIDTH / 2, 60);

  const stats = getHistoryStats();
  const history = getGameHistory();

  // Statistics
  ctx.font = '22px "Courier New"';
  ctx.textAlign = 'left';
  
  ctx.fillStyle = '#ffff00';
  ctx.shadowBlur = 15;
  ctx.fillText(`Games Played: ${stats.gamesPlayed}`, 60, 120);
  
  ctx.fillStyle = '#ff9100';
  ctx.fillText(`Best Score: ${stats.bestScore}`, 60, 155);
  
  ctx.fillStyle = '#00ff88';
  ctx.fillText(`Best Level: ${stats.bestLevel}`, 60, 190);
  
  ctx.fillStyle = '#ff00ff';
  ctx.fillText(`Average Score: ${stats.avgScore}`, 60, 225);

  // Recent games header
  ctx.font = 'bold 24px "Courier New"';
  ctx.fillStyle = '#00ffff';
  ctx.textAlign = 'center';
  ctx.fillText('Recent Games', WIDTH / 2, 275);

  // Column headers
  ctx.font = '18px "Courier New"';
  ctx.fillStyle = '#9c27b0';
  ctx.textAlign = 'left';
  ctx.fillText('Score', 80, 310);
  ctx.fillText('Level', 220, 310);
  ctx.fillText('Lives', 340, 310);
  ctx.fillText('Date', 460, 310);

  // Recent games list (max 8)
  ctx.font = '16px "Courier New"';
  const maxDisplay = Math.min(8, history.length);
  
  for (let i = 0; i < maxDisplay; i++) {
    const game = history[i];
    const y = 345 + i * 28;
    
    // Alternate colors
    ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#cccccc';
    ctx.shadowBlur = 5;
    
    ctx.fillText(game.score.toString(), 80, y);
    ctx.fillText(game.level.toString(), 220, y);
    ctx.fillText(game.lives.toString(), 340, y);
    
    // Format date
    const date = new Date(game.date);
    const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
    ctx.fillText(dateStr, 460, y);
  }

  // Instructions
  ctx.font = '22px "Courier New"';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#00ff00';
  ctx.shadowBlur = 15;
  ctx.fillText('Press SPACEBAR to Return', WIDTH / 2, HEIGHT - 40);

  ctx.restore();
}

function drawGameOver() {
  ctx.save();

  // Semi-transparent overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Game Over text
  ctx.font = 'bold 70px "Courier New"';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ff0000';
  ctx.shadowBlur = 40;
  ctx.shadowColor = '#ff0000';
  ctx.fillText('GAME OVER', WIDTH / 2, HEIGHT / 2 - 60);

  // Score
  ctx.font = '30px "Courier New"';
  ctx.fillStyle = '#ffff00';
  ctx.shadowBlur = 20;
  ctx.shadowColor = '#ffff00';
  ctx.fillText(`Final Score: ${score}`, WIDTH / 2, HEIGHT / 2 + 20);

  // High Score
  if (score >= highScore) {
    ctx.fillStyle = '#00ff00';
    ctx.shadowColor = '#00ff00';
    ctx.fillText('NEW HIGH SCORE!', WIDTH / 2, HEIGHT / 2 + 60);
  } else {
    ctx.fillStyle = '#ff6600';
    ctx.shadowColor = '#ff6600';
    ctx.fillText(`High Score: ${highScore}`, WIDTH / 2, HEIGHT / 2 + 60);
  }

  // Restart instruction
  ctx.font = '24px "Courier New"';
  ctx.fillStyle = '#00ffff';
  ctx.shadowBlur = 15;
  ctx.fillText('Press SPACEBAR to Play Again', WIDTH / 2, HEIGHT / 2 + 120);

  ctx.restore();
}

function drawHUD() {
  ctx.save();

  // Score
  ctx.font = 'bold 24px "Courier New"';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffff00';
  ctx.shadowBlur = 10;
  ctx.shadowColor = '#ffff00';
  ctx.fillText(`Score: ${score}`, 20, 35);

  // Lives
  ctx.fillStyle = '#ff00ff';
  ctx.shadowColor = '#ff00ff';
  ctx.fillText(`Lives: ${playerLives}`, 20, 65);

  // Level
  ctx.fillStyle = '#00ff88';
  ctx.shadowColor = '#00ff88';
  ctx.fillText(`Level: ${currentLevel}`, 20, 95);

  // Progress to next level
  const progress = Math.min(enemiesDefeated, enemiesRequiredForLevel);
  ctx.fillStyle = '#ff9100';
  ctx.shadowColor = '#ff9100';
  ctx.fillText(`Progress: ${progress}/${enemiesRequiredForLevel}`, 20, 125);

  // High Score
  ctx.textAlign = 'right';
  ctx.fillStyle = '#00ffff';
  ctx.shadowColor = '#00ffff';
  ctx.fillText(`High: ${highScore}`, WIDTH - 20, 35);

  ctx.restore();
}

function render() {
  // Clear canvas
  ctx.fillStyle = '#000014';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Draw starfield
  stars.forEach(star => {
    star.update();
    star.draw();
  });

  // Draw game elements based on state
  if (gameState === GAME_STATES.START) {
    drawStartScreen();
  } else if (gameState === GAME_STATES.PLAYING) {
    // Draw particles
    particles.forEach(p => p.draw());

    // Draw bullets
    playerBullets.forEach(b => b.draw());

    // Draw enemies
    enemies.forEach(e => e.draw());

    // Draw player
    player.draw();

    // Draw HUD
    drawHUD();
  } else if (gameState === GAME_STATES.LEVEL_COMPLETE) {
    // Draw game elements faded
    particles.forEach(p => p.draw());
    playerBullets.forEach(b => b.draw());
    enemies.forEach(e => e.draw());
    player.draw();

    // Draw level complete screen
    drawLevelComplete();
  } else if (gameState === GAME_STATES.GAME_OVER) {
    // Draw game elements faded
    particles.forEach(p => p.draw());
    playerBullets.forEach(b => b.draw());
    enemies.forEach(e => e.draw());
    player.draw();

    // Draw game over screen
    drawGameOver();
  } else if (gameState === GAME_STATES.HISTORY) {
    drawHistory();
  }
}

// ========================================
// MAIN GAME LOOP
// ========================================

function gameLoop() {
  if (gameState === GAME_STATES.PLAYING) {
    updateGame();
  }

  render();
  requestAnimationFrame(gameLoop);
}

// Start the game loop
gameLoop();
