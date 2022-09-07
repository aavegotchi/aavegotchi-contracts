import { run } from "hardhat";
import { GrantXPSnapshotTaskArgs } from "../../../tasks/grantXP_snapshot";

async function grantXP() {
  const taskArgs: GrantXPSnapshotTaskArgs = {
    proposalId:
      "0x0ba9fdfc595ea0f77e240ecccf9627b473b9e6be19d00ed9f9ff716fac40cc06",
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
