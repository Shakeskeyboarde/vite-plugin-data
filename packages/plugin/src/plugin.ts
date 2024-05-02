import path from 'node:path';

import { type AliasOptions, createLogger, mergeConfig, type Plugin, type UserConfig } from 'vite';

import { load } from './load.js';
import { cleanUrl } from './utils/clean-url.js';
import { isGlobMatch } from './utils/is-glob-match.js';
import { normalizeGlobs } from './utils/normalize-globs.js';

/**
 * Options for the vite-plugin-data plugin.
*/
export interface Options {
  /**
   * Glob paths to ignore. By default, all files inside `node_modules`
   * directories are ignored.
   */
  ignore?: string[];
  /**
   * Provide a custom Vite configuration to use when transpiling data loaders.
   */
  config?: UserConfig;
}

/**
 * A Vite plugin that resolves the exports of data loader files at build-time
 * and replaces the original file source with the pre-resolved exports.
 */
export default ({ ignore = [], config: customConfig = {} }: Options = {}): Plugin => {
  /**
   * Map of data loader module IDs to dependency paths so that the
   * `handleHotUpdate` function can invalidate the correct modules.
   */
  const moduleDependencies = new Map<string, string[]>();

  /**
   * Map of data loader module IDs to watch patterns so that the
   * `handleHotUpdate` function can invalidate the correct modules.
   */
  const moduleDependencyPatterns = new Map<string, string[]>();

  /**
   * The `logger` from the resolved configuration.
   */
  let logger = createLogger();

  /**
   * The `root` from the resolved configuration.
   */
  let root: string;

  /**
   * The `resolve.alias` from the resolved configuration.
   */
  let alias: AliasOptions | undefined;

  /**
   * Absolute ignore patterns which are normalized to the `config.root`.
   */
  let ignorePatterns: string[] = [];

  /**
   * Log a prefixed message using the Vite logger.
   */
  const log = (message: string): void => {
    logger.info(`[vite-plugin-data] ${message}`);
  };

  return {
    name: 'vite-plugin-data',
    enforce: 'pre',
    configResolved(config) {
      logger = config.logger;
      root = config.root;
      alias = config.resolve.alias;
      ignorePatterns = normalizeGlobs(ignore, config.root);
    },
    async load(id) {
      // The ID is not an absolute file path.
      if (!path.isAbsolute(id)) return;

      // Strip query parameters from the ID (not used).
      id = cleanUrl(id);

      // The ID matches an ignore pattern.
      if (isGlobMatch(id, ['**/node_modules/**', ...ignorePatterns])) return;

      // The ID does not end with a data loader extension.
      if (!/\.data\.(?:js|cjs|mjs|ts|cts|mts)$/iu.test(id)) return;

      log(path.relative(root, id));

      const {
        exports,
        dependencies,
        dependencyPatterns,
      } = await load(id, mergeConfig({ root, resolve: { alias } }, customConfig));

      moduleDependencies.set(id, dependencies);
      moduleDependencyPatterns.set(id, dependencyPatterns);

      /**
       * Static constant statement source strings generated from the data
       * loader's exports. Promises are awaited, and their resolved values are
       * converted to pre-resolved promise expressions.
       */
      const exportStatements = await Promise.all(Object.entries(exports).map(async ([key, value]) => {
        /**
         * Awaited (non-promise) value exported by the data loader. Only
         * `Promise` instances are supported, not promise-like objects.
         */
        const resolved = value instanceof Promise ? await value : value;

        /**
         * Stringified representation of the JSON-safe export value.
         */
        const encoded = JSON.stringify(resolved, (_key, rawValue) => {
          assertJsonSafe(rawValue);
          return rawValue;
        }, 2);

        /**
         * Either a default or named export statement prefix.
         */
        const prefix = key === 'default' ? 'default' : `const ${key} =`;

        /**
         * Either a simple value or a pre-resolved promise if the originally
         * exported value was a promise.
         */
        const suffix = value instanceof Promise ? `Promise.resolve(${encoded})` : encoded;

        return `export ${prefix} ${suffix};\n`;
      }));

      return { code: exportStatements.join(''), moduleSideEffects: false };
    },
    async handleHotUpdate(ctx) {
      const invalidatedModuleIds = new Set<string>();

      // Collect module IDs that should be invalidated based on dependencies.
      for (const [id, dependencies] of moduleDependencies.entries()) {
        if (dependencies.includes(ctx.file)) {
          invalidatedModuleIds.add(id);
        }
      }

      // Collect module IDs that should be invalidated based on watch patterns.
      for (const [id, patterns] of moduleDependencyPatterns.entries()) {
        if (isGlobMatch(ctx.file, patterns)) {
          invalidatedModuleIds.add(id);
        }
      }

      // Start with the modules that are already known to be invalidated in
      // the context, and add modules for all the invalidated IDs.
      const invalidatedModules = new Set(ctx.modules);

      // Resolve all of the module IDs to their corresponding modules.
      for (const id of invalidatedModuleIds) {
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
