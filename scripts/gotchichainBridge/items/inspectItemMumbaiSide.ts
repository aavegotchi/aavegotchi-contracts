/* global ethers hre */

import { ethers } from "hardhat";

const aavegotchDiamondAddressMumbai = process.env.AAVEGOTCHI_DIAMOND_ADDRESS_MUMBAI as string

export default async function main() {
  const to = (await ethers.getSigners())[0].address
  const itemsFacetPolygonSide = await ethers.getContractAt("contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet", aavegotchDiamondAddressMumbai)

  const itemBalances = await itemsFacetPolygonSide.itemBalances(to) 

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
