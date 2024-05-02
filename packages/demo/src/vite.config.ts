import path from 'node:path';

import { defineConfig } from 'vite';
import { checker } from 'vite-plugin-checker';
import { data } from 'vite-plugin-data';

process.chdir(__dirname);

export default defineConfig({
  plugins: [
    checker({ typescript: true }),
    data(),
  ],
  build: {
    target: ['node18'],
    outDir: '../dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
