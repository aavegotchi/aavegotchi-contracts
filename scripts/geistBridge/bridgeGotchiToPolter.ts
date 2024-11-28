/* global ethers hre */

import { ethers, network } from "hardhat";
import { maticDiamondAddress } from "../helperFunctions";
import { upgradeBridge } from "../upgrades/upgrade-geistBridgeFacet2";
import { bridgeConfig } from "./bridgeConfig";

export default async function main() {
  let diamondAddress;
  let vault;
  let connector;
  // let itemBridgeAddress;
  // let itemConnectorAddress;

  console.log("network:", network.name);

  await upgradeBridge();
  console.log("Bridge upgraded");

  if (network.name === "hardhat") {
    diamondAddress = "0x87C969d083189927049f8fF3747703FB9f7a8AEd";
    vault = bridgeConfig[84532].GOTCHI.Vault;
    connector = bridgeConfig[84532].GOTCHI.connectors["631571"].FAST;
  } else if (network.name === "polter") {
    diamondAddress = bridgeConfig[631571].GOTCHI.MintableToken;
    // controller address
    vault = bridgeConfig[631571].GOTCHI.Controller;
    connector = bridgeConfig[631571].GOTCHI.connectors["84532"].FAST;
    // itemBridgeAddress = "0x10Cf0D5C1986a7Aa98aDb3bfa3529c1BBDa59FB9";
    // itemConnectorAddress = "0x27fA28c1f241E5dEA9AA583751E5D968a28FD9D5";
  } else if (network.name === "baseSepolia") {
    diamondAddress = "0x87C969d083189927049f8fF3747703FB9f7a8AEd";
    // vault address
    vault = bridgeConfig[84532].GOTCHI.Vault;
    connector = bridgeConfig[84532].GOTCHI.connectors["631571"].FAST;
    // itemBridgeAddress = "0x130119B300049A80C20B2D3bfdFCfd021373E5e7";
    // itemConnectorAddress = "0xb8388b23222876FAC04b464fA0d6A064c67A14FC";
  } else if (network.name === "matic") {
    diamondAddress = maticDiamondAddress;
    //   // TODO: connector address
    //   gotchiBridgeAddress = "";
    //   gotchiConnectorAddress = "";
    //   itemBridgeAddress = "";
    //   itemConnectorAddress = "";
    // } else if (network.name === "geist") {
    //   diamondAddress = "";
    //   // TODO: connector address
    //   gotchiBridgeAddress = "";
    //   gotchiConnectorAddress = "";
    //   itemBridgeAddress = "";
    //   itemConnectorAddress = "";
  } else {
    throw Error("No network settings for " + network.name);
  }

  const accounts = await ethers.getSigners();
  let signer = accounts[0];

  //impersonate the owner
  const owner = "0xC3c2e1Cf099Bc6e1fA94ce358562BCbD5cc59FE5";
  await network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [owner],
  });

  signer = await ethers.getSigner(owner);

  const bridgeFacet = await ethers.getContractAt(
    "PolygonXGeistBridgeFacet",
    diamondAddress,
    signer
  );

  // const svgFacet = await ethers.getContractAt("SvgFacet", diamondAddress);
  // const daoFacet = await ethers.getContractAt("DAOFacet", diamondAddress);
  // const itemsFacet = await ethers.getContractAt(
  //   "contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet",
  //   diamondAddress
  // );

  const gasLimit = 1000000;
  const gasPrice = 100000000000;
  let tx;

  // console.log(`Trying to approve to send gotchis/items.`);
  // tx = await aavegotchiFacet.setApprovalForAll(itemBridgeAddress, true)
  // console.log(`Wating for tx to be validated, tx hash: ${tx.hash}`)
  // await tx.wait()

  const tokenId = 512;

  console.log("signert:", signer.address);

  if (connector) {
    const tx = await bridgeFacet.bridgeGotchi(
      signer.address,
      tokenId,
      gasLimit,
      connector,
      { gasPrice: gasPrice }
    );
    console.log(`Wating for tx to be validated, tx hash: ${tx.hash}`);
    await tx.wait();
    console.log("Gotchi bridged");
  } else {
    throw Error("No connector found");
  }

  // aavegotchi bridging
  // for (let tokenId = 108; tokenId < 110; tokenId++) {
  //   const gotchi = await aavegotchiFacet.getAavegotchi(tokenId);
  //   console.log(`Gotchi: ${gotchi}`);
  //   const svg = await svgFacet.getAavegotchiSvg(tokenId);
  //   console.log(`Gotchi SVG: ${svg}`);

  //   console.log(`Trying to approve to send a gotchi. Token Id: ${tokenId}`);
  //   tx = await aavegotchiFacet.approve(gotchiBridgeAddress, tokenId);
  //   console.log(`Wating for tx to be validated, tx hash: ${tx.hash}`);
  //   await tx.wait();

  //   console.log(`Trying to bridge a gotchi. Token Id:${tokenId}`);
  //   tx = await bridgeFacet.bridgeGotchi(
  //     signer.address,
  //     tokenId,
  //     gasLimit,
  //     gotchiConnectorAddress,
  //     { gasPrice: gasPrice }
  //   );
  //   console.log(`Wating for tx to be validated, tx hash: ${tx.hash}`);
  //   await tx.wait();
  // }

  // item minting
  // const mintTokenIds = [151, 152, 153, 210];
  // const quantities = [20, 20, 20, 20];
  // console.log(`Trying to mint items...`)
  // tx = await daoFacet.mintItems(signer.address, mintTokenIds, quantities, {gasPrice: gasPrice})
  // console.log(`Wating for tx to be validated, tx hash: ${tx.hash}`)
  // await tx.wait()

  // item bridging
  // for (let tokenId = 1; tokenId < 5; tokenId++) {
  //   console.log(`Trying to bridge an item. Item Id:${tokenId}`)
  //   tx = await bridgeFacet.bridgeItem(signer.address, tokenId, 2, gasLimit, itemConnectorAddress, {gasPrice: gasPrice})
  //   console.log(`Wating for tx to be validated, tx hash: ${tx.hash}`)
  //   await tx.wait()
  // }

  // equip/unequip gotchi
  // for (let tokenId = 109; tokenId < 110; tokenId++) {
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
