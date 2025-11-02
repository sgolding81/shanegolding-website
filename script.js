
document.getElementById('year').textContent = new Date().getFullYear();

/* =========== Particle background (same as earlier) =========== */
const bgCanvas = document.getElementById('bg');
const bgCtx = bgCanvas.getContext('2d');
let particlesArray;
const numParticles = 80;

function resizeBg() {
  bgCanvas.width = window.innerWidth;
  bgCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeBg);
resizeBg();

class Particle {
  constructor() {
    this.reset();
  }
  reset() {
    this.x = Math.random() * bgCanvas.width;
    this.y = Math.random() * bgCanvas.height;
    this.size = Math.random() * 2;
    this.speedX = Math.random() * 0.6 - 0.3;
    this.speedY = Math.random() * 0.6 - 0.3;
  }
  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    if (this.x < 0 || this.x > bgCanvas.width) this.speedX *= -1;
    if (this.y < 0 || this.y > bgCanvas.height) this.speedY *= -1;
  }
  draw() {
    bgCtx.beginPath();
    bgCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    bgCtx.fillStyle = 'rgba(0,180,255,0.6)';
    bgCtx.fill();
  }
}

function initBg() {
  particlesArray = [];
  for (let i = 0; i < numParticles; i++) particlesArray.push(new Particle());
}

function animateBg() {
  bgCtx.clearRect(0,0,bgCanvas.width,bgCanvas.height);
  for (let p of particlesArray) { p.update(); p.draw(); }
  connectBg();
  requestAnimationFrame(animateBg);
}

function connectBg() {
  for (let a = 0; a < particlesArray.length; a++) {
    for (let b = a; b < particlesArray.length; b++) {
      const dx = particlesArray[a].x - particlesArray[b].x;
      const dy = particlesArray[a].y - particlesArray[b].y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < 100) {
        const op = 1 - dist / 100;
        bgCtx.strokeStyle = `rgba(0,180,255,${op * 0.25})`;
        bgCtx.lineWidth = 0.5;
        bgCtx.beginPath();
        bgCtx.moveTo(particlesArray[a].x, particlesArray[a].y);
        bgCtx.lineTo(particlesArray[b].x, particlesArray[b].y);
        bgCtx.stroke();
      }
    }
  }
}

initBg();
animateBg();

/* =========== Typing effect fallback width safety =========== */
// If user rescales or font load changes layout, no action needed — typing uses ch width.

