/* global ethers hre */

import { ethers } from "hardhat";

const lzChainIdGotchichain = process.env.LZ_CHAIN_ID_GOTCHICHAIN as string
const aavegotchDiamondAddressGotchichain = process.env.AAVEGOTCHI_DIAMOND_ADDRESS_GOTCHICHAIN as string
const itemsBridgeAddressMumbai = process.env.ITEMS_BRIDGE_ADDRESS_MUMBAI as string
const itemsBridgeAddressGotchichain = process.env.ITEMS_BRIDGE_ADDRESS_GOTCHICHAIN as string

export default async function main() {
  const bridgeGotchichainSide = await ethers.getContractAt("ItemsBridgeGotchichainSide", itemsBridgeAddressGotchichain)
  const bridgeFacetGotchichainSide = await ethers.getContractAt("PolygonXGotchichainBridgeFacet", aavegotchDiamondAddressGotchichain)

  await bridgeGotchichainSide.setUseCustomAdapterParams(true)
  
  await bridgeGotchichainSide.setTrustedRemote(lzChainIdGotchichain, ethers.utils.solidityPack(["address", "address"], [itemsBridgeAddressMumbai, bridgeGotchichainSide.address]))

  await bridgeGotchichainSide.setMinDstGas(lzChainIdGotchichain, 1, 150000)
  await bridgeGotchichainSide.setMinDstGas(lzChainIdGotchichain, 2, 150000)

  await bridgeFacetGotchichainSide.addLayerZeroBridge(bridgeGotchichainSide.address)

  console.log("Bridge setted on Gotchichain");
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
