export const GRID_SIZE = 18;
export const INITIAL_SPEED = 120;
export const MIN_SPEED = 45;
export const SPEED_STEP = 6;

const CARDINAL_DIRECTIONS = new Set(['0,-1', '0,1', '-1,0', '1,0']);

function sameCell(a, b) {
  return a.x === b.x && a.y === b.y;
}

function cloneCell(cell) {
  return cell ? { x: cell.x, y: cell.y } : null;
}

export class SnakeGame {
  constructor({ size = GRID_SIZE, random = Math.random } = {}) {
    if (!Number.isInteger(size) || size < 2) {
      throw new TypeError('Snake board size must be an integer of at least 2.');
    }
    if (typeof random !== 'function') {
      throw new TypeError('Snake random source must be a function.');
    }

    this.size = size;
    this.random = random;
    this.reset();
  }

  reset() {
    const center = Math.floor(this.size / 2);
    this.snake = [{ x: center, y: center }];
    this.direction = { x: 0, y: 0 };
    this.nextDirection = { x: 0, y: 0 };
    this.turnQueued = false;
    this.score = 0;
    this.speed = INITIAL_SPEED;
    this.state = 'idle';
    this.food = null;
    this.spawnFood();
    return this.snapshot();
  }

  start() {
    if (this.state === 'running') return false;
    if (this.state === 'paused') return this.resume();
    if (this.state === 'game-over' || this.state === 'won') this.reset();

    if (this.direction.x === 0 && this.direction.y === 0) {
      this.direction = { x: 1, y: 0 };
      this.nextDirection = { x: 1, y: 0 };
    }
    this.state = 'running';
    return true;
  }

  pause() {
    if (this.state !== 'running') return false;
    this.state = 'paused';
    return true;
  }

  resume() {
    if (this.state !== 'paused') return false;
    this.state = 'running';
    return true;
  }

  setDirection(x, y) {
    if (this.state !== 'running' || this.turnQueued) return false;
    if (!CARDINAL_DIRECTIONS.has(`${x},${y}`)) return false;
    if (this.direction.x === -x && this.direction.y === -y) return false;

    this.nextDirection = { x, y };
    this.turnQueued = true;
    return true;
  }

  tick() {
    if (this.state !== 'running') {
      return { type: 'idle', snapshot: this.snapshot() };
    }

    this.direction = { ...this.nextDirection };
    this.turnQueued = false;

    const head = {
      x: (this.snake[0].x + this.direction.x + this.size) % this.size,
      y: (this.snake[0].y + this.direction.y + this.size) % this.size,
    };
    const ate = this.food && sameCell(head, this.food);
    const collisionBody = ate ? this.snake : this.snake.slice(0, -1);

    if (collisionBody.some((segment) => sameCell(segment, head))) {
      this.state = 'game-over';
      return { type: 'game-over', snapshot: this.snapshot() };
    }

    this.snake.unshift(head);

    if (!ate) {
      this.snake.pop();
      return { type: 'move', snapshot: this.snapshot() };
    }

    this.score += 1;
    this.speed = Math.max(
      MIN_SPEED,
      INITIAL_SPEED - Math.floor(this.score / 5) * SPEED_STEP,
    );

    if (!this.spawnFood()) {
      this.state = 'won';
      return { type: 'won', snapshot: this.snapshot() };
    }

    return { type: 'ate', snapshot: this.snapshot() };
  }

  spawnFood() {
    const occupied = new Set(this.snake.map((segment) => `${segment.x},${segment.y}`));
    const freeCells = [];

    for (let y = 0; y < this.size; y += 1) {
      for (let x = 0; x < this.size; x += 1) {
        if (!occupied.has(`${x},${y}`)) freeCells.push({ x, y });
      }
    }

    if (freeCells.length === 0) {
      this.food = null;
      return false;
    }

    const rawIndex = Math.floor(this.random() * freeCells.length);
    const index = Math.max(0, Math.min(freeCells.length - 1, rawIndex));
    this.food = freeCells[index];
    return true;
  }

  snapshot() {
    return {
      size: this.size,
      snake: this.snake.map(cloneCell),
      direction: cloneCell(this.direction),
      food: cloneCell(this.food),
      score: this.score,
      speed: this.speed,
      state: this.state,
    };
  }
}
