//updating IDs 216 (rainbow vomit) back

import { run } from "hardhat";

import { wearablesBackSvgs } from "../../svgs/wearables-sides";

import { UpdateSvgsTaskArgs } from "../../tasks/updateSvgs";

async function main() {
  console.log("Updating Wearables");
  const itemIds = [216];
  const rainbowVomit = 216;
  const back = wearablesBackSvgs[216];

  const taskArgs: UpdateSvgsTaskArgs = {
    svgIds: [rainbowVomit].join(),
    svgType: "wearables-back",
    svgs: [back].join("***"),
  };
  await run("updateSvgs", taskArgs);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

exports.addR5sideViews = main;
