import { run } from "hardhat";

import {
  wearablesLeftSvgs as left,
  wearablesRightSvgs as right,
  wearablesBackSvgs as back,
  wearablesLeftSleeveSvgs as leftSleeve,
  wearablesRightSleeveSvgs as rightSleeve,
  wearablesBackSleeveSvgs as backSleeve,
} from "../../svgs/wearables-sides";
import { itemTypes } from "../../data/itemTypes/raffle6wearables";
import { UpdateSvgsTaskArgs } from "../../tasks/updateSvgs";
import { updateSvgTaskForSideViews } from "../../scripts/svgHelperFunctions";
import { convertSideDimensionsToTaskFormat } from "../../tasks/updateItemSideDimensions";
import { SideDimensions } from "../itemTypeHelpers";
import { sideViewDimensions } from "../../data/itemTypes/raffle6wearablesSideViews";
import { BigNumberish } from "ethers";

async function main() {
  const itemIds: number[] = [];
  for (let index = 0; index < itemTypes.length; index++) {
    itemIds.push(Number(itemTypes[index].svgId));
  }

  let sideViewsTaskArray = await updateSvgTaskForSideViews(itemIds);

  for (let index = 0; index < sideViewsTaskArray.length; index++) {
    await run("updateSvgs", sideViewsTaskArray[index]);
  }

  const newDimensions: SideDimensions[] = sideViewDimensions;
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
