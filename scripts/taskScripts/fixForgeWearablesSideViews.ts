import { run } from "hardhat";
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

export async function fixForgeWearableSideViews() {
  const itemIds: number[] = [
    359, 360, 361, 362, 363, 364, 365, 366, 367, 368, 369,
  ];

  // uploading svg files
  let sideViewsTaskArray = await updateSvgTaskForSideViews(itemIds);
  // console.log("sideViewsTaskArray", sideViewsTaskArray);
  for (let index = 0; index < sideViewsTaskArray.length; index++) {
    await run("updateSvgs", sideViewsTaskArray[index]);
  }

  const sleeveIds = [53, 54];
  let sleevesTaskArray = await updateSvgTaskForSideSleeves(sleeveIds);
  // console.log("sleevesTaskArray", sleevesTaskArray);
  for (let index = 0; index < sleevesTaskArray.length; index++) {
    await run("updateSvgs", sleevesTaskArray[index]);
  }

  // uploading svg dimensions
  await run(
    "updateItemSideDimensions",
    convertSideDimensionsToTaskFormat(sideViewDimensions)
  );

  // uploading svg exceptions
  await run(
    "updateWearableExceptions",
    convertExceptionsToTaskFormat(forgeSideExceptions)
  );
}

if (require.main === module) {
  fixForgeWearableSideViews()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
