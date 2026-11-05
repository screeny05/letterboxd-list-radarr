export const LETTERBOXD_ORIGIN = 'https://letterboxd.com';

/**
 * Ensures slug starts and ends with a single slash.
 */
export const normalizeSlug = (slug: string): string => '/' + slug.replace(/^\/*(.*?)\/*$/, '$1') + '/';
