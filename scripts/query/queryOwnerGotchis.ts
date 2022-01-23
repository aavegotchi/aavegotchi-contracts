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

  const tokenIds = await aavegotchiFacet.tokenIdsOfOwner(
    "0xDd564df884Fd4e217c9ee6F65B4BA6e5641eAC63",
    { blockTag: 23738362 }
  );

  tokenIds.forEach((id) => {
    console.log(id);
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
