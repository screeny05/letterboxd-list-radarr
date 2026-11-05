import pLimit from "p-limit";
import get from "../axios";
import { getCachedMovieDetail } from "./movie-details";
import { parsePosters } from "./parse";
import { LETTERBOXD_ORIGIN } from "./util";
import * as cache from "../cache/index";
import { logger } from "../logger";

const studioLogger = logger.child({ module: "Studio" });

// Cache studios for 30min, same as regular lists
const STUDIO_CACHE_TIMEOUT = 30 * 60;

export interface LetterboxdStudioFilm {
    slug: string;
    title: string;
    imdb: string;
    tmdb?: string;
}

// Letterboxd's Cloudflare challenges /studio/<slug>/page/<n>/ requests (even page/1/),
// so unlike regular lists, only the default unpaginated page is fetched here.
export const getStudio = async (
    studioSlug: string
): Promise<LetterboxdStudioFilm[]> => {
    const posters = parsePosters(await get(`${LETTERBOXD_ORIGIN}${studioSlug}`));

    // Each studio entry is enriched with its imdb/tmdb ids.
    const limit = pLimit(7);
    const films = await Promise.all(
        posters.map((poster) =>
            limit(async (): Promise<LetterboxdStudioFilm | undefined> => {
                try {
                    const detail = await getCachedMovieDetail(poster.slug);
                    if (!detail) {
                        return;
                    }
                    return { ...poster, imdb: detail.imdb, tmdb: detail.tmdb };
                } catch (e: any) {
                    studioLogger.error(`Error fetching '${poster.slug}'.`);
                }
            })
        )
    );
    return films.filter((film): film is LetterboxdStudioFilm => !!film);
};

export const getStudioCached = async (
    studioSlug: string
): Promise<LetterboxdStudioFilm[]> => {
    const cached = await cache.get(studioSlug);
    if (cached && Array.isArray(cached)) {
        return cached;
    }
    if (cached !== undefined) {
        await cache.del(studioSlug);
    }

    const posters = await getStudio(studioSlug);
    await cache.set(studioSlug, posters, STUDIO_CACHE_TIMEOUT);
    return posters;
};
