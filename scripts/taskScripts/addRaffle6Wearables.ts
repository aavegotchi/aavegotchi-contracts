import { run } from "hardhat";
import { AddItemTypesTaskArgs } from "../../tasks/addItemTypes";
import { maticDiamondAddress, itemManager } from "../helperFunctions";
import { setDimensionsObjectFromArray } from "../svgHelperFunctions";
import { itemTypes } from "../../data/itemTypes/raffle6wearables";
import {
  convertDimensionsArrayToString,
  UpdateItemDimensionsTaskArgs,
} from "../../tasks/updateItemDimensions";
import { Dimensions } from "../itemTypeHelpers";

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
    uploadSleeveSvgs: true,

    replaceWearableSvgs: false,
    replaceSleeveSvgs: false,
    associateSleeves: true,
    sendToItemManager: true,
  };

  await run("addItemTypes", args);

  const itemsArray = setDimensionsObjectFromArray(itemTypes);

  await run("updateItemDimensions", itemsArray);
}

addItemTypes()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

exports.addItemTypes = addItemTypes;
