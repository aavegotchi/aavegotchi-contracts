//updating IDs: 15(red plaid shirt), 16(blue plaid shirt), 112(hazmat suit)

import { run } from "hardhat";

import {
  updateSvgTaskForSideViews,
  updateSvgTaskFront,
} from "../svgHelperFunctions";

async function main() {
  let sideViewsIds = [15, 16, 112];

  let sideViewsTaskArray = await updateSvgTaskForSideViews(sideViewsIds);

  for (let index = 0; index < sideViewsTaskArray.length; index++) {
    await run("updateSvgs", sideViewsTaskArray[index]);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

exports.bodyWearableBatchFixes3 = main;
