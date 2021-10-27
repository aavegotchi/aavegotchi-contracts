//updating IDs: 93(fluffy pillow), 257(bitcoin guitar)

import { run } from "hardhat";
import {
  updateSvgTaskForSideViews,
  updateSvgTaskFront,
} from "../svgHelperFunctions";

async function main() {
  let frontItemIds = [93, 257];
  let sideViewsItemIds = [93, 257];

  //svg upload
  let frontTaskArray = await updateSvgTaskFront(frontItemIds);
  let sideViewsTaskArray = await updateSvgTaskForSideViews(sideViewsItemIds);

  for (let index = 0; index < frontTaskArray.length; index++) {
    await run("updateSvgs", frontTaskArray[index]);
  }

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

exports.handBatchFixes2 = main;
