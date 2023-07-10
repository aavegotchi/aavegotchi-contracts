/* global ethers hre */

import { ethers } from "hardhat";

import mintItems from "./mintItems";

const lzChainIdMumbai = process.env.LZ_CHAIN_ID_MUMBAI as string
const lzChainIdGotchichain = process.env.LZ_CHAIN_ID_GOTCHICHAIN as string
const aavegotchDiamondAddressMumbai = process.env.AAVEGOTCHI_DIAMOND_ADDRESS_MUMBAI as string
const itemsBridgeAddressMumbai = process.env.ITEMS_BRIDGE_ADDRESS_MUMBAI as string
const itemsBridgeAddressGotchichain = process.env.ITEMS_BRIDGE_ADDRESS_GOTCHICHAIN as string

const txParams = {
  gasPrice: "2243367512"
}

export default async function main() {
  const alice = (await ethers.getSigners())[0]

  const tokenId = 80
  const tokenAmount = 1

  const bridgePolygonSide = await ethers.getContractAt("ItemsBridgePolygonSide", itemsBridgeAddressMumbai)
  const aavegotchiFacetPolygonSide = await ethers.getContractAt("contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet", aavegotchDiamondAddressMumbai)


  console.log(await bridgePolygonSide.useCustomAdapterParams());

  // let tx = await aavegotchiFacetPolygonSide.setApprovalForAll(bridgePolygonSide.address, true,  {...txParams})
  // console.log(`Wating for tx to be validated, tx hash: ${tx.hash}`)
  // await tx.wait()

  // const defaultAdapterParams = ethers.utils.solidityPack(["uint16", "uint256"], [1, "350000"])

  // const nativeFee = (await bridgePolygonSide.estimateSendFee(lzChainIdGotchichain, alice.address, tokenId, tokenAmount, false, defaultAdapterParams)).nativeFee
  // tx = await bridgePolygonSide.sendFrom(
  //   alice.address,
  //   lzChainIdGotchichain,
  //   alice.address,
  //   tokenId,
  //   tokenAmount,
  //   alice.address,
  //   ethers.constants.AddressZero,
  //   defaultAdapterParams,
  //   { value: nativeFee }
  // )
  // console.log(`Wating for tx to be validated, tx hash: ${tx.hash}`)
  // const receipt = await tx.wait()

  // console.log("Token transferred from Polygon to Gotchichain!");
  // console.log("Transaction hash:", receipt.transactionHash)
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
