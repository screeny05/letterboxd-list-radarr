import { Response } from "express";

// Send keep-alive every 5 seconds.
const KEEP_ALIVE_INTERVAL = 5 * 1000;

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

    return {
        push(chunk: any) {
            res.write(isFirstChunk ? "[" : ",");
            res.write(JSON.stringify(chunk));
            res.write("\r\n");
            isFirstChunk = false;
        },
        end() {
            clearInterval(keepAliveInterval);

            if (isFirstChunk) {
                res.write("[");
            }
            res.end("]");
        },
        fail(code: number, message: string) {
            clearInterval(keepAliveInterval);
            res.status(code);

            res.write(JSON.stringify({ message }));
            if (!isFirstChunk) {
                res.write("]");
            }
            res.end();
        },
    };
};
