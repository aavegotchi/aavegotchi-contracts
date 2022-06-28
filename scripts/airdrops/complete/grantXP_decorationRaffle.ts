import { run } from "hardhat";

async function grantXP() {
  await run("grantXP", {
    filename: "calls/decorationRaffle",
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
