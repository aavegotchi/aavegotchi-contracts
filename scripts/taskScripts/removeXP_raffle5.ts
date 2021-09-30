import { run } from "hardhat";

async function grantXP() {
  await run("removeXP", {
    filename: "calls/raffle5remove",
  });
}

grantXP()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

exports.grantXP = grantXP;
