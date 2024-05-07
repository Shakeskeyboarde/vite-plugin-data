import path from 'node:path';

import { normalizePath } from 'vite';
import { expect, test } from 'vitest';

import { load } from '../load.js';

test('bundles and imports a data loader module', async () => {
  const { exports } = await load(path.resolve(__dirname, 'src/demo.data.ts'));

  expect(exports.default).toBe('default-string');
  expect(exports.imported).toBe('imported-string');
  expect(exports.named).toBe('named-string');
  expect(exports.promised).toBeInstanceOf(Promise);
  await expect(exports.promised).resolves.toBe('promised-string');
  expect(exports.read).toBeInstanceOf(Promise);
  await expect(exports.read).resolves.toBe('read-string');
});

test('correctly detects dependencies', async () => {
  const { dependencies } = await load(path.resolve(__dirname, 'src/demo.data.ts'));

  expect(dependencies).toStrictEqual([
    normalizePath(path.resolve(__dirname, 'src/demo.data.ts')),
    normalizePath(path.resolve(__dirname, 'src/to-be-imported.ts')),
  ]);
});

test('correctly detects dependency patterns', async () => {
  const { dependencyPatterns } = await load(path.resolve(__dirname, 'src/demo.data.ts'));

  expect(dependencyPatterns).toStrictEqual([
    normalizePath(path.resolve(__dirname, 'src/data.txt')),
  ]);
});

test('injects expected module constants', async () => {
  const result = await load(path.resolve(__dirname, 'src/meta.data.ts'));
  const exports: Record<string, any> = result.exports;

  expect(exports.default.url).toBe('file://' + normalizePath(path.resolve(__dirname, 'src/meta.data.ts')));
  expect(exports.default.filename).toBe(normalizePath(path.resolve(__dirname, 'src/meta.data.ts')));
  expect(exports.default.dirname).toBe(normalizePath(path.resolve(__dirname, 'src')));
  expect(exports.default.__filename).toBe(normalizePath(path.resolve(__dirname, 'src/meta.data.ts')));
  expect(exports.default.__dirname).toBe(normalizePath(path.resolve(__dirname, 'src')));
});
