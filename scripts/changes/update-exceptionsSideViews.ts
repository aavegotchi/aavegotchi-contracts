import { ethers } from "hardhat";
import { expect } from "chai";
import { SvgViewsFacet } from "../../typechain";
import { upgrade } from "../../scripts/upgrades/upgrade-sideViewsExceptions";
import { maticDiamondAddress } from "../../scripts/helperFunctions";
import { Exceptions } from "../../scripts/itemTypeHelpers";

export async function main() {
  const diamondAddress = maticDiamondAddress;
  let svgViewsFacet: SvgViewsFacet;

  svgViewsFacet = (await ethers.getContractAt(
    "SvgViewsFacet",
    diamondAddress
  )) as SvgViewsFacet;

  await upgrade();

  //hand exceptions
  const rightExceptions: Exceptions[] = [
    {
      itemId: 201,
      slotPosition: 4,
      exceptionBool: true,
    },
    {
      itemId: 217,
      slotPosition: 4,
      exceptionBool: true,
    },
  ];
  const leftExceptions: Exceptions[] = [
    {
      itemId: 201,
      slotPosition: 5,
      exceptionBool: true,
    },
    {
      itemId: 217,
      slotPosition: 5,
      exceptionBool: true,
    },
  ];

  console.log("Testing");
  await svgViewsFacet.setSideViewExceptions(rightExceptions);
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
