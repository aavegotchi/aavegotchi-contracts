import { run } from "hardhat";

import { SettleXPTaskArgs } from "../../tasks/settleXP";

async function settleXP() {
  const taskArgs: SettleXPTaskArgs = {
    proposals: '1',
    batchSize: "500"
  };
  await run("settleXP", taskArgs);
}

settleXP()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

exports.settleXP = settleXP;
