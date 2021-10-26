import { run } from "hardhat";
import { RarityPayoutTaskArgs } from "../../tasks/rarityPayouts";

async function rarityPayout() {
  const args: RarityPayoutTaskArgs = {
    season: "2",
    rarityDataFile: "rnd1",
    rounds: "4",
    totalAmount: "2000000",
    blockNumber: "",
  };
  await run("rarityPayout", args);
}

rarityPayout()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

exports.rarityPayout = rarityPayout;
