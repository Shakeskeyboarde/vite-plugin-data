import { assert, test } from 'vitest';

import { Result } from '../result.js';

test('constructor sets properties correctly', () => {
  const param = {
    dependencies: ['/root/dependency.ts'],
    exports: { foo: 'bar' },
    dependencyPatterns: ['/root/data.txt'],
  };
  const result = new Result(param);
  assert.deepEqual(result.dependencies, param.dependencies);
  assert.deepEqual(result.exports, param.exports);
  assert.deepEqual(result.dependencyPatterns, param.dependencyPatterns);
});

test('dependsOn correctly matches dependencies', () => {
  const param = {
    dependencies: ['/root/dependency1.ts', '/root/dependency2.ts'],
  };
  const result = new Result(param);
  assert.isTrue(result.dependsOn('/root/dependency1.ts'));
  assert.isTrue(result.dependsOn('/root/dependency2.ts'));
});

test('dependsOn correctly matches dependency patterns', () => {
  const param = {
    dependencyPatterns: [
      '/root/data.txt',
      '/root/folder/*.json',
      '/root/**/*.txt',
    ],
  };
  const result = new Result(param);
  assert.isTrue(result.dependsOn('/root/folder/somedata.json'));
  assert.isTrue(result.dependsOn('/root/data.txt'));
  assert.isTrue(
    result.dependsOn('/root/data/some/path/to/folder/somefile.txt'),
  );
});

test('dependsOn returns false when no matches are found', () => {
  const param = {
    dependencyPatterns: [
      '/root/data.txt',
      '/root/folder/**/*.txt',
      '/root/some/path/**/*.json',
    ],
  };
  const result = new Result(param);
  assert.isFalse(result.dependsOn('/root/data/data.txt'));
  assert.isFalse(result.dependsOn('/root/folder/some/other/path/data.json'));
  assert.isFalse(result.dependsOn('/root/folder/some/other/path/data.yaml'));
  assert.isFalse(
    result.dependsOn('/root/some/path/to/a/non/json/file/data.txt'),
  );
});

test('dependsOn returns false when no dependency match', () => {
  const param = {
    dependencies: ['/root/path/to/file.ts', '/root/path/to/handler.ts'],
  };
  const result = new Result(param);
  assert.isFalse(result.dependsOn('/root/path/to/another/file.ts'));
  assert.isFalse(result.dependsOn('/root/path/to/file.json'));
  assert.isFalse(result.dependsOn('/root/path/to/another/handler.ts'));
});
