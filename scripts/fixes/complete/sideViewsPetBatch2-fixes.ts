//updating IDs: 151(common rolf), 152(uncommon rolf),
//              153(rare rolf), 154(legendary rolf),
//              155(mythical rolf), 156(godlike rolf)
//              233(uncommon cacti), 236(rare cacti),

import { run } from "hardhat";
import { updateSvgTaskForSideViews } from "../svgHelperFunctions";

async function main() {
  let sideViewsItemIds = [/*151, 152, 153, 154, 155, 156,*/ 233, 236];
  let sideViewsTaskArray = await updateSvgTaskForSideViews(sideViewsItemIds);

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

exports.petBatch2Fixes = main;
