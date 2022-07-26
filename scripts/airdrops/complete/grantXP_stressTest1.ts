import { run } from "hardhat";

async function grantXP() {
  await run("grantXP_aavegotchis", {
    filename: "minigames/stressTest1",
    amount: "10",
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
