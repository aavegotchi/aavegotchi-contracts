/* global ethers hre */

import { ethers, network } from "hardhat";
import { maticDiamondAddress } from "../helperFunctions";
import { AMOY_DIAMOND } from "../../helpers/constants";

export default async function main() {
  const gasPrice = "70000000000";
  let gotchiBridgeAddress;
  let itemBridgeAddress;
  let diamondAddress;
  if (network.name === "polter") {
    diamondAddress = "0x6b54b36A54b068152f0f39FdA0Bf96e02176D95B";
    // controller address
    gotchiBridgeAddress = "0xEa4BE882A0105E44DEF336F8B2d4FB2E317e6877";
    itemBridgeAddress = "0xEa4BE882A0105E44DEF336F8B2d4FB2E317e6877";
  } else if (network.name === "amoy") {
    diamondAddress = AMOY_DIAMOND;
    // vault address
    gotchiBridgeAddress = "0xfc1a9d9898e7a48D75EF6f18F5c042f8fc2E9055";
    itemBridgeAddress = "0xfc1a9d9898e7a48D75EF6f18F5c042f8fc2E9055";
  } else if (network.name === "matic") {
    diamondAddress = maticDiamondAddress;
    // TODO: vault address
    gotchiBridgeAddress = "";
    itemBridgeAddress = "";
  } else if (network.name === "geist") {
    diamondAddress = "";
    // TODO: controller address
    gotchiBridgeAddress = "";
    itemBridgeAddress = "";
  } else {
    throw Error("No network settings for " + network.name);
  }

  const daoFacet = await ethers.getContractAt("DAOFacet", diamondAddress);

  console.log(`Configuring gotchi bridge...`);
  let tx = await daoFacet.updateGotchiGeistBridge(gotchiBridgeAddress, {
    gasPrice: gasPrice,
  });
  console.log(`Wating for tx to be validated, tx hash: ${tx.hash}`);
  await tx.wait();

  console.log(`Configuring items bridge...`);
  tx = await daoFacet.updateItemGeistBridge(itemBridgeAddress, {
    gasPrice: gasPrice,
  });
  console.log(`Wating for tx to be validated, tx hash: ${tx.hash}`);
  await tx.wait();

  console.log(`Bridge configured on ${network.name}.`);
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
