/* global ethers hre */

import { ethers } from "hardhat";

const aavegotchDiamondAddressMumbai = process.env.AAVEGOTCHI_DIAMOND_ADDRESS_MUMBAI as string

const txParams = {
  gasPrice: "5000000000"
}

export default async function main() {
  const itemsFacetPolygonSide = await ethers.getContractAt("contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet", aavegotchDiamondAddressMumbai)
  
  const aavegotchiId = "140"

  console.log(`Equipping wearables to aavegotchi with ID ${aavegotchiId}`)
  let tx = await itemsFacetPolygonSide.equipWearables(aavegotchiId, [81, 0, 0, 80, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], txParams)
  console.log(`Waiting for tx to be validated, tx hash: ${tx.hash}`)
  await tx.wait()

  const equippedWearables = await itemsFacetPolygonSide.equippedWearables(aavegotchiId)

  console.log(`Items equipped to aavegotchi with ID ${aavegotchiId}`);
  console.log(`Updated equipped wearables: ${equippedWearables}`)
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
