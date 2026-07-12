import { GRID_SIZE, SnakeGame } from './snake-engine.js';

const canvas = document.getElementById('gameCanvas');
const gameRegion = document.getElementById('snakeGame');

if (canvas && gameRegion) {
  const ctx = canvas.getContext('2d');
  const scoreOutput = document.getElementById('score');
  const highScoreOutput = document.getElementById('highScore');
  const statusOutput = document.getElementById('gameStatus');
  const startButton = document.getElementById('startBtn');
  const pauseButton = document.getElementById('pauseBtn');
  const resetButton = document.getElementById('resetBtn');
  const directionButtons = [...document.querySelectorAll('[data-direction]')];
  const game = new SnakeGame();
  const logicalSize = 360;
  let loop = null;
  let highScore = readHighScore();

  function readHighScore() {
    try {
      const value = Number.parseInt(localStorage.getItem('sg_snake_high') ?? '0', 10);
      return Number.isFinite(value) && value > 0 ? value : 0;
    } catch {
      return 0;
    }
  }

  function saveHighScore(value) {
    try {
      localStorage.setItem('sg_snake_high', String(value));
    } catch {
      // Storage can be unavailable in private or locked-down browsing modes.
    }
  }

  function stopLoop() {
    if (loop !== null) {
      clearInterval(loop);
      loop = null;
    }
  }

  function startLoop() {
    stopLoop();
    loop = window.setInterval(runTick, game.speed);
  }

  function announce(message) {
    statusOutput.textContent = message;
  }

  function updateControls() {
    const { state } = game;
    scoreOutput.value = String(game.score);
    scoreOutput.textContent = String(game.score);
    highScoreOutput.value = String(highScore);
    highScoreOutput.textContent = String(highScore);

    startButton.disabled = state === 'running';
    pauseButton.disabled = state !== 'running';
    startButton.textContent = state === 'paused'
      ? 'Resume'
      : state === 'game-over' || state === 'won'
        ? 'Play again'
        : 'Start';

    for (const button of directionButtons) {
      button.disabled = state !== 'running';
    }
  }

  function startOrResume() {
    const resumed = game.state === 'paused';
    if (!game.start()) return;
    announce(resumed ? 'Game resumed.' : 'Game running. Use arrow keys, WASD, or the direction buttons.');
    updateControls();
    draw();
    startLoop();
    gameRegion.focus({ preventScroll: true });
  }

  function pauseGame(message = 'Game paused.') {
    if (!game.pause()) return;
    stopLoop();
    announce(message);
    updateControls();
  }

  function resetGame() {
    stopLoop();
    game.reset();
    announce('Ready. Select Start, then use the game controls.');
    updateControls();
    draw();
  }

  function runTick() {
    const previousSpeed = game.speed;
    const result = game.tick();
    draw();

    if (result.type === 'ate') {
      if (game.score > highScore) {
        highScore = game.score;
        saveHighScore(highScore);
      }
      announce(`Score ${game.score}.`);
      if (game.speed !== previousSpeed) startLoop();
    } else if (result.type === 'game-over') {
      stopLoop();
      announce(`Game over. Final score ${game.score}. Select Play again or Reset.`);
    } else if (result.type === 'won') {
      stopLoop();
      if (game.score > highScore) {
        highScore = game.score;
        saveHighScore(highScore);
      }
      announce(`You filled the board with a score of ${game.score}. Select Play again or Reset.`);
    }

    updateControls();
  }

  function resizeCanvas() {
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = logicalSize * scale;
    canvas.height = logicalSize * scale;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    draw();
  }

  function draw() {
    const cellSize = logicalSize / GRID_SIZE;
    ctx.fillStyle = '#070708';
    ctx.fillRect(0, 0, logicalSize, logicalSize);

    if (game.food) drawCell(game.food, '#d8a574', false, cellSize);
    game.snake.forEach((segment, index) => {
      const alpha = 0.58 + (1 - index / game.snake.length) * 0.42;
      const color = index === 0 ? '#f5f5f6' : `rgba(241, 241, 242, ${alpha})`;
      drawCell(segment, color, index === 0, cellSize);
    });
  }

  function drawCell(cell, color, isHead, cellSize) {
    const padding = 1.2;
    const x = cell.x * cellSize + padding;
    const y = cell.y * cellSize + padding;
    const size = cellSize - padding * 2;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, size, size);

    if (isHead) {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.22)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
    }
  }

  const directionMap = {
    ArrowUp: [0, -1], w: [0, -1], W: [0, -1],
    ArrowDown: [0, 1], s: [0, 1], S: [0, 1],
    ArrowLeft: [-1, 0], a: [-1, 0], A: [-1, 0],
    ArrowRight: [1, 0], d: [1, 0], D: [1, 0],
  };

  gameRegion.addEventListener('keydown', (event) => {
    if (event.target.closest('button, a, input, select, textarea')) return;

    if (event.key in directionMap && game.state === 'running') {
      event.preventDefault();
      game.setDirection(...directionMap[event.key]);
      return;
    }

    if ((event.key === ' ' || event.key === 'Spacebar') && !event.repeat) {
      event.preventDefault();
      if (game.state === 'running') pauseGame();
      else startOrResume();
    }
  });

  startButton.addEventListener('click', startOrResume);
  pauseButton.addEventListener('click', () => pauseGame());
  resetButton.addEventListener('click', resetGame);
  canvas.addEventListener('pointerdown', () => gameRegion.focus({ preventScroll: true }));

  for (const button of directionButtons) {
    button.addEventListener('click', () => {
      const directions = {
        up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0],
      };
      game.setDirection(...directions[button.dataset.direction]);
    });
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && game.state === 'running') {
      pauseGame('Game paused while this page was in the background.');
    }
  });

  window.addEventListener('resize', resizeCanvas, { passive: true });
  highScoreOutput.textContent = String(highScore);
  resetGame();
  resizeCanvas();
}
