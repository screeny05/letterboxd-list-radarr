import * as cheerio from "cheerio";
import type { CheerioAPI } from "cheerio";

export interface LetterboxdPoster {
    slug: string;
    title: string;
}

export interface LetterboxdListPage {
    next: string;
    posters: LetterboxdPoster[];
}

export interface LetterboxdTaggedList {
    slug: string;
    title: string;
    moviesCount: string;
}

export interface LetterboxdTaggedListsPage {
    next: string;
    lists: LetterboxdTaggedList[];
}

export interface LetterboxdMovieDetails {
    slug: string;
    name: string;
    published: string;
    imdb: string;
    tmdb?: string;
}

const POSTER_SELECTOR =
    '.posteritem > .react-component, [data-component-class*="LazyPoster"], .poster-list [data-poster-url*="film"], .poster-grid [data-poster-url*="film"]';
const NEXT_PAGE_REGEX = /\/page\/(\d+)/;
const IMDB_REGEX = /imdb\.com\/title\/(.*?)(\/|$)/i;
const TMDB_REGEX = /themoviedb\.org\/movie\/(.*?)(\/|$)/;

export const getFirstMatch =
    (regex: RegExp) =>
    (val?: string): string => {
        if (!val) {
            return "";
        }
        const match = val.match(regex);
        if (!match || match.length < 2) {
            return "";
        }
        return match[1];
    };

const nextPage = ($: CheerioAPI): string =>
    getFirstMatch(NEXT_PAGE_REGEX)($(".paginate-nextprev .next").first().attr("href"));

const posters = ($: CheerioAPI): LetterboxdPoster[] =>
    $(POSTER_SELECTOR)
        .toArray()
        .map((el) => ({
            slug: $(el).attr("data-target-link") ?? "",
            title: $(el).attr("data-item-name") ?? "",
        }));

export const parsePosters = (html: string): LetterboxdPoster[] =>
    posters(cheerio.load(html));

export const parseListPage = (html: string): LetterboxdListPage => {
    const $ = cheerio.load(html);
    return { next: nextPage($), posters: posters($) };
};

export const parseCollectionAjaxUrl = (html: string): string =>
    cheerio.load(html)("#films-browser-list-container").first().attr("data-url") ?? "";

export const parseCollectionPosters = (html: string): LetterboxdPoster[] => {
    const $ = cheerio.load(html);
    return $(".poster-list .film-poster")
        .toArray()
        .map((el) => ({
            slug: $(el).attr("data-target-link") ?? "",
            title: $(el).find(".image").first().attr("alt") ?? "",
        }));
};

export const parseMovieDetails = (html: string): Omit<LetterboxdMovieDetails, "slug"> => {
    const $ = cheerio.load(html);
    return {
        name: $(".headline-1").first().text().trim(),
        published: $("a[href^='/films/year']").first().text().trim(),
        imdb: getFirstMatch(IMDB_REGEX)($('[data-track-action="imdb" i]').first().attr("href")),
        tmdb: getFirstMatch(TMDB_REGEX)($('[data-track-action="tmdb" i]').first().attr("href")),
    };
};

export const parseTaggedListsPage = (html: string): LetterboxdTaggedListsPage => {
    const $ = cheerio.load(html);
    return {
        next: nextPage($),
        lists: $(".list-set .list")
            .toArray()
            .map((el) => {
                const list = $(el);
                return {
                    slug: list.find("a").first().attr("href") ?? "",
                    title: list.find("h2").first().text().trim(),
                    moviesCount: getFirstMatch(/(\d+)/)(list.find(".attribution .value").first().text().trim()),
                };
            }),
    };
};
