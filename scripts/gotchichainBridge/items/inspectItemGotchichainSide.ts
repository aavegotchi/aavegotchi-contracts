/* global ethers hre */

import { ethers } from "hardhat";
import { ItemsBridgeGotchichainSide } from "../../../typechain";

const aavegotchDiamondAddressGotchichain = process.env.AAVEGOTCHI_DIAMOND_ADDRESS_GOTCHICHAIN as string
const itemsBridgeAddressGotchichain = process.env.ITEMS_BRIDGE_ADDRESS_GOTCHICHAIN as string

export default async function main() {
  const to = (await ethers.getSigners())[0].address
  const itemsFacetGotchichainSide = await ethers.getContractAt("contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet", aavegotchDiamondAddressGotchichain)
  const itemsBridgeGotchichainSide: ItemsBridgeGotchichainSide = await ethers.getContractAt("ItemsBridgeGotchichainSide", itemsBridgeAddressGotchichain)


  //0xe183f33de2837795525b4792ca4cd60535bd77c53b7e7030060bfcf5734d6b0c

  console.log('tx')
  const tx = await ethers.provider.getTransactionReceipt("0xe624c36d1672d2a49bc7acb8f1af8c7582bc8c76ce593bfc0e292b917afe4d06")
  console.log(tx.logs)

  console.log("events")
  const events = Object.keys(itemsBridgeGotchichainSide.interface.events)
  events.forEach((event) => {
    console.log(`${itemsBridgeGotchichainSide.interface.getEventTopic(event)} --- ${event}`)
  })

  // console.log(await itemsFacetGotchichainSide.getItemType(80))

  // const itemBalances = await itemsFacetGotchichainSide.itemBalances(to)

  // console.log(`Item balances for ${to}`, itemBalances.toString());
  // console.log(itemBalances)
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
