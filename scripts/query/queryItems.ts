/* global ethers */
/* eslint-disable  prefer-const */

import { ethers } from "hardhat";
import { ItemsFacet } from "../../typechain";

async function main() {
  let aavegotchiDiamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
  console.log(aavegotchiDiamondAddress);
  let itemsFacet = (await ethers.getContractAt(
    "contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet",
    aavegotchiDiamondAddress
  )) as ItemsFacet;

  const balances = await itemsFacet.itemBalances(
    "0xA421Ed8a4E3cfbFbFd2F621b27bd3C27D71C8b97"
  );
  console.log("balances:", balances);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
