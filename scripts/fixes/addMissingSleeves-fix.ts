//updating IDs: 8(marine jacket) front sleeves, 25(thaave suit) all sleeves, 125(track suit) all sleeves

import { run, network, ethers } from "hardhat";

import { Signer } from "@ethersproject/abstract-signer";
import { SvgFacet } from "../../typechain";
import { wearablesSvgs as front } from "../../svgs/wearables";
import {
  convertSleevesToTaskFormat,
  UpdateSleevesTaskArgs,
} from "../../tasks/updateSleeveItemId";
import { UpdateSvgsTaskArgs } from "../../tasks/updateSvgs";
import { Sleeves } from "../itemTypeHelpers";
import {
  updateSvgTaskForSideSleeves,
  updateSvgTaskFront,
  updateSvgTaskForSideViews,
} from "../svgHelperFunctions";
import {
  wearablesLeftSvgs as left,
  wearablesRightSvgs as right,
  wearablesBackSvgs as back,
  wearablesLeftSleeveSvgs as leftSleeve,
  wearablesRightSleeveSvgs as rightSleeve,
  wearablesBackSleeveSvgs as backSleeve,
} from "../../svgs/wearables-sides";

async function main() {
  console.log("Sleeves Left Length: ", leftSleeve.length);
  console.log("Sleeves Right Length: ", rightSleeve.length);
  console.log("Sleeves Back Length: ", backSleeve.length);
  const itemIds = [264, 265, 266];

  let frontViewTaskArray = await updateSvgTaskFront(itemIds);
  for (let index = 0; index < frontViewTaskArray.length; index++) {
    await run("updateSvgs", frontViewTaskArray[index]);
  }

  const sideViewSleeves = [43, 44, 45];

  const sides = ["left", "right", "back"];

  for (let index = 0; index < sideViewSleeves.length; index++) {
    const itemId = sideViewSleeves[index];

    const sideArrays = [
      leftSleeve[itemId],
      rightSleeve[itemId],
      backSleeve[itemId],
    ];

    for (let index = 0; index < sides.length; index++) {
      const side = sides[index];
      const sideArray = sideArrays[index];

      let taskArgsLeft: UpdateSvgsTaskArgs = {
        svgIds: [itemId].join(","),
        svgType: `sleeves-${side}`,
        svgs: [sideArray].join("***"),
      };

      await run("updateSvgs", taskArgsLeft);
    }
  }

  for (let index = 0; index < itemIds.length; index++) {
    const itemId = itemIds[index];

    const sideArrays = [left[itemId], right[itemId], back[itemId]];

    for (let index = 0; index < sides.length; index++) {
      const side = sides[index];
      const sideArray = sideArrays[index];

      let taskArgsLeft: UpdateSvgsTaskArgs = {
        svgIds: [itemId].join(","),
        svgType: `wearables-${side}`,
        svgs: [sideArray].join("***"),
      };

      await run("updateSvgs", taskArgsLeft);
    }
  }

  let sleeves: Sleeves[] = [
    {
      sleeveId: 43,
      wearableId: 8,
    },
    {
      sleeveId: 44,
      wearableId: 25,
    },
    {
      sleeveId: 45,
      wearableId: 125,
    },
  ];

  await run("updateSleeves", convertSleevesToTaskFormat(sleeves));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

exports.addMissingSleevesFix = main;
