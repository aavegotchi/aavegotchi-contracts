import { run } from "hardhat";
import { propType } from "../../../helperFunctions";
import { GrantXPSnapshotTaskArgs } from "../../../../tasks/grantXP_snapshot";

async function grantXP() {
  const id =
    "0x84f361a72e89cee4e27f4d9a7eb5793e0209a0f364a6de9f4f076c43e49b9404";
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
