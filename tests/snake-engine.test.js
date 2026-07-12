import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INITIAL_SPEED,
  MIN_SPEED,
  SnakeGame,
} from '../assets/js/snake-engine.js';

function runningGame({ size = 6, snake, direction, food, score = 0 } = {}) {
  const game = new SnakeGame({ size, random: () => 0 });
  game.state = 'running';
  game.snake = snake ?? [{ x: 2, y: 2 }];
  game.direction = direction ?? { x: 1, y: 0 };
  game.nextDirection = { ...game.direction };
  game.food = food ?? { x: size - 1, y: size - 1 };
  game.score = score;
  game.turnQueued = false;
  return game;
}

test('reset restores the complete initial state', () => {
  const game = new SnakeGame({ random: () => 0 });
  game.start();
  game.score = 12;
  game.speed = MIN_SPEED;
  game.state = 'game-over';
  const state = game.reset();

  assert.equal(state.state, 'idle');
  assert.equal(state.score, 0);
  assert.equal(state.speed, INITIAL_SPEED);
  assert.equal(state.snake.length, 1);
  assert.deepEqual(state.direction, { x: 0, y: 0 });
  assert.ok(state.food);
});

test('start, pause, resume, game over, and replay are explicit transitions', () => {
  const game = new SnakeGame({ random: () => 0 });
  assert.equal(game.pause(), false);
  assert.equal(game.start(), true);
  assert.equal(game.state, 'running');
  assert.equal(game.pause(), true);
  assert.equal(game.state, 'paused');
  assert.equal(game.resume(), true);

  game.state = 'game-over';
  game.score = 7;
  assert.equal(game.start(), true);
  assert.equal(game.state, 'running');
  assert.equal(game.score, 0);
  assert.equal(game.speed, INITIAL_SPEED);
});

test('movement wraps at every board edge', () => {
  const cases = [
    [{ x: 0, y: 2 }, { x: -1, y: 0 }, { x: 3, y: 2 }],
    [{ x: 3, y: 2 }, { x: 1, y: 0 }, { x: 0, y: 2 }],
    [{ x: 2, y: 0 }, { x: 0, y: -1 }, { x: 2, y: 3 }],
    [{ x: 2, y: 3 }, { x: 0, y: 1 }, { x: 2, y: 0 }],
  ];

  for (const [head, direction, expected] of cases) {
    const game = runningGame({ size: 4, snake: [head], direction, food: { x: 1, y: 1 } });
    game.tick();
    assert.deepEqual(game.snake[0], expected);
  }
});

test('a direct reversal and a second turn in the same tick are rejected', () => {
  const game = runningGame();
  assert.equal(game.setDirection(-1, 0), false);
  assert.equal(game.setDirection(0, -1), true);
  assert.equal(game.setDirection(-1, 0), false);
  game.tick();
  assert.deepEqual(game.direction, { x: 0, y: -1 });
});

test('normal movement preserves length and eating grows the snake', () => {
  const move = runningGame({ snake: [{ x: 1, y: 1 }, { x: 0, y: 1 }], food: { x: 5, y: 5 } });
  assert.equal(move.tick().type, 'move');
  assert.equal(move.snake.length, 2);

  const eat = runningGame({ snake: [{ x: 1, y: 1 }], food: { x: 2, y: 1 } });
  assert.equal(eat.tick().type, 'ate');
  assert.equal(eat.snake.length, 2);
  assert.equal(eat.score, 1);
});

test('speed changes every five points and never drops below the minimum', () => {
  const game = runningGame({ snake: [{ x: 1, y: 1 }], food: { x: 2, y: 1 }, score: 4 });
  game.tick();
  assert.equal(game.score, 5);
  assert.equal(game.speed, INITIAL_SPEED - 6);

  game.score = 500;
  game.snake = [{ x: 2, y: 1 }];
  game.food = { x: 3, y: 1 };
  game.direction = { x: 1, y: 0 };
  game.nextDirection = { x: 1, y: 0 };
  game.tick();
  assert.equal(game.speed, MIN_SPEED);
});

test('moving into the departing tail is valid but hitting the body ends the game', () => {
  const tailMove = runningGame({
    snake: [
      { x: 1, y: 1 },
      { x: 1, y: 2 },
      { x: 0, y: 2 },
      { x: 0, y: 1 },
    ],
    direction: { x: -1, y: 0 },
    food: { x: 5, y: 5 },
  });
  assert.equal(tailMove.tick().type, 'move');
  assert.deepEqual(tailMove.snake[0], { x: 0, y: 1 });

  const collision = runningGame({
    snake: [
      { x: 1, y: 1 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
      { x: 2, y: 1 },
    ],
    direction: { x: 0, y: 1 },
    food: { x: 5, y: 5 },
  });
  assert.equal(collision.tick().type, 'game-over');
  assert.equal(collision.state, 'game-over');
});

test('filling the final free cell wins and keeps the completed board', () => {
  const game = runningGame({
    size: 2,
    snake: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
    direction: { x: 1, y: 0 },
    food: { x: 1, y: 0 },
  });
  assert.equal(game.tick().type, 'won');
  assert.equal(game.state, 'won');
  assert.equal(game.snake.length, 4);
  assert.equal(game.food, null);
});

test('food placement uses the injected random source and only free cells', () => {
  const game = new SnakeGame({ size: 3, random: () => 0.999 });
  game.snake = [
    { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 },
    { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 },
    { x: 0, y: 2 }, { x: 1, y: 2 },
  ];
  assert.equal(game.spawnFood(), true);
  assert.deepEqual(game.food, { x: 2, y: 2 });
});
