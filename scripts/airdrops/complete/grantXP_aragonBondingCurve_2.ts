import { run } from "hardhat";

async function grantXP() {
  await run("grantXP", {
    filename: "aragonVotes/prop4or5",
    xpAmount: "100",
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
