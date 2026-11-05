import { createClient } from "redis";
import { logger } from "../logger";

const log = logger.child({ module: "Cache" });

export const cache = createClient({
    url: process.env.REDIS_URL,
    disableOfflineQueue: true,
    ...(process.env.REDIS_URL?.startsWith("rediss://")
        ? { socket: { tls: true, rejectUnauthorized: false } }
        : {}),
});

cache.on("error", (err) => {
    log.error("Redis error", err);
});

cache.on("ready", () => {
    log.info("Redis ready");
});

cache.connect().catch((err) => log.error("Redis connection failed", err));

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

export const has = async (key: string): Promise<boolean> => {
    if (!key || !cache.isReady) return false;
    try {
        const data = await cache.exists(key);
        onCommandSucceeded();
        return data === 1;
    } catch (err) {
        onCommandFailed("exists", key, err);
        return false;
    }
};

export const get = async <T = any>(key: string): Promise<T | undefined> => {
    if (!key || !cache.isReady) return undefined;
    try {
        const data = await cache.get(key);
        const value = data === null ? undefined : JSON.parse(data);
        onCommandSucceeded();
        return value;
    } catch (err) {
        onCommandFailed("get", key, err);
        return undefined;
    }
};

export const set = async (key: string, value: any, ttl?: number): Promise<void> => {
    if (!cache.isReady) return;
    try {
        await cache.set(key, JSON.stringify(value), ttl ? { expiration: { type: "EX", value: ttl } } : undefined);
        onCommandSucceeded();
    } catch (err) {
        onCommandFailed("set", key, err);
    }
};

export const del = async (key: string): Promise<void> => {
    if (!cache.isReady) return;
    try {
        await cache.del(key);
        onCommandSucceeded();
    } catch (err) {
        onCommandFailed("del", key, err);
    }
};
