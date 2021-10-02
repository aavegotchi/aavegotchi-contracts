import { ethers, run } from "hardhat";

import { wearablesSvgs } from "../../svgs/wearables";

import { UpdateSvgsTaskArgs } from "../../tasks/updateSvgs";
import {
  convertDimensionsArrayToString,
  UpdateItemDimensionsTaskArgs,
} from "../../tasks/updateItemDimensions";
import { Dimensions } from "../itemTypeHelpers";

async function main() {
  const rastaFront = wearablesSvgs[109];
  const pajamaPants = 91;
  const rastaShirt = 109;
  const hawaiianBlueShirt = 115;

  const itemIds = [pajamaPants, rastaShirt, hawaiianBlueShirt];

  const taskArgs: UpdateSvgsTaskArgs = {
    svgIds: [pajamaPants, rastaShirt, hawaiianBlueShirt].join(","),
    svgType: "wearables",
    svgs: [rastaFront].join("***"),
  };

  console.log("task args:", taskArgs);

  // await run("updateSvgs", taskArgs);

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
    itemIds: itemIds.join(","),
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

exports.addR5sideViews = main;
