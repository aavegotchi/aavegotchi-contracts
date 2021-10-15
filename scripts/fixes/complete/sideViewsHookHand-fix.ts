//updating IDs 223(hook hand)

import { run } from "hardhat";

import { convertSideDimensionsToTaskFormat } from "../../tasks/updateItemSideDimensions";
import { SideDimensions } from "../itemTypeHelpers";
import {
  updateSvgTaskForSideViews,
  updateSvgTaskFront,
} from "../../scripts/svgHelperFunctions";

async function main() {
  console.log("Updating Wearables");
  let sideViewsItemIds = [223];
  let frontItemIds = [223];

  //svg upload
  let frontTaskArray = await updateSvgTaskFront(frontItemIds);
  let sideViewsTaskArray = await updateSvgTaskForSideViews(sideViewsItemIds);

  for (let index = 0; index < frontTaskArray.length; index++) {
    await run("updateSvgs", frontTaskArray[index]);
  }

  for (let index = 0; index < sideViewsTaskArray.length; index++) {
    await run("updateSvgs", sideViewsTaskArray[index]);
  }

  //dimensions
  const newDimensions: SideDimensions[] = [
    {
      itemId: 223,
      name: "Hook Hand",
      side: "back",
      dimensions: { x: 1, y: 35, width: 9, height: 9 },
    },
  ];

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

exports.hookHandFix = main;
