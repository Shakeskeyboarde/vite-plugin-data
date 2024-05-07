import { expect, test } from 'vitest';

import { compile } from '../compile.js';

test('generates default export', async () => {
  const exports = { default: 2 };
  const code = await compile(exports);

  expect(code).toMatchInlineSnapshot(`
    "export default 2;
    "
  `);
});

test('generates named exports', async () => {
  const code = await compile({
    foo: 'bar',
    fizz: {
      buzz: {
        fizz: {
          buzz: 'fizz',
        },
      },
    },
  });

  expect(code).toMatchInlineSnapshot(`
    "export const foo = "bar";
    export const fizz = {
      "buzz": {
        "fizz": {
          "buzz": "fizz"
        }
      }
    };
    "
  `);
});

test('throws error when unsafe JSON is passed', async () => {
  await expect(async () => {
    await compile({ unsafeFunction: () => undefined });
  }).rejects.toThrow(`data loader exported value that is not JSON-safe`);
});

test('generates resolved promises', async () => {
  const code = await compile({
    bio: Promise.resolve({ name: 'Bob', age: 15 }),
    default: Promise.resolve(15),
  });

  expect(code).toMatchInlineSnapshot(`
    "export const bio = Promise.resolve({
      "name": "Bob",
      "age": 15
    });
    export default Promise.resolve(15);
    "
  `);
});
