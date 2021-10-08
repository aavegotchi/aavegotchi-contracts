//updating ETH, AAVE, USDT, USDC, YFI, TUSD

import { run } from "hardhat";

import {
  collateralsLeftSvgs as left,
  collateralsRightSvgs as right,
} from "../../svgs/collaterals-sides";

import { UpdateSvgsTaskArgs } from "../../tasks/updateSvgs";

async function main() {
  console.log("Updating Wearables");
  const itemIds = [
    1, // "0x20D3922b4a1A8560E1aC99FBA4faDe0c849e2142" ETH
    2, // "0x823CD4264C1b951C9209aD0DeAea9988fE8429bF" AAVE
    4, // "0xDAE5F1590db13E3B40423B5b5c5fbf175515910b" USDT
    5, // "0x9719d867A500Ef117cC201206B8ab51e794d3F82" USDC
    7, // "0xe20f7d1f0eC39C4d5DB01f53554F2EF54c71f613" YFI
    8, // "0xF4b8888427b00d7caf21654408B7CBA2eCf4EbD9" TUSD
  ];

  const sides = ["left", "right"];

  for (let index = 0; index < itemIds.length; index++) {
    const itemId = itemIds[index];

    const sideArrays = [left[itemId], right[itemId]];

    for (let index = 0; index < sides.length; index++) {
      const side = sides[index];
      const sideArray = sideArrays[index];

      let taskArgsLeft: UpdateSvgsTaskArgs = {
        svgIds: [itemId].join(","),
        svgType: `collaterals-${side}`,
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

exports.collateralFixes = main;
