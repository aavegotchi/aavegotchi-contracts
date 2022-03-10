import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { gasPrice, itemManager } from "../scripts/helperFunctions";
import { NonceManager } from "@ethersproject/experimental";

export interface GrantXPMinigameTaskArgs {
  filename: string;
  amount: string;
  batchSize: string;
}

task("grantXP_aavegotchis", "Grants XP to Aavegotchis by ID")
  .addParam("filename", "Path to the minigame results file")
  .addParam("amount", "Amount of XP to grant")
  .addParam("batchSize")
  .setAction(
    async (
      taskArgs: GrantXPMinigameTaskArgs,
      hre: HardhatRuntimeEnvironment
    ) => {
      const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
      const xpAmount = taskArgs.amount;

      console.log(itemManager);
      let signer;
      const testing = ["hardhat", "localhost"].includes(hre.network.name);
      if (testing) {
        await hre.network.provider.request({
          method: "hardhat_impersonateAccount",
          params: [itemManager],
        });
        signer = await hre.ethers.provider.getSigner(itemManager);
      } else if (hre.network.name === "matic") {
        const accounts = await hre.ethers.getSigners();
        signer = accounts[0];
      } else {
        throw Error("Incorrect network selected");
      }

      const managedSigner = new NonceManager(signer);

      const dao = (
        await hre.ethers.getContractAt("DAOFacet", diamondAddress)
      ).connect(managedSigner);

      const { tokenIds } = require(`../data/airdrops/${taskArgs.filename}`);

      const finalTokenIds: string[] = [...new Set(tokenIds)] as string[];

      const maxProcess = Number(taskArgs.batchSize);
      const batches = Math.ceil(finalTokenIds.length / maxProcess);

      for (let index = 0; index < batches; index++) {
        const batch: string[] = finalTokenIds.slice(
          index * maxProcess,
          (index + 1) * maxProcess
        );

        if (index < 9) continue;

        console.log("batch:", batch);

        console.log(
          `GROUP ${index}: Sending ${xpAmount} XP to ${batch.length} aavegotchis!`
        );

        const tx = await dao.grantExperience(
          batch,
          Array(batch.length).fill(xpAmount),
          { gasPrice: gasPrice }
        );
        let receipt = await tx.wait();

        if (!receipt.status) {
          throw Error(`Error:: ${tx.hash}`);
        }
        console.log(
          "Airdropped XP to Aaavegotchis. Last address:",
          batch[batch.length - 1]
        );
        console.log("A total of", finalTokenIds.length, "Aavegotchis");

        console.log("");
      }
    }
  );
