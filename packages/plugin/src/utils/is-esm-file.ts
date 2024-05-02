import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Determine if the specified filename is an ECMAScript module based on the
 * extension or the nearest package.json file.
 */
export const isEsmFile = async (filename: string): Promise<boolean> => {
  if (filename.endsWith('.cjs') || filename.endsWith('.cts')) return false;
  if (filename.endsWith('.mjs') || filename.endsWith('.mts')) return true;

  return await isEsmPackage(path.dirname(filename));
};

/**
 * Find the nearest package.json file, and return true if the "type" field is
 * set to "module".
 */
const isEsmPackage = async (dir: string): Promise<boolean> => {
  try {
    const pkg = await fs.readFile(path.join(dir, 'package.json'), 'utf8');
    const { type } = JSON.parse(pkg);

    return type === 'module';
  }
  catch (error: any) {
    if (error?.code !== 'ENOENT') throw error;

    const nextDir = path.dirname(dir);

    if (nextDir === dir) return false;

    return await isEsmPackage(nextDir);
  }
};
