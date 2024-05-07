import { expect, test } from 'vitest';

import { Result } from '../result.js';

test('constructor sets properties correctly', () => {
  const param = {
    dependencies: ['/root/dependency.ts'],
    exports: { foo: 'bar' },
    dependencyPatterns: ['/root/data.txt'],
  };
  const result = new Result(param);

  expect(result.dependencies).toStrictEqual(param.dependencies);
  expect(result.exports).toStrictEqual(param.exports);
  expect(result.dependencyPatterns).toStrictEqual(param.dependencyPatterns);
});

test('dependsOn returns true when dependencies are matched', () => {
  const param = {
    dependencies: ['/root/dependency1.ts', '/root/dependency2.ts'],
  };
  const result = new Result(param);

  expect(result.dependsOn('/root/dependency1.ts')).toBe(true);
  expect(result.dependsOn('/root/dependency2.ts')).toBe(true);
});

test('dependsOn returns true when dependency patterns are matched', () => {
  const param = {
    dependencyPatterns: [
      '/root/data.txt',
      '/root/folder/*.json',
      '/root/**/*.txt',
    ],
  };
  const result = new Result(param);

  expect(result.dependsOn('/root/folder/somedata.json')).toBe(true);
  expect(result.dependsOn('/root/data.txt')).toBe(true);
  expect(result.dependsOn('/root/data/some/path/to/folder/somefile.txt')).toBe(true);
});

test('dependsOn returns false when dependency patterns are not matched', () => {
  const param = {
    dependencyPatterns: [
      '/root/data.txt',
      '/root/folder/**/*.txt',
      '/root/some/path/**/*.json',
    ],
  };
  const result = new Result(param);

  expect(result.dependsOn('/root/data/data.txt')).toBe(false);
  expect(result.dependsOn('/root/folder/some/other/path/data.json')).toBe(false);
  expect(result.dependsOn('/root/folder/some/other/path/data.yaml')).toBe(false);
  expect(result.dependsOn('/root/some/path/to/a/non/json/file/data.txt')).toBe(false);
});

test('dependsOn returns false when no dependencies are not matched', () => {
  const param = {
    dependencies: ['/root/path/to/file.ts', '/root/path/to/handler.ts'],
  };
  const result = new Result(param);

  expect(result.dependsOn('/root/path/to/another/file.ts')).toBe(false);
  expect(result.dependsOn('/root/path/to/file.json')).toBe(false);
  expect(result.dependsOn('/root/path/to/another/handler.ts')).toBe(false);
});
