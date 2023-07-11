/* global ethers hre */

import { ethers } from "hardhat";


const lzChainIdMumbai = process.env.LZ_CHAIN_ID_MUMBAI as string
const aavegotchDiamondAddressGotchichain = process.env.AAVEGOTCHI_DIAMOND_ADDRESS_GOTCHICHAIN as string
const itemsBridgeAddressGotchichain = process.env.ITEMS_BRIDGE_ADDRESS_GOTCHICHAIN as string

const txParams = {
  gasPrice: "2243367512"
}

export default async function main() {
  const alice = (await ethers.getSigners())[0]

  const tokenIds = [80, 81]
  const tokenAmounts = [1, 2]

  const bridgeGotchichainSide = await ethers.getContractAt("ItemsBridgeGotchichainSide", itemsBridgeAddressGotchichain)
  const aavegotchiFacetGotchichainSide = await ethers.getContractAt("contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet", aavegotchDiamondAddressGotchichain)

  let tx = await aavegotchiFacetGotchichainSide.setApprovalForAll(bridgeGotchichainSide.address, true,  {...txParams})
  console.log(`Waiting for tx to be validated, tx hash: ${tx.hash}`)
  await tx.wait()

  const defaultAdapterParams = ethers.utils.solidityPack(["uint16", "uint256"], [1, "350000"])

  const nativeFee = (await bridgeGotchichainSide.estimateSendBatchFee(lzChainIdMumbai, alice.address, tokenIds, tokenAmounts, false, defaultAdapterParams)).nativeFee
  console.log(`Native fee: ${nativeFee}`)
  tx = await bridgeGotchichainSide.sendBatchFrom(
    alice.address,
    lzChainIdMumbai,
    alice.address,
    tokenIds,
    tokenAmounts,
    alice.address,
    ethers.constants.AddressZero,
    defaultAdapterParams,
    { value: nativeFee, ...txParams }
  )
  console.log(`Wating for tx to be validated, tx hash: ${tx.hash}`)
  const receipt = await tx.wait()

  console.log("Token transferred from Polygon to Gotchichain!");
  console.log("Transaction hash:", receipt.transactionHash)
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
