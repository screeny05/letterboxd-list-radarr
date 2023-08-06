import redis from "redis";

const cache = redis.createClient({ url: process.env.REDIS_URL });

export const has = (key: string): Promise<boolean> =>
    new Promise((resolve, reject) => {
        if (!key) {
            return false;
        }
        cache.exists(key, (err, data) => {
            if (err) {
                return reject(err);
            }
            resolve(data === 1);
        });
    });

export const get = <T = any>(key: string): Promise<T> =>
    new Promise((resolve, reject) => {
        cache.get(key, (err, data) => {
            if (err) {
                return reject(err);
            }
            resolve(JSON.parse(data));
        });
    });

export const set = (key: string, value: any, ttl?: number): Promise<void> =>
    new Promise((resolve, reject) => {
        const cb = (err: any, data: any) => {
            if (err) {
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
        cache.del(key, (err) => {
            if (err) {
                return reject(err);
            }
            resolve();
        });
    });
