import { getKanpai, LETTERBOXD_ORIGIN } from "./util";
import { LetterboxdPoster } from "./list";
import * as cache from "../cache/index";

// Cache studios for 30min, same as regular lists
const STUDIO_CACHE_TIMEOUT = 30 * 60;

// Letterboxd's Cloudflare challenges /studio/<slug>/page/<n>/ requests (even page/1/),
// so unlike regular lists, only the default unpaginated page is fetched here.
export const getStudio = async (
    studioSlug: string
): Promise<LetterboxdPoster[]> => {
    return await getKanpai<LetterboxdPoster[]>(
        `${LETTERBOXD_ORIGIN}${studioSlug}`,
        [
            '.posteritem > .react-component, [data-component-class*="LazyPoster"], .poster-list [data-poster-url*="film"], .poster-grid [data-poster-url*="film"]',
            {
                slug: ["$", "[data-target-link]"],
                title: ["$", "[data-item-name]"],
            },
        ]
    );
};

export const getStudioCached = async (
    studioSlug: string
): Promise<LetterboxdPoster[]> => {
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
