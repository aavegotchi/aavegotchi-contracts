import { run } from "hardhat";
import { maticDiamondAddress } from "../helperFunctions";

async function addWearableSets() {
  const itemManager: string = "0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119";
  const diamondAddress: string = maticDiamondAddress;
  const setsFile: string = "raffle5sets";

  await run("addWearableSets", {
    itemManager: itemManager,
    diamondAddress: diamondAddress,
    itemFile: setsFile,
  });
}

addWearableSets()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

exports.addItemTypes = addWearableSets;
