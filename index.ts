import { LetterboxdPoster } from './lib/letterboxd/list';
import express from 'express';
import { normalizeSlug } from './lib/letterboxd/util';
import { transformLetterboxdMovieToRadarr } from './lib/radarr/transform';
import { getMoviesDetailCached, LetterboxdMovieDetails } from './lib/letterboxd/movie-details';
import { sendChunkedJson } from './lib/express/send-chunked-json';
import { fetchPostersFromSlug } from './lib/letterboxd';

const PORT = process.env.PORT || 5000;

const app = express();
const server = app.listen(PORT, () => console.log(`Listening on port ${PORT}`));

server.keepAliveTimeout = 78

app.get('/', (_, res) => res.send('Use letterboxd.com path as path here.'));

app.get('/favicon.ico', (_, res) => res.status(404).send());

app.get(/(.*)/, async (req, res) => {
    const chunk = sendChunkedJson(res);

    // Abort fetching on client close
    let isConnectionOpen = true;
    let isFinished = false;
    req.connection.on('close', () => {
        isConnectionOpen = false;
        if(!isFinished){
            console.log('Client closed connection before finish.');
        }
    });

    const slug = normalizeSlug(req.params[0]);

    let posters: LetterboxdPoster[];

    try {
        posters = await fetchPostersFromSlug(slug);
    } catch (e: any) {
        isFinished = true;
        chunk.fail(404, e.message);
        return;
    }

    const movieSlugs = posters.map(poster => poster.slug);

    const onMovie = (movie: LetterboxdMovieDetails) => {
        // If there's no tmdb-id it may be a tv-show
        // radarr throws an error, if an entry is missing an id
        if(!movie.tmdb){
            return;
        }
        chunk.push(transformLetterboxdMovieToRadarr(movie));
    };

    await getMoviesDetailCached(movieSlugs, 7, onMovie, () => !isConnectionOpen);

    isFinished = true;
    chunk.end();
});
