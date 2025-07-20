import {
    getKanpai,
    getFirstMatch,
    LETTERBOXD_ORIGIN,
    LETTERBOXD_NEXT_PAGE_REGEX,
} from "./util";
import * as cache from "../cache/index";

// Cache Lists for 30min
const LIST_CACHE_TIMEOUT = 30 * 60;

export interface LetterboxdPoster {
    slug: string;
    title: string;
}

interface LetterboxdListPage {
    next: string;
    posters: LetterboxdPoster[];
}

interface GetListOptions {
    postersQuery?: string;
}

export const getList = async (
    listSlug: string,
    onPage?: (page: number) => void,
    options?: GetListOptions
): Promise<LetterboxdPoster[]> => {
    const posters: LetterboxdPoster[] = [];
    let nextPage: number | null = 1;
    while (nextPage) {
        const result = await getListPaginated(listSlug, nextPage, options);
        if (onPage) {
            onPage(nextPage);
        }
        posters.push(...result.posters);
        nextPage = Number.parseInt(result.next);
        nextPage = Number.isNaN(nextPage) ? null : nextPage;
    }
    return posters;
};

export const getListCached = async (
    listSlug: string,
    onPage?: (page: number) => void,
    options?: GetListOptions
): Promise<LetterboxdPoster[]> => {
    const cached = await cache.get(listSlug);
    if (cached && Array.isArray(cached)) {
        return cached;
    }
    if (cached !== undefined) {
        await cache.del(listSlug);
    }

    const posters = await getList(listSlug, onPage, options);
    await cache.set(listSlug, posters, LIST_CACHE_TIMEOUT);
    return posters;
};

export const getListPaginated = async (
    listSlug: string,
    page: number,
    options?: GetListOptions
): Promise<LetterboxdListPage> => {
    const {
        postersQuery = ".poster-list .film-poster"
    } = options || {};

    return await getKanpai<LetterboxdListPage>(
        `${LETTERBOXD_ORIGIN}${listSlug}page/${page}/`,
        {
            next: [
                ".paginate-nextprev .next",
                "[href]",
                getFirstMatch(LETTERBOXD_NEXT_PAGE_REGEX),
            ],
            posters: [
                postersQuery,
                {
                    slug: ["$", "[data-target-link]"],
                    title: [".image", "[alt]"],
                },
            ],
        }
    );
};
