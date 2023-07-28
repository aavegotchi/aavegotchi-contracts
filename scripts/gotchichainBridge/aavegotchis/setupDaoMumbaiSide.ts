/* global ethers hre */

import { ethers } from "hardhat";

const aavegotchiBridgeAddressMumbai = process.env.AAVEGOTCHI_BRIDGE_ADDRESS_MUMBAI as string
const aavegotchDiamondAddressMumbai = process.env.AAVEGOTCHI_DIAMOND_ADDRESS_MUMBAI as string

const txParams = {
  gasPrice: "5000000000",
}

export default async function main() {
  const daoFacetPolygonSide = await ethers.getContractAt("DAOFacet", aavegotchDiamondAddressMumbai)

  const tx = await daoFacetPolygonSide.addLayerZeroBridgeAddress(aavegotchiBridgeAddressMumbai, txParams)
  console.log(`Waiting for tx to be validated, tx hash: ${tx.hash}`)
  await tx.wait()

  console.log("Bridge setted on Polygon.");
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
