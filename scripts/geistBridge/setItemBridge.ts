/* global ethers hre */

import { ethers, network } from "hardhat";
import { maticDiamondAddress, maticDiamondUpgrader } from "../helperFunctions";
import { bridgeConfig } from "./bridgeConfig";

export default async function setBridges() {
  let diamondAddress;
  let vaultAddress;
  let signer; //: /SignerWithAddress = (await ethers.getSigners())[0];
  const maticDiamondOwner = maticDiamondUpgrader;

  const slug = "GOTCHI_ITEM";

  if (network.name === "hardhat") {
    diamondAddress = bridgeConfig[137][slug].NonMintableToken;
    signer = await ethers.getImpersonatedSigner(maticDiamondOwner);
    vaultAddress = bridgeConfig[137][slug].Vault;
  } else if (network.name === "baseSepolia") {
    diamondAddress = bridgeConfig[84532][slug].NonMintableToken;
    vaultAddress = bridgeConfig[84532][slug].Vault;

    signer = (await ethers.getSigners())[0];
  } else if (network.name === "matic") {
    diamondAddress = bridgeConfig[137][slug].NonMintableToken;
    vaultAddress = bridgeConfig[137][slug].Vault;
    signer = (await ethers.getSigners())[0]; //new LedgerSigner(ethers.provider, "m/44'/60'/2'/0/0");
  } else {
    throw Error("No network settings for " + network.name);
  }

  const gasPrice = 100000000000;

  const bridgeFacet = await ethers.getContractAt(
    "WearablesFacet",
    diamondAddress,
    signer
  );

  const currentItemBridge = await bridgeFacet.getItemGeistBridge();

  console.log("Current Item Bridge:", currentItemBridge);

  if (currentItemBridge === vaultAddress) {
    console.log("Bridges are already set");
    return;
  }

  if (currentItemBridge !== vaultAddress) {
    console.log("Setting Item Bridge address:", vaultAddress);
    const tx1 = await bridgeFacet.setItemGeistBridge(vaultAddress, {
      gasPrice,
    });
    await tx1.wait();
    console.log("Gotchi Bridge set");
  }
}

if (require.main === module) {
  setBridges()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
