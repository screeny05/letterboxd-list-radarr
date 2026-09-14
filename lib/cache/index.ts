import redis from "redis";
import { logger } from "../logger";

const log = logger.child({ module: "Cache" });

export const cache = redis.createClient({
    url: process.env.REDIS_URL,
    ...(process.env.REDIS_URL?.startsWith("rediss://")
        ? { tls: { rejectUnauthorized: false } }
        : {}),
});

cache.on("error", (err) => {
    log.error("Redis error", err);
});

cache.on("ready", () => {
    log.info("Redis ready");
});

let isDegraded = false;

const onCommandFailed = (command: string, key: string, err: any): void => {
    const message = `Redis ${command} failed for '${key}', continuing without cache`;
    if (isDegraded) {
        log.debug(message, err);
        return;
    }
    isDegraded = true;
    log.warn(message, err);
};

const onCommandSucceeded = (): void => {
    isDegraded = false;
};

export const has = (key: string): Promise<boolean> =>
    new Promise((resolve) => {
        if (!key || !cache.connected) {
            return resolve(false);
        }
        cache.exists(key, (err, data) => {
            if (err) {
                onCommandFailed("exists", key, err);
                return resolve(false);
            }
            onCommandSucceeded();
            resolve(data === 1);
        });
    });

export const get = <T = any>(key: string): Promise<T | undefined> =>
    new Promise((resolve) => {
        if (!key || !cache.connected) {
            // Treat an unavailable cache as a miss so we fall back to
            // fetching live instead of failing the request.
            return resolve(undefined);
        }
        cache.get(key, (err, data) => {
            if (err) {
                onCommandFailed("get", key, err);
                return resolve(undefined);
            }
            onCommandSucceeded();
            try {
                resolve(JSON.parse(data));
            } catch (e) {
                onCommandFailed("get", key, e);
                resolve(undefined);
            }
        });
    });

export const set = (key: string, value: any, ttl?: number): Promise<void> =>
    new Promise((resolve) => {
        if (!cache.connected) {
            return resolve();
        }

        const cb = (err: any) => {
            if (err) {
                onCommandFailed("set", key, err);
            } else {
                onCommandSucceeded();
            }
            resolve();
        };

        value = JSON.stringify(value);

        if (ttl) {
            cache.set(key, value, "EX", ttl, cb);
        } else {
            cache.set(key, value, cb);
        }
    });

export const del = (key: string): Promise<void> =>
    new Promise((resolve) => {
        if (!cache.connected) {
            return resolve();
        }

        cache.del(key, (err) => {
            if (err) {
                onCommandFailed("del", key, err);
            } else {
                onCommandSucceeded();
            }
            resolve();
        });
    });
