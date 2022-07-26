/* global ethers */
/* eslint-disable  prefer-const */

import { ethers, network } from "hardhat";
import { ERC721MarketplaceFacet } from "../../typechain";
import { AavegotchiFacet } from "../../typechain/AavegotchiFacet";
import { impersonate, maticDiamondAddress } from "../helperFunctions";

async function main() {
  console.log(maticDiamondAddress);

  let aavegotchiFacet = (await ethers.getContractAt(
    "ERC721MarketplaceFacet",
    maticDiamondAddress
  )) as ERC721MarketplaceFacet;

  aavegotchiFacet = await impersonate(
    "0x51208e5cC9215c6360210C48F81C8270637a5218",
    aavegotchiFacet,
    ethers,
    network
  );

  await aavegotchiFacet.executeERC721Listing("232582");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
