//updating IDs 69 (farmer pitchfork) 229 (Lasso),

import { run } from "hardhat";

import {
  wearablesLeftSvgs,
  wearablesRightSvgs,
  wearablesBackSvgs,
} from "../../svgs/wearables-sides";

import {
  sideViewDimensions1,
  sideViewDimensions8,
} from "../../svgs/sideViewDimensions";

import { UpdateSvgsTaskArgs } from "../../tasks/updateSvgs";
import { convertSideDimensionsToTaskFormat } from "../../tasks/updateItemSideDimensions";

async function main() {
  console.log("Updating Wearables");
  const itemIds = [69, 229];

  //hand wearables
  for (let index = 0; index < itemIds.length; index++) {
    const itemId = itemIds[index];

    const left = wearablesLeftSvgs[itemId];
    const right = wearablesRightSvgs[itemId];
    const back = wearablesBackSvgs[itemId];

    let taskArgsLeft: UpdateSvgsTaskArgs = {
      svgIds: [itemId].join(","),
      svgType: "wearables-left",
      svgs: [left].join("***"),
    };
    await run("updateSvgs", taskArgsLeft);

    let taskArgsRight: UpdateSvgsTaskArgs = {
      svgIds: [itemId].join(","),
      svgType: "wearables-right",
      svgs: [right].join("***"),
    };
    await run("updateSvgs", taskArgsRight);

    let taskArgsBack: UpdateSvgsTaskArgs = {
      svgIds: [itemId].join(","),
      svgType: "wearables-back",
      svgs: [back].join("***"),
    };
    await run("updateSvgs", taskArgsBack);
  }

  //dimensions
  await run(
    "updateItemSideDimensions",
    convertSideDimensionsToTaskFormat(sideViewDimensions1)
  );
  await run(
    "updateItemSideDimensions",
    convertSideDimensionsToTaskFormat(sideViewDimensions8)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

exports.handFixes = main;
