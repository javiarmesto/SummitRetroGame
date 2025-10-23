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
  GAME_OVER: 'gameover'
};

let gameState = GAME_STATES.START;
let score = 0;
let highScore = localStorage.getItem('spaceShooterHighScore') || 0;
let playerLives = 3;

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
  ' ': false // Spacebar
};

document.addEventListener('keydown', (e) => {
  if (e.key in keys) {
    e.preventDefault();
    keys[e.key] = true;

    // Start game on spacebar from start screen
    if (gameState === GAME_STATES.START && e.key === ' ') {
      startGame();
    }

    // Restart game on spacebar from game over screen
    if (gameState === GAME_STATES.GAME_OVER && e.key === ' ') {
      startGame();
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
// ENEMY BULLETS
// ========================================

class EnemyBullet {
  constructor(x, y, targetX, targetY) {
    this.x = x;
    this.y = y;
    this.width = 6;
    this.height = 6;
    this.speed = 4;

    // Calculate direction towards target
    const dx = targetX - x;
    const dy = targetY - y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    this.vx = (dx / distance) * this.speed;
    this.vy = (dy / distance) * this.speed;

    this.color = '#ff0000';
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
  }

  draw() {
    ctx.save();
    ctx.shadowBlur = 15;
    ctx.shadowColor = this.color;
    ctx.fillStyle = this.color;

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
    ctx.fill();

    // Inner glow
    ctx.fillStyle = '#ffff00';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.width / 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  isOffScreen() {
    return this.x < -20 || this.x > WIDTH + 20 || this.y < -20 || this.y > HEIGHT + 20;
  }
}

const enemyBullets = [];

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
    this.speed = selectedType.speed;
    this.health = selectedType.health;
    this.maxHealth = selectedType.health;
    this.points = selectedType.points;

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
// BOSS - GIANT PINEAPPLE
// ========================================

class Boss {
  constructor() {
    this.width = 120;
    this.height = 140;
    this.x = WIDTH / 2 - this.width / 2;
    this.y = -this.height;
    this.speed = 1;
    this.health = 100;
    this.maxHealth = 100;
    this.points = 5000;

    // Movement pattern
    this.targetY = 80;
    this.movePhase = 'entering'; // entering, fighting, leaving
    this.horizontalSpeed = 2;
    this.direction = 1;

    // Attack patterns
    this.shootTimer = 0;
    this.shootDelay = 60; // Frames between attacks
    this.attackPattern = 0;

    // Visual effects
    this.color = '#ffd700'; // Gold
    this.glowPhase = 0;
    this.isAngry = false; // When health < 50%
  }

  update() {
    this.glowPhase += 0.1;

    if (this.movePhase === 'entering') {
      // Move down to fighting position
      if (this.y < this.targetY) {
        this.y += this.speed;
      } else {
        this.movePhase = 'fighting';
      }
    } else if (this.movePhase === 'fighting') {
      // Horizontal movement
      this.x += this.horizontalSpeed * this.direction;

      if (this.x <= 0 || this.x >= WIDTH - this.width) {
        this.direction *= -1;
      }

      // Check if angry mode (health < 50%)
      if (this.health < this.maxHealth / 2) {
        this.isAngry = true;
        this.horizontalSpeed = 3;
        this.shootDelay = 40; // Shoot faster when angry
      }

      // Attack logic
      this.shootTimer++;
      if (this.shootTimer >= this.shootDelay) {
        this.attack();
        this.shootTimer = 0;
        this.attackPattern = (this.attackPattern + 1) % 3;
      }
    } else if (this.movePhase === 'leaving') {
      // Move up off screen
      this.y -= this.speed * 2;
    }
  }

  attack() {
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;

    if (this.attackPattern === 0) {
      // Pattern 1: Shoot at player
      enemyBullets.push(new EnemyBullet(centerX, centerY, player.x + player.width / 2, player.y + player.height / 2));
    } else if (this.attackPattern === 1) {
      // Pattern 2: Spray of bullets
      for (let i = 0; i < 5; i++) {
        const angle = (Math.PI / 4) * i - Math.PI / 2;
        const targetX = centerX + Math.cos(angle) * 300;
        const targetY = centerY + Math.sin(angle) * 300;
        enemyBullets.push(new EnemyBullet(centerX, centerY, targetX, targetY));
      }
    } else if (this.attackPattern === 2) {
      // Pattern 3: Circle of bullets
      const bulletCount = this.isAngry ? 12 : 8;
      for (let i = 0; i < bulletCount; i++) {
        const angle = (Math.PI * 2 * i) / bulletCount;
        const targetX = centerX + Math.cos(angle) * 300;
        const targetY = centerY + Math.sin(angle) * 300;
        enemyBullets.push(new EnemyBullet(centerX, centerY, targetX, targetY));
      }
    }
  }

  draw() {
    ctx.save();

    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;

    // Pulsing glow effect
    const glowIntensity = 20 + Math.sin(this.glowPhase) * 10;
    ctx.shadowBlur = glowIntensity;
    ctx.shadowColor = this.isAngry ? '#ff0000' : this.color;

    // Pineapple body (oval shape)
    ctx.fillStyle = this.isAngry ? '#ff8800' : this.color;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY + 10, this.width / 2.2, this.height / 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pineapple pattern (diamond grid)
    ctx.strokeStyle = this.isAngry ? '#cc4400' : '#cc9900';
    ctx.lineWidth = 2;
    const rows = 6;
    const cols = 5;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const offsetX = (row % 2) * 8;
        const px = centerX - 35 + col * 15 + offsetX;
        const py = centerY - 20 + row * 15;

        ctx.beginPath();
        ctx.moveTo(px, py - 5);
        ctx.lineTo(px + 5, py);
        ctx.lineTo(px, py + 5);
        ctx.lineTo(px - 5, py);
        ctx.closePath();
        ctx.stroke();
      }
    }

    // Pineapple leaves (crown)
    ctx.fillStyle = '#2e7d32';
    for (let i = 0; i < 7; i++) {
      const angle = (Math.PI * 2 * i) / 7 - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - this.height / 2.5);
      ctx.lineTo(centerX + Math.cos(angle) * 30, centerY - this.height / 2.5 - 40);
      ctx.lineTo(centerX + Math.cos(angle) * 15, centerY - this.height / 2.5 - 10);
      ctx.closePath();
      ctx.fill();
    }

    // Angry eyes when damaged
    if (this.isAngry) {
      ctx.fillStyle = '#ff0000';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ff0000';

      // Left eye
      ctx.beginPath();
      ctx.arc(centerX - 20, centerY - 10, 8, 0, Math.PI * 2);
      ctx.fill();

      // Right eye
      ctx.beginPath();
      ctx.arc(centerX + 20, centerY - 10, 8, 0, Math.PI * 2);
      ctx.fill();

      // Angry mouth
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(centerX, centerY + 15, 15, 0.2 * Math.PI, 0.8 * Math.PI);
      ctx.stroke();
    }

    ctx.restore();
  }

  takeDamage() {
    this.health--;
    if (this.health <= 0) {
      this.movePhase = 'leaving';
      return true;
    }
    return false;
  }

  isDefeated() {
    return this.health <= 0;
  }

  isOffScreen() {
    return this.y < -this.height - 50;
  }
}

let currentBoss = null;
let bossActive = false;
let nextBossScore = 3000; // First boss at 3000 points

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
  // Don't spawn regular enemies during boss fight
  if (bossActive) return;

  spawnTimer++;

  if (spawnTimer >= spawnRate) {
    spawnEnemy();
    spawnTimer = 0;

    // Increase difficulty over time
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

  // Check if it's time to spawn a boss
  if (score >= nextBossScore && !bossActive && !currentBoss) {
    spawnBoss();
  }
}

function spawnBoss() {
  currentBoss = new Boss();
  bossActive = true;
  enemies.length = 0; // Clear regular enemies
}

// ========================================
// GAME LOGIC
// ========================================

const player = new Player();

function startGame() {
  gameState = GAME_STATES.PLAYING;
  score = 0;
  playerLives = 3;

  // Clear arrays
  enemies.length = 0;
  playerBullets.length = 0;
  enemyBullets.length = 0;
  particles.length = 0;

  // Reset spawn timer
  spawnTimer = 0;
  spawnRate = 60;
  waveNumber = 0;

  // Reset boss
  currentBoss = null;
  bossActive = false;
  nextBossScore = 3000;

  // Reset player position
  player.x = WIDTH / 2 - player.width / 2;
  player.y = HEIGHT - player.height - 30;
}

function updateGame() {
  // Update player
  player.update();

  // Update player bullets
  for (let i = playerBullets.length - 1; i >= 0; i--) {
    playerBullets[i].update();

    // Remove off-screen bullets
    if (playerBullets[i].isOffScreen()) {
      playerBullets.splice(i, 1);
    }
  }

  // Update enemy bullets
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    enemyBullets[i].update();

    // Check collision with player
    if (checkCollision(enemyBullets[i], player)) {
      createExplosion(player.x + player.width / 2, player.y + player.height / 2, '#ff1493');
      enemyBullets.splice(i, 1);
      playerLives--;

      if (playerLives <= 0) {
        gameOver();
      }
      continue;
    }

    // Remove off-screen bullets
    if (enemyBullets[i].isOffScreen()) {
      enemyBullets.splice(i, 1);
    }
  }

  // Update boss
  if (currentBoss) {
    currentBoss.update();

    // Check collision with player
    if (currentBoss.movePhase === 'fighting' && checkCollision(player, currentBoss)) {
      createExplosion(player.x + player.width / 2, player.y + player.height / 2, '#ff1493');
      playerLives--;

      if (playerLives <= 0) {
        gameOver();
      }
    }

    // Check collision with player bullets
    for (let j = playerBullets.length - 1; j >= 0; j--) {
      if (checkCollision(playerBullets[j], currentBoss)) {
        currentBoss.takeDamage();
        playerBullets.splice(j, 1);

        if (currentBoss.isDefeated()) {
          score += currentBoss.points;
          createExplosion(currentBoss.x + currentBoss.width / 2,
                         currentBoss.y + currentBoss.height / 2,
                         currentBoss.color);
          // Create bigger explosion for boss
          for (let k = 0; k < 3; k++) {
            setTimeout(() => {
              createExplosion(currentBoss.x + currentBoss.width / 2 + rand(-30, 30),
                             currentBoss.y + currentBoss.height / 2 + rand(-30, 30),
                             currentBoss.color);
            }, k * 100);
          }
        }
        break;
      }
    }

    // Remove boss if off screen after defeat
    if (currentBoss.isOffScreen() && currentBoss.movePhase === 'leaving') {
      currentBoss = null;
      bossActive = false;
      nextBossScore = score + 3000; // Next boss in 3000 points
    }
  }

  // Update regular enemies
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

function gameOver() {
  gameState = GAME_STATES.GAME_OVER;

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

  // High Score
  if (highScore > 0) {
    ctx.font = '20px "Courier New"';
    ctx.fillStyle = '#00ff88';
    ctx.fillText(`High Score: ${highScore}`, WIDTH / 2, HEIGHT - 50);
  }

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

  // High Score
  ctx.textAlign = 'right';
  ctx.fillStyle = '#00ffff';
  ctx.shadowColor = '#00ffff';
  ctx.fillText(`High: ${highScore}`, WIDTH - 20, 35);

  // Boss warning or health bar
  if (bossActive && currentBoss) {
    if (currentBoss.movePhase === 'entering') {
      // Boss warning
      ctx.font = 'bold 48px "Courier New"';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ff0000';
      ctx.shadowBlur = 30;
      ctx.shadowColor = '#ff0000';
      ctx.fillText('WARNING!', WIDTH / 2, HEIGHT / 2);

      ctx.font = 'bold 36px "Courier New"';
      ctx.fillStyle = '#ffd700';
      ctx.shadowColor = '#ffd700';
      ctx.fillText('BOSS APPROACHING', WIDTH / 2, HEIGHT / 2 + 50);
    } else if (currentBoss.movePhase === 'fighting') {
      // Boss health bar
      const barWidth = 600;
      const barHeight = 30;
      const barX = (WIDTH - barWidth) / 2;
      const barY = 20;
      const healthPercent = currentBoss.health / currentBoss.maxHealth;

      // Background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(barX - 5, barY - 5, barWidth + 10, barHeight + 10);

      // Border
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 3;
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#ffd700';
      ctx.strokeRect(barX - 5, barY - 5, barWidth + 10, barHeight + 10);

      // Health bar background
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#330000';
      ctx.fillRect(barX, barY, barWidth, barHeight);

      // Health bar fill
      const gradient = ctx.createLinearGradient(barX, 0, barX + barWidth * healthPercent, 0);
      if (currentBoss.isAngry) {
        gradient.addColorStop(0, '#ff0000');
        gradient.addColorStop(1, '#ff8800');
      } else {
        gradient.addColorStop(0, '#00ff00');
        gradient.addColorStop(1, '#ffff00');
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

      // Boss name and health text
      ctx.font = 'bold 20px "Courier New"';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 5;
      ctx.shadowColor = '#000000';
      ctx.fillText(`BOSS: GIANT PINEAPPLE - ${currentBoss.health}/${currentBoss.maxHealth}`, WIDTH / 2, barY + barHeight / 2 + 7);
    }
  } else if (!bossActive && score > 0) {
    // Next boss indicator
    const remaining = nextBossScore - score;
    if (remaining > 0 && remaining <= 500) {
      ctx.font = '18px "Courier New"';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ff8800';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ff8800';
      ctx.fillText(`Next Boss in ${remaining} pts`, WIDTH / 2, HEIGHT - 20);
    }
  }

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
    enemyBullets.forEach(b => b.draw());

    // Draw enemies
    enemies.forEach(e => e.draw());

    // Draw boss
    if (currentBoss) {
      currentBoss.draw();
    }

    // Draw player
    player.draw();

    // Draw HUD
    drawHUD();
  } else if (gameState === GAME_STATES.GAME_OVER) {
    // Draw game elements faded
    particles.forEach(p => p.draw());
    playerBullets.forEach(b => b.draw());
    enemyBullets.forEach(b => b.draw());
    enemies.forEach(e => e.draw());
    if (currentBoss) {
      currentBoss.draw();
    }
    player.draw();

    // Draw game over screen
    drawGameOver();
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
