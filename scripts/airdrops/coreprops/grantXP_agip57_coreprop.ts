import { run } from "hardhat";
import { GrantXPSnapshotTaskArgs } from "../../../tasks/grantXP_snapshot";

async function grantXP() {
  const id =
    "0x1930189873f7591fa60fc108d632c0f11fc35d8fff3eaccc349d05756c54c321";
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
