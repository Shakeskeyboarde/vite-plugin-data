import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { build, mergeConfig, type Rollup, type UserConfig } from 'vite';

import { overrideConfig } from './plugins/override-config.js';
import { overrideIdentifiers } from './plugins/override-identifiers.js';
import { trackDependencies } from './plugins/track-dependencies.js';
import { isEsmFile } from './utils/is-esm-file.js';
import { makeTempDir } from './utils/make-temp-dir.js';
import { parseCommentConfig } from './utils/parse-comment-config.js';

/**
 * The results of loading a data loader file.
 */
interface Result {
  /**
   * Exports resolved of the data loader file.
   */
  exports: Record<string, unknown>;
  /**
   * Absolute paths of file modules imported by the data loader file, including
   * any transitive dependencies.
   */
  dependencies: string[];
  /**
   * Explicitly defined dependencies set in the data loader configuration
   * comment. All paths are absolute and glob patterns are normalized.
   */
  dependencyPatterns: string[];
}

/**
 * Use Vite to transpile a data loader file to a temporary directory, and
 * then import the resulting bundle to get the data exports.
 *
 * The Vite configuration used for transpiling does a few special things:
 *
 * - Externalizes NodeJS built-ins and native modules.
 * - Tracks dependencies of the data loader file.
 * - Fakes file-level constants.
 *   - `__dirname`
 *   - `__filename`
 *   - `import.meta.url`
 *   - 'import.meta.dirname`
 *   - 'import.meta.filename`
 */
export const load = async (
  filename: string,
  config: UserConfig = {},
): Promise<Result> => {
  const dependencies: string[] = [];
  const [isEsm, [outDir, cleanupOutDir]] = await Promise.all([
    isEsmFile(filename),
    makeTempDir(path.dirname(filename)),
  ]);

  // Write a package.json file to the temporary directory with only the
  // "type" field set to indicate the module type.
  await fs.writeFile(
    path.join(outDir, 'package.json'),
    JSON.stringify({ type: isEsm ? 'module' : 'commonjs' }),
    { encoding: 'utf-8' },
  );

  /**
   * The default (base) configuration which may be overridden by a user
   * provided configuration ({@link config}).
   */
  const configDefaults: UserConfig & { configFile: false } = {
    // The Vite config that would be detected is probably not correct for
    // data loaders, because data loaders run at build-time, and the bundle
    // runs in some other environment (eg. a browser).
    configFile: false,
    logLevel: 'warn',
    plugins: [
      trackDependencies({ onDependency: (dependency) => dependencies.push(dependency) }),
    ],
    build: {
      target: `node${process.versions.node}`,
      lib: {
        entry: filename,
        formats: [isEsm ? 'es' : 'cjs'],
      },
      rollupOptions: {
        // No reason to treeshake data loaders since their source is not
        // bundled. Side effects might be useful. Not treeshaking should be
        // faster.
        treeshake: false,
      },
      // No reason to minify because the source is not bundled.
      minify: false,
      emptyOutDir: false,
      sourcemap: 'inline',
      // No need to limit inlined assets since the source is not bundled.
      assetsInlineLimit: 0,
      // No need to warn about large chunks since the source is not bundled.
      chunkSizeWarningLimit: Number.POSITIVE_INFINITY,
    },
    resolve: {
      // The data loader runs in Node, so allow "node" conditional exports to
      // be resolved.
      conditions: ['node'],
    },
  };

  /**
   * The override configuration which replaces any user provided configuration
   * ({@link config}) that might be incompatible with data loader bundling.
   */
  const configOverrides: UserConfig = {
    plugins: [
      overrideConfig({ outDir }),
      overrideIdentifiers(),
    ],
  };

  /**
   * Final configuration produced by merging the default configuration, user
   * provided configuration, and override configuration.
   */
  const mergedConfig: UserConfig = mergeConfig(configDefaults, mergeConfig(config, configOverrides));

  try {
    const results = await build(mergedConfig);
    const result = (Array.isArray(results) ? results[0] : results) as Rollup.RollupOutput;
    const entry = path.resolve(outDir, result.output[0].fileName);
    const [exports, dependencyPatterns] = await Promise.all([
      import(entry) as Promise<Record<string, unknown>>,
      parseCommentConfig(filename),
    ]);

    return { exports, dependencies, dependencyPatterns };
  }
  finally {
    await cleanupOutDir();
  }
};
