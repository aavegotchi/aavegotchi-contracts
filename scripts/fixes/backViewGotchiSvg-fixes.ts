/* global ethers hre */
/* eslint prefer-const: "off" */
import { run } from "hardhat";
import { aavegotchiUpdateForSvgTask } from "../svgHelperFunctions";

async function main() {
  console.log("Update SVG Start");

  const aavegotchiIds: number[] = [2, 3];

  const aavegotchiBackFix = await aavegotchiUpdateForSvgTask(
    aavegotchiIds,
    "back"
  );

  await run("updateSvgs", aavegotchiBackFix);
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

exports.backViewGotchiSvgFixes = main;
