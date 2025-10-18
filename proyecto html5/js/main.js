const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const w = canvas.width;
const h = canvas.height;

const balls = [];

function rand(min, max){ return Math.random()*(max-min)+min }

class Ball{
  constructor(){
    this.r = rand(8, 28);
    this.x = rand(this.r, w - this.r);
    this.y = rand(this.r, h - this.r);
    this.vx = rand(-2.5, 2.5);
    this.vy = rand(-2.5, 2.5);
    this.color = `hsl(${Math.floor(rand(0,360))} 70% 60%)`;
  }
  update(){
    this.x += this.vx;
    this.y += this.vy;
    if(this.x - this.r < 0 || this.x + this.r > w) this.vx *= -1;
    if(this.y - this.r < 0 || this.y + this.r > h) this.vy *= -1;
  }
  draw(ctx){
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.arc(this.x, this.y, this.r, 0, Math.PI*2);
    ctx.fill();
  }
}

for(let i=0;i<18;i++) balls.push(new Ball());

function loop(){
  ctx.clearRect(0,0,w,h);
  for(const b of balls){ b.update(); b.draw(ctx) }
  requestAnimationFrame(loop);
}

loop();

// Basic interaction: click to add a ball
canvas.addEventListener('pointerdown', e=>{
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const b = new Ball(); b.x = x; b.y = y; balls.push(b);
});
