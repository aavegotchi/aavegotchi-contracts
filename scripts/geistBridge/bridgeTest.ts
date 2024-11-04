/* global ethers hre */

import { ethers, network } from "hardhat";
import { maticDiamondAddress } from "../helperFunctions";

export default async function main() {
  let diamondAddress;
  let gotchiBridgeAddress;
  let gotchiConnectorAddress;
  let itemBridgeAddress;
  let itemConnectorAddress;
  if (network.name === "base-sepolia") {
    diamondAddress = "0x87C969d083189927049f8fF3747703FB9f7a8AEd"
    // vault address
    gotchiBridgeAddress = "0x110A646276961C2d8a54b951bbC8B169E0F573c4"
    gotchiConnectorAddress = "0xd912F40C27E317db2334e210de892e9dc92816af"
    itemBridgeAddress = "0x130119B300049A80C20B2D3bfdFCfd021373E5e7"
    itemConnectorAddress = "0xb8388b23222876FAC04b464fA0d6A064c67A14FC"
  } else if (network.name === "matic") {
    diamondAddress = maticDiamondAddress
    // TODO: connector address
    gotchiBridgeAddress = ""
    gotchiConnectorAddress = ""
    itemBridgeAddress = ""
    itemConnectorAddress = ""
  } else {
    throw Error("No network settings for " + network.name);
  }

  const bridgeFacet = await ethers.getContractAt("PolygonXGeistBridgeFacet", diamondAddress)
  const aavegotchiFacet = await ethers.getContractAt("contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet", diamondAddress)
  const svgFacet = await ethers.getContractAt("SvgFacet", diamondAddress)
  const daoFacet = await ethers.getContractAt("DAOFacet", diamondAddress)
  const itemsFacet = await ethers.getContractAt("contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet", diamondAddress)

  const accounts = await ethers.getSigners();
  const signer = accounts[0];
  const gasLimit = 500000;
  const gasPrice = 100000000000;
  let tx;

  // console.log(`Trying to approve to send gotchis/items.`);
  // tx = await aavegotchiFacet.setApprovalForAll(itemBridgeAddress, true)
  // console.log(`Wating for tx to be validated, tx hash: ${tx.hash}`)
  // await tx.wait()

  // aavegotchi bridging
  for (let tokenId = 106; tokenId < 108; tokenId++) {
    const gotchi = await aavegotchiFacet.getAavegotchi(tokenId)
    console.log(`Gotchi: ${gotchi}`)
    const svg = await svgFacet.getAavegotchiSvg(tokenId)
    console.log(`Gotchi SVG: ${svg}`)

    console.log(`Trying to approve to send a gotchi. Token Id: ${tokenId}`);
    tx = await aavegotchiFacet.approve(gotchiBridgeAddress, tokenId)
    console.log(`Wating for tx to be validated, tx hash: ${tx.hash}`)
    await tx.wait()

    console.log(`Trying to bridge a gotchi. Token Id:${tokenId}`);
    tx = await bridgeFacet.bridgeGotchi(signer.address, tokenId, gasLimit, gotchiConnectorAddress, {gasPrice: gasPrice})
    console.log(`Wating for tx to be validated, tx hash: ${tx.hash}`)
    await tx.wait()
  }

  // item minting
  // const mintTokenIds = [151, 152, 153, 210];
  // const quantities = [20, 20, 20, 20];
  // console.log(`Trying to mint items...`)
  // tx = await daoFacet.mintItems(signer.address, mintTokenIds, quantities, {gasPrice: gasPrice})
  // console.log(`Wating for tx to be validated, tx hash: ${tx.hash}`)
  // await tx.wait()

  // item bridging
  // for (let tokenId = 1; tokenId < 30; tokenId++) {
  //   console.log(`Trying to bridge an item. Item Id:${tokenId}`)
  //   tx = await bridgeFacet.bridgeItem(signer.address, tokenId, 2, gasLimit, itemConnectorAddress, {gasPrice: gasPrice})
  //   console.log(`Wating for tx to be validated, tx hash: ${tx.hash}`)
  //   await tx.wait()
  // }

  // equip/unequip gotchi
  // for (let tokenId = 106; tokenId < 107; tokenId++) {
  //   console.log(`Trying to equip/unequip a gotchi. Token Id: ${tokenId}`);
  //   // // equip all slots
  //   // tx = await itemsFacet.equipWearables(tokenId, [15, 13, 14, 10, 29, 12, 151, 0, 0, 0, 0, 0, 0, 0, 0, 0])
  //   // equip some slots
  //   tx = await itemsFacet.equipWearables(tokenId, [15, 0, 14, 0, 29, 0, 151, 0, 0, 0, 0, 0, 0, 0, 0, 0])
  //   // // unequip all
  //   // tx = await itemsFacet.equipWearables(tokenId, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
  //   console.log(`Wating for tx to be validated, tx hash: ${tx.hash}`)
  //   await tx.wait()
  // }

  // check code
  // console.log(`Fetching information of gotchis. Owner address:${signer.address}`);
  // const gotchis = await aavegotchiFacet.allAavegotchisOfOwner(signer.address)
  // console.log(`Gotchis: ${gotchis}`)
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
