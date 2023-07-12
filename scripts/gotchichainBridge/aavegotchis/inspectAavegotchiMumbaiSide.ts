/* global ethers hre */

import { ethers } from "hardhat";

const aavegotchDiamondAddressMumbai = process.env.AAVEGOTCHI_DIAMOND_ADDRESS_MUMBAI as string

export default async function main() {
  const to = (await ethers.getSigners())[0].address
  const aavegotchiFacet = await ethers.getContractAt("contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet", aavegotchDiamondAddressMumbai)

  const aavegotchiBalances = await aavegotchiFacet.balanceOf(to)
  const allAavegotchisOfOwner = await aavegotchiFacet.allAavegotchisOfOwner(to)

  console.log("All Avegotchis of Owner")
  console.log(allAavegotchisOfOwner)
  console.log(`\nItem balances for ${to}: ${aavegotchiBalances.toString()}`);
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
