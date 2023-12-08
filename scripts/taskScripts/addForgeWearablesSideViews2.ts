import { run } from "hardhat";
import { itemTypes as itemTypes1 } from "../../data/itemTypes/forgewearables3";

import {
  sideViewDimensions,
  forgeSideExceptions,
} from "../../data/itemTypes/forgewearablesSideViews2";
import {
  updateSvgTaskForSideSleeves,
  updateSvgTaskForSideViews,
} from "../svgHelperFunctions";
import { convertSideDimensionsToTaskFormat } from "../../tasks/updateItemSideDimensions";
import { convertExceptionsToTaskFormat } from "../../tasks/updateWearableExceptions";

export async function addForgeWearableSideViews() {
  const itemIds: number[] = [
    // 370, 371, 372, 373, 374, 375, 376, 377, 378, 379, 380, 381, 382, 383, 384,
    // 385, 386, 387,
  ];
  for (let index = 0; index < itemTypes1.length; index++) {
    itemIds.push(Number(itemTypes1[index].svgId));
  }
  console.log("itemIds", itemIds);

  // uploading svg files
  let sideViewsTaskArray = await updateSvgTaskForSideViews(itemIds);
  //console.log("sideViewsTaskArray", sideViewsTaskArray);
  for (let index = 0; index < sideViewsTaskArray.length; index++) {
    await run("updateSvgs", sideViewsTaskArray[index]);
  }

  const sleeveIds = [55, 56, 57];
  let sleevesTaskArray = await updateSvgTaskForSideSleeves(sleeveIds);
  // console.log("sleevesTaskArray", sleevesTaskArray);
  for (let index = 0; index < sleevesTaskArray!.length; index++) {
    await run("updateSvgs", sleevesTaskArray![index]);
  }

  //uploading svg dimensions
  await run(
    "updateItemSideDimensions",
    convertSideDimensionsToTaskFormat(sideViewDimensions)
  );

  //uploading svg exceptions
  await run(
    "updateWearableExceptions",
    convertExceptionsToTaskFormat(forgeSideExceptions)
  );
}

if (require.main === module) {
  addForgeWearableSideViews()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
