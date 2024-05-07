import path from 'node:path';

import { normalizePath } from 'vite';
import { expect, test, vi } from 'vitest';

import { normalizeGlobs } from '../utils/normalize-globs.js';

vi.mock('vite', async (importOriginal) => {
  const { normalizePath: normalizePath_, ...rest }: any = await importOriginal();
  return { ...rest, normalizePath: vi.fn(normalizePath_) };
});

test('normalizes single glob to an array', () => {
  expect(normalizeGlobs('foo.*', __dirname)).toStrictEqual(['foo.*']);
  expect(normalizePath).toHaveBeenLastCalledWith('foo.*');
});

test('normalizes dot-prefixed globs to absolute', () => {
  expect(normalizeGlobs(['./foo.*'], __dirname)).toStrictEqual([normalizePath(path.resolve(__dirname, './foo.*'))]);
  expect(normalizePath).toHaveBeenLastCalledWith(path.resolve(__dirname, './foo.*'));
});
