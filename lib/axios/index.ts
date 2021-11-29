import Axios from "axios";
import readPackageUp from 'read-pkg-up';
import robotsParser from 'robots-parser';
import { logger } from "../logger";
import { LETTERBOXD_ORIGIN } from "../letterboxd/util";

const meta = readPackageUp.sync()?.packageJson;
const userAgentString = `Mozilla/5.0 (compatible; ${meta?.name}/${meta?.version}; +${meta?.homepage})`;

const axiosLogger = logger.child({ module: 'AxiosInstance' });

let loadedRobots: boolean = false;
let parsedRobots: null|any = null;

const instance = Axios.create({
    headers: {
        'User-Agent': userAgentString,
    },
});

const fetchRobots = async function(): Promise<void> {
    const LETTERBOXD_ROBOTS_URL = `${LETTERBOXD_ORIGIN}/robots.txt`;
    loadedRobots = true;
    const robotsReq = await instance.get(LETTERBOXD_ROBOTS_URL);
    parsedRobots = robotsParser(LETTERBOXD_ROBOTS_URL, robotsReq.data);
}

export default async function get(url: string): Promise<string> {
    if(!loadedRobots){
        await fetchRobots();
    }

    if(parsedRobots && !parsedRobots.isAllowed(url, userAgentString)){
        axiosLogger.info(`Tried accessing disallowed URL (${url}).`);
        throw new Error('Disallowed URL');
    }

    const response = await instance.get(url);
    return response.data;
}
