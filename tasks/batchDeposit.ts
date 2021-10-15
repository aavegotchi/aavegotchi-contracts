import { LedgerSigner } from "@ethersproject/hardware-wallets";
import { task } from "hardhat/config";
import { ContractReceipt, ContractTransaction } from "@ethersproject/contracts";
import { Signer } from "@ethersproject/abstract-signer";
import { ItemsTransferFacet } from "../typechain";
import { gasPrice, maticDiamondAddress } from "../scripts/helperFunctions";
import { HardhatRuntimeEnvironment } from "hardhat/types";

function removeDuplicates(gotchiIds: string[]) {
  const uniqueGotchis: string[] = [];
  const duplicateGotchis: string[] = [];
  let index: number = 0;
  for (index; index < gotchiIds.length; index++) {
    if (uniqueGotchis.includes(gotchiIds[index])) {
      duplicateGotchis.push(gotchiIds[index]);
    }
    if (!uniqueGotchis.includes(gotchiIds[index])) {
      uniqueGotchis.push(gotchiIds[index]);
    }
  }
  console.log("removed", duplicateGotchis.length, "duplicate gotchis");
  return uniqueGotchis;
}

interface TaskArgs {
  gotchiIds: string;
  quantity: string;
  itemId: string;
}

task(
  "batchDeposit",
  "Allows the batch deposit of ERC1155 to multiple ERC721 tokens"
)
  .addParam("gotchiIds", "String array of Gotchi IDs")
  .addParam(
    "quantity",
    "The amount of ERC1155 tokens to deposit into each ERC721 token"
  )
  .addParam("itemId", "The item to deposit")
  .setAction(async (taskArgs: TaskArgs, hre: HardhatRuntimeEnvironment) => {
    const gotchiIDs: string[] = taskArgs.gotchiIds.split(",");
    const quantity: number = Number(taskArgs.quantity);
    const itemId: number = Number(taskArgs.itemId);

    //assuming all item drops are in the data/airdrops/itemdrops folder
    // const { gotchis } = require(`../data/airdrops/itemdrops/${filename}.ts`);
    const diamondAddress = maticDiamondAddress;
    const itemManager = "0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119";
    let signer: Signer;
    const testing = ["hardhat", "localhost"].includes(hre.network.name);
    if (testing) {
      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [itemManager],
      });
      signer = await hre.ethers.provider.getSigner(itemManager);
    } else if (hre.network.name === "matic") {
      signer = new LedgerSigner(hre.ethers.provider, "hid", "m/44'/60'/2'/0/0");
    } else {
      throw Error("Incorrect network selected");
    }

    const itemsTransfer = (
      await hre.ethers.getContractAt("ItemsTransferFacet", diamondAddress)
    ).connect(signer) as ItemsTransferFacet;
    const uniqueIds: string[] = removeDuplicates(gotchiIDs);
    console.log(
      "Batch Depositing",
      quantity,
      "items of itemId",
      itemId,
      "to",
      uniqueIds.length,
      "gotchis"
    );
    // let eachGotchi: number[] = Array(1).fill(itemId);
    // let eachValue: number[] = Array(1).fill(quantity);
    const tx: ContractTransaction =
      await itemsTransfer.batchBatchTransferToParent(
        itemManager,
        diamondAddress,
        uniqueIds,
        Array(uniqueIds.length).fill([itemId]),
        Array(uniqueIds.length).fill([quantity]),
        { gasPrice: gasPrice }
      );
    console.log("tx:", tx.hash);
    let receipt: ContractReceipt = await tx.wait();
    // console.log("Gas used:", strDisplay(receipt.gasUsed.toString()));
    if (!receipt.status) {
      throw Error(`Error:: ${tx.hash}`);
    }
  });
