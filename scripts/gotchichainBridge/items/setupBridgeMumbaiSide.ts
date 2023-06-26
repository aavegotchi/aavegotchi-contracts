/* global ethers hre */

import { ethers } from "hardhat";

const lzChainIdMumbai = process.env.LZ_CHAIN_ID_MUMBAI as string
const aavegotchDiamondAddressMumbai = process.env.AAVEGOTCHI_DIAMOND_ADDRESS_MUMBAI as string
const itemsBridgeAddressMumbai = process.env.ITEMS_BRIDGE_ADDRESS_MUMBAI as string
const itemsBridgeAddressGotchichain = process.env.ITEMS_BRIDGE_ADDRESS_GOTCHICHAIN as string

export default async function main() {
  const bridgePolygonSide = await ethers.getContractAt("ItemsBridgePolygonSide", itemsBridgeAddressMumbai)
  const bridgeFacetPolygonSide = await ethers.getContractAt("PolygonXGotchichainBridgeFacet", aavegotchDiamondAddressMumbai)

  await bridgePolygonSide.setUseCustomAdapterParams(true)
  
  await bridgePolygonSide.setTrustedRemote(lzChainIdMumbai, ethers.utils.solidityPack(["address", "address"], [itemsBridgeAddressGotchichain, bridgePolygonSide.address]))

  await bridgePolygonSide.setMinDstGas(lzChainIdMumbai, 1, 150000)
  await bridgePolygonSide.setMinDstGas(lzChainIdMumbai, 2, 150000)

  await bridgeFacetPolygonSide.setLayerZeroBridge(bridgePolygonSide.address)

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
