/* global ethers hre */

import { ethers } from "hardhat";

const lzEndpointAddressMumbai = process.env.LZ_ENDPOINT_ADDRESS_MUMBAI as string
const aavegotchDiamondAddressMumbai = process.env.AAVEGOTCHI_DIAMOND_ADDRESS_MUMBAI as string

export default async function main() {
  const BridgePolygonSide = await ethers.getContractFactory("ItemsBridgePolygonSide");
  const bridgePolygonSide = await BridgePolygonSide.deploy(lzEndpointAddressMumbai, aavegotchDiamondAddressMumbai)

  console.log("BridgePolygonSide deployed to:", bridgePolygonSide.address);
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
