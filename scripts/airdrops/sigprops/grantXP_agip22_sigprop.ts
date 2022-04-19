import { run } from "hardhat";
import { GrantXPSnapshotTaskArgs } from "../../../tasks/grantXP_snapshot";

async function grantXP() {
  const taskArgs: GrantXPSnapshotTaskArgs = {
    proposalId:
      "0x41faa0fa14ed1948a7e0c0c8e0f79890762181d7648c206117324143ffccec40",
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