/* =========== Snake Game Implementation =========== */
(function() {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  // Game configuration
  let gridSize = 18; // cells per row/column (square grid)
  const cellPadding = 1; // visual padding inside cells
  let cellSize; // pixel size calculated from canvas

  // State
  let snake = [{x:9,y:9}]; // array of {x,y} segments
  let dir = {x:0,y:0}; // current direction
  let nextDir = {x:0,y:0}; // queued direction
  let food = null;
  let score = 0;
  let highScore = parseInt(localStorage.getItem('sg_snake_high') || '0', 10) || 0;
  let running = false;
  let gameInterval = null;
  let speed = 120; // ms per tick (lower = faster)
  const minGrid = 12, maxGrid = 28;

  const scoreEl = document.getElementById('score');
  const highEl = document.getElementById('highScore');
  const startBtn = document.getElementById('startBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const resetBtn = document.getElementById('resetBtn');
  const gridLabel = document.getElementById('gridSizeLabel');
  const gridLabel2 = document.getElementById('gridSizeLabel2');

  highEl.textContent = highScore;
  scoreEl.textContent = score;
  gridLabel.textContent = gridSize;
  gridLabel2.textContent = gridSize;

  // Responsive canvas sizing to keep square
  function resizeGameCanvas() {
    // choose a display size (max 420)
    const maxDisplay = Math.min(window.innerWidth - 40, 420);
    const display = Math.max(240, Math.min(maxDisplay, 380));
    canvas.style.width = display + 'px';
    canvas.style.height = display + 'px';

    // set internal resolution according to grid to keep sharp cells
    const devicePixelRatio = window.devicePixelRatio || 1;
    const internalSize = gridSize * 18; // baseline 18px per cell
    canvas.width = gridSize * Math.round(internalSize / gridSize) * devicePixelRatio;
    canvas.height = canvas.width;
    cellSize = canvas.width / gridSize;
  }
  window.addEventListener('resize', resizeGameCanvas);
  resizeGameCanvas();

  // Initialize or reset game
  function resetGame() {
    snake = [{x: Math.floor(gridSize/2), y: Math.floor(gridSize/2)}];
    dir = {x:0,y:0};
    nextDir = {x:0,y:0};
    score = 0;
    updateScore();
    spawnFood();
    stopLoop();
    running = false;
  }

  function startGame() {
    if (running) return;
    running = true;
    // if stationary, give initial direction to the right
    if (dir.x === 0 && dir.y === 0 && nextDir.x === 0 && nextDir.y === 0) {
      dir = {x:1,y:0};
    }
    startLoop();
  }

  function pauseGame() {
    running = false;
    stopLoop();
  }

  function startLoop() {
    stopLoop();
    gameInterval = setInterval(tick, speed);
  }
  function stopLoop() {
    if (gameInterval) { clearInterval(gameInterval); gameInterval = null; }
  }

  function updateScore() {
    scoreEl.textContent = score;
    if (score > highScore) {
      highScore = score;
      highEl.textContent = highScore;
      localStorage.setItem('sg_snake_high', highScore.toString());
    }
  }

  function spawnFood() {
    // find empty cell
    let tries = 0;
    while (tries < 1000) {
      const fx = Math.floor(Math.random() * gridSize);
      const fy = Math.floor(Math.random() * gridSize);
      const collision = snake.some(s => s.x === fx && s.y === fy);
      if (!collision) { food = {x:fx,y:fy}; return; }
      tries++;
    }
    // fallback: if no place found, set food null
    food = null;
  }

  function tick() {
    // apply queued direction if valid (no reverse)
    if ((nextDir.x !== -dir.x || nextDir.y !== -dir.y) && (nextDir.x !== 0 || nextDir.y !== 0)) {
      dir = {...nextDir};
    }

    if (dir.x === 0 && dir.y === 0) return; // not moving yet

    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    // wrap-around behavior (or you can change to wall-collision)
    if (head.x < 0) head.x = gridSize - 1;
    if (head.x >= gridSize) head.x = 0;
    if (head.y < 0) head.y = gridSize - 1;
    if (head.y >= gridSize) head.y = 0;

    // check self-collision
    if (snake.some(seg => seg.x === head.x && seg.y === head.y)) {
      // game over: stop and reset direction
      pauseGame();
      // brief flash or message - we'll reset after short delay
      setTimeout(() => {
        resetGame();
        draw(); // show reset screen
      }, 400);
      return;
    }

    snake.unshift(head);

    // ate food?
    if (food && head.x === food.x && head.y === food.y) {
      score += 1;
      updateScore();
      spawnFood();
      // optionally increase speed slightly
      if (score % 5 === 0 && speed > 45) {
        speed = Math.max(45, speed - 6);
        if (running) startLoop();
      }
    } else {
      snake.pop(); // move forward
    }

    draw();
  }

  function clearCanvas() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
  }

  function drawGrid() {
    // optional: subtle grid lines or background
  }

  function draw() {
    clearCanvas();
    // background fill
    ctx.fillStyle = '#050505';
    ctx.fillRect(0,0,canvas.width,canvas.height);

    // draw food
    if (food) {
      drawCell(food.x, food.y, '#ff6b6b');
    }

    // draw snake
    for (let i=0;i<snake.length;i++) {
      const s = snake[i];
      const shade = i === 0 ? '#00e0ff' : `rgba(0,180,255,${0.4 + (i/snake.length)*0.45})`;
      drawCell(s.x, s.y, shade, i===0);
    }
  }

  function drawCell(x,y,color,isHead) {
    const pad = cellPadding;
    const px = Math.round(x * cellSize) + pad;
    const py = Math.round(y * cellSize) + pad;
    const size = Math.round(cellSize) - pad*2;
    // body
    ctx.fillStyle = color;
    ctx.fillRect(px, py, size, size);
    // head highlight
    if (isHead) {
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = Math.max(1, Math.round(cellSize*0.04));
      ctx.strokeRect(px + 0.5, py + 0.5, size - 1, size - 1);
    }
  }

  // Input handling
  window.addEventListener('keydown', (e) => {
    const key = e.key;
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d','W','A','S','D'].includes(key)) {
      e.preventDefault();
      if (key === 'ArrowUp' || key === 'w' || key === 'W') setDirection(0,-1);
      if (key === 'ArrowDown' || key === 's' || key === 'S') setDirection(0,1);
      if (key === 'ArrowLeft' || key === 'a' || key === 'A') setDirection(-1,0);
      if (key === 'ArrowRight' || key === 'd' || key === 'D') setDirection(1,0);
    } else if (key === ' ' || key === 'Spacebar') {
      // space toggles start/pause
      if (running) pauseGame(); else startGame();
    }
  });

  function setDirection(x,y) {
    // queue it (prevent reversing directly)
    if (dir.x === -x && dir.y === -y) return;
    nextDir = {x,y};
  }

  // Buttons
  startBtn.addEventListener('click', () => { startGame(); });
  pauseBtn.addEventListener('click', () => {
    if (running) { pauseGame(); pauseBtn.textContent = 'Resume'; }
    else { startGame(); pauseBtn.textContent = 'Pause'; }
  });
  resetBtn.addEventListener('click', () => { resetGame(); draw(); });

  // Touch swipe support (basic)
  let touchStart = null;
  canvas.addEventListener('touchstart', (ev) => {
    const t = ev.touches[0];
    touchStart = {x:t.clientX, y:t.clientY, time: Date.now()};
  }, {passive:true});
  canvas.addEventListener('touchmove', (ev) => {
    ev.preventDefault();
  }, {passive:false});
  canvas.addEventListener('touchend', (ev) => {
    if (!touchStart) return;
    const t = ev.changedTouches[0];
    const dx = t.clientX - touchStart.x;
    const dy = t.clientY - touchStart.y;
    const adx = Math.abs(dx), ady = Math.abs(dy);
    if (Math.max(adx,ady) > 20) {
      if (adx > ady) {
        if (dx > 0) setDirection(1,0); else setDirection(-1,0);
      } else {
        if (dy > 0) setDirection(0,1); else setDirection(0,-1);
      }
    } else {
      // tap: toggle start/pause
      if (running) pauseGame(); else startGame();
    }
    touchStart = null;
  });

  // Initialize game with safe defaults
  function init() {
    // Ensure canvas internal sizing matches grid
    resizeGameCanvas();
    resetGame();
    // draw initial frame
    draw();
  }

  init();

  // Expose some helpers for debugging or future UI
  window.__sg_snake = {
    setGrid: (n) => {
      gridSize = Math.max(minGrid, Math.min(maxGrid, Math.floor(n)));
      gridLabel.textContent = gridSize;
      gridLabel2.textContent = gridSize;
      resizeGameCanvas();
      resetGame();
      draw();
    }
  };
})();
