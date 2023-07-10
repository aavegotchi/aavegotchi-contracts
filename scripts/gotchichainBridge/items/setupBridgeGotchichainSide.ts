/* global ethers hre */

import { ethers } from "hardhat";

const lzChainIdMumbai = process.env.LZ_CHAIN_ID_MUMBAI as string
const aavegotchDiamondAddressGotchichain = process.env.AAVEGOTCHI_DIAMOND_ADDRESS_GOTCHICHAIN as string
const itemsBridgeAddressMumbai = process.env.ITEMS_BRIDGE_ADDRESS_MUMBAI as string
const itemsBridgeAddressGotchichain = process.env.ITEMS_BRIDGE_ADDRESS_GOTCHICHAIN as string

export default async function main() {
  const bridgeGotchichainSide = await ethers.getContractAt("ItemsBridgeGotchichainSide", itemsBridgeAddressGotchichain)
  const daoFacetGotchichainSide = await ethers.getContractAt("DAOFacet", aavegotchDiamondAddressGotchichain)

  let tx = await bridgeGotchichainSide.setUseCustomAdapterParams(true)
  console.log(`Wating for tx to be validated, tx hash: ${tx.hash}`)
  await tx.wait()
  
  tx = await bridgeGotchichainSide.setTrustedRemote(lzChainIdMumbai, ethers.utils.solidityPack(["address", "address"], [itemsBridgeAddressMumbai, bridgeGotchichainSide.address]))
  console.log(`Wating for tx to be validated, tx hash: ${tx.hash}`)
  await tx.wait()

  tx = await bridgeGotchichainSide.setMinDstGas(lzChainIdMumbai, 1, 150000)
  console.log(`Wating for tx to be validated, tx hash: ${tx.hash}`)
  await tx.wait()

  tx = await bridgeGotchichainSide.setMinDstGas(lzChainIdMumbai, 2, 150000)
  console.log(`Wating for tx to be validated, tx hash: ${tx.hash}`)
  await tx.wait()

  tx = await daoFacetGotchichainSide.addLayerZeroBridgeAddress(bridgeGotchichainSide.address)
  console.log(`Wating for tx to be validated, tx hash: ${tx.hash}`)
  await tx.wait()

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
