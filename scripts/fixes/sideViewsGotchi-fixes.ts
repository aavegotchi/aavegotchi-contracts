// update gotchi body
import { run } from "hardhat";
import { aavegotchiSvgs } from "../../svgs/aavegotchi-side-typeScript";
import { UpdateSvgsTaskArgs } from "../../tasks/updateSvgs";

async function main() {
  const itemIds = [1, 3];
  const sides = ["left", "right"];
  const sideArrays = [aavegotchiSvgs.left, aavegotchiSvgs.right];

  for (let index = 0; index < itemIds.length; index++) {
    const itemId = itemIds[index];
    for (let index = 0; index < sides.length; index++) {
      const side = sides[index];
      const sideArray = sideArrays[index];

      let taskArgsSidesLeft: UpdateSvgsTaskArgs = {
        svgIds: [itemId].join(","),
        svgType: `aavegotchi-${side}`,
        svgs: [sideArray].join("***"),
      };

      await run("updateSvgs", taskArgsSidesLeft);
    }
  }

  /*   for (let index = 0; index < itemIds.length; index++) {
    const itemId = itemIds[index];
    let taskArgsSidesRight: UpdateSvgsTaskArgs = {
      svgIds: [itemId].join(","),
      svgType: `aavegotchi-right`,
      svgs: [aavegotchiSvgs.right].join("***"),
    };

    await run("updateSvgs", taskArgsSidesRight);
  } */
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

exports.gotchiSideViewFixes = main;
