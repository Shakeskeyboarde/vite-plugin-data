import picomatch from 'picomatch';

/**
 * Pre-configured picomatch matcher.
 */
export const isGlobMatch = (value: string, patterns: string | string[]): boolean => {
  return picomatch.isMatch(
    value,
    patterns,
    // This is the config anymatch (and therefore chokidar) uses.
    { dot: true },
  );
};
