//updating IDs: *15(red plaid), *16(blue plaid),
//              *31(Jordan Suit), *43(Nogara Armor),
//              *46(half rekt shirt), *50(GldXross robe)
//              *54(Llamacorn Shirt), *56(aagent shirt)
//              *74(JaayHaoSuit), *105(portal mage)

import { run } from "hardhat";

import {
  convertDimensionsArrayToString,
  UpdateItemDimensionsTaskArgs,
} from "../../tasks/updateItemDimensions";
import { Dimensions, SideDimensions } from "../itemTypeHelpers";
import { convertSideDimensionsToTaskFormat } from "../../tasks/updateItemSideDimensions";
import {
  updateSvgTaskForSideViews,
  updateSvgTaskFront,
} from "../../scripts/svgHelperFunctions";

async function main() {
  let frontItemIds = [46, 50, 54, 56, 105];
  let sideViewsItemIds = [46, 50, 54, 56, 105];

  //svg upload
  let frontTaskArray = await updateSvgTaskFront(frontItemIds);
  let sideViewsTaskArray = await updateSvgTaskForSideViews(sideViewsItemIds);

  for (let index = 0; index < frontTaskArray.length; index++) {
    await run("updateSvgs", frontTaskArray[index]);
  }

  for (let index = 0; index < sideViewsTaskArray.length; index++) {
    await run("updateSvgs", sideViewsTaskArray[index]);
  }

  //Dimensions
  console.log("Updating Dimensions");
  let dimensionItemIds = [15, 16, 31, 43, 46, 54, 56, 74];

  //front dimensions
  const redPlaidDimensions = { x: 12, y: 32, width: 40, height: 22 };
  const bluePlaidDimensions = { x: 12, y: 32, width: 40, height: 22 };
  const jordanSuitDimensions = { x: 12, y: 32, width: 40, height: 22 };
  const llamaCornShirtDimensions = { x: 12, y: 32, width: 40, height: 21 };
  const halfRektShirt = { x: 12, y: 32, width: 40, height: 19 };
  const jaayHaoSuitDimensions = { x: 11, y: 31, width: 42, height: 23 };
  const nogaraArmorDimensions = { x: 12, y: 32, width: 40, height: 22 };
  const aagentShirtDimensions = { x: 12, y: 32, width: 40, height: 19 };

  const dimensions: Dimensions[] = [
    redPlaidDimensions,
    bluePlaidDimensions,
    jordanSuitDimensions,
    nogaraArmorDimensions,
    halfRektShirt,
    llamaCornShirtDimensions,
    aagentShirtDimensions,
    jaayHaoSuitDimensions,
  ];

  const dimensionsTaskArgs: UpdateItemDimensionsTaskArgs = {
    itemIds: dimensionItemIds.join(","),
    dimensions: convertDimensionsArrayToString(dimensions),
  };
  await run("updateItemDimensions", dimensionsTaskArgs);

  //side dimensions
  const newDimensions: SideDimensions[] = [
    {
      itemId: 50,
      name: "Gldn Xross Robe",
      side: "left",
      dimensions: { x: 20, y: 31, width: 24, height: 22 },
    },
    {
      itemId: 50,
      name: "Gldn Xross Robe",
      side: "right",
      dimensions: { x: 20, y: 31, width: 24, height: 22 },
    },
    {
      itemId: 74,
      name: "Jaay Hao Suit",
      side: "left",
      dimensions: { x: 20, y: 32, width: 5, height: 10 },
    },
    {
      itemId: 74,
      name: "Jaay Hao Suit",
      side: "right",
      dimensions: { x: 20, y: 32, width: 5, height: 10 },
    },
    {
      itemId: 74,
      name: "Jaay Hao Suit",
      side: "back",
      dimensions: { x: 11, y: 31, width: 34, height: 23 },
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

exports.bodyWearableFixes2 = main;
