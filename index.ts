import { getList } from './lib/letterboxd/list';
import express from 'express';
import { normalizeSlug } from './lib/letterboxd/util';
import { transformLetterboxdListToRadarr } from './lib/radarr/transform';

const app = express();
app.listen(3000, () => console.log('listening http://localhost:3000'));

app.get('/favicon.ico', (req, res) => res.status(404).send());

app.get(/(.*)/, async (req, res) => {
    const slug = normalizeSlug(req.params[0]);

    try {
        const movieData = await getList(slug);
        res.send(transformLetterboxdListToRadarr(movieData));
    } catch(e){
        res.status(404).send();
    }
});
