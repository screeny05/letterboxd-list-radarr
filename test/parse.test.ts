import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
    parseCollectionAjaxUrl,
    parseCollectionPosters,
    parseListPage,
    parseMovieDetails,
    parsePosters,
    parseTaggedListsPage,
} from "../lib/letterboxd/parse";

const fixture = (name: string) =>
    readFileSync(join(__dirname, "fixtures", name), "utf8");
const golden = (name: string) => JSON.parse(fixture(`${name}.json`));

test("list page returns posters and the next page number", () => {
    assert.deepEqual(parseListPage(fixture("list-page.html")), golden("list-page"));
});

test("last list page returns an empty next page", () => {
    assert.deepEqual(parseListPage(fixture("list-last-page.html")), golden("list-last-page"));
});

test("studio page returns every poster", () => {
    assert.deepEqual(parsePosters(fixture("studio.html")), golden("studio"));
});

test("collection page returns its ajax url", () => {
    assert.equal(parseCollectionAjaxUrl(fixture("collection.html")), golden("collection"));
});

test("collection ajax page returns posters titled by image alt", () => {
    assert.deepEqual(parseCollectionPosters(fixture("collection-ajax.html")), golden("collection-ajax"));
});

test("film page returns name, year, imdb and tmdb ids", () => {
    assert.deepEqual(parseMovieDetails(fixture("film.html")), golden("film"));
});

test("tagged lists page returns lists and the next page number", () => {
    assert.deepEqual(parseTaggedListsPage(fixture("tagged-lists.html")), golden("tagged-lists"));
});
