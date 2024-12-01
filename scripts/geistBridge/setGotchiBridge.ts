/* global ethers hre */

import { ethers, network } from "hardhat";
import { maticDiamondAddress, maticDiamondUpgrader } from "../helperFunctions";
import { bridgeConfig } from "./bridgeConfig";

export default async function setBridges() {
  let diamondAddress;
  let gotchiBridgeAddress;
  let signer; //: /SignerWithAddress = (await ethers.getSigners())[0];
  const maticDiamondOwner = maticDiamondUpgrader;

  const slug = "GOTCHI";

  if (network.name === "hardhat") {
    diamondAddress = bridgeConfig[137][slug].NonMintableToken;
    gotchiBridgeAddress = bridgeConfig[137][slug].Vault;
    signer = await ethers.getImpersonatedSigner(maticDiamondOwner);

    // itemBridgeAddress = bridgeConfig[137].GOTCHI_ITEM.Vault;
  } else if (network.name === "baseSepolia") {
    diamondAddress = bridgeConfig[84532][slug].NonMintableToken;
    gotchiBridgeAddress = bridgeConfig[84532][slug].Vault;

    signer = (await ethers.getSigners())[0];
  } else if (network.name === "matic") {
    diamondAddress = bridgeConfig[137][slug].NonMintableToken;
    // TODO: Set production bridge addresses
    gotchiBridgeAddress = bridgeConfig[137][slug].Vault;
    signer = (await ethers.getSigners())[0]; //new LedgerSigner(ethers.provider, "m/44'/60'/2'/0/0");
  } else {
    throw Error("No network settings for " + network.name);
  }

  const gasPrice = 100000000000;

  const bridgeFacet = await ethers.getContractAt(
    "PolygonXGeistBridgeFacet",
    diamondAddress,
    signer
  );

  const currentGotchiBridge = await bridgeFacet.getGotchiBridge();

  console.log("Current Gotchi Bridge:", currentGotchiBridge);

  if (currentGotchiBridge === gotchiBridgeAddress) {
    console.log("Bridges are already set");
    return;
  }

  if (currentGotchiBridge !== gotchiBridgeAddress) {
    console.log("Setting Gotchi Bridge address:", gotchiBridgeAddress);
    const tx1 = await bridgeFacet.setBridges(
      gotchiBridgeAddress,
      ethers.constants.AddressZero,
      {
        gasPrice,
      }
    );
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
