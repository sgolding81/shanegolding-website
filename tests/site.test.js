import test from 'node:test';
import assert from 'node:assert/strict';
import { validateSite } from '../scripts/check-site.mjs';

test('site structure, metadata, links, assets, and contrast are valid', () => {
  assert.deepEqual(validateSite(), []);
});
