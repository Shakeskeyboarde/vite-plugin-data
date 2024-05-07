/* vite-plugin-data {
  // Depends on all files in this directory.
  dependencies: ['./**']
} */

import fs from 'node:fs/promises';
import path from 'node:path';

/*
This demo data loader reads all the filenames in this directory (src), finds
the greatest modified time, and exports a locale specific data and time string.

Notice the configuration comment at the top of this file. It declares that this
data loader depends on all files in this directory (recursive/deep). When
running a dev server, this causes the data loader to be re-evaluated whenever
any file in this directory changes, triggering an HMR update for any module
that uses values exported from this data loader.

This all happens at build-time, where this script has access to the local file
system, which it would not have access to if it were simply bundled and run in
the browser.

Top-level awaits are used in this module to read the file system
asynchronously. This works because this is an ES module.
*/

/**
 * All the filenames in this directory and its subdirectories.
 */
const filenames = await fs.readdir(__dirname, { recursive: true });

/**
 * Stats for all the filenames.
 */
const stats = await Promise.all(filenames.map((filename) => fs.stat(path.resolve(__dirname, filename))));

/**
 * The last (greatest) modified time for all the stats, in milliseconds since
 * the Unix epoch.
 */
const last = stats.reduce((result, value) => Math.max(result, value.mtimeMs), 0);

/**
 * The last modified time as a locale specific date and time string.
 */
export const lastModified = new Date(last).toLocaleString();
