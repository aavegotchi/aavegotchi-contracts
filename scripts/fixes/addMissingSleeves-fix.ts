//updating IDs: 8(marine jacket) front sleeves, 25(thaave suit) all sleeves, 125(track suit) all sleeves

import { run, network, ethers } from "hardhat";

import {
  wearablesSvgs as front,
  sleeveSvgs as frontSleeve,
} from "../../svgs/wearables";
import {
  convertSleevesToTaskFormat,
  UpdateSleevesTaskArgs,
} from "../../tasks/updateSleeves";
import { Sleeves } from "../itemTypeHelpers";
import {
  updateSvgTaskForSvgType,
  updateSleevesTaskForSvgType,
} from "../svgHelperFunctions";

async function main() {
  const viewSleeves = [49, 50, 51];

  const sleevesFront = await updateSleevesTaskForSvgType(viewSleeves, "front");
  const sleevesLeft = await updateSleevesTaskForSvgType(viewSleeves, "left");
  const sleevesRight = await updateSleevesTaskForSvgType(viewSleeves, "right");
  const sleevesBack = await updateSleevesTaskForSvgType(viewSleeves, "back");

  console.log("Marine Jacket Sleeves: ", frontSleeve[49]);

  console.log("Sleeves Data: ", sleevesFront);

  await run("updateSvgs", sleevesFront);
  await run("updateSvgs", sleevesLeft);
  await run("updateSvgs", sleevesRight);
  await run("updateSvgs", sleevesBack);

  let sleeves: Sleeves[] = [
    {
      sleeveId: 49,
      wearableId: 8,
    },
    {
      sleeveId: 50,
      wearableId: 25,
    },
    {
      sleeveId: 51,
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
