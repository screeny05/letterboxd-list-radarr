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

export const has = (key: string): Promise<boolean> =>
    new Promise((resolve, reject) => {
        if (!key || !cache.connected) {
            return resolve(false);
        }
        cache.exists(key, (err, data) => {
            if (err) {
                return reject(err);
            }
            resolve(data === 1);
        });
    });

export const get = <T = any>(key: string): Promise<T | undefined> =>
    new Promise((resolve, reject) => {
        if (!key || !cache.connected) {
            // Treat an unavailable cache as a miss so we fall back to
            // fetching live instead of failing the request.
            return resolve(undefined);
        }
        cache.get(key, (err, data) => {
            if (err) {
                log.error("Redis callback errored", err);
                return reject(err);
            }
            resolve(JSON.parse(data));
        });
    });

export const set = (key: string, value: any, ttl?: number): Promise<void> =>
    new Promise((resolve, reject) => {
        if (!cache.connected) {
            return resolve();
        }

        const cb = (err: any, data: any) => {
            if (err) {
                log.error("Redis callback errored", err);
                return reject(err);
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
    new Promise((resolve, reject) => {
        if (!cache.connected) {
            return resolve();
        }

        cache.del(key, (err) => {
            if (err) {
                log.error("Redis callback errored", err);
                return reject(err);
            }
            resolve();
        });
    });
