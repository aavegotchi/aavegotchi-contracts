import { run } from "hardhat";

async function grantXP() {
  await run("grantXP_customValues", {
    filename: "amb/may",
    batchSize: "500",
  });
}

grantXP()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

exports.grantXP = grantXP;
