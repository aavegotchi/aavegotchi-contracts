import { run } from "hardhat";
import { GrantXPSnapshotTaskArgs } from "../../../tasks/grantXP_snapshot";

async function grantXP() {
  const taskArgs: GrantXPSnapshotTaskArgs = {
    proposalId:
      "0xeaac981066e143c46c7a616d2e6ff004d7d4d354005e077f01e3698041e4780a",
    propType: "coreprop",
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
