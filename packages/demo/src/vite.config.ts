import path from 'node:path';
import url from 'node:url';

import { defineConfig } from 'vite';
import { checker } from 'vite-plugin-checker';
import data from 'vite-plugin-data';

process.chdir(path.dirname(url.fileURLToPath(import.meta.url)));

export default defineConfig({
  plugins: [
    checker({ typescript: true }),
    data(),
  ],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
});
