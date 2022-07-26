/* global ethers hre */
/* eslint prefer-const: "off" */
import { run } from "hardhat";
import { aavegotchiUpdateForSvgTask } from "../svgHelperFunctions";

async function main() {
  console.log("Update SVG Start");

  const aavegotchiIds: number[] = [2, 3];

  const aavegotchiFrontFix = await aavegotchiUpdateForSvgTask(
    aavegotchiIds,
    "front"
  );
  const aavegotchiLeftFix = await aavegotchiUpdateForSvgTask(
    aavegotchiIds,
    "left"
  );
  const aavegotchiRightFix = await aavegotchiUpdateForSvgTask(
    aavegotchiIds,
    "right"
  );

  await run("updateSvgs", aavegotchiFrontFix);
  await run("updateSvgs", aavegotchiLeftFix);
  await run("updateSvgs", aavegotchiRightFix);
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

exports.sideViewsGotchiSecondaryFix = main;
