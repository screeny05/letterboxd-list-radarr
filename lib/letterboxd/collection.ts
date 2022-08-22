import { LetterboxdPoster } from "./list";
import { getKanpai, LETTERBOXD_ORIGIN } from "./util";

export const getCollection = async (
    collectionSlug: string
): Promise<LetterboxdPoster[]> => {
    // The letterboxd url-scheme can be pretty complex for collections,
    // and i'm too lazy to extract the collection-name from the collectionSlug.
    // Therefore we fetch the ajaxUrl from the given page itself.
    const ajaxUrl = await getKanpai<string>(
        `${LETTERBOXD_ORIGIN}${collectionSlug}`,
        ["#films-browser-list-container", "[data-url]"]
    );

    const posters = await getKanpai<LetterboxdPoster[]>(
        `${LETTERBOXD_ORIGIN}${ajaxUrl}`,
        [
            ".poster-list .film-poster",
            {
                slug: ["$", "[data-target-link]"],
                title: [".image", "[alt]"],
            },
        ]
    );

    return posters;
};
