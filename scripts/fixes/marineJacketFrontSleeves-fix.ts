//updating ID 8(marine jacket) front sleeves

import { run } from "hardhat";

import { wearablesSvgs as front } from "../../svgs/wearables";
import {
  convertSleevesToTaskFormat,
  UpdateSleevesTaskArgs,
} from "../../tasks/updateSleeveItemId";
import { UpdateSvgsTaskArgs } from "../../tasks/updateSvgs";
import { Sleeves } from "../itemTypeHelpers";
import { wearable } from "../svgHelperFunctions";

async function main() {
  let frontItemIds = [8];
  const side = ["front"];

  for (let index = 0; index < frontItemIds.length; index++) {
    const itemId = frontItemIds[index];

    const sideArrays = [front[itemId]];

    for (let index = 0; index < side.length; index++) {
      let taskArgsFront: UpdateSvgsTaskArgs = {
        svgIds: [itemId].join(","),
        svgType: `wearables`,
        svgs: [sideArrays].join("***"),
      };

      await run("updateSvgs", taskArgsFront);
    }
  }

  let sleeves: Sleeves[] = [
    {
      sleeveId: 36,
      wearableId: 8,
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

exports.marineJacketSleeveFix = main;
