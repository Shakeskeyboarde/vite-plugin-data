/**
 * Remove the query and hash from a URL string.
 */
export const cleanUrl = (url: string): string => {
  return url.replace(/[?#].*$/u, '');
};
