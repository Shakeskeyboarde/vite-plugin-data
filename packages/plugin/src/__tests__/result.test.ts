import { assert, test } from "vitest";

import { MOCK_RESULT_PARAM } from "../__mocks__/result.mock.js";
import { Result } from "../result.js";

test("constructor sets properties correctly", () => {
  const result = new Result(MOCK_RESULT_PARAM);
  assert.deepEqual(result.dependencies, MOCK_RESULT_PARAM.dependencies);
  assert.deepEqual(result.exports, MOCK_RESULT_PARAM.exports);
  assert.deepEqual(
    result.dependencyPatterns,
    MOCK_RESULT_PARAM.dependencyPatterns,
  );
});

test("dependsOn correctly matches dependencies", () => {
  const result = new Result(MOCK_RESULT_PARAM);
  assert.isTrue(result.dependsOn("/root/dummy-dependency-1.ts"));
  assert.isTrue(result.dependsOn("/root/dummy-dependency-2.ts"));
});

test("dependsOn correctly matches dependency patterns", () => {
  const result = new Result(MOCK_RESULT_PARAM);
  assert.isTrue(result.dependsOn("/root/folder/somedata.json"));
  assert.isTrue(result.dependsOn("/root/data.txt"));
  assert.isTrue(
    result.dependsOn("/root/data/some/path/to/folder/somefile.txt"),
  );
});
