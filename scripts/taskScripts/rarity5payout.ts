import { run } from "hardhat";

async function rarityPayout() {
  await run("rarityPayout", {
    rarityDataFile: "rarityFarmingRoundFour"
  });
}

rarityPayout()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

exports.rarityPayout = rarityPayout;
