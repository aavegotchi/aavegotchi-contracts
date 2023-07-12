/* global ethers hre */

import { ethers } from "hardhat";

import { AavegotchiBridgeGotchichainSide } from "../../../typechain";

const lzChainIdMumbai = process.env.LZ_CHAIN_ID_MUMBAI as string
const aavegotchiBridgeAddressMumbai = process.env.AAVEGOTCHI_BRIDGE_ADDRESS_MUMBAI as string
const aavegotchiBridgeAddressGotchichain = process.env.AAVEGOTCHI_BRIDGE_ADDRESS_GOTCHICHAIN as string

const txParams = {
  gasPrice: "5000000000"
}

export default async function main() {
  const aavegotchiBridgeGotchichainSide: AavegotchiBridgeGotchichainSide = await ethers.getContractAt("AavegotchiBridgeGotchichainSide", aavegotchiBridgeAddressGotchichain)

  const failedTxReceipt = await ethers.provider.getTransactionReceipt("0xfe950a404f55db052c557f451c24b0b2eb4ee9354c255ace7adeb0525133c018")
  const { _nonce, _payload } = aavegotchiBridgeGotchichainSide.interface.decodeEventLog("MessageFailed", failedTxReceipt.logs[1].data)

  const trustedRemote = ethers.utils.solidityPack(
    ['address', 'address'],
    [aavegotchiBridgeAddressMumbai, aavegotchiBridgeAddressGotchichain]
  )
  
  console.log(await aavegotchiBridgeGotchichainSide.failedMessages(lzChainIdMumbai, trustedRemote, _nonce))

  const tx = await aavegotchiBridgeGotchichainSide.retryMessage(lzChainIdMumbai, trustedRemote, _nonce, _payload, txParams);
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
