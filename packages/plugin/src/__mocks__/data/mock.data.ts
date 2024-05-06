/* vite-plugin-data {
  dependencies: ./message.json
} */

import fs from 'node:fs/promises';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const text = await fs.readFile(path.resolve(__dirname, 'message.json'), 'utf8');

class Foo {
  text = 'foo text';

  toJSON(): {} {
    return { text: this.text };
  }
}

/**
 * Should not cause an error even though a class instance is exported, because
 * the class has a toJSON method which returns a JSON-safe value.
 */
export const foo = new Foo();

/**
 * Should not cause an error because promises are resolve and replaced with
 * a promise that is pre-resolved with the awaited value.
 */
export const promise = Promise.resolve().then(async () => {
  return 'promised value';
});

/**
 * Message from the local JSON file.
 */
export default JSON.parse(text).message as string;

export { bar } from './bar.js';
