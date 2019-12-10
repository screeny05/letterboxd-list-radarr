# letterboxd-list-radarr

Connect radarr to letterboxd.com lists

## Usage

This repository is hosted on heroku. That way you don't have to run the service yourself.
To use it, you have to:

1. Configure a new list in radarr, using the _Radarr Lists_ provider.
2. Set _Radarr API URL_ to `https://letterbox-list-radarr.herokuapp.com` (or your custom one, if you choose self-hosting)
3. Set _Path to list_ to whatever appears in the URL for the list of your choosing after `letterboxd.com`.

Supported Lists:

* Watchilsts: https://letterboxd.com<b>/screeny05/watchlist/</b>
* Regular Lists: https://letterboxd.com<b>/screeny05/list/jackie-chan-the-definitive-list/</b>
* Watched Movies: https://letterboxd.com<b>/screeny05/films/</b>
* Filmography:
    * Actor: https://letterboxd.com<b>/actor/tom-hanks/</b>
    * Director: https://letterboxd.com<b>/director/alfred-hitchcock/</b>
    * Writer: https://letterboxd.com<b>/writer/charlie-kaufman/</b>
    * Etc.

Others may be supported, but are not tested, yet.

## Self-hosting

You need a working redis-instance, which is used for caching movie- & list-data.

Following environment-params are supported:

```
REDIS_URL
PORT
```

1. Clone this repo
2. Make sure you have configured the env-variables
3. `node dist/index.js`
