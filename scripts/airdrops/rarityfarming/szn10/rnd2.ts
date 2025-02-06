import { run } from "hardhat";
import { RarityPayoutTaskArgs } from "../../../../tasks/rarityPayouts";

async function rarityPayout() {
  const args: RarityPayoutTaskArgs = {
    season: "10",
    rarityDataFile: "rnd2",
    rounds: "4",
    totalAmount: "1200000",
    blockNumber: "67490569",
    deployerAddress: "0x821049b2273b0ccd34a64d1b08a3346f110ecae2",
    tieBreakerIndex: "1",
    rarityParams: [750000.0, 7500, 0.94].toString(),
    kinshipParams: [300000.0, 7500, 0.76].toString(),
    xpParams: [150000.0, 7500, 0.65].toString(),
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
