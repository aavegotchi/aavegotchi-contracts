/* global ethers hre */

import { ethers } from "hardhat";
import { AavegotchiBridgePolygonSide } from "../../../typechain";

const lzChainIdGotchichain = process.env.LZ_CHAIN_ID_GOTCHICHAIN as string
const aavegotchDiamondAddressMumbai = process.env.AAVEGOTCHI_DIAMOND_ADDRESS_MUMBAI as string
const aavegotchiBridgeAddressMumbai = process.env.AAVEGOTCHI_BRIDGE_ADDRESS_MUMBAI as string

const txParams = {
  gasPrice: "5000000000"
}

export default async function main() {
  const alice = (await ethers.getSigners())[0]

  const aavegotchiId = "140"

  const bridgePolygonSide = await ethers.getContractAt("AavegotchiBridgePolygonSide", aavegotchiBridgeAddressMumbai)
  const aavegotchiFacetPolygonSide = await ethers.getContractAt("contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet", aavegotchDiamondAddressMumbai)

  console.log("Approving aavegotchi to bridge")
  let tx = await aavegotchiFacetPolygonSide.approve(bridgePolygonSide.address, aavegotchiId, txParams)
  console.log(`Waiting for tx to be validated, tx hash: ${tx.hash}`)
  await tx.wait()

  const adapterParams = await getAdapterParams(bridgePolygonSide)

  let nativeFee = (await bridgePolygonSide.estimateSendFee(lzChainIdGotchichain, alice.address, aavegotchiId, false, adapterParams)).nativeFee
  console.log(`Native fee: ${nativeFee}`)

  tx = await bridgePolygonSide.sendFrom(
    alice.address,
    lzChainIdGotchichain,
    alice.address,
    aavegotchiId,
    alice.address,
    ethers.constants.AddressZero,
    adapterParams,
    { value: nativeFee, ...txParams }
  )
  console.log(`Wating for tx to be validated, tx hash: ${tx.hash}`)
  const receipt = await tx.wait()

  console.log("Token transferred from Polygon to Gotchichain!");
  console.log("Transaction hash:", receipt.transactionHash)
}

async function getAdapterParams(bridgePolygonSide: AavegotchiBridgePolygonSide) {
  const minGasToTransferAndStorePolygonSide = await bridgePolygonSide.minDstGasLookup(lzChainIdGotchichain, 1)
  const transferGasPerTokenPolygonSide = await bridgePolygonSide.dstChainIdToTransferGas(lzChainIdGotchichain)
  return ethers.utils.solidityPack(["uint16", "uint256"], [1, minGasToTransferAndStorePolygonSide.add(transferGasPerTokenPolygonSide.mul(1))])
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
