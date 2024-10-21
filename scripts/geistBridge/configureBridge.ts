/* global ethers hre */

import { ethers, network } from "hardhat";
import { maticDiamondAddress } from "../helperFunctions";
import { AMOY_DIAMOND } from "../../helpers/constants";

export default async function main() {
  const gasPrice = "70000000000";
  let gotchiBridgeAddress;
  let itemBridgeAddress;
  let diamondAddress;
  let tx;
  // if (network.name === "polter") { // polter-devnet
  //   diamondAddress = "0x6b54b36A54b068152f0f39FdA0Bf96e02176D95B";
  //   // controller address
  //   gotchiBridgeAddress = "0x38161F1a033D86aea6D222AEdE57702046414CA5";
  //   itemBridgeAddress = "0x38161F1a033D86aea6D222AEdE57702046414CA5";
  // } else if (network.name === "amoy") {
  //   diamondAddress = AMOY_DIAMOND;
  //   // vault address
  //   gotchiBridgeAddress = "0x09011fcA980Df5d22E5ff2262051Bc28C430E11c";
  //   itemBridgeAddress = "0x09011fcA980Df5d22E5ff2262051Bc28C430E11c";
  if (network.name === "polter") { // polter-testnet
    diamondAddress = "0x1F0eb9099b9c398323dcf2F133dFdAD9dE7cF994";
    // controller address
    gotchiBridgeAddress = "0x651ae3874e3485bAdc8cE39bC29e53A1fa14fD8F";
    itemBridgeAddress = "0xB54f6A7b222fcf6eE1C1163A781609e60BaE5008";
  } else if (network.name === "base-sepolia") {
    diamondAddress = "0x87C969d083189927049f8fF3747703FB9f7a8AEd";
    // vault address
    gotchiBridgeAddress = "0x0e915A936d4a7E300B749112DA80D047Bf580DA7";
    itemBridgeAddress = "0xde94E671f4612D0F020851173e9fD99d3A6Cc9F3";
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
  tx = await daoFacet.updateGotchiGeistBridge(gotchiBridgeAddress, {
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
