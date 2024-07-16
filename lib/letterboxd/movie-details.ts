import pLimit from "p-limit";
import { getKanpai, getFirstMatch, LETTERBOXD_ORIGIN } from "./util";
import * as cache from "../cache/index";
import { logger } from "../logger";

const moviesLogger = logger.child({ module: "MoviesDetails" });

const IMDB_REGEX = /imdb\.com\/title\/(.*?)(\/|$)/i;
const TMDB_REGEX = /themoviedb\.org\/movie\/(.*?)(\/|$)/;

export interface LetterboxdMovieDetails {
    slug: string;
    name: string;
    published: string;
    imdb: string;
    tmdb?: string;
}

export const getMoviesDetailCached = async (
    slugs: string[],
    concurrencyLimit: number = 7,
    onDetail?: (movie: LetterboxdMovieDetails) => void,
    shouldCancel?: () => boolean
) => {
    // we have to remove empty entries to prevent infinite loading
    slugs = slugs.filter((slug) => slug);
    const limit = pLimit(concurrencyLimit);
    const movies = await Promise.all(
        slugs.map(async (slug) => {
            const detail = await limit(async () => {
                // Cancel running operations in case client connection closed.
                if (shouldCancel && shouldCancel()) {
                    return;
                }

                try {
                    return await getCachedMovieDetail(slug);
                } catch (e: any) {
                    moviesLogger.error(`Error fetching '${slug}'.`);
                }
            });

            if (onDetail && detail) {
                onDetail(detail);
            }
            return detail;
        })
    );
    return movies.filter((movie): movie is LetterboxdMovieDetails => !!movie);
};

export const getMovieDetail = async (slug: string) => {
    const details = await getKanpai<LetterboxdMovieDetails>(
        `${LETTERBOXD_ORIGIN}${slug}`,
        {
            name: ".headline-1",
            published: "a[href^='/films/year']",
            imdb: [
                '[data-track-action="imdb" i]',
                "[href]",
                getFirstMatch(IMDB_REGEX),
            ],
            tmdb: [
                '[data-track-action="tmdb" i]',
                "[href]",
                getFirstMatch(TMDB_REGEX),
            ],
        }
    );
    details.slug = slug;
    return details;
};

export const getCachedMovieDetail = async (slug: string) => {
    if (await cache.has(slug)) {
        moviesLogger.debug(`Fetched '${slug}' from redis.`);
        return await cache.get<LetterboxdMovieDetails>(slug);
    }

    const data = await getMovieDetail(slug);
    moviesLogger.debug(`Fetched '${slug}' live.`);

    // We cache movies indefinitely, assuming they don't change.
    // Be sure to configure redis with a maxmemory and an eviction policy or this will eat all your RAM
    await cache.set(slug, data);

    return data;
};
