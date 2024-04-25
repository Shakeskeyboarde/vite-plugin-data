/* vite-plugin-data {
  watch: ./message.json
} */
import fs from 'node:fs/promises';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const text = await fs.readFile(path.resolve(__dirname, 'message.json'), 'utf8');

/**
 * Message from the local JSON file.
 */
export default JSON.parse(text).message as string;
