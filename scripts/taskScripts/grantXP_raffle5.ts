import { run } from "hardhat";

async function grantXP() {
  await run("grantXP", {
    filename: "calls/raffle5",
    xpAmount: "10",
    batchSize: "50",
  });
}

grantXP()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

exports.grantXP = grantXP;
