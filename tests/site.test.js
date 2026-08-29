import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canonicalPages,
  invalidAriaCurrentTargets,
  root,
  validateSite,
} from '../scripts/check-site.mjs';

const caseStudies = [
  ['webcam-streaming.html', 'assets/images/webcam-streaming.svg'],
  ['discord-assistant-bridge.html', 'assets/images/discord-assistant-bridge.svg'],
  ['accessible-snake.html', 'assets/images/accessible-snake.svg'],
];

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

test('site structure, metadata, links, assets, and contrast are valid', () => {
  assert.deepEqual(validateSite(), []);
});

test('all three projects have canonical case studies and original SVG visuals', () => {
  assert.deepEqual(canonicalPages, [
    'index.html',
    'about.html',
    'webcam-streaming.html',
    'discord-assistant-bridge.html',
    'accessible-snake.html',
    'privacy.html',
    'terms.html',
  ]);

  const index = read('index.html');
  for (const [page, image] of caseStudies) {
    assert.match(index, new RegExp(`href="/${page}"`));
    assert.match(index, new RegExp(`src="/${image.replaceAll('/', '\\/')}"`));
    assert.ok(fs.existsSync(path.join(root, page)));
    assert.ok(fs.existsSync(path.join(root, image)));
    assert.match(read(page), new RegExp(`src="/${image.replaceAll('/', '\\/')}"`));
  }
});

test('interaction and deployment accessibility contracts stay explicit', () => {
  const css = read('assets/css/site.css');
  const workflow = read('.github/workflows/pages.yml');
  const snakeUi = read('assets/js/snake-ui.js');

  assert.match(css, /\.skip-link:focus-visible\s*\{[^}]*transform:\s*translateY\(0\)/s);
  assert.match(css, /@media\s*\(max-width:\s*420px\)[\s\S]*#gameCanvas[\s\S]*max-height:/);
  assert.match(css, /\.direction-button\s*\{[^}]*min-width:\s*44px[^}]*min-height:\s*44px/s);
  assert.match(snakeUi, /gameRegion\.addEventListener\(['"]keydown/);
  assert.doesNotMatch(snakeUi, /window\.addEventListener\(['"]keydown/);

  for (const [page, image] of caseStudies) {
    assert.match(workflow, new RegExp(page.replace('.', '\\.')));
    assert.match(workflow, new RegExp(image.split('/').at(-1).replace('.', '\\.')));
    assert.doesNotMatch(read(page), /href="\/#work"\s+aria-current="page"/);
  }

  const index = read('index.html');
  assert.equal((index.match(/class="project-visual"[^>]*alt=""/g) ?? []).length, 3);
});

test('aria-current validation is independent of anchor attribute order', () => {
  assert.deepEqual(
    invalidAriaCurrentTargets('<a href="/about.html" aria-current="page">About</a>', 'index.html'),
    ['/about.html'],
  );
  assert.deepEqual(
    invalidAriaCurrentTargets('<a aria-current="page" href="/about.html">About</a>', 'index.html'),
    ['/about.html'],
  );
  assert.deepEqual(
    invalidAriaCurrentTargets('<a aria-current="page" class="brand" href="/">Home</a>', 'index.html'),
    [],
  );
});
