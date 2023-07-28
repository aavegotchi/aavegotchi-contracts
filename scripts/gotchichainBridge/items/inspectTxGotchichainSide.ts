/* global ethers hre */

import { ethers } from "hardhat";
import { ItemsBridgeGotchichainSide } from "../../../typechain";

const itemsBridgeAddressGotchichain = process.env.ITEMS_BRIDGE_ADDRESS_GOTCHICHAIN as string

export default async function main() {
  const itemsBridgeGotchichainSide: ItemsBridgeGotchichainSide = await ethers.getContractAt("ItemsBridgeGotchichainSide", itemsBridgeAddressGotchichain)

  console.log('tx')
  const tx = await ethers.provider.getTransactionReceipt("0xe624c36d1672d2a49bc7acb8f1af8c7582bc8c76ce593bfc0e292b917afe4d06")
  console.log(tx.logs)

  console.log("events")
  const events = Object.keys(itemsBridgeGotchichainSide.interface.events)
  events.forEach((event) => {
    console.log(`${itemsBridgeGotchichainSide.interface.getEventTopic(event)} --- ${event}`)
  })
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
