/* global ethers hre */

import { ethers } from "hardhat";

const aavegotchDiamondAddressMumbai = process.env.AAVEGOTCHI_DIAMOND_ADDRESS_MUMBAI as string

export default async function main() {
  const aavegotchiFacetPolygonSide = await ethers.getContractAt("contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet", aavegotchDiamondAddressMumbai)

  const from = (await ethers.getSigners())[0].address
  const to = "0xB46227Bf3eb2d0A6CCC7D55d1e3e00A049bdD98F"
  const tokenId = "139"

  const tx = await aavegotchiFacetPolygonSide.transferFrom(from, to, tokenId, { gasPrice: "5000000000" })
  console.log(`Waiting for tx to be validated, tx hash: ${tx.hash}`)
  await tx.wait()
  
  console.log(`\nAavegotchi with ID ${tokenId} transfered from ${from} to ${to}`);
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
