import path from 'node:path';

import { normalizePath } from 'vite';

/**
 * Modify glob patterns as follows:
 *
 * - Resolve them using the `root` if a pattern begins with a dot.
 * - Normalize paths (Vite `normalizePath`).
 * - Deduplicate patterns.
 */
export const normalizeGlobs = (patterns: string | string[], root: string): string[] => {
  if (typeof patterns === 'string') {
    patterns = [patterns];
  }

  return Array.from(new Set((typeof patterns === 'string' ? [patterns] : patterns)
    .map((pattern) => {
      // XXX: This is not really a complete way of making absolute globs, but
      // it's the way the Vite Press static data loader does it.
      // https://github.com/vuejs/vitepress/blob/main/src/node/plugins/staticDataPlugin.ts
      return pattern.startsWith('.')
        ? normalizePath(path.resolve(root, pattern))
        : normalizePath(pattern);
    })));
};
