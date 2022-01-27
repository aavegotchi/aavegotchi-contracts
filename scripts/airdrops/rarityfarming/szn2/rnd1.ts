import { run } from "hardhat";
import { RarityPayoutTaskArgs } from "../../../../tasks/rarityPayouts";

async function rarityPayout() {
  const args: RarityPayoutTaskArgs = {
    season: "2",
    rarityDataFile: "rnd1",
    rounds: "4",
    totalAmount: "2000000",
    blockNumber: "21170980",
    deployerAddress: "0x8D46fd7160940d89dA026D59B2e819208E714E82",
    tieBreakerIndex: "1",
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
