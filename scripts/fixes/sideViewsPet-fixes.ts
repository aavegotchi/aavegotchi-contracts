//updating IDs 237 (Mythical Cacti) back, and 238 (Godlike Cacti) back

import { run } from "hardhat";

import {
  wearablesLeftSvgs,
  wearablesRightSvgs,
  wearablesBackSvgs,
} from "../../svgs/wearables-sides";

import {
  sideViewDimensions6,
  sideViewDimensions8,
} from "../../svgs/sideViewDimensions";

import { UpdateSvgsTaskArgs } from "../../tasks/updateSvgs";
import { convertSideDimensionsToTaskFormat } from "../../tasks/updateItemSideDimensions";

async function main() {
  let itemIds = [237, 238];

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

  await run(
    "updateItemSideDimensions",
    convertSideDimensionsToTaskFormat(sideViewDimensions6)
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

exports.petFixes = main;
