/* global ethers */
/* eslint-disable  prefer-const */

import { ethers, network } from "hardhat";
import { AavegotchiFacet } from "../../typechain/AavegotchiFacet";
import { maticDiamondAddress } from "../helperFunctions";

async function main() {
  console.log(maticDiamondAddress);

  const aavegotchiFacet = (await ethers.getContractAt(
    "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
    maticDiamondAddress
  )) as AavegotchiFacet;

  const aavegotchi = await aavegotchiFacet.getAavegotchi("14117");

  console.log(aavegotchi);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
