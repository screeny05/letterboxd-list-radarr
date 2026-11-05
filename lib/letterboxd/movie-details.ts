import pLimit from "p-limit";
import get from "../axios";
import { LetterboxdMovieDetails, parseMovieDetails } from "./parse";
import { LETTERBOXD_ORIGIN } from "./util";
import * as cache from "../cache/index";
import { logger } from "../logger";

export type { LetterboxdMovieDetails } from "./parse";

const moviesLogger = logger.child({ module: "MoviesDetails" });

const MOVIE_CACHE_TIMEOUT = 30 * 24 * 60 * 60;

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

export const getMovieDetail = async (
    slug: string
): Promise<LetterboxdMovieDetails> => ({
    ...parseMovieDetails(await get(`${LETTERBOXD_ORIGIN}${slug}`)),
    slug,
});

export const getCachedMovieDetail = async (slug: string) => {
    const cached = await cache.get<LetterboxdMovieDetails>(slug);
    if (cached) {
        moviesLogger.debug(`Fetched '${slug}' from redis.`);
        return cached;
    }

    const data = await getMovieDetail(slug);
    moviesLogger.debug(`Fetched '${slug}' live.`);

    await cache.set(slug, data, MOVIE_CACHE_TIMEOUT);

    return data;
};
