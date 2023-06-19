import { run } from "hardhat";
import { GrantXPSnapshotTaskArgs } from "../../../tasks/grantXP_snapshot";

async function grantXP() {
  const id =
    "0x123768584b0e878a6466a293e402702de7427f0657ea24fd60d71589d0b3003e";
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
