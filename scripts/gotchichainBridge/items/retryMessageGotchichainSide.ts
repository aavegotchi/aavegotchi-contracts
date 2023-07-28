/* global ethers hre */

import { ethers } from "hardhat";

import { ItemsBridgeGotchichainSide } from "../../../typechain";

const lzChainIdMumbai = process.env.LZ_CHAIN_ID_MUMBAI as string
const itemsBridgeAddressMumbai = process.env.ITEMS_BRIDGE_ADDRESS_MUMBAI as string
const itemsBridgeAddressGotchichain = process.env.ITEMS_BRIDGE_ADDRESS_GOTCHICHAIN as string

const txParams = {
  gasPrice: "2243367512"
}

export default async function main() {
  const itemsBridgeGotchichainSide: ItemsBridgeGotchichainSide = await ethers.getContractAt("ItemsBridgeGotchichainSide", itemsBridgeAddressGotchichain)

  const failedTxReceipt = await ethers.provider.getTransactionReceipt("0xe624c36d1672d2a49bc7acb8f1af8c7582bc8c76ce593bfc0e292b917afe4d06")
  const { _nonce, _payload } = itemsBridgeGotchichainSide.interface.decodeEventLog("MessageFailed", failedTxReceipt.logs[1].data)

  const trustedRemote = ethers.utils.solidityPack(
    ['address', 'address'],
    [itemsBridgeAddressMumbai, itemsBridgeAddressGotchichain]
  )
  
  console.log(await itemsBridgeGotchichainSide.failedMessages(lzChainIdMumbai, trustedRemote, _nonce))


  const tx = await itemsBridgeGotchichainSide.retryMessage(lzChainIdMumbai, trustedRemote, _nonce, _payload, txParams);
  console.log(`Wating for tx to be validated, tx hash: ${tx.hash}`)
  const receipt = await tx.wait()

  console.log("Message retried");
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
