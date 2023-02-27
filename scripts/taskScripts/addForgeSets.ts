import { run } from "hardhat";
import { AddWearableSetsTaskArgs } from "../../tasks/addWearableSets";
import { maticDiamondAddress } from "../helperFunctions";

async function addWearableSets() {
  const itemManager: string = "0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119";
  const diamondAddress: string = maticDiamondAddress;
  const setsFile: string = "forgeSets";

  const args: AddWearableSetsTaskArgs = {
    itemManager: itemManager,
    diamondAddress: diamondAddress,
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
