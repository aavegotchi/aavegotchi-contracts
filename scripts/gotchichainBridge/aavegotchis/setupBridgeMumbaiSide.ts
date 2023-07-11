/* global ethers hre */

import { ethers } from "hardhat";

const lzChainIdGotchichain = process.env.LZ_CHAIN_ID_GOTCHICHAIN as string
const aavegotchiBridgeAddressMumbai = process.env.AAVEGOTCHI_BRIDGE_ADDRESS_MUMBAI as string
const aavegotchiBridgeAddressGotchichain = process.env.AAVEGOTCHI_BRIDGE_ADDRESS_GOTCHICHAIN as string

const txParams = {
  gasPrice: "5000000000",
}

export default async function main() {
  const bridgePolygonSide = await ethers.getContractAt("AavegotchiBridgePolygonSide", aavegotchiBridgeAddressMumbai)

  let tx = await bridgePolygonSide.setTrustedRemote(lzChainIdGotchichain, ethers.utils.solidityPack(["address", "address"], [aavegotchiBridgeAddressGotchichain, bridgePolygonSide.address]), txParams)
  console.log(`Wating for tx to be validated, tx hash: ${tx.hash}`)
  await tx.wait()

  tx = await bridgePolygonSide.setDstChainIdToBatchLimit(lzChainIdGotchichain, 1, txParams)
  console.log(`Wating for tx to be validated, tx hash: ${tx.hash}`)
  await tx.wait()

  tx = await bridgePolygonSide.setMinDstGas(lzChainIdGotchichain, 1, 35000, txParams)
  console.log(`Wating for tx to be validated, tx hash: ${tx.hash}`)
  await tx.wait()

  tx = await bridgePolygonSide.setDstChainIdToTransferGas(lzChainIdGotchichain, 1950000, txParams)
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
