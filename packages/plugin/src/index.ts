import fs from 'node:fs/promises';
import { register } from 'node:module';
import path from 'node:path';

import micromatch from 'micromatch';
import RJSON from 'really-relaxed-json';
import { type FSWatcher, type Plugin } from 'vite';
import { z, ZodError, type ZodIssue } from 'zod';

type Config = z.infer<typeof $config>;

/**
 * Options for the vite-plugin-data plugin.
*/
export interface PluginOptions {
  /**
   * Glob paths to ignore. By default, all files inside `node_modules`
   * directories are ignored.
  */
  ignore?: string[];
}

/**
 * Vite plugin which resolves `*.data.{js|ts}` file exports at build-time and bundles them as JSON-only modules.
 */
export default ({ ignore = [] }: PluginOptions = {}): Plugin => {
  // Enable direct dynamic importing of TypeScript files with TS extensions.
  register('ts-node/esm', import.meta.url);

  /**
   * Map of watched patterns to module IDs that should be invalidated when
   * a file matching the pattern changes.
   */
  const watchPatternToModuleIds = new Map<string, Set<string>>();

  /**
   * The watcher (if any) that patterns will be added to. Only available in
   * development mode when the server is running.
   */
  let watcher: FSWatcher | undefined;

  /**
   * Simple counter that increments each time a data loader is imported. This
   * value is appended to the import as a query parameter to force the data
   * loader module to be re-imported.
   */
  let importCount = 0;

  /**
   * Update the watcher and the invalidation map.
   */
  const watch = (relativePattern: string, id: string): void => {
    const pattern = path.resolve(path.dirname(id), relativePattern).replaceAll(/\\/gu, '/');
    let ids = watchPatternToModuleIds.get(pattern);

    if (!ids) {
      ids = new Set();
      watchPatternToModuleIds.set(pattern, ids);
    }

    ids.add(id);
    watcher?.add(pattern);
  };

  return {
    name: 'vite-plugin-data',
    enforce: 'pre',
    configureServer(server) {
      // Capture the watcher instance so data loaders can add watched files.
      watcher = server.watcher;
    },
    async load(id) {
      // The id is not an absolute file path.
      if (!path.isAbsolute(id)) return;

      // The id matches an ignore pattern.
      if (micromatch.isMatch(id, ['**/node_modules/**', ...ignore])) return;

      // The id does not end with a data loader extension.
      if (!/\.data\.(?:js|cjs|mjs|ts|cts|mts)$/iu.test(id)) return;

      const [config, exports] = await Promise.all([
        // Read and parse the vite-plugin-data configuration comment.
        parseConfigComment(id, (issue) => this[issue.fatal ? 'error' : 'warn'](`${issue.path}: ${issue.message}`)),
        // Resolve the data loader exports.
        import(`${id}?__vite_plugin_data__=${importCount++}`) as Promise<Record<string, unknown>>,
      ]);

      /**
       * Generated code from the pre-resolved data loader exports.
       */
      const code = Object.entries(exports)
        .reduce((acc, [key, value]) => {
          const jsonString = JSON.stringify(value, (_key, rawValue) => {
            assertJsonSafe(rawValue);
            return rawValue;
          }, 2);

          return `${acc}export ${key === 'default' ? 'default' : `const ${key} =`} ${jsonString};\n`;
        }, '');

      // Configure watching for HMR in development mode.
      if (watcher && config.watch) {
        for (const pattern of Array.isArray(config.watch) ? config.watch : [config.watch]) {
          watch(pattern, id);
        }
      }

      return { code };
    },
    async handleHotUpdate(ctx) {
      const invalidatedIds = new Set<string>();

      // Check all the watched patterns to see if they match.
      for (const [pattern, ids] of watchPatternToModuleIds.entries()) {
        if (micromatch.isMatch(ctx.file, pattern)) {
          // The pattern matches, so invalidate all of the data loader module
          // IDs that are watching for the pattern.
          ids.forEach((id) => invalidatedIds.add(id));
        }
      }

      // Set of invalidated modules. Start with the modules that are already
      // known to be invalidated in the context, and add new ones from watch
      // pattern matches.
      const invalidatedModules = new Set(ctx.modules);

      // Resolve all of the module IDs to their corresponding modules.
      for (const id of invalidatedIds) {
        const module = ctx.server.moduleGraph.getModuleById(id);

        if (module) {
          invalidatedModules.add(module);
        }
      }

      return Array.from(invalidatedModules);
    },
  };
};

/**
 * Configuration scheme used to parse and validate the configuration comment
 * JSON data in data loader files.
 */
const $config = z.object({
  watch: z.array(z.string()).or(z.string()).optional(),
});

/**
 * Parse the vite-plugin-data configuration comment in the specified file (id).
 * This applies relaxed JSON parsing and throws errors if the configuration
 * does not match the expected schema.
 */
const parseConfigComment = async (id: string, onIssue: (issue: ZodIssue) => void): Promise<Config> => {
  const source = await fs.readFile(id, 'utf-8');
  const match = source.match(/\/\*\s*vite-plugin-data\s(.*?)\*\//su);

  if (!match) return {};

  try {
    return $config.parse(JSON.parse(RJSON.toJson(match[1]!)));
  }
  catch (error) {
    if (error instanceof ZodError) {
      error.issues.forEach(onIssue);
    }

    throw new Error(`invalid vite-plugin-data configuration in "${id}"`);
  }
};

/**
 * Throw an error if the value is not safe to JSON stringify. Objects which
 * are instances of a class are considered unsafe, because data may be lost
 * when serializing and deserializing the object.
 */
const assertJsonSafe = (value: unknown): void => {
  if (value === null) return;
  if (typeof value === 'string') return;
  if (typeof value === 'number') return;
  if (typeof value === 'boolean') return;
  if (Array.isArray(value)) return;
  if (typeof value === 'object') {
    if (Object.getPrototypeOf(value) === Object.prototype) return;
    if (Object.getPrototypeOf(value) === null) return;
  }

  throw new Error(`data loader exported value that is not JSON serializable`);
};
