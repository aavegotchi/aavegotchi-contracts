import { run } from "hardhat";
import { GrantXPSnapshotTaskArgs } from "../../../tasks/grantXP_snapshot";

async function grantXP() {
  const id =
    "0xcae82273be9b783832d85214303e0f9f52e2220cedd5acc254b81f5b9457bae7";
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
