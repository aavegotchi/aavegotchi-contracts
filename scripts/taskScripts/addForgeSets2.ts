import { run } from "hardhat";
import { AddWearableSetsTaskArgs } from "../../tasks/addWearableSets";
import { itemManager, maticDiamondAddress } from "../helperFunctions";

async function addWearableSets() {
  const setsFile: string = "forgeSets2";

  const args: AddWearableSetsTaskArgs = {
    itemManager: itemManager,
    diamondAddress: maticDiamondAddress,
    setsFile: setsFile,
    overrideTraits: "false",
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
