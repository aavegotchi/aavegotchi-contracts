//updating IDs 237 (Mythical Cacti) back, and 238 (Godlike Cacti) back

import { run } from "hardhat";

import {
  wearablesLeftSvgs as left,
  wearablesRightSvgs as right,
  wearablesBackSvgs as back,
} from "../../svgs/wearables-sides";

import { UpdateSvgsTaskArgs } from "../../tasks/updateSvgs";
import { convertSideDimensionsToTaskFormat } from "../../tasks/updateItemSideDimensions";
import { SideDimensions } from "../itemTypeHelpers";

import {
  convertDimensionsArrayToString,
  UpdateItemDimensionsTaskArgs,
} from "../../tasks/updateItemDimensions";
import { Dimensions } from "../itemTypeHelpers";

async function main() {
  let itemIds = [237, 238];
  const sides = ["left", "right", "back"];

  for (let index = 0; index < itemIds.length; index++) {
    const itemId = itemIds[index];

    const sideArrays = [left[itemId], right[itemId], back[itemId]];

    for (let index = 0; index < sides.length; index++) {
      const side = sides[index];
      const sideArray = sideArrays[index];

      let taskArgsLeft: UpdateSvgsTaskArgs = {
        svgIds: [itemId].join(","),
        svgType: `wearables-${side}`,
        svgs: [sideArray].join("***"),
      };

      await run("updateSvgs", taskArgsLeft);
    }
  }

  const newDimensions: SideDimensions[] = [
    {
      itemId: 237,
      name: "Mythical Cacti",
      side: "back",
      dimensions: { x: 0, y: 45, width: 15, height: 15 },
    },
    {
      itemId: 238,
      name: "Godlike Cacti",
      side: "back",
      dimensions: { x: 1, y: 44, width: 62, height: 10 },
    },
  ];

  await run(
    "updateItemSideDimensions",
    convertSideDimensionsToTaskFormat(newDimensions)
  );

  const mythicalCactiId = 237;
  const mythicalCactiDimensions = { x: 40, y: 45, width: 23, height: 17 };
  const dimensions: Dimensions[] = [mythicalCactiDimensions];

  const dimensionsTaskArgs: UpdateItemDimensionsTaskArgs = {
    itemIds: [mythicalCactiId].join(","),
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

exports.petFixes = main;
