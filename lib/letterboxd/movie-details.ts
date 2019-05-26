import pLimit from "p-limit";
import { getKanpai, getFirstMatch, LETTERBOXD_ORIGIN } from "./util";
import { readFile, writeFile } from "fs";
import { promisify } from "util";

const IMDB_REGEX = /imdb\.com\/title\/(.*?)(\/|$)/i;
const TMDB_REGEX = /themoviedb\.org\/movie\/(.*?)(\/|$)/;
const CACHE_VERSION = 1;

export interface LetterboxdMovieDetails {
    slug: string;
    name: string;
    published: string;
    imdb: string;
    tmdb: string;
}

interface MovieCache {
    version: number;
    movies: {
        [slug: string]: LetterboxdMovieDetails;
    }
}

export const getMoviesDetail = async(slugs: string[], concurrencyLimit: number = 7) => {
    const limit = pLimit(concurrencyLimit);
    const cache = await openCache();
    const movies = await Promise.all(slugs.map(
        slug => limit(() => getCachedMovieDetail(slug, cache))
    ));
    await closeCache(cache);
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

export const openCache = async () => {
    let cache: MovieCache = { version: CACHE_VERSION, movies: {} };
    try {
        const json = await promisify(readFile)('./cache', { encoding: 'utf8' });
        const parsed = JSON.parse(json);
        if(cache.version === CACHE_VERSION){
            cache = parsed;
        }
    } catch(e){}

    return cache;
};

export const closeCache = async (cache: MovieCache) => {
    await promisify(writeFile)('./cache', JSON.stringify(cache), { encoding: 'utf8' });
};

export const getCachedMovieDetail = async (slug: string, cache: MovieCache) => {
    if(cache.movies[slug]){
        return cache.movies[slug];
    }

    const data = await getMovieDetail(slug);
    cache.movies[slug] = data;

    return data;
};
