import { run } from "hardhat";

import { GrantXPSnapshotTaskArgs } from "../../../tasks/grantXP_snapshot";
import { propType } from "../../helperFunctions";

async function grantXP() {
  const id =
    "0x2e8ca843b06faf0be9cc14b33cc819095e9f6a508af9ef52f442d791c00af25f";
  const taskArgs: GrantXPSnapshotTaskArgs = {
    proposalId: id,
    batchSize: "500",
  };
  await run("grantXP_snapshot", taskArgs);
}

grantXP()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

exports.grantXP = grantXP;
