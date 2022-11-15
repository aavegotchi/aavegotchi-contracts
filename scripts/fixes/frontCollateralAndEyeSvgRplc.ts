/* global ethers hre */
/* eslint prefer-const: "off" */
import { run } from "hardhat";
import {
  collateralsUpdateForSvgTask,
  eyeShapeUpdateForSvgTask,
} from "../svgHelperFunctions";

async function main() {
  console.log("Update Collateral SVG Start");

  const collateralIds: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  const eyeShapeIds: number[] = [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    21, 22, 23, 24, 25,
  ];

  const collateralFix = await collateralsUpdateForSvgTask(
    collateralIds,
    "front"
  );
  await run("updateSvgs", collateralFix);

  const eyeShapesFix = await eyeShapeUpdateForSvgTask(eyeShapeIds, "front", 1);
  await run("updateSvgs", eyeShapesFix);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
