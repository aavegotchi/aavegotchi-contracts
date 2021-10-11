import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { gasPrice, maticDiamondAddress } from "../scripts/helperFunctions";
import { LedgerSigner } from "@ethersproject/hardware-wallets";
import { Signer } from "@ethersproject/abstract-signer";
import { DAOFacet } from "../typechain";

import { GotchiArray } from "../data/airdrops/calls/raffle5remove";

interface TaskArgs {
  filename: string;
  xpAmount: string;
  batchSize: string;
}

interface GotchisOwned {
  id: string;
}

interface Data {
  id: string;
  gotchisOwned: GotchisOwned[];
}

task("removeXP", "Removes XP from Gotchis")
  .addParam("filename", "File that contains the airdrop")

  .setAction(async (taskArgs: TaskArgs, hre: HardhatRuntimeEnvironment) => {
    const filename: string = taskArgs.filename;

    const { gotchis } = require(`../data/airdrops/${filename}.ts`);

    const diamondAddress = maticDiamondAddress;
    const gameManager = "0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119"; //
    console.log(gameManager);
    let signer: Signer;
    const testing = ["hardhat", "localhost"].includes(hre.network.name);
    if (testing) {
      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [gameManager],
      });
      signer = await hre.ethers.provider.getSigner(gameManager);
    } else if (hre.network.name === "matic") {
      signer = new LedgerSigner(hre.ethers.provider, "hid", "m/44'/60'/2'/0/0");
    } else {
      throw Error("Incorrect network selected");
    }

    const dao = (
      await hre.ethers.getContractAt("DAOFacet", diamondAddress)
    ).connect(signer) as DAOFacet;

    let typedGotchis: GotchiArray[] = gotchis;

    let gotchiIDs: number[] = [];
    let xpAmount: number[] = [];

    typedGotchis.forEach((gotchi) => {
      gotchiIDs.push(gotchi[0][0]);
      xpAmount.push(gotchi[1][0]);
    });

    console.log("gotchi ids:", gotchiIDs);
    console.log("xp amount:", xpAmount);

    console.log(`Removing XP from ${gotchiIDs.length} gotchis`);

    /*
    const tx: ContractTransaction = await dao.removeExperience(
      gotchiIDs,
      xpAmount,
      { gasPrice: gasPrice }
    );
    console.log("tx:", tx.hash);
    let receipt: ContractReceipt = await tx.wait();

    if (!receipt.status) {
      throw Error(`Error:: ${tx.hash}`);
    }
    */
  });
