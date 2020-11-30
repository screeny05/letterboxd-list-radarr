import { LetterboxdMovieDetails } from "../letterboxd/movie-details";

export const transformLetterboxdMovieToRadarr = (movie: LetterboxdMovieDetails) => {
    return {
        id: movie.tmdb ? Number.parseInt(movie.tmdb) : null,
        imdb_id: movie.imdb,
        title: movie.name,
        release_year: movie.published,
        clean_title: movie.slug,
        adult: false
    }
};
