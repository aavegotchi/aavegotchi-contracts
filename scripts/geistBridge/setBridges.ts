/* global ethers hre */

import { ethers, network } from "hardhat";
import { maticDiamondAddress, maticDiamondUpgrader } from "../helperFunctions";
import { bridgeConfig } from "./bridgeConfig";
import { LedgerSigner } from "@anders-t/ethers-ledger";

export default async function setBridges() {
  let diamondAddress;
  let gotchiBridgeAddress;
  let itemBridgeAddress;
  let signer; //: /SignerWithAddress = (await ethers.getSigners())[0];
  const maticDiamondOwner = maticDiamondUpgrader;

  if (network.name === "hardhat") {
    diamondAddress = maticDiamondAddress;
    gotchiBridgeAddress = bridgeConfig[137].GOTCHI.Vault;

    signer = await ethers.getImpersonatedSigner(maticDiamondOwner);

    // itemBridgeAddress = bridgeConfig[137].GOTCHI_ITEM.Vault;
  } else if (network.name === "baseSepolia") {
    diamondAddress = bridgeConfig[84532].GOTCHI.NonMintableToken;
    gotchiBridgeAddress = bridgeConfig[84532].GOTCHI.Vault;
    itemBridgeAddress = bridgeConfig[84532].GOTCHI_ITEM.Vault;

    signer = (await ethers.getSigners())[0];
  } else if (network.name === "matic") {
    diamondAddress = maticDiamondAddress;
    // TODO: Set production bridge addresses
    gotchiBridgeAddress = bridgeConfig[137].GOTCHI.Vault;
    signer = new LedgerSigner(ethers.provider, "m/44'/60'/2'/0/0");
    // itemBridgeAddress = bridgeConfig[137].GOTCHI_ITEM.Vault;
  } else {
    throw Error("No network settings for " + network.name);
  }

  // const accounts = await ethers.getSigners();

  const gasPrice = 100000000000;

  const bridgeFacet = await ethers.getContractAt(
    "PolygonXGeistBridgeFacet",
    diamondAddress,
    signer
  );

  const currentGotchiBridge = await bridgeFacet.getGotchiBridge();
  const currentItemBridge = await bridgeFacet.getItemBridge();

  if (
    currentGotchiBridge === gotchiBridgeAddress &&
    currentItemBridge === itemBridgeAddress
  ) {
    console.log("Bridges are already set");
    return;
  }

  if (currentGotchiBridge !== gotchiBridgeAddress) {
    console.log("Setting Gotchi Bridge address:", gotchiBridgeAddress);
    const tx1 = await bridgeFacet.updateGotchiGeistBridge(gotchiBridgeAddress, {
      gasPrice,
    });
    await tx1.wait();
    console.log("Gotchi Bridge set");
  }

  // if (currentItemBridge !== itemBridgeAddress) {
  //   console.log("Setting Item Bridge address:", itemBridgeAddress);
  //   const tx2 = await bridgeFacet.updateItemGeistBridge(itemBridgeAddress, {
  //     gasPrice,
  //   });
  //   await tx2.wait();
  //   console.log("Item Bridge set");
  // }
}

if (require.main === module) {
  setBridges()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
