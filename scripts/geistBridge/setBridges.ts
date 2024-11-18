/* global ethers hre */

import { ethers, network } from "hardhat";
import { maticDiamondAddress } from "../helperFunctions";
import { bridgeConfig } from "./bridgeConfig";

export default async function main() {
  let diamondAddress;
  let gotchiBridgeAddress;
  let itemBridgeAddress;

  if (network.name === "baseSepolia") {
    diamondAddress = bridgeConfig[84532].GOTCHI.NonMintableToken;
    gotchiBridgeAddress = bridgeConfig[84532].GOTCHI.Vault;
    itemBridgeAddress = bridgeConfig[84532].GOTCHI_ITEM.Vault;
  } else if (network.name === "matic") {
    diamondAddress = maticDiamondAddress;
    // TODO: Set production bridge addresses
    gotchiBridgeAddress = "";
    itemBridgeAddress = "";
  } else {
    throw Error("No network settings for " + network.name);
  }

  const accounts = await ethers.getSigners();
  const signer = accounts[0];
  const gasPrice = 100000000000;

  const daoFacet = await ethers.getContractAt("DAOFacet", diamondAddress);

  const gotchiBridge = await ethers.getContractAt(
    "PolygonXGeistBridgeFacet",
    diamondAddress
  );

  const currentGotchiBridge = await gotchiBridge.getGotchiBridge();
  const currentItemBridge = await gotchiBridge.getItemBridge();

  if (
    currentGotchiBridge === gotchiBridgeAddress &&
    currentItemBridge === itemBridgeAddress
  ) {
    console.log("Bridges are already set");
    return;
  }

  if (currentGotchiBridge !== gotchiBridgeAddress) {
    console.log("Setting Gotchi Bridge address:", gotchiBridgeAddress);
    const tx1 = await daoFacet.updateGotchiGeistBridge(gotchiBridgeAddress, {
      gasPrice,
    });
    await tx1.wait();
    console.log("Gotchi Bridge set");
  }

  if (currentItemBridge !== itemBridgeAddress) {
    console.log("Setting Item Bridge address:", itemBridgeAddress);
    const tx2 = await daoFacet.updateItemGeistBridge(itemBridgeAddress, {
      gasPrice,
    });
    await tx2.wait();
    console.log("Item Bridge set");
  }
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
