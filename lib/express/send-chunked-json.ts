import { Response } from "express";

// Send keep-alive every 5 seconds.
const KEEP_ALIVE_INTERVAL = 5 * 1000;

// If no push happened after 60 seconds, close connection.
const PUSH_TIMEOUT = 30 * 1000;

/**
 * Stream array of objects as JSON to client.
 */
export const sendChunkedJson = (res: Response) => {
    let isFirstChunk = true;

    res.header("Content-Type", "application/json");
    res.header("Transfer-Encoding", "chunked");

    // Send regular keep-alive to prevent loadbalancer timeouts
    const sendKeepAlive = () => res.write("\r\n");
    const keepAliveInterval = setInterval(sendKeepAlive, KEEP_ALIVE_INTERVAL);

    // Close connection ourselves if there is no push after a certain timeout
    let pushTimeout: NodeJS.Timeout;
    const resetTimeout = () => {
        clearTimeout(pushTimeout);
        pushTimeout = setTimeout(
            () => chunk.fail(408, "No more data received."),
            PUSH_TIMEOUT
        );
    };

    resetTimeout();

    const chunk = {
        push(chunk: any) {
            res.write(isFirstChunk ? "[" : ",");
            res.write(JSON.stringify(chunk));
            res.write("\r\n");
            resetTimeout();
            isFirstChunk = false;
        },
        end() {
            clearInterval(keepAliveInterval);
            clearTimeout(pushTimeout);

            if (isFirstChunk) {
                res.write("[");
            }
            res.end("]");
        },
        fail(code: number, message: string) {
            res.status(code);

            chunk.push({ message });
            chunk.end();
        },
    };

    return chunk;
};
