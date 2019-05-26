// @ts-ignore
import { getKanpai, getFirstMatch, LETTERBOXD_ORIGIN } from './util';
import * as cache from '../cache/index';

const LETTERBOX_NEXT_PAGE_REGEX = /\/page\/(\d+)/;
const LIST_CACHE_TIMEOUT = 30 * 60;

export interface LetterboxdPoster {
    slug: string;
    title: string;
}

interface LetterboxdListPage {
    next: string;
    posters: LetterboxdPoster[];
}

export const getList = async (listSlug: string, onPage?: (page: number) => void) => {
    const posters: LetterboxdPoster[] = [];
    let nextPage: number|null = 1;
    while(nextPage){
        if(onPage){ onPage(nextPage); }
        const result = await getListPaginated(listSlug, nextPage);
        posters.push(...result.posters);
        nextPage = Number.parseInt(result.next);
        nextPage = Number.isNaN(nextPage) ? null : nextPage;
    }
    return posters;
};

export const getListCached = async (listSlug: string, onPage?: (page: number) => void) => {
    if(await cache.has(listSlug)){
        return await cache.get(listSlug);
    }

    const posters = await getList(listSlug, onPage);
    await cache.set(listSlug, posters, LIST_CACHE_TIMEOUT);
    return posters;
};

export const getListPaginated = async (listSlug: string, page: number) => {
    return await getKanpai<LetterboxdListPage>(`${LETTERBOXD_ORIGIN}${listSlug}page/${page}/`, {
        next: ['.paginate-nextprev .next', '[href]', getFirstMatch(LETTERBOX_NEXT_PAGE_REGEX)],
        posters: ['.poster-list .film-poster', {
            slug: ['$', '[data-film-slug]'],
            title: ['.image', '[alt]']
        }]
    });
};
