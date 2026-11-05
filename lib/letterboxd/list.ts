import get from "../axios";
import { LetterboxdListPage, LetterboxdPoster, parseListPage } from "./parse";
import { LETTERBOXD_ORIGIN } from "./util";
import * as cache from "../cache/index";

export type { LetterboxdPoster } from "./parse";

// Cache Lists for 30min
const LIST_CACHE_TIMEOUT = 30 * 60;

export const getList = async (
    listSlug: string
): Promise<LetterboxdPoster[]> => {
    const posters: LetterboxdPoster[] = [];
    let nextPage: number | null = 1;
    while (nextPage) {
        const result = await getListPaginated(listSlug, nextPage);
        posters.push(...result.posters);
        nextPage = Number.parseInt(result.next);
        nextPage = Number.isNaN(nextPage) ? null : nextPage;
    }
    return posters;
};

export const getListCached = async (
    listSlug: string
): Promise<LetterboxdPoster[]> => {
    const cached = await cache.get(listSlug);
    if (cached && Array.isArray(cached)) {
        return cached;
    }
    if (cached !== undefined) {
        await cache.del(listSlug);
    }

    const posters = await getList(listSlug);
    await cache.set(listSlug, posters, LIST_CACHE_TIMEOUT);
    return posters;
};

export const getListPaginated = async (
    listSlug: string,
    page: number
): Promise<LetterboxdListPage> => {
    return parseListPage(
        await get(`${LETTERBOXD_ORIGIN}${listSlug}page/${page}/`)
    );
};
