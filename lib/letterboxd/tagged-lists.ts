import pLimit from "p-limit";
import get from "../axios";
import { logger } from "../logger";
import { getListCached } from "./list"
import { LetterboxdPoster, LetterboxdTaggedList, LetterboxdTaggedListsPage, parseTaggedListsPage } from "./parse";
import { LETTERBOXD_ORIGIN } from "./util";

export const getTaggedLists = async (taggedListSlug: string): Promise<LetterboxdPoster[]> => {
    const lists: LetterboxdTaggedList[] = [];
    const posters: LetterboxdPoster[] = [];

    let moviesCount = 0;

    let nextPage: number|null = 1;
    while(nextPage){
        const result = await getTaggedListsPaginated(taggedListSlug, nextPage);
        lists.push(...result.lists);
        moviesCount += result.lists.reduce((a, list) => a + Number.parseInt(list.moviesCount), 0);
        nextPage = Number.parseInt(result.next);
        nextPage = Number.isNaN(nextPage) ? null : nextPage;
    }
    logger.debug(`Tagged Lists contain ${moviesCount} movies.`);

    const limit = pLimit(2);
    await Promise.all(lists.map(async (list) => {
        const listPosters = await limit(() => getListCached(list.slug));
        logger.debug(`Fetched List ${list.slug}.`);
        posters.push(...listPosters);
    }));

    return posters;
};

export const getTaggedListsPaginated = async (listSlug: string, page: number): Promise<LetterboxdTaggedListsPage> =>
    parseTaggedListsPage(await get(`${LETTERBOXD_ORIGIN}${listSlug}page/${page}/`));
