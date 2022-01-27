import { run, ethers, network } from "hardhat";

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
import {
  updateSvgTaskForSideViews,
  updateSvgTaskForSideSleeves,
} from "../../scripts/svgHelperFunctions";
import { convertSideDimensionsToTaskFormat } from "../../tasks/updateItemSideDimensions";
import { SideDimensions } from "../itemTypeHelpers";
import { sideViewDimensions } from "../../data/itemTypes/raffle6wearablesSideViews";
import { uploadOrUpdateSvg } from "../svgHelperFunctions";

import { SvgViewsFacet, SvgFacet } from "../../typechain";
import { Signer } from "@ethersproject/abstract-signer";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import {
  getDiamondSigner,
  itemManager,
  maticDiamondAddress,
} from "../../scripts/helperFunctions";
import { BigNumberish } from "ethers";

async function main() {
  const itemIds: number[] = [];
  for (let index = 0; index < itemTypes.length; index++) {
    itemIds.push(Number(itemTypes[index].svgId));
  }

  //uploading svg files
  let sideViewsTaskArray = await updateSvgTaskForSideViews(itemIds);
  for (let index = 0; index < sideViewsTaskArray.length; index++) {
    await run("updateSvgs", sideViewsTaskArray[index]);
  }

  const sleeveIds = [43, 44, 45, 46, 47, 48];
  let sleevesTaskArray = await updateSvgTaskForSideSleeves(sleeveIds);
  for (let index = 0; index < sleevesTaskArray.length; index++) {
    await run("updateSvgs", sleevesTaskArray[index]);
  }

  //uploading svg dimensions
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
