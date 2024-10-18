import pLimit from "p-limit";
import { LetterboxdPoster } from "./list";
import { getKanpai, LETTERBOXD_ORIGIN } from "./util";
import * as cache from "../cache/index";

const PAGE_LIMIT = 10;

// Cache popular for 120min
const CACHE_TIMEOUT = 120 * 60;

export const getCachedFilmsPopular = async (
    slug: string
): Promise<LetterboxdPoster[]> => {
    const cached = await cache.get(slug);
    if (cached && Array.isArray(cached)) {
        return cached;
    }
    if (cached !== undefined) {
        await cache.del(slug);
    }

    const posters = await getFilmsPopular(slug);
    await cache.set(slug, posters, CACHE_TIMEOUT);
    return posters;
};

export const getFilmsPopular = async (
    slug: string
): Promise<LetterboxdPoster[]> => {
    const pageNumbers = Array.from({ length: PAGE_LIMIT }, (_, i) => i + 1);
    const limit = pLimit(2);
    const posters: LetterboxdPoster[] = [];
    const path = slug.replace(/^\/films/, "");

    await Promise.all(
        pageNumbers.map(async (page) => {
            const listPosters = await limit(() =>
                getFilmsPopularPaginated(path, page)
            );
            posters.push(...listPosters);
        })
    );

    return posters;
};

export const getFilmsPopularPaginated = async (
    path: string,
    page: number
): Promise<LetterboxdPoster[]> => {
    return await getKanpai<LetterboxdPoster[]>(
        `${LETTERBOXD_ORIGIN}/films/ajax/${path}page/${page}/`,
        [
            ".poster-list .listitem",
            {
                slug: [".poster", "[data-target-link]"],
                title: ["img", "[alt]"],
            },
        ]
    );
};
