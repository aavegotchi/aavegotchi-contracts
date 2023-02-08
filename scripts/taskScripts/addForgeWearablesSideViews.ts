import { run } from "hardhat";
import { itemTypes as itemTypes1 } from "../../data/itemTypes/forgewearables1";
import { itemTypes as itemTypes2 } from "../../data/itemTypes/forgewearables2";
import {
  forgeSideExceptions,
  sideViewDimensions,
} from "../../data/itemTypes/forgewearablesSideViews";
import {
  updateSvgTaskForSideSleeves,
  updateSvgTaskForSideViews,
} from "../svgHelperFunctions";
import { convertSideDimensionsToTaskFormat } from "../../tasks/updateItemSideDimensions";
import { convertExceptionsToTaskFormat } from "../../tasks/updateWearableExceptions";

export async function addForgeWearableSideViews() {
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

  // uploading svg excpetions
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
