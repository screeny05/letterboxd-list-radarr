// @ts-ignore
import { getKanpai, getFirstMatch, LETTERBOXD_ORIGIN } from './util';
import { getMoviesDetail } from './movie-details';

const LETTERBOX_NEXT_PAGE_REGEX = /\/page\/(\d+)/;

interface LetterboxdPoster {
    slug: string;
    title: string;
}

interface LetterboxdListPage {
    next: string;
    posters: LetterboxdPoster[];
}

export const getList = async (listSlug: string) => {
    const posters: LetterboxdPoster[] = [];
    let nextPage: number|null = 1;
    while(nextPage){
        console.log('Page', nextPage);
        const result = await getListPaginated(listSlug, nextPage);
        posters.push(...result.posters);
        nextPage = Number.parseInt(result.next);
        nextPage = Number.isNaN(nextPage) ? null : nextPage;
    }
    const movies = await getMoviesDetail(posters.map(poster => poster.slug));
    return movies;
};

export const getListPaginated = async (listSlug: string, page: number) => {
    return await getKanpai<LetterboxdListPage>(`${LETTERBOXD_ORIGIN}${listSlug}page/${page}/`, {
        next: ['.paginate-nextprev .next', '[href]', getFirstMatch(LETTERBOX_NEXT_PAGE_REGEX)],
        posters: ['.poster-list .film-poster', {
            slug: ['$', '[data-film-slug]'],
            title: ['.image', '[alt]']
        }]
    });
};
