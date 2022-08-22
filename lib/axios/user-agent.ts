import readPackageUp from "read-pkg-up";

const meta = readPackageUp.sync()?.packageJson;

export const userAgentString = `Mozilla/5.0 (compatible; ${meta?.name}/${meta?.version}; +${meta?.homepage})`;
