import { expect, test } from "vitest";
import { compile } from "../compile.js";
import {
  MOCK_EXPORTS_WITH_PROMISE,
  MOCK_JSON_SAFE_EXPORTS,
  MOCK_JSON_UNSAFE_EXPORTS,
} from "../__mocks__/compile.mock.js";

test("generates default export", async () => {
  const code = await compile(MOCK_JSON_SAFE_EXPORTS);
  expect(code).toContain(
    `export default ${JSON.stringify(MOCK_JSON_SAFE_EXPORTS.default, null, 2)}`,
  );
});

test("generates named exports", async () => {
  const code = await compile(MOCK_JSON_SAFE_EXPORTS);
  expect(code).toContain(`export const day = "${MOCK_JSON_SAFE_EXPORTS.day}"`);
  expect(code).toContain(
    `export const month = ${MOCK_JSON_SAFE_EXPORTS.month}`,
  );
  expect(code).toContain(`export const year = ${MOCK_JSON_SAFE_EXPORTS.year}`);
  expect(code).toContain(`export const date = ${MOCK_JSON_SAFE_EXPORTS.date}`);
  expect(code).toContain(
    `export const month = ${MOCK_JSON_SAFE_EXPORTS.month}`,
  );
  expect(code).toContain(
    `export const dummyObject = ${JSON.stringify(MOCK_JSON_SAFE_EXPORTS.dummyObject, null, 2)}`,
  );
});

test("throws error when unsafe JSON is passed", async () => {
  await expect(compile(MOCK_JSON_UNSAFE_EXPORTS)).rejects.toThrow(
    `data loader exported value that is not JSON-safe`,
  );
});

test("generates resolved promises", async () => {
  const code = await compile(MOCK_EXPORTS_WITH_PROMISE);
  const [resolvedDefault, resolvedBio] = await Promise.all([
    MOCK_EXPORTS_WITH_PROMISE.default,
    MOCK_EXPORTS_WITH_PROMISE.bio,
  ]);
  expect(code).toContain(
    `export const bio = Promise.resolve(${JSON.stringify(resolvedBio, null, 2)})`,
  );
  expect(code).toContain(`export default Promise.resolve(${resolvedDefault})`);
});
