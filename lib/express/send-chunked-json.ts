import { Response } from "express";
import { logger } from "../logger";

const chunkLogger = logger.child({ module: "SendChunkedJson" });

// Send keep-alive every 5 seconds.
const KEEP_ALIVE_INTERVAL = 5 * 1000;

// If no push happened after timeout, close connection.
// FlareSolverr can take 30-60 seconds per request, so use longer timeout when configured.
const PUSH_TIMEOUT = process.env.FLARESOLVERR_URL ? 120 * 1000 : 30 * 1000;

/**
 * Stream array of objects as JSON to client.
 */
export const sendChunkedJson = (res: Response) => {
    let isFirstChunk = true;

    // `res.writable` stays true after end on older node, so track it ourselves.
    let isEnded = false;

    res.header("Content-Type", "application/json");
    res.header("Transfer-Encoding", "chunked");

    let keepAliveInterval: NodeJS.Timeout;
    let pushTimeout: NodeJS.Timeout;

    const clearTimers = () => {
        clearInterval(keepAliveInterval);
        clearTimeout(pushTimeout);
    };

    const markEnded = () => {
        isEnded = true;
        clearTimers();
    };

    const isWritable = () => !isEnded && res.writable;

    // Send regular keep-alive to prevent loadbalancer timeouts
    const sendKeepAlive = () => {
        if (!isWritable()) {
            markEnded();
            return;
        }
        res.write("\r\n");
    };
    keepAliveInterval = setInterval(sendKeepAlive, KEEP_ALIVE_INTERVAL);

    // Close connection ourselves if there is no push after a certain timeout
    const resetTimeout = () => {
        clearTimeout(pushTimeout);
        pushTimeout = setTimeout(
            () =>
                chunk.fail(
                    504,
                    "Server closed connection. No more data received."
                ),
            PUSH_TIMEOUT
        );
    };

    resetTimeout();

    // Without a listener a stream error would take down the process.
    res.on("error", (e: Error) => {
        markEnded();
        chunkLogger.warn(`Response stream error - ${e?.message}`);
    });

    res.once("close", markEnded);

    const chunk = {
        get isEnded() {
            return isEnded;
        },
        push(chunk: any) {
            if (!isWritable()) {
                markEnded();
                return;
            }

            res.write(isFirstChunk ? "[" : ",");
            res.write(JSON.stringify(chunk));
            res.write("\r\n");
            resetTimeout();
            isFirstChunk = false;
        },
        end() {
            if (!isWritable()) {
                markEnded();
                return;
            }

            markEnded();

            if (isFirstChunk) {
                res.write("[");
            }
            res.end("]");
        },
        fail(code: number, message: string) {
            if (!isWritable()) {
                markEnded();
                return;
            }

            if (!res.headersSent) {
                res.status(code);
            }

            chunk.push({ message });
            chunk.end();
        },
    };

    return chunk;
};
