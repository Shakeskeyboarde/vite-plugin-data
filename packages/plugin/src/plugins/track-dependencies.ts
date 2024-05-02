import path from 'node:path';

import { type Plugin } from 'vite';

import { cleanUrl } from '../utils/clean-url.js';

interface Options {
  onDependency: (filename: string) => void;
}

/**
 * Track all absolute path module IDs that are loaded during a Vite build.
 *
 * > NOTE: External modules are not included, because they are never loaded.
 */
export const trackDependencies = ({ onDependency }: Options): Plugin => {
  return {
    name: '__vite_plugin_data_track_dependencies__',
    enforce: 'pre',
    load(id): null {
      if (path.isAbsolute(id)) {
        onDependency(cleanUrl(id));
      }

      return null;
    },
  };
};
