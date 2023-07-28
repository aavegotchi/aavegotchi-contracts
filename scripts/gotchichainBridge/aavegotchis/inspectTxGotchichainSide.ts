/* global ethers hre */

import { ethers } from "hardhat";
import { AavegotchiBridgeGotchichainSide } from "../../../typechain";

const aavegotchiBridgeAddressGotchichain = process.env.AAVEGOTCHI_BRIDGE_ADDRESS_GOTCHICHAIN as string

export default async function main() {
  const aavegotchiBridgeGotchichainSide: AavegotchiBridgeGotchichainSide = await ethers.getContractAt("AavegotchiBridgeGotchichainSide", aavegotchiBridgeAddressGotchichain)

  console.log('tx')
  const tx = await ethers.provider.getTransactionReceipt("0xfe950a404f55db052c557f451c24b0b2eb4ee9354c255ace7adeb0525133c018")
  console.log(tx.logs)

  console.log("events")
  const events = Object.keys(aavegotchiBridgeGotchichainSide.interface.events)
  events.forEach((event) => {
    console.log(`${aavegotchiBridgeGotchichainSide.interface.getEventTopic(event)} --- ${event}`)
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
