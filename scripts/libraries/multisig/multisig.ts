/* global ethers */
/* eslint-disable  prefer-const */

import { Signer } from "@ethersproject/abstract-signer";
import {
  ContractTransaction,
  PopulatedTransaction,
} from "@ethersproject/contracts";
import { gasPrice } from "../../helperFunctions";

export async function sendToMultisig(
  multisigAddress: string,
  signer: Signer,
  transaction: PopulatedTransaction,
  ethers: any
) {
  const abi = [
    "function submitTransaction(address destination, uint value, bytes data) public returns (uint transactionId)",
  ];
  const multisigContract = await ethers.getContractAt(
    abi,
    multisigAddress,
    signer
  );
  console.log("Sending transaction to multisig:", multisigAddress);
  let tx: ContractTransaction = await multisigContract.submitTransaction(
    transaction.to,
    0,
    transaction.data,
    { gasPrice: gasPrice }
  );
  let receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Failed to send transaction to multisig: ${tx.hash}`);
  }
  console.log("Completed sending transaction to multisig:", tx.hash);
  return tx;
}
