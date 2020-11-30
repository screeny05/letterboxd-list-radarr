import { getCollection } from "./collection";
import { getListCached, LetterboxdPoster } from "./list";
import { getTaggedLists } from "./tagged-lists";

const COLLECTION_REGEX = /^\/films\/in\/.*$/;
const REVIEW_REGEX = /^\/reviews\/.*$/;
const TAGGED_LISTS_REGEX = /^\/.*\/tag\/.*\/lists\/$/;


export const fetchPostersFromSlug = async (slug: string): Promise<LetterboxdPoster[]> => {
    if(COLLECTION_REGEX.test(slug)){
        return await getCollection(slug);
    }

    if(TAGGED_LISTS_REGEX.test(slug)){
        return await getTaggedLists(slug);
    }

    if(REVIEW_REGEX.test(slug)){
        throw new Error('Review lists are not supported.');
    }

    return await getListCached(slug);
}
