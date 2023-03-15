import { run } from "hardhat";
import { propType } from "../../helperFunctions";
import { GrantXPSnapshotTaskArgs } from "../../../tasks/grantXP_snapshot";

async function grantXP() {
  const id =
    "0x0a5979a05cebab1c87e08bbe8d142657d3442e0987d45d36c2eb41584d86da7b";
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
