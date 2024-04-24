import path from 'node:path';
import url from 'node:url';

import { defineConfig } from 'vitest/config';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    coverage: {
      enabled: true,
      all: true,
      // include: [path.resolve(__dirname, 'packages/*/src/**')],
      reporter: ['html', 'text-summary'],
    },
  },
});
