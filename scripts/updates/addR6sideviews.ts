import { run } from "hardhat";

import { itemTypes } from "../../data/itemTypes/raffle6wearables";
import {
  updateSvgTaskForSideViews,
  updateSvgTaskForSideSleeves,
} from "../../scripts/svgHelperFunctions";
import { convertSideDimensionsToTaskFormat } from "../../tasks/updateItemSideDimensions";
import { SideDimensions } from "../itemTypeHelpers";
import { sideViewDimensions } from "../../data/itemTypes/raffle6wearablesSideViews";

async function main() {
  const itemIds: number[] = [];
  let arrayEnd = 292;
  for (let index = 264; index < arrayEnd; index++) {
    itemIds.push(index);
  }
  for (let index = 0; index < itemTypes.length; index++) {
    itemIds.push(Number(itemTypes[index].svgId));
  }

  //uploading svg files
  let sideViewsTaskArray = await updateSvgTaskForSideViews(itemIds);
  for (let index = 0; index < sideViewsTaskArray.length; index++) {
    await run("updateSvgs", sideViewsTaskArray[index]);
  }

  const sleeveIds = [43, 44, 45, 46, 47, 48];
  let sleevesTaskArray = await updateSvgTaskForSideSleeves(sleeveIds);
  for (let index = 0; index < sleevesTaskArray.length; index++) {
    await run("updateSvgs", sleevesTaskArray[index]);
  }

  //uploading svg dimensions
  const newDimensions: SideDimensions[] = sideViewDimensions;
  await run(
    "updateItemSideDimensions",
    convertSideDimensionsToTaskFormat(newDimensions)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
