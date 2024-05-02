import fsLegacy from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Make a temporary data loader bundle output directory. If possible, the
 * directory will be created inside the nearest parent `node_modules`
 * directory. Otherwise, it will be created in the initial directory.
 */
export const makeTempDir = async (initialDir: string): Promise<[tempDir: string, cleanup: () => Promise<void>]> => {
  initialDir = path.resolve(initialDir);

  const prefix = await findNodeModules(initialDir) ?? initialDir;
  const tempDir = await fs.mkdtemp(path.resolve(prefix ?? initialDir, '.vite-plugin-data-'));
  const cleanup = async (): Promise<void> => {
    await fs.rm(tempDir, { recursive: true, force: true });
  };

  // Make a best effort to cleanup the temporary directory if something goes
  // wrong and the cleanup function is not called.
  process.on('exit', () => {
    fsLegacy.rmSync(tempDir, { recursive: true, force: true });
  });

  return [tempDir, cleanup];
};

const findNodeModules = async (dir: string): Promise<string | null> => {
  const current = path.join(dir, 'node_modules');
  const exists = await fs.stat(current)
    .then((stats) => stats.isDirectory())
    .catch((error: any) => error?.code === 'ENOENT' ? false : 'error');

  // Stop on unexpected errors.
  if (exists === 'error') return null;
  if (exists) return current;

  const parentDir = path.dirname(dir);

  // Stop if at the root directory.
  if (parentDir === dir) return null;

  return await findNodeModules(parentDir);
};
