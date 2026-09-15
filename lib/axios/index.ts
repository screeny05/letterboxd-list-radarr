import Axios from "axios";
import { logger } from "../logger";
import { RobotsGuard } from "./robots-guard";
import { userAgentString } from "./user-agent";

const axiosLogger = logger.child({ module: "AxiosInstance" });

const instance = Axios.create({
    headers: {
        "User-Agent": userAgentString,
    },
});

const robotsGuard = new RobotsGuard(instance);

const FLARESOLVERR_URL = process.env.FLARESOLVERR_URL;

// FlareSolverr session management for cookie reuse
let flaresolverrSession: string | null = null;
let sessionCreationPromise: Promise<string> | null = null;

async function getOrCreateSession(): Promise<string> {
    if (flaresolverrSession) {
        return flaresolverrSession;
    }

    // Prevent multiple concurrent session creations
    if (sessionCreationPromise) {
        return sessionCreationPromise;
    }

    sessionCreationPromise = (async () => {
        axiosLogger.debug("Creating new FlareSolverr session");
        const response = await instance.post(FLARESOLVERR_URL!, {
            cmd: "sessions.create",
        });

        if (response.data?.status === "error") {
            throw new Error(`Failed to create FlareSolverr session: ${response.data.message}`);
        }

        flaresolverrSession = response.data.session;
        axiosLogger.debug(`Created FlareSolverr session: ${flaresolverrSession}`);
        return flaresolverrSession!;
    })();

    try {
        return await sessionCreationPromise;
    } finally {
        sessionCreationPromise = null;
    }
}

export default async function get(url: string): Promise<string> {
    // If FlareSolverr is configured, use it and skip robots.txt
    if (FLARESOLVERR_URL) {
        const session = await getOrCreateSession();
        axiosLogger.debug(`Using FlareSolverr session ${session} for ${url}`);

        const response = await instance.post(FLARESOLVERR_URL, {
            cmd: "request.get",
            url: url,
            session: session,
            maxTimeout: 60000,
        });

        // If session expired or invalid, recreate it and retry
        if (response.data?.status === "error" && response.data.message?.includes("session")) {
            axiosLogger.debug("Session expired, recreating...");
            flaresolverrSession = null;
            const newSession = await getOrCreateSession();

            const retryResponse = await instance.post(FLARESOLVERR_URL, {
                cmd: "request.get",
                url: url,
                session: newSession,
                maxTimeout: 60000,
            });

            if (retryResponse.data?.status === "error") {
                axiosLogger.error(
                    `FlareSolverr error for ${url}: ${retryResponse.data.message}`
                );
                throw new Error(`FlareSolverr error: ${retryResponse.data.message}`);
            }

            return retryResponse.data.solution.response;
        }

        if (response.data?.status === "error") {
            axiosLogger.error(
                `FlareSolverr error for ${url}: ${response.data.message}`
            );
            throw new Error(`FlareSolverr error: ${response.data.message}`);
        }

        if (!response.data?.solution?.response) {
            axiosLogger.error(
                `FlareSolverr returned invalid response for ${url}`
            );
            throw new Error("FlareSolverr returned invalid response");
        }

        return response.data.solution.response;
    }

    // Standard path with robots.txt checking
    if (!robotsGuard.isLoaded) {
        await robotsGuard.load();
    }

    if (!robotsGuard.isAllowed(url)) {
        axiosLogger.error(
            `Tried accessing robots.txt disallowed URL (${url}).`
        );
        throw new Error("Disallowed URL according to robots.txt");
    }

    const response = await instance.get(url);
    return response.data;
}
