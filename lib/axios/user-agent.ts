import readPackageUp from "read-pkg-up";

const meta = readPackageUp.sync()?.packageJson;

export const userAgentString =
    process.env.USER_AGENT ??
    `Mozilla/5.0 (compatible; ${meta?.name}/${meta?.version}; +${meta?.homepage})`;
