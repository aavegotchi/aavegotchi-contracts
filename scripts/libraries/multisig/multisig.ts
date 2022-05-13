/* global ethers */
/* eslint-disable  prefer-const */

import { Signer } from "@ethersproject/abstract-signer";
import {
  ContractTransaction,
  PopulatedTransaction,
} from "@ethersproject/contracts";
import { BigNumber } from "ethers";

interface FeeData {
  maxPriorityFeePerGas: BigNumber;
  maxFeePerGas: BigNumber;
  gasPrice: BigNumber;
}

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

  console.log("signer:", await signer.getAddress());

  console.log("data:", transaction.data);

  //@ts-ignore
  const feeData: FeeData = await signer.provider?.getFeeData();

  console.log("feedata:", feeData);

  let tx: ContractTransaction = await multisigContract.submitTransaction(
    transaction.to,
    0,
    transaction.data,
    { gasPrice: feeData.gasPrice.mul(5).div(2) }
  );

  console.log("tx:", tx.data);

  let receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Failed to send transaction to multisig: ${tx.hash}`);
  }
  console.log("Completed sending transaction to multisig:", tx.hash);
  return tx;
}
