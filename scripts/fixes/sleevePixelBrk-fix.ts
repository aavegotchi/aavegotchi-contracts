// ID:  8(marine jacket), 11(mess dress), 15(red plaid shirt), 16(blue plaid shirt), 19(aave hero shirt),
//      22(captain aave suit), 28(marc outfit), 31(jordan suit), 37(eth T-shirt), 43(Nogara Eagle Armor),
//      50(Gldn Xross Robe), 56(Aagent Shirt), 74(Jaay Hao Suit), 85(Gentleman Suit), 91(PajamaPants),
//      102(Witch Cape), 109(Rasta Shirt), 112(HazmatSuit), 114(RedHawaiian Shirt), 115(BlueHawaiian Shirt),
//      125(Track Suit), 135(Polygon Shirt), 138(Snapshot Shirt), 150(Royal Robes), 160(Lil Pump Threads),
//      222(Pirate Coat), 231(Comfy Poncho), 234(Shaaman Poncho), 244(VNeck Shirt)

import { run } from "hardhat";
import {
  updateSvgTaskForSvgType,
  updateSleevesTaskForSvgType,
} from "../svgHelperFunctions";
import {
  convertDimensionsArrayToString,
  UpdateItemDimensionsTaskArgs,
} from "../../tasks/updateItemDimensions";
import { Dimensions } from "../itemTypeHelpers";

async function main() {
  const ids = [
    8, 11, 15, 16, 19, 22, 28, 31, 37, 43, 50, 56, 74, 85, 91, 102, 109, 112,
    114, 115, 125, 135, 138, 160, 222, 231, 234, 244, 310,
  ];

  const sleeveIds = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
    23, 24, 25, 26, 27, 28, 29, 31, 32, 33, 34, 35, 36, 49, 51,
  ];

  const sideSleeveIds = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
    23, 24, 25, 26, 27, 28, 29, 31, 32, 33, 34, 35, 36, 49, 51,
  ];

  console.log("Body length: ", ids.length);
  console.log("Sleeves length: ", sleeveIds.length);
  console.log("Side Sleeves length: ", sideSleeveIds.length);

  //update svg
  const frontBody = await updateSvgTaskForSvgType(ids, "front");
  const frontSleeves = await updateSleevesTaskForSvgType(sleeveIds, "front");
  const backBody = await updateSvgTaskForSvgType(ids, "back");
  const backSleeves = await updateSleevesTaskForSvgType(sleeveIds, "back");
  const rightSleeves = await updateSleevesTaskForSvgType(
    sideSleeveIds,
    "right"
  );
  const leftSleeves = await updateSleevesTaskForSvgType(sideSleeveIds, "left");

  await run("updateSvgs", frontBody);
  await run("updateSvgs", frontSleeves);
  await run("updateSvgs", backBody);
  await run("updateSvgs", backSleeves);
  await run("updateSvgs", rightSleeves);
  await run("updateSvgs", leftSleeves);

  //update dimensions
  let dimFixIds: number[] = [135, 138, 160];

  const polygonShirtDimensions = { x: 12, y: 32, width: 40, height: 20 };
  const snapShotShirtDimensions = { x: 12, y: 32, width: 40, height: 20 };
  const lilPumpThreadsDimensions = { x: 11, y: 31, width: 42, height: 22 };
  const dimensions: Dimensions[] = [
    polygonShirtDimensions,
    snapShotShirtDimensions,
    lilPumpThreadsDimensions,
  ];

  const dimensionsTaskArgs: UpdateItemDimensionsTaskArgs = {
    itemIds: dimFixIds.join(","),
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

exports.sleevePixelBrkFix = main;
