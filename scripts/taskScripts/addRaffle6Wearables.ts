import { run } from "hardhat";
import { AddItemTypesTaskArgs } from "../../tasks/addItemTypes";
import { maticDiamondAddress, itemManager } from "../helperFunctions";

async function addItemTypes() {
  const itemFile: string = "raffle6wearables";
  const svgFile: string = "raffle6wearables";
  const sleeveStartId: string = "51";

  const args: AddItemTypesTaskArgs = {
    itemManager: itemManager,
    diamondAddress: maticDiamondAddress,
    itemFile: itemFile,
    svgFile: svgFile,
    sleeveStartId: sleeveStartId,
    uploadItemTypes: true,
    uploadWearableSvgs: true,
    uploadSleeveSvgs: false,

    replaceWearableSvgs: false,
    replaceSleeveSvgs: true,
    associateSleeves: true,
    sendToItemManager: true,
  };

  await run("addItemTypes", args);
}

addItemTypes()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

exports.addItemTypes = addItemTypes;
