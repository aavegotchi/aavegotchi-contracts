import { run } from "hardhat";
import { RarityPayoutTaskArgs } from "../../../../tasks/rarityPayouts";

async function rarityPayout() {
  const args: RarityPayoutTaskArgs = {
    season: "3",
    rarityDataFile: "rnd4",
    rounds: "4",
    totalAmount: "1500000",
    blockNumber: "27404025",
    deployerAddress: "0x8D46fd7160940d89dA026D59B2e819208E714E82",
    tieBreakerIndex: "3",
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
