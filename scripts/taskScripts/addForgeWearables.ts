import { run } from "hardhat";
import { AddItemTypesTaskArgs } from "../../tasks/addItemTypes";
import { maticDiamondAddress, itemManagerAlt } from "../helperFunctions";
import { upgrade } from "../upgrades/upgrade-editItemTypes";
import { itemTypes as itemTypes1 } from "../../data/itemTypes/forgewearables1";
import { itemTypes as itemTypes2 } from "../../data/itemTypes/forgewearables2";
import { sideViewDimensions } from "../../data/itemTypes/forgewearablesSideViews";
import {
  updateSvgTaskForSideSleeves,
  updateSvgTaskForSideViews,
} from "../svgHelperFunctions";
import { convertSideDimensionsToTaskFormat } from "../../tasks/updateItemSideDimensions";

export async function addItemTypes() {
  await upgrade();

  // Replace wrongly added baadges with forge wearables
  const itemFile: string = "forgewearables1";
  const svgFile: string = "forgewearables1";
  const sleeveStartId: string = "52"; // last sleeve id for this set is 54

  const args: AddItemTypesTaskArgs = {
    itemManager: itemManagerAlt,
    diamondAddress: maticDiamondAddress,
    itemFile: itemFile,
    svgFile: svgFile,
    sleeveStartId: sleeveStartId,
    uploadItemTypes: false,
    uploadWearableSvgs: true,
    uploadSleeveSvgs: true,

    replaceItemTypes: true,
    replaceWearableSvgs: false,
    replaceSleeveSvgs: false,
    associateSleeves: true,
    sendToItemManager: true,
  };

  await run("addItemTypes", args);

  // Add remained forge wearables
  const itemFile2: string = "forgewearables2";
  const svgFile2: string = "forgewearables2";
  const sleeveStartId2: string = "54"; // last sleeve id for this set is 51

  const args2: AddItemTypesTaskArgs = {
    itemManager: itemManagerAlt,
    diamondAddress: maticDiamondAddress,
    itemFile: itemFile2,
    svgFile: svgFile2,
    sleeveStartId: sleeveStartId2,
    uploadItemTypes: true,
    uploadWearableSvgs: true,
    uploadSleeveSvgs: true,

    replaceItemTypes: false,
    replaceWearableSvgs: false,
    replaceSleeveSvgs: false,
    associateSleeves: true,
    sendToItemManager: true,
  };

  await run("addItemTypes", args2);

  // add sideview dimensions for forge wearables
  const itemIds: number[] = [];
  for (let index = 0; index < itemTypes1.length; index++) {
    itemIds.push(Number(itemTypes1[index].svgId));
  }
  for (let index = 0; index < itemTypes2.length; index++) {
    itemIds.push(Number(itemTypes2[index].svgId));
  }

  // uploading svg files
  let sideViewsTaskArray = await updateSvgTaskForSideViews(itemIds);
  console.log("sideViewsTaskArray", sideViewsTaskArray);
  for (let index = 0; index < sideViewsTaskArray.length; index++) {
    await run("updateSvgs", sideViewsTaskArray[index]);
  }

  const sleeveIds = [52, 53, 54];
  let sleevesTaskArray = await updateSvgTaskForSideSleeves(sleeveIds);
  console.log("sleevesTaskArray", sleevesTaskArray);
  for (let index = 0; index < sleevesTaskArray.length; index++) {
    await run("updateSvgs", sleevesTaskArray[index]);
  }

  // uploading svg dimensions
  await run(
    "updateItemSideDimensions",
    convertSideDimensionsToTaskFormat(sideViewDimensions)
  );
}

if (require.main === module) {
  addItemTypes()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
