import module from 'node:module';

import { type Plugin } from 'vite';

import { normalizeExternal } from '../utils/normalize-external.js';

interface Options {
  outDir: string;
}

/**
 * Override the configuration options that are critical to the correct
 * operation of the data leader plugin.
 */
export const overrideConfig = ({ outDir }: Options): Plugin => {
  return {
    name: '__vite_plugin_data_override_config__',
    config(root): void {
      // XXX: Returning a configuration should deep merge it with the current
      // configuration. But, it doesn't seem to work in all cases, like
      // (build.rollupOptions.external). So, it's modified in place instead.

      const build = (root.build ??= {});
      const rollup = (root.build.rollupOptions ??= {});
      const external = normalizeExternal(rollup.external);

      build.outDir = outDir;
      build.write = true;
      rollup.external = (id, ...args) => {
        // Node built-ins are always external.
        if (module.isBuiltin(id)) return true;
        // Node native modules are always external.
        if (id.endsWith('.node')) return true;
        // Otherwise, delegate to the user defined external option.
        return external(id, ...args);
      };
    },
  };
};
