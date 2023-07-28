/* global ethers hre */

import { ethers } from "hardhat";
import {  } from "../../../typechain";

const aavegotchDiamondAddressGotchichain = process.env.AAVEGOTCHI_DIAMOND_ADDRESS_GOTCHICHAIN as string

export default async function main() {
  const to = (await ethers.getSigners())[0].address
  const itemsFacetGotchichainSide = await ethers.getContractAt("contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet", aavegotchDiamondAddressGotchichain)

  // console.log(await itemsFacetGotchichainSide.getItemType(80))

  const itemBalances = await itemsFacetGotchichainSide.itemBalances(to)

  console.log(`Item balances for ${to}`, itemBalances.toString());
  console.log(itemBalances)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

exports.deployProject = main;
