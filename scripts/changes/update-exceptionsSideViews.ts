import { ethers } from "hardhat";
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
      _itemId: 201,
      _slotPosition: 4,
      _exceptionBool: true,
    },
    {
      _itemId: 217,
      _slotPosition: 4,
      _exceptionBool: true,
    },
  ];
  const leftExceptions: Exceptions[] = [
    {
      _itemId: 201,
      _slotPosition: 5,
      _exceptionBool: true,
    },
    {
      _itemId: 217,
      _slotPosition: 5,
      _exceptionBool: true,
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
