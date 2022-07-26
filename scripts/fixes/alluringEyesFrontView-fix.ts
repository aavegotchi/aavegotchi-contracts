//updating IDs: 301(alluring eyes)

import { run } from "hardhat";

import { updateSvgTaskFront } from "../svgHelperFunctions";
import {
  convertDimensionsArrayToString,
  UpdateItemDimensionsTaskArgs,
} from "../../tasks/updateItemDimensions";
import { Dimensions } from "../itemTypeHelpers";

async function main() {
  //update svg
  let frontItemIds = [301];

  let frontTaskArray = await updateSvgTaskFront(frontItemIds);

  for (let index = 0; index < frontTaskArray.length; index++) {
    await run("updateSvgs", frontTaskArray[index]);
  }

  //update dimensions
  const alluringEyesDimensions = { x: 18, y: 19, width: 27, height: 13 };
  const dimensions: Dimensions[] = [alluringEyesDimensions];

  const dimensionsTaskArgs: UpdateItemDimensionsTaskArgs = {
    itemIds: frontItemIds.join(","),
    dimensions: convertDimensionsArrayToString(dimensions),
  };
  await run("updateItemDimensions", dimensionsTaskArgs);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

exports.alluringEyesFix = main;
