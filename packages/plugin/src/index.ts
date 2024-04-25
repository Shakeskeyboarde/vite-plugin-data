import fs from 'node:fs/promises';
import { register } from 'node:module';
import path from 'node:path';

import picomatch from 'picomatch';
import RJSON from 'really-relaxed-json';
import { createLogger, type FSWatcher, type Plugin } from 'vite';
import { z, ZodError } from 'zod';

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
 * A Vite plugin that resolves the exports of data loader files at build-time
 * and replaces the original file source with the pre-resolved exports.
 */
export default ({ ignore = [] }: PluginOptions = {}): Plugin => {
  /**
   * Map of watched patterns (keys) to module IDs (values) that should be
   * invalidated when a file matching the pattern changes.
   *
   * This is stored as a Map with Set values (multi-map), so that reloads
   * don't cause unbounded growth.
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
   * Guard which prevents `ts-node/esm` from being registered multiple times.
   */
  let isTsNodeRegistered = false;

  /**
   * Update the watcher and the invalidation map.
   */
  const watch = (relativePattern: string, id: string): void => {
    const pattern = path.resolve(path.dirname(id), relativePattern).replaceAll(/\\/gu, '/');
    let ids = watchPatternToModuleIds.get(pattern);

    if (!ids) {
      // XXX: Only add the pattern to the watcher if it's a new pattern,
      // because I'm not confident that chokidar will deduplicate.
      watcher?.add(pattern);
      ids = new Set();
      watchPatternToModuleIds.set(pattern, ids);
    }

    ids.add(id);
  };

  return {
    name: 'vite-plugin-data',
    enforce: 'pre',
    configResolved(config) {
      // Capture the logger instance for logging.
      logger = config.logger;
    },
    configureServer(server) {
      // Capture the watcher instance so data loaders can add watch patterns.
      watcher = server.watcher;
    },
    async load(id) {
      // The ID is not an absolute file path.
      if (!path.isAbsolute(id)) return;

      // The ID matches an ignore pattern.
      if (isMatch(id, ['**/node_modules/**', ...ignore])) return;

      // The ID does not end with a data loader extension.
      if (!/\.data\.(?:js|cjs|mjs|ts|cts|mts)$/iu.test(id)) return;

      // Enable Typescript import support the first time a Typescript data
      // loader file is encountered.
      if (!isTsNodeRegistered && id.endsWith('ts')) {
        isTsNodeRegistered = true;
        register('ts-node/esm/transpile-only', import.meta.url);
      }

      const [config, exports] = await Promise.all([
        // Read and parse the vite-plugin-data configuration comment.
        parseConfigComment(id),
        // Resolve the data loader's exports.
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

      // Configure watching for HMR support in development mode.
      if (watcher && config.watch) {
        for (const pattern of Array.isArray(config.watch) ? config.watch : [config.watch]) {
          watch(pattern, id);
        }
      }

      return { code, moduleSideEffects: false };
    },
    async handleHotUpdate(ctx) {
      const invalidatedIds = new Set<string>();

      // Check all the watched patterns to see if they match.
      for (const [pattern, ids] of watchPatternToModuleIds.entries()) {
        if (isMatch(ctx.file, pattern)) {
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
 * Vite logger.
 */
let logger = createLogger();

/**
 * Prefixed logger.
 */
const log = (level: 'info' | 'warn' | 'error', message: string): void => {
  logger[level](`[vite-plugin-data] ${message}`);
};

/**
 * Configuration schema used to parse and validate the configuration comment
 * JSON data in data loader files.
 */
const $config = z.object({
  watch: z.array(z.string()).or(z.string()).optional(),
});

const isMatch = (id: string, patterns: string | string[]): boolean => {
  return picomatch.isMatch(
    id,
    patterns,
    // This is what anymatch (and therefore chokidar) use.
    { dot: true },
  );
};

/**
 * Parse the vite-plugin-data configuration comment in the specified file (id).
 * This applies relaxed JSON parsing and throws errors if the configuration
 * does not match the expected schema.
 */
const parseConfigComment = async (id: string): Promise<Config> => {
  const source = await fs.readFile(id, 'utf-8');
  const match = source.match(/\/\*\s*vite-plugin-data\s(.*?)\*\//su);

  if (!match) return {};

  try {
    return $config.parse(JSON.parse(RJSON.toJson(match[1]!)));
  }
  catch (error) {
    if (error instanceof ZodError) {
      error.issues.forEach((issue) => {
        log(
          issue.fatal ? 'error' : 'warn',
          `invalid "${issue.path.join('.')}" config in "${id}"`,
        );
      });
    }
    else {
      log('error', `failed parsing config in "${id}"`);
    }

    return {};
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

  // Objects must have a null/null-Object prototype which indicating they are
  // not class instances, or a toJSON method which returns a JSON-safe value.
  if (typeof value === 'object') {
    if ('toJSON' in value && typeof value.toJSON === 'function') return;

    const proto = Object.getPrototypeOf(value);

    if (proto === Object.prototype) return;
    if (proto === null) return;
  }

  throw new Error(`data loader exported value that is not JSON-safe`);
};
