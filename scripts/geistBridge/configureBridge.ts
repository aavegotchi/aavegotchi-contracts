/* global ethers hre */

import { ethers, network } from "hardhat";
import { maticDiamondAddress } from "../helperFunctions";

export default async function main() {
  const gasPrice = "70000000000";
  let gotchiBridgeAddress;
  let itemBridgeAddress;
  let diamondAddress;
  let tx;
  if (network.name === "base-sepolia") {
    diamondAddress = "0x87C969d083189927049f8fF3747703FB9f7a8AEd";
    // vault address
    gotchiBridgeAddress = "0x0e915A936d4a7E300B749112DA80D047Bf580DA7";
    itemBridgeAddress = "0xde94E671f4612D0F020851173e9fD99d3A6Cc9F3";
  } else if (network.name === "matic") {
    diamondAddress = maticDiamondAddress;
    // TODO: vault address
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
