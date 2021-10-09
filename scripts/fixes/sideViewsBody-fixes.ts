import { run } from "hardhat";

import { wearablesSvgs as front } from "../../svgs/wearables";

import { UpdateSvgsTaskArgs } from "../../tasks/updateSvgs";
import {
  convertDimensionsArrayToString,
  UpdateItemDimensionsTaskArgs,
} from "../../tasks/updateItemDimensions";
import { Dimensions } from "../itemTypeHelpers";

async function main() {
  let frontItemIds = [91, 109, 115];
  const side = ["front"];

  for (let index = 0; index < frontItemIds.length; index++) {
    const itemId = frontItemIds[index];

    const sideArrays = [front[itemId]];

    for (let index = 0; index < side.length; index++) {
      let taskArgsFront: UpdateSvgsTaskArgs = {
        svgIds: [itemId].join(","),
        svgType: `wearables`,
        svgs: [sideArrays].join("***"),
      };

      await run("updateSvgs", taskArgsFront);
    }
  }

  //dimensions
  console.log("Updating Dimensions");

  const pajamaDimensions = { x: 11, y: 31, width: 42, height: 22 };
  const rastaDimensions = { x: 12, y: 32, width: 40, height: 15 };
  const hawaiianDimensions = { x: 12, y: 32, width: 40, height: 21 };

  const dimensions: Dimensions[] = [
    pajamaDimensions,
    rastaDimensions,
    hawaiianDimensions,
  ];

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

exports.bodyWearableFixes = main;
