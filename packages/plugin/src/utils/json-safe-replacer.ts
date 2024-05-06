/**
 * Replacer function for `JSON.stringify` which throws an error if the value is
 * not safe to JSON stringify. Otherwise, the value is returned.
 *
 * Objects which are instances of a class are considered unsafe, because data
 * may be lost when serializing and deserializing the object.
 */
export const jsonSafeReplacer = <T>(_key: string, value: T): T => {
  assertJsonSafe(value);
  return value;
};

const assertJsonSafe = (value: unknown): void => {
  if (value === null) return;
  if (typeof value === 'string') return;
  if (typeof value === 'number' && !Number.isNaN(value)) return;
  if (typeof value === 'boolean') return;
  if (Array.isArray(value)) return;

  // Objects must have a null/null-Object prototype which indicating they are
  // not class instances, or a toJSON method which returns a JSON-safe value.
  if (typeof value === 'object') {
    if ('toJSON' in value && typeof value.toJSON === 'function') return;

    const proto = Object.getPrototypeOf(value);

    if (proto === Object.prototype) return;
    if (proto === null) return;
  }

  throw new Error(`data loader exported value that is not JSON-safe`);
};
