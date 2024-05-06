import { expect, test } from 'vitest';

import { jsonSafeReplacer } from '../../utils/json-safe-replacer.js';

class Unsafe {}

class Safe {
  toJSON(): unknown {
    return {};
  }
}

test('no throw on JSON primitives, non-class objects, and arrays', () => {
  expect(() => jsonSafeReplacer('', 1)).not.toThrow();
  expect(() => jsonSafeReplacer('', 'string')).not.toThrow();
  expect(() => jsonSafeReplacer('', true)).not.toThrow();
  expect(() => jsonSafeReplacer('', null)).not.toThrow();
  expect(() => jsonSafeReplacer('', [])).not.toThrow();
  expect(() => jsonSafeReplacer('', {})).not.toThrow();
  expect(() => jsonSafeReplacer('', Object.create(null))).not.toThrow();
});

test('no throw on class instance with toJSON method', () => {
  expect(() => jsonSafeReplacer('', new Safe())).not.toThrow();
});

test('throw on non-JSON primitives', () => {
  expect(() => jsonSafeReplacer('', Number.NaN)).toThrow();
  expect(() => jsonSafeReplacer('', 1n)).toThrow();
  expect(() => jsonSafeReplacer('', Symbol())).toThrow();
  expect(() => jsonSafeReplacer('', undefined)).toThrow();
});

test('throw on class instance', () => {
  expect(() => jsonSafeReplacer('', new Unsafe())).toThrow();
});

test('returns JSON-safe value', () => {
  const instance = new Safe();
  const object = {};
  const array: never[] = [];

  expect(jsonSafeReplacer('', 1)).toBe(1);
  expect(jsonSafeReplacer('', 'string')).toBe('string');
  expect(jsonSafeReplacer('', true)).toBe(true);
  expect(jsonSafeReplacer('', null)).toBe(null);
  expect(jsonSafeReplacer('', instance)).toBe(instance);
  expect(jsonSafeReplacer('', object)).toBe(object);
  expect(jsonSafeReplacer('', array)).toBe(array);
});
