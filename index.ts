import { getListCached, LetterboxdPoster } from './lib/letterboxd/list';
import express from 'express';
import { normalizeSlug } from './lib/letterboxd/util';
import { transformLetterboxdMovieToRadarr } from './lib/radarr/transform';
import { getMoviesDetailCached } from './lib/letterboxd/movie-details';

const PORT = process.env.PORT || 5000

const app = express();
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));

app.get('/', (_, res) => res.send('Use letterboxd.com path as path here.'));

app.get('/favicon.ico', (_, res) => res.status(404).send());

app.get(/(.*)/, async (req, res) => {
    const slug = normalizeSlug(req.params[0]);

    try {
        let firstChunk = true;
        const posters = await getListCached(slug, () => res.write(' '));

        res.write('[');

        await getMoviesDetailCached(
            posters.map((poster: LetterboxdPoster) => poster.slug),
            7,
            movie => {
                // If there's no tmdb-id it may be a tv-show
                // radarr throws an error, if an entry is missing an id
                if(!movie.tmdb){
                    return;
                }
                if(!firstChunk){
                    res.write(',');
                }
                res.write(JSON.stringify(transformLetterboxdMovieToRadarr(movie)));
                firstChunk = false;
            }
        );

        res.end(']');
    } catch(e){
        res.status(404).send(e.message);
    }
});
