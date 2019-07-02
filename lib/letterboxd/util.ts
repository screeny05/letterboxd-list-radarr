import axios from 'axios';
import { executeKanpai, KanpaiExecutable, KanpaiContext } from 'kanpai-scraper';

export const LETTERBOXD_ORIGIN = 'https://letterboxd.com';

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
    const response = await axios.get(url);
    const context = new KanpaiContext(response.data);
    return executeKanpai<T>(context, executable, {
        strict: false
    });
};

export const normalizeSlug = (slug: string): string => '/' + slug.replace(/^\/*(.*?)\/*$/, '$1') + '/';
