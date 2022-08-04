/* global ethers hre */
/* eslint prefer-const: "off" */
import { run } from "hardhat";
import { eyeShapeUpdateForSvgTask } from "../svgHelperFunctions";

async function main() {
  console.log("Update Sideview Eyes Color Start");

  const eyeShapeIds: number[] = [5, 6, 7, 11, 12, 13];
  const eyeShapeIdsH2: number[] = [5, 6, 7, 11, 12, 13, 22, 23];

  const eyeLeftH1Fix = await eyeShapeUpdateForSvgTask(eyeShapeIds, "left", 1);
  await run("updateSvgs", eyeLeftH1Fix);
  const eyeLeftH2Fix = await eyeShapeUpdateForSvgTask(eyeShapeIdsH2, "left", 2);
  await run("updateSvgs", eyeLeftH2Fix);
  const eyeRightH1Fix = await eyeShapeUpdateForSvgTask(eyeShapeIds, "right", 1);
  await run("updateSvgs", eyeRightH1Fix);
  const eyeRightH2Fix = await eyeShapeUpdateForSvgTask(
    eyeShapeIdsH2,
    "right",
    2
  );
  await run("updateSvgs", eyeRightH2Fix);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
