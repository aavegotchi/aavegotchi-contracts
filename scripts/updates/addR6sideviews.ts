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

  //testing
  console.log("*** Wearable Arrays Length ***");
  console.log("Right: ", right.length);
  console.log("Left: ", left.length);
  console.log("Back: ", back.length);
  console.log("Right Sleeve: ", rightSleeve.length);
  console.log("Left Sleeve: ", leftSleeve.length);
  console.log("Back Sleeve: ", backSleeve.length);

  /* let signer: Signer;
  const testing = ["hardhat", "localhost"].includes(network.name);

  if (testing) {
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [itemManager],
    });
    signer = await ethers.getSigner(itemManager);
  } else if (network.name === "matic") {
    const accounts = await ethers.getSigners();
    signer = accounts[0]; //new LedgerSigner(ethers.provider);

    console.log("signer:", signer);
  } else {
    throw Error("Incorrect network selected");
  }

  const svgViewsFacet = await ethers.getContractAt(
    "SvgViewsFacet",
    maticDiamondAddress,
    signer
  );

  let numTraits1: [number, number, number, number, number, number] = [
    99, 99, 99, 99, 12, 9,
  ];
  let wearables1: [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number
  ] = [0, 0, 0, 0, 312, 299, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

  // // **** Test ****
  // // BODY = 0;
  // // FACE = 1;
  // // EYES = 2;
  // // HEAD = 3;
  // // RIGHT = 4;
  // // LEFT = 5;
  // // PET = 6;
  // // BG = 7;

  const sidePreview = await svgViewsFacet.previewSideAavegotchi(
    "2",
    "0xE0b22E0037B130A9F56bBb537684E6fA18192341",
    numTraits1,
    wearables1
  );
  console.log("Side Preview: ", sidePreview); */
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
