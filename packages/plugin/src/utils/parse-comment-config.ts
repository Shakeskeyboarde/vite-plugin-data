import fs from 'node:fs/promises';
import path from 'node:path';

import RJSON from 'really-relaxed-json';

import { normalizeGlobs } from './normalize-globs.js';

/**
 * Parse the vite-plugin-data configuration comment in the module. This uses
 * relaxed JSON parsing and throws errors if the configuration does not match
 * the expected schema.
 */
export const parseCommentConfig = async (id: string): Promise<string[]> => {
  const source = await fs.readFile(id, 'utf-8');
  const match = source.match(/\/\*\s*vite-plugin-data\s(.*?)\*\//su);

  if (!match) return [];

  let config: unknown;

  try {
    config = JSON.parse(RJSON.toJson(match[1]!));
  }
  catch (error) {
    throw new Error(`failed parsing data loader config`, { cause: error });
  }

  assertConfig(config);

  const dependencies = normalizeGlobs(config.dependencies ?? [], path.dirname(id));

  return dependencies;
};

const assertConfig: (value: unknown) => asserts value is {
  dependencies?: string | string[] | null;
} = (value: unknown) => {
  if (typeof value !== 'object' || value === null) {
    throw new Error('data loader config must be an object');
  }

  const { dependencies, ...extra } = value as Record<string, unknown>;
  const unknownOption = Object.keys(extra)[0];

  if (unknownOption != null) {
    throw new Error(`unknown data loader option "${unknownOption}"`);
  }

  if (dependencies == null) return;
  if (typeof dependencies === 'string') return;
  if (Array.isArray(dependencies) && dependencies.every((v) => typeof v === 'string')) return;

  throw new Error('data loader dependencies must be a string or an array of strings');
};
