import { run } from "hardhat";
import { AddWearableSetsTaskArgs } from "../../tasks/addWearableSets";
import { itemManagerAlt, maticDiamondAddress } from "../helperFunctions";

async function addWearableSets() {
  const itemManager: string = itemManagerAlt;
  const diamondAddress: string = maticDiamondAddress;
  const setsFile: string = "wearableSetsRaffle6";

  const args: AddWearableSetsTaskArgs = {
    itemManager: itemManager,
    diamondAddress: diamondAddress,
    setsFile: setsFile,
  };
  await run("addWearableSets", args);
}

addWearableSets()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

exports.addItemTypes = addWearableSets;
