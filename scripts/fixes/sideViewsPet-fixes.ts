
//updating IDs 237 (Mythical Cacti) back, and 238 (Godlike Cacti) back 

import { run } from "hardhat";

import {
  wearablesLeftSvgs,
  wearablesRightSvgs,
  wearablesBackSvgs,
} from "../../svgs/wearables-sides";

import { sideViewDimensions6, sideViewDimensions8 } from "../../svgs/sideViewDimensions";
import { UpdateSvgsTaskArgs } from "../../tasks/updateSvgs";

import { 
  UpdateItemSideDimensionsTaskArgs,
  convertSideDimensionsToString
} from "../../tasks/updateItemSideDimensions";


async function main() {
  const itemIds = [ 237, 238, ];

  for (let index = 0; index < itemIds.length; index++) {
    const itemId = itemIds[index];

    const left = wearablesLeftSvgs[itemId];
    const right = wearablesRightSvgs[itemId];
    const back = wearablesBackSvgs[itemId];

    let taskArgsLeft: UpdateSvgsTaskArgs = {
      svgIds: [itemId].join(","),
      svgType: "wearables-left",
      svgs: [left].join("***"),
    }
    await run("updateSvgs", taskArgsLeft);

    let taskArgsRight: UpdateSvgsTaskArgs = {
      svgIds: [itemId].join(","),
      svgType: "wearables-right",
      svgs: [right].join("***"),
    }
    await run("updateSvgs", taskArgsRight); 

    let taskArgsBack: UpdateSvgsTaskArgs = {
      svgIds: [itemId].join(","),
      svgType: "wearables-back",
      svgs: [back].join("***"),
    }
    await run("updateSvgs", taskArgsBack); 

  for (let index = 0; index < sideViewDimensions6.length; index++){
    const itemArray = sideViewDimensions6[index];
    const itemId = [];
    itemId.push(itemArray.itemId);

    const sideDimensionsTaskArgs: UpdateItemSideDimensionsTaskArgs = {
      itemIds: itemId.join(),
      side: itemArray.side,
      dimensions: convertSideDimensionsToString(itemArray.dimensions),
    };
    await run("updateItemSideDimensions", sideDimensionsTaskArgs);
  }

  for (let index = 0; index < sideViewDimensions8.length; index++){
    const itemArray = sideViewDimensions8[index];
    const itemId = [];
    itemId.push(itemArray.itemId);

    const sideDimensionsTaskArgs: UpdateItemSideDimensionsTaskArgs = {
      itemIds: itemId.join(),
      side: itemArray.side,
      dimensions: convertSideDimensionsToString(itemArray.dimensions),
    };
    await run("updateItemSideDimensions", sideDimensionsTaskArgs);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

exports.addR5sideViews = main;
