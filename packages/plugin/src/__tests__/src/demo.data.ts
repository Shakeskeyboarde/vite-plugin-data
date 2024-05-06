/* vite-plugin-data {
  dependencies: [./data.txt]
} */

import fs from 'node:fs/promises';
import path from 'node:path';

export const named = 'named-string';

export const promised = (async () => {
  return 'promised-string';
})();

export const read = fs.readFile(path.resolve(__dirname, './data.txt'), 'utf8').then((text) => text.trim());

export { default as imported } from './to-be-imported.js';

export default 'default-string';
