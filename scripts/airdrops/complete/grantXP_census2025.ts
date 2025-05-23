import { run } from "hardhat";

async function grantXP() {
  await run("grantXP", {
    filename: "calls/census2025",
    xpAmount: "20",
    batchSize: "500",
    excludedAddresses: ["0xDd564df884Fd4e217c9ee6F65B4BA6e5641eAC63"],
  });
}

grantXP()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

exports.grantXP = grantXP;
