import { run } from "hardhat";
import { GrantXPSnapshotTaskArgs } from "../../../tasks/grantXP_snapshot";

async function grantXP() {
  const taskArgs: GrantXPSnapshotTaskArgs = {
    proposalId:
      "0xe011f10e23135bf2cfe25f67ab143d2cdad03c0ffae9f9c520d75442b2622644",
    propType: "sigprop",
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
