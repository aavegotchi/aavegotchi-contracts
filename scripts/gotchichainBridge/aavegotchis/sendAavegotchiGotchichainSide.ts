/* global ethers hre */

import { ethers } from "hardhat";
import { AavegotchiBridgeGotchichainSide } from "../../../typechain";

const lzChainIdMumbai = process.env.LZ_CHAIN_ID_MUMBAI as string
const aavegotchDiamondAddressGotchichain = process.env.AAVEGOTCHI_DIAMOND_ADDRESS_GOTCHICHAIN as string
const aavegotchiBridgeAddressGotchichain = process.env.AAVEGOTCHI_BRIDGE_ADDRESS_GOTCHICHAIN as string

const txParams = {
  gasPrice: "5000000000"
}

export default async function main() {
  const alice = (await ethers.getSigners())[0]

  const aavegotchiId = "140"

  const bridgeGotchichainSide = await ethers.getContractAt("AavegotchiBridgeGotchichainSide", aavegotchiBridgeAddressGotchichain)
  const aavegotchiFacetGotchichainSide = await ethers.getContractAt("contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet", aavegotchDiamondAddressGotchichain)

  console.log("Approving aavegotchi to bridge")
  let tx = await aavegotchiFacetGotchichainSide.approve(bridgeGotchichainSide.address, aavegotchiId, txParams)
  console.log(`Waiting for tx to be validated, tx hash: ${tx.hash}`)
  await tx.wait()

  const adapterParams = await getAdapterParams(bridgeGotchichainSide)

  let nativeFee = (await bridgeGotchichainSide.estimateSendFee(lzChainIdMumbai, alice.address, aavegotchiId, false, adapterParams)).nativeFee
  console.log(`Native fee: ${nativeFee}`)

  tx = await bridgeGotchichainSide.sendFrom(
    alice.address,
    lzChainIdMumbai,
    alice.address,
    aavegotchiId,
    alice.address,
    ethers.constants.AddressZero,
    adapterParams,
    { value: nativeFee, ...txParams }
  )
  console.log(`Waiting for tx to be validated, tx hash: ${tx.hash}`)
  const receipt = await tx.wait()

  console.log("Token transferred from Polygon to Gotchichain!");
  console.log("Transaction hash:", receipt.transactionHash)
}

async function getAdapterParams(bridgeGotchichainSide: AavegotchiBridgeGotchichainSide) {
  const minGasToTransferAndStoreGotchichainSide = await bridgeGotchichainSide.minDstGasLookup(lzChainIdMumbai, 1)
  const transferGasPerTokenGotchichainSide = await bridgeGotchichainSide.dstChainIdToTransferGas(lzChainIdMumbai)
  return ethers.utils.solidityPack(["uint16", "uint256"], [1, minGasToTransferAndStoreGotchichainSide.add(transferGasPerTokenGotchichainSide.mul(1))])
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
