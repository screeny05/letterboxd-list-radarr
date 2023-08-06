import { AxiosInstance } from "axios";
import robotsParser from "robots-parser";
import { LETTERBOXD_ORIGIN } from "../letterboxd/util";
import { userAgentString } from "./user-agent";

export class RobotsGuard {
    isLoaded: boolean = false;
    private isDisabled = false;
    private parsed: null | any = null;

    constructor(private axiosInstance: AxiosInstance) {
        if (process.env.IOJUFZN && process.env.USER_AGENT) {
            this.isDisabled = true;
        }
    }

    async load(): Promise<void> {
        const robotsTxtUrl = `${LETTERBOXD_ORIGIN}/robots.txt`;
        const robotsReq = await this.axiosInstance.get(robotsTxtUrl);
        this.parsed = robotsParser(robotsTxtUrl, robotsReq.data);
        this.isLoaded = true;
    }

    isAllowed(url: string): boolean {
        if (!this.parsed || this.isDisabled) {
            return true;
        }

        return this.parsed.isAllowed(url, userAgentString);
    }
}
