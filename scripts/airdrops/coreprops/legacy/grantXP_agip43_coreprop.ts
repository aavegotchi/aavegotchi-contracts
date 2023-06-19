import { run } from "hardhat";
import { propType } from "../../../helperFunctions";
import { GrantXPSnapshotTaskArgs } from "../../../../tasks/grantXP_snapshot";

async function grantXP() {
  const id =
    "0x57055266d44a9c8679807c917fb0518bfd3ea92e6f21e81b977ce9892c191b6a";
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
