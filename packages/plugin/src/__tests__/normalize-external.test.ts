import { expect, test, vi } from 'vitest';

import { normalizeExternal } from '../utils/normalize-external.js';

test('normalizes single id', () => {
  const external = normalizeExternal('some-id');

  expect(external('some-id', undefined, false)).toBe(true);
  expect(external('other-id', undefined, false)).toBe(false);
});

test('normalizes single RegExp', () => {
  const external = normalizeExternal(/^some-id$/u);

  expect(external('some-id', undefined, false)).toBe(true);
  expect(external('other-id', undefined, false)).toBe(false);
});

test('normalizes array of ids and RegExps', () => {
  const external = normalizeExternal(['some-id', /^other-id$/u]);

  expect(external('some-id', undefined, false)).toBe(true);
  expect(external('other-id', undefined, false)).toBe(true);
  expect(external('another-id', undefined, false)).toBe(false);
});

test('leaves external function as is', () => {
  const external = vi.fn();

  expect(normalizeExternal(external)).toBe(external);
});
