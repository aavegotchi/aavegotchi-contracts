import { run } from "hardhat";
import { AddItemTypesTaskArgs } from "../../tasks/addItemTypes";
import { maticDiamondAddress, itemManager } from "../helperFunctions";
import { itemTypes } from "../../data/itemTypes/raffle6wearables";
import {
  convertDimensionsArrayToString,
  UpdateItemDimensionsTaskArgs,
} from "../../tasks/updateItemDimensions";
import { Dimensions } from "../itemTypeHelpers";

async function addItemTypes() {
  const itemFile: string = "raffle6wearables";
  const svgFile: string = "raffle6wearables";
  const sleeveStartId: string = "43"; // last sleeve id for this set is 48

  const args: AddItemTypesTaskArgs = {
    itemManager: itemManager,
    diamondAddress: maticDiamondAddress,
    itemFile: itemFile,
    svgFile: svgFile,
    sleeveStartId: sleeveStartId,
    uploadItemTypes: true,
    uploadWearableSvgs: true,
    uploadSleeveSvgs: true,

    replaceWearableSvgs: false,
    replaceSleeveSvgs: false,
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
