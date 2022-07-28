import { run } from "hardhat";

import { itemTypes } from "../../data/itemTypes/raffle6wearables";
import {
  updateSvgTaskForSvgType,
  updateSleevesTaskForSvgType,
} from "../../scripts/svgHelperFunctions";

async function main() {
  const itemIds: number[] = [];
  let arrayEnd = 292;
  for (let index = 264; index < arrayEnd; index++) {
    itemIds.push(index);
  }
  for (let index = 0; index < itemTypes.length; index++) {
    itemIds.push(Number(itemTypes[index].svgId));
  }

  const svgLeftTask = await updateSvgTaskForSvgType(itemIds, "left");
  await run("updateSvgs", svgLeftTask);

  // const sleeveIds = [43, 44, 45, 46, 47, 48];
  // let sleevesTaskArray = await updateSleevesTaskForSvgType(
  //   sleeveIds,
  //   "sleeves-left"
  // );
  // await run("updateSvgs", sleevesTaskArray);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
