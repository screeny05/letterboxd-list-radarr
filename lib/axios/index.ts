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

export default async function get(url: string): Promise<string> {
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
