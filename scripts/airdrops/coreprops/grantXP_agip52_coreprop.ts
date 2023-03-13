import { run } from "hardhat";
import { GrantXPSnapshotTaskArgs } from "../../../tasks/grantXP_snapshot";

async function grantXP() {
  const id =
    "0x84119ecd3be2cd0fd2382ffaf2db0490967b3456ff19695e6629fdeeb9058dbb";
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
