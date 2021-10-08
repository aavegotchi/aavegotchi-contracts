//updating IDs 216 (rainbow vomit) back

import { run } from "hardhat";

import { wearablesBackSvgs as back } from "../../svgs/wearables-sides";

import { UpdateSvgsTaskArgs } from "../../tasks/updateSvgs";

async function main() {
  console.log("Updating Wearables");
  const itemIds = [216];
  const sides = ["back"];

  for (let index = 0; index < itemIds.length; index++) {
    const itemId = itemIds[index];

    const sideArrays = [back[itemId]];

    for (let index = 0; index < sides.length; index++) {
      const side = sides[index];
      const sideArray = sideArrays[index];

      let taskArgsLeft: UpdateSvgsTaskArgs = {
        svgIds: [itemId].join(","),
        svgType: `wearables-${side}`,
        svgs: [sideArray].join("***"),
      };

      await run("updateSvgs", taskArgsLeft);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

exports.faceFixes = main;
