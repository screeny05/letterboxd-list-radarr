import { executeKanpai, KanpaiExecutable, KanpaiContext } from 'kanpai-scraper';
import get from '../axios';

export const LETTERBOXD_ORIGIN = 'https://letterboxd.com';
export const LETTERBOXD_NEXT_PAGE_REGEX = /\/page\/(\d+)/;

export const getFirstMatch = (regex: RegExp) => (val?: string): string => {
    if(!val){
        return '';
    }
    const match = val.match(regex);
    if(!match || match.length < 2){
        return '';
    }
    return match[1];
};

export const getKanpai = async<T = any> (url: string, executable: KanpaiExecutable) => {
    const data = await get(url);
    const context = new KanpaiContext(data);
    return executeKanpai<T>(context, executable, {
        strict: false
    });
};

/**
 * Ensures slug starts and ends with a single slash.
 */
export const normalizeSlug = (slug: string): string => '/' + slug.replace(/^\/*(.*?)\/*$/, '$1') + '/';
