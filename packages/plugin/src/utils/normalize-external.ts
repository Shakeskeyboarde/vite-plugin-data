import { type Rollup } from 'vite';

/**
 * Convert a non-function Rollup `external` option to a function.
 */
export const normalizeExternal = (
  external: Rollup.ExternalOption = () => undefined,
): Extract<Rollup.ExternalOption, Function> => {
  if (typeof external === 'function') {
    return external;
  }

  const ids: string[] = [];
  const regexes: RegExp[] = [];

  (Array.isArray(external) ? external : [external]).forEach((value) => {
    if (typeof value === 'string') ids.push(value);
    else regexes.push(value);
  });

  return (source) => ids.includes(source) || regexes.some((regex) => regex.test(source));
};
