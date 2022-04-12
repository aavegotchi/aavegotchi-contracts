import { run } from "hardhat";

async function grantXP() {
  await run("grantXP", {
    filename: "calls/rarityFarmingSzn3_rnd1",
    xpAmount: "10",
    batchSize: "500",
    excludedAddresses: "",
  });
}

grantXP()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

exports.grantXP = grantXP;
