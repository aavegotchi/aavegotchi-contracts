import { run } from "hardhat";
import { GrantXPSnapshotTaskArgs } from "../../../tasks/grantXP_snapshot";

async function grantXP() {
  const taskArgs: GrantXPSnapshotTaskArgs = {
    proposalId:
      "0x9923aab6825158ec2503d88e3ee2f9c5fbb12000581d06343ac9829aa59b66a6",
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
