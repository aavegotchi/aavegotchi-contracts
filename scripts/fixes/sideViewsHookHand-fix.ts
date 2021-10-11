//updating IDs 223(hook hand)

import { run } from "hardhat";

import {
  wearablesLeftSvgs as left,
  wearablesRightSvgs as right,
  wearablesBackSvgs as back,
} from "../../svgs/wearables-sides";

import { wearablesSvgs as front } from "../../svgs/wearables";

import { UpdateSvgsTaskArgs } from "../../tasks/updateSvgs";
import { convertSideDimensionsToTaskFormat } from "../../tasks/updateItemSideDimensions";
import { SideDimensions } from "../itemTypeHelpers";

async function main() {
  console.log("Updating Wearables");
  let itemIds = [223];
  const sides = ["left", "right", "back"];

  //hand wearables
  for (let index = 0; index < itemIds.length; index++) {
    const itemId = itemIds[index];

    const sideArrays = [left[itemId], right[itemId], back[itemId]];

    for (let index = 0; index < sides.length; index++) {
      const side = sides[index];
      const sideArray = sideArrays[index];

      let taskArgsSides: UpdateSvgsTaskArgs = {
        svgIds: [itemId].join(","),
        svgType: `wearables-${side}`,
        svgs: [sideArray].join("***"),
      };

      await run("updateSvgs", taskArgsSides);
    }
  }

  let frontItemIds = [223];

  for (let index = 0; index < frontItemIds.length; index++) {
    const itemId = frontItemIds[index];

    const sideArrays = [front[itemId]];

    for (let index = 0; index < sides.length; index++) {
      let taskArgsFront: UpdateSvgsTaskArgs = {
        svgIds: [itemId].join(","),
        svgType: `wearables`,
        svgs: [sideArrays].join("***"),
      };

      await run("updateSvgs", taskArgsFront);
    }
  }

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
