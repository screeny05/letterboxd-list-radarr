# letterboxd-list-radarr

Connect radarr to letterboxd.com lists

## Usage

This service is hosted on render. That way you don't have to run the service yourself (but you can, see below).

### Radarr v3

1. Configure a new list in radarr, using the _Custom Lists_ provider.
2. Set _List URL_ to `https://letterboxd-list-radarr.onrender.com` followed by the path to your list in letterboxd. For example: `https://letterboxd-list-radarr.onrender.com/screeny05/list/jackie-chan-the-definitive-list/`
3. Configure the rest of the settings to your liking
4. Test & Save.

If there are any problems with v3, feel free to open an issue.

### Radarr v2

1. Configure a new list in radarr, using the _Radarr Lists_ provider.
2. Set _Radarr API URL_ to `https://letterboxd-list-radarr.onrender.com` (or your custom one, if you choose self-hosting)
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
* Collections: https://letterboxd.com<b>/films/in/halloween-collection/</b>
* Lists tagged by User are not supported. Please use links to the lists themself instead.

Others may be supported, but are not tested, yet.

## FAQ

### The API always returns `Disallowed URL`
This means that letterboxd.com does not allow this URL to be crawled per their [robots.txt](https://letterboxd.com/robots.txt). Your URL probably contains sorting or expensive queries by letterboxd. Check the linked file to ensure your given URL does not match any of the listed paths.

## Self-hosting

### Using render

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

It might take a few minutes after deploying to render, before the instance becomes available.

Be aware that render currently has a [free limit](https://render.com/docs/free) of 750h/month.

### Using heroku

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

If you are planning on running this instance for a lot of movies, be sure to set the correct cache-eviction policy for the redis:

```
heroku redis:maxmemory <name-of-redis-instance> --policy allkeys-lfu
```

### Using docker
```
git clone git@github.com:screeny05/letterboxd-list-radarr.git
cd letterboxd-list-radarr
npm install
docker-compose up -d
```

The file redis.conf can be used to configure your own settings for redis.

Your local instance will be available on port 5000 `http://localhost:5000`

### Local & development

You need a working redis-instance, which is used for caching movie- & list-data.

Following environment-params are supported:

* `REDIS_URL` - A [redis connection string](https://github.com/ServiceStack/ServiceStack.Redis#redis-connection-strings) to your redis-instance
* `PORT` - The http-port which the application listens on

1. Clone this repo
2. Make sure you have configured the env-variables
3. `npm install`
3. `npm start`
