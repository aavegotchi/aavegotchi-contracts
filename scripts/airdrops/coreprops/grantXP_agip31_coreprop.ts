import { run } from "hardhat";
import {
  currentOverrides,
  GrantXPSnapshotTaskArgs,
} from "../../../tasks/grantXP_snapshot";

async function grantXP() {
  const taskArgs: GrantXPSnapshotTaskArgs = {
    proposalId:
      "0x2ddd04ae165c6f6245f4cdd83abd00bb1644bf78fd6719eae394f9db4e00d910",
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
