import { LetterboxdMovieDetails } from "../letterboxd/movie-details";

export const transformLetterboxdListToRadarr = (movies: LetterboxdMovieDetails[]) => {
    return movies.map(movie => {
        return {
            id: Number.parseInt(movie.tmdb),
            imdb_id: movie.imdb,
            title: movie.name,
            release_year: movie.published,
            clean_title: movie.slug,
            adult: false
        }
    })
}
