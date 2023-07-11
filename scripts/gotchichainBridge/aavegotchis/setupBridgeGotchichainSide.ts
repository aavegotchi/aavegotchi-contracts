/* global ethers hre */

import { ethers } from "hardhat";

const lzChainIdMumbai = process.env.LZ_CHAIN_ID_MUMBAI as string
const aavegotchiBridgeAddressMumbai = process.env.AAVEGOTCHI_BRIDGE_ADDRESS_MUMBAI as string
const aavegotchiBridgeAddressGotchichain = process.env.AAVEGOTCHI_BRIDGE_ADDRESS_GOTCHICHAIN as string

export default async function main() {
  const bridgeGotchichainSide = await ethers.getContractAt("AavegotchiBridgeGotchichainSide", aavegotchiBridgeAddressGotchichain)

  let tx = await bridgeGotchichainSide.setTrustedRemote(lzChainIdMumbai, ethers.utils.solidityPack(["address", "address"], [aavegotchiBridgeAddressMumbai, bridgeGotchichainSide.address]))
  console.log(`Wating for tx to be validated, tx hash: ${tx.hash}`)
  await tx.wait()

  tx = await bridgeGotchichainSide.setDstChainIdToBatchLimit(lzChainIdMumbai, 1)
  console.log(`Wating for tx to be validated, tx hash: ${tx.hash}`)
  await tx.wait()

  tx = await bridgeGotchichainSide.setMinDstGas(lzChainIdMumbai, 1, 35000)
  console.log(`Wating for tx to be validated, tx hash: ${tx.hash}`)
  await tx.wait()

  tx = await bridgeGotchichainSide.setDstChainIdToTransferGas(lzChainIdMumbai, 1950000)
  console.log(`Wating for tx to be validated, tx hash: ${tx.hash}`)
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
