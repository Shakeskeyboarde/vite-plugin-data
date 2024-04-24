import { type Plugin } from 'vite';

const PLUGIN_NAME = 'vite-plugin-data';

/**
 * Vite plugin which resolves `*.data.{js|ts}` file exports at build-time and bundles them as JSON-only modules.
 */
export default (): Plugin => {
  return {
    name: PLUGIN_NAME,
    enforce: 'pre',
    async resolveId(id, importer) {
      if (id === `${PLUGIN_NAME}/watch`) {
        // TODO: Return a virtual module ID which includes the importer as a
        // query parameter so that the import is actually specific to the
        // importer.
      }
    },
    async load(id, options) {
      if (id.endsWith('.data.js') || id.endsWith('.data.ts')) {
        // TODO: Import the id and use the exports to generate the module runtime source.
        // TODO: Support additional watch paths "somehow" to trigger rebuilds.
      }
    },
    async transform(code, id) {
      if (id.startsWith(`${PLUGIN_NAME}/watch?`)) {
        // TODO: Inject importer metadata into the code so that the watch path
        // is specific to the importer.
      }
    },
  };
};
