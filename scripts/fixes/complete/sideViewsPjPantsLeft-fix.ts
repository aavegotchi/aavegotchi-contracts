import { run } from "hardhat";

import { wearablesLeftSvgs as left } from "../../svgs/wearables-sides";
import { UpdateSvgsTaskArgs } from "../../tasks/updateSvgs";

async function main() {
  let sideItemIds = [91];
  const leftSide = ["left"];

  for (let index = 0; index < sideItemIds.length; index++) {
    const itemId = sideItemIds[index];
    const sideArrays = [left[itemId]];

    for (let index = 0; index < leftSide.length; index++) {
      const side = leftSide[index];
      const sideArray = sideArrays[index];

      let taskArgsSides: UpdateSvgsTaskArgs = {
        svgIds: [itemId].join(","),
        svgType: `wearables-${side}`,
        svgs: [sideArray].join("***"),
      };

      await run("updateSvgs", taskArgsSides);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

exports.PjPantsLeftFix = main;
