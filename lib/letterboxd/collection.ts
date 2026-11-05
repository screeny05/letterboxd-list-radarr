import get from "../axios";
import { LetterboxdPoster, parseCollectionAjaxUrl, parseCollectionPosters } from "./parse";
import { LETTERBOXD_ORIGIN } from "./util";

export const getCollection = async (
    collectionSlug: string
): Promise<LetterboxdPoster[]> => {
    // The letterboxd url-scheme can be pretty complex for collections,
    // and i'm too lazy to extract the collection-name from the collectionSlug.
    // Therefore we fetch the ajaxUrl from the given page itself.
    const ajaxUrl = parseCollectionAjaxUrl(
        await get(`${LETTERBOXD_ORIGIN}${collectionSlug}`)
    );

    return parseCollectionPosters(await get(`${LETTERBOXD_ORIGIN}${ajaxUrl}`));
};
