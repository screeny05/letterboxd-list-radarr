import pLimit from "p-limit";
import { getKanpai, getFirstMatch, LETTERBOXD_ORIGIN } from "./util";
import * as cache from "../cache/index";

const IMDB_REGEX = /imdb\.com\/title\/(.*?)(\/|$)/i;
const TMDB_REGEX = /themoviedb\.org\/movie\/(.*?)(\/|$)/;

export interface LetterboxdMovieDetails {
    slug: string;
    name: string;
    published: string;
    imdb: string;
    tmdb?: string;
}

export const getMoviesDetailCached = async(slugs: string[], concurrencyLimit: number = 7, onDetail?: (movie: LetterboxdMovieDetails) => void) => {
    // we have to remove empty entries to prevent infinite loading
    slugs = slugs.filter(slug => slug);
    const limit = pLimit(concurrencyLimit);
    const movies = await Promise.all(slugs.map(async slug => {
        const detail = await limit(() => getCachedMovieDetail(slug));
        if(onDetail){
            onDetail(detail);
        }
        return detail;
    }));
    return movies;
};

export const getMovieDetail = async (slug: string) => {
    const details = await getKanpai<LetterboxdMovieDetails>(`${LETTERBOXD_ORIGIN}${slug}`, {
        name: '.headline-1',
        published: '[itemprop="datePublished"]',
        imdb: ['[data-track-action="imdb" i]', '[href]', getFirstMatch(IMDB_REGEX)],
        tmdb: ['[data-track-action="tmdb" i]', '[href]', getFirstMatch(TMDB_REGEX)]
    });
    details.slug = slug;
    return details;
};

export const getCachedMovieDetail = async (slug: string) => {
    if(await cache.has(slug)){
        return await cache.get(slug);
    }

    const data = await getMovieDetail(slug);
    await cache.set(slug, data);

    return data;
};
