import { ethers, run } from "hardhat";
import { itemTypes } from "../../data/itemTypes/gotchigangwearables";

import {
  sideViewDimensions,
  gotchigangSideExceptions,
} from "../../data/itemTypes/gotchigangwearableSideViews";
import {
  updateSvgTaskForSideSleeves,
  updateSvgTaskForSideViews,
} from "../svgHelperFunctions";
import { convertSideDimensionsToTaskFormat } from "../../tasks/updateItemSideDimensions";
import { convertExceptionsToTaskFormat } from "../../tasks/updateWearableExceptions";
import { AddItemTypesTaskArgs } from "../../tasks/addItemTypes";
import {
  diamondOwner,
  maticDiamondAddress,
  maticForgeDiamond,
} from "../helperFunctions";

export async function addGotchigangWearableSideViewsAndItemTypes() {
  //upload wearables and add itemtypes
  const itemFile: string = "gotchigangwearables";
  const svgFile: string = "gotchigangwearables";

  //not uploading sleeves
  const sleeveStartId: string = "0";

  const args: AddItemTypesTaskArgs = {
    diamondAddress: maticDiamondAddress,
    itemFile: itemFile,
    svgFile: svgFile,
    sleeveStartId: sleeveStartId,
    uploadItemTypes: true,
    uploadWearableSvgs: true,
    uploadSleeveSvgs: false,

    replaceItemTypes: false,
    replaceWearableSvgs: false,
    replaceSleeveSvgs: false,
    associateSleeves: false,
    sendToAddress: maticForgeDiamond, //TODO
  };

  await run("addItemTypes", args);

  //upload side views
  const itemIds: number[] = [
    //404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416, 417
  ];
  for (let index = 0; index < itemTypes.length; index++) {
    itemIds.push(Number(itemTypes[index].svgId));
  }
  console.log("itemIds", itemIds);

  // uploading svg files
  let sideViewsTaskArray = await updateSvgTaskForSideViews(itemIds);
  console.log("sideViewsTaskArray", sideViewsTaskArray);

  for (let index = 0; index < sideViewsTaskArray!.length; index++) {
    await run("updateSvgs", sideViewsTaskArray![index]);
  }

  //uploading svg dimensions
  await run(
    "updateItemSideDimensions",
    convertSideDimensionsToTaskFormat(sideViewDimensions)
  );

  // uploading svg exceptions
  await run(
    "updateWearableExceptions",
    convertExceptionsToTaskFormat(gotchigangSideExceptions)
  );
}

if (require.main === module) {
  addGotchigangWearableSideViewsAndItemTypes()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
