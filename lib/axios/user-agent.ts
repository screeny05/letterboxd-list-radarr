import { readPackageUpSync } from "read-package-up";

const meta = readPackageUpSync()?.packageJson;

export const userAgentString =
    process.env.USER_AGENT ??
    `Mozilla/5.0 (compatible; ${meta?.name}/${meta?.version}; +${meta?.homepage})`;
