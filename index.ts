import { getListCached, LetterboxdPoster } from './lib/letterboxd/list';
import express from 'express';
import { normalizeSlug } from './lib/letterboxd/util';
import { transformLetterboxdMovieToRadarr } from './lib/radarr/transform';
import { getMoviesDetailCached } from './lib/letterboxd/movie-details';

const PORT = process.env.PORT || 5000

const app = express();
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));

app.get('/favicon.ico', (req, res) => res.status(404).send());

app.get(/(.*)/, async (req, res) => {
    const slug = normalizeSlug(req.params[0]);

    try {
        let firstChunk = true;
        res.write('[');

        const posters = await getListCached(slug, () => res.write(' '));

        await getMoviesDetailCached(
            posters.map((poster: LetterboxdPoster) => poster.slug),
            7,
            movie => {
                if(!firstChunk){
                    res.write(',');
                }
                res.write(JSON.stringify(transformLetterboxdMovieToRadarr(movie)));
                firstChunk = false;
            }
        );

        res.end(']');
    } catch(e){
        res.status(404).send();
    }
});
