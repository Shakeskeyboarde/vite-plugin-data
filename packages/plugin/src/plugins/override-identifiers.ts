import path from 'node:path';
import url from 'node:url';

import MagicString from 'magic-string';
import { type Plugin, type UserConfig } from 'vite';

import { cleanUrl } from '../utils/clean-url.js';

const DEFINE_META_DIRNAME = '__vite_plugin_data_import_meta_dirname__';
const DEFINE_META_FILENAME = '__vite_plugin_data_import_meta_filename__';
const DEFINE_META_URL = '__vite_plugin_data_import_meta_url__';

/**
 * RegExp that matches IDs with a known JS-like source code extension. It
 * should be safe to inject JS leaders/trailers into these files.
 *
 * Borrowed from: https://github.com/vitejs/vite/blob/main/packages/vite/src/node/utils.ts
 */
const RX_KNOWN_JS_EXTENSION = /\.(?:[jt]sx?|m[jt]s|vue|marko|svelte|astro|imba|mdx)(?:$|\?)/u;

/**
 * Polyfill per-module identifiers such that the module continues to work as
 * if it were called "in-place", rather than as part of the final bundle.
 *
 * For instance, if a modules uses `import.meta.url`, it should be the same as
 * it would have been before the module was transformed, so that file system
 * operations work as expected after bundling.
 *
 * The following identifiers are polyfilled:
 * - `__filename`
 * - `__dirname`
 * - `import.meta.filename`
 * - `import.meta.dirname`
 * - `import.meta.url`
 */
export const overrideIdentifiers = (): Plugin => {
  return {
    name: '__vite_plugin_data_internal_override_identifiers__',
    config(): UserConfig {
      return {
        // Replace (define) the source identifiers (keys) with alternative
        // (non-reserved) identifiers. These identifiers will be defined
        // per-module in the `transform` hook. That way, all modules can
        // have independent values for these identifiers even after bundling.
        define: {
          __filename: DEFINE_META_FILENAME,
          __dirname: DEFINE_META_DIRNAME,
          'import.meta.filename': DEFINE_META_FILENAME,
          'import.meta.dirname': DEFINE_META_DIRNAME,
          'import.meta.url': DEFINE_META_URL,
        },
      };
    },
    transform(code, id) {
      // Not an absolute path ID.
      if (!path.isAbsolute(id)) return;
      // Not a source code ID.
      if (!RX_KNOWN_JS_EXTENSION.test(id)) return;

      id = cleanUrl(id);

      const metaDirname = path.dirname(id);
      const metaUrl = url.pathToFileURL(id).href;
      const newCode = new MagicString(code)
        .prepend(`const ${DEFINE_META_FILENAME} = ${JSON.stringify(id)};\n`)
        .prepend(`const ${DEFINE_META_DIRNAME} = ${JSON.stringify(metaDirname)};\n`)
        .prepend(`const ${DEFINE_META_URL} = ${JSON.stringify(metaUrl)};\n`)
      ;

      return {
        code: newCode.toString(),
        map: newCode.generateMap({
          source: id,
          includeContent: true,
          hires: true,
        }),
      };
    },
  };
};
