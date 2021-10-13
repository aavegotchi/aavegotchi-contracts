//updating IDs 15(red plaid), 16(blue plaid), 31(Jordan Suit), 54(Llamacorn Shirt), 74(JaayHaoSuit),

import { run } from "hardhat";

import { wearablesSvgs as front } from "../../svgs/wearables";

import { UpdateSvgsTaskArgs } from "../../tasks/updateSvgs";
import {
  convertDimensionsArrayToString,
  UpdateItemDimensionsTaskArgs,
} from "../../tasks/updateItemDimensions";
import { Dimensions } from "../itemTypeHelpers";

async function main() {
  let frontItemIds = [15, 16, 31, 54, 74];

  //dimensions
  console.log("Updating Dimensions");

  const redPlaidDimensions = { x: 12, y: 32, width: 40, height: 22 };
  const bluePlaidDimensions = { x: 12, y: 32, width: 40, height: 22 };
  const jordanSuitDimensions = { x: 12, y: 32, width: 40, height: 22 };
  const llamaCornShirtDimensions = { x: 12, y: 32, width: 40, height: 21 };
  const jaayHaoSuitDimensions = { x: 11, y: 31, width: 42, height: 23 };

  const dimensions: Dimensions[] = [
    redPlaidDimensions,
    bluePlaidDimensions,
    jordanSuitDimensions,
    llamaCornShirtDimensions,
    jaayHaoSuitDimensions,
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

exports.bodyWearableFixes2 = main;
