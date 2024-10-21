import { LetterboxdPoster } from "./lib/letterboxd/list";
import express from "express";
import { normalizeSlug } from "./lib/letterboxd/util";
import { transformLetterboxdMovieToRadarr } from "./lib/radarr/transform";
import {
    getMoviesDetailCached,
    LetterboxdMovieDetails,
} from "./lib/letterboxd/movie-details";
import { sendChunkedJson } from "./lib/express/send-chunked-json";
import { fetchPostersFromSlug } from "./lib/letterboxd";
import { logger } from "./lib/logger";
import { cache } from "./lib/cache";

const appLogger = logger.child({ module: "App" });

const PORT = process.env.PORT || 5000;

const app = express();
const server = app.listen(PORT, () =>
    appLogger.info(`Listening on port ${PORT}`)
);

server.keepAliveTimeout = 78;

app.get("/", (_, res) => res.send("Use letterboxd.com path as path here."));

app.get("/favicon.ico", (_, res) => res.status(404).send());

app.get(/(.*)/, async (req, res) => {
    const chunk = sendChunkedJson(res);

    // Abort fetching on client close
    let isConnectionOpen = true;
    let isFinished = false;
    req.connection.once("close", () => {
        isConnectionOpen = false;
        if (!isFinished) {
            appLogger.warn("Client closed connection before finish.");
        }
    });

    const slug = normalizeSlug(req.params[0]);
    const limit = req.query.limit
        ? Number.parseInt(req.query.limit)
        : undefined;

    let posters: LetterboxdPoster[];

    try {
        appLogger.info(`Fetching posters for ${slug}`);
        posters = await fetchPostersFromSlug(slug);
        if (!Array.isArray(posters)) {
            throw new Error(`Fetching posters failed for ${slug}`);
        }
        if (limit) {
            posters = posters.slice(0, limit);
        }
    } catch (e: any) {
        isFinished = true;
        appLogger.error(`Failed to fetch posters for ${slug} - ${e?.message}`);
        chunk.fail(404, e?.message);
        isConnectionOpen = false;
        return;
    }

    const movieSlugs = posters.map((poster) => poster.slug);

    const onMovie = (movie: LetterboxdMovieDetails) => {
        // If there's no tmdb-id it may be a tv-show
        // radarr throws an error, if an entry is missing an id
        if (!movie.tmdb) {
            return;
        }
        chunk.push(transformLetterboxdMovieToRadarr(movie));
    };

    try {
        await getMoviesDetailCached(
            movieSlugs,
            7,
            onMovie,
            () => !isConnectionOpen
        );
    } catch (e: any) {
        appLogger.error(`Failed to fetch movies for ${slug} - ${e?.message}`);
        chunk.fail(404, e?.message);
        isConnectionOpen = false;
        return;
    }

    isFinished = true;
    chunk.end();
});

process.on("unhandledRejection", (reason) => {
    throw reason;
});

process.on("uncaughtException", (error) => {
    appLogger.error("Uncaught Exception", error);
    process.exit(1);
});
