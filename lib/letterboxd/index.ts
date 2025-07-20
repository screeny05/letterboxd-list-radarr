import { getCollection } from "./collection";
import { getListCached, LetterboxdPoster } from "./list";
import { getTaggedLists } from "./tagged-lists";
import { getCachedFilmsPopular } from "./films-popular";

const COLLECTION_REGEX = /^\/films\/in\/.*$/;
const TAGGED_LISTS_REGEX = /^\/.*\/tag\/.*\/lists\/$/;
const FILMS_POPULAR_REGEX = /^\/films\/popular\/.*?$/;
const REVIEW_REGEX = /^\/.*\/reviews\/.*$/;

export const fetchPostersFromSlug = async (
    slug: string
): Promise<LetterboxdPoster[]> => {
    // https://letterboxd.com/films/in/smile-collection/
    if (COLLECTION_REGEX.test(slug)) {
        return await getCollection(slug);
    }

    if (TAGGED_LISTS_REGEX.test(slug)) {
        return await getTaggedLists(slug);
    }

    // https://letterboxd.com/films/popular
    if (FILMS_POPULAR_REGEX.test(slug)) {
        return await getCachedFilmsPopular(slug);
    }

    if (REVIEW_REGEX.test(slug)) {
        return await getListCached(slug, {
            postersQuery: ".viewing-list .film-poster"
        });
    }

    return await getListCached(slug);
};
