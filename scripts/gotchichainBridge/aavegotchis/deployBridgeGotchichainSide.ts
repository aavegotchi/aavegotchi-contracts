/* global ethers hre */

import { ethers } from "hardhat";

const lzEndpointAddressGotchichain = process.env.LZ_ENDPOINT_ADDRESS_GOTCHICHAIN as string
const aavegotchDiamondAddressGotchichain = process.env.AAVEGOTCHI_DIAMOND_ADDRESS_GOTCHICHAIN as string

export default async function main() {
  const minGasToStore = 150000
  const BridgePolygonSide = await ethers.getContractFactory("AavegotchiBridgeGotchichainSide");
  const bridgePolygonSide = await BridgePolygonSide.deploy(minGasToStore, lzEndpointAddressGotchichain, aavegotchDiamondAddressGotchichain)

  console.log("AavegotchiBridgeGotchichainSide deployed to:", bridgePolygonSide.address);
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
