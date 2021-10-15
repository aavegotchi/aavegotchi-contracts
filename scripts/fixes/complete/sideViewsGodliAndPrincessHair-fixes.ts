//updating IDs 144(princess hair) and 145(godli lock)

import { run } from "hardhat";

import { updateSvgTaskForSideViews } from "../../scripts/svgHelperFunctions";

async function main() {
  console.log("Updating Wearables");
  const itemIds = [144, 145];

  let sideViewsTaskArray = await updateSvgTaskForSideViews(itemIds);

  for (let index = 0; index < sideViewsTaskArray.length; index++) {
    await run("updateSvgs", sideViewsTaskArray[index]);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

exports.godliAndPrincessHairFixes = main;
