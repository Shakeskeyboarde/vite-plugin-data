import { assertJsonSafe } from './utils/assert-json-safe.js';

/**
 * Compile a JSON-safe object to Javascript code containing export statements
 * for all object properties. The `default` property will become the default
 * export, and all other properties will become named export constants.
 *
 * > NOTE: Properties of `exports` with promise values are awaited, and the
 * > awaited values are converted to pre-resolved promises
 * > (eg. `Promise.resolve(<value>)`).
 *
 * > NOTE: Throws if `exports` is not JSON-safe.
 */
export const compile = async <T extends Record<string, unknown>>(exports: T): Promise<string> => {
  /**
   * Static constant statement source strings generated from the data
   * loader's exports. Promises are awaited, and their resolved values are
   * converted to pre-resolved promise expressions.
   */
  const statements = await Promise.all(Object.entries(exports).map(async ([key, value]) => {
    /**
     * Awaited (non-promise) value exported by the data loader. Only
     * `Promise` instances are supported, not promise-like objects.
     */
    const resolved = value instanceof Promise ? await value : value;

    /**
     * Stringified representation of the JSON-safe export value.
     */
    const encoded = JSON.stringify(resolved, (_, v) => {
      assertJsonSafe(v);
      return v;
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

  return statements.join('');
};
