import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { gasPrice, itemManager } from "../scripts/helperFunctions";

import { MinigameGroup, MinigameResult } from "../types";

export interface GrantXPMinigameTaskArgs {
  filename: string;
  xp15: string;
  xp10: string;
  xpMin: string;
}

task("grantXP_minigame", "Grants XP to Gotchis by addresses")
  .addParam("filename", "Path to the minigame results file")
  .addParam("xp15", "# of Gotchis to receive 15XP")
  .addParam("xp10", "# of Gotchis to receive 10XP")
  .addParam("xpMin", "Minimum score to receive 5XP")
  .setAction(
    async (
      taskArgs: GrantXPMinigameTaskArgs,
      hre: HardhatRuntimeEnvironment
    ) => {
      const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";

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

      const dao = (
        await hre.ethers.getContractAt("DAOFacet", diamondAddress)
      ).connect(signer);

      //First order by score

      const orderByScore = (a: MinigameResult, b: MinigameResult) => {
        return b.score - a.score;
      };

      const {
        results,
      } = require(`../data/airdrops/minigames/${taskArgs.filename}`);

      const finalResults: MinigameResult[] = results.sort(orderByScore);

      const xp15 = Number(taskArgs.xp15);
      const xp10 = Number(taskArgs.xp10);
      const xp5min = Number(taskArgs.xpMin);

      //10xp (0,99)
      let game15 = finalResults.slice(0, xp15);
      if (game15.length !== xp15) throw new Error("XP 15 length incorrect");
      console.log("game15:", game15.length);

      //10xp (100,500)
      let game10 = finalResults.slice(xp15, xp15 + xp10);
      if (game10.length !== xp10) throw new Error("XP 15 length incorrect");
      console.log("game 10:", game10.length);

      //5xp (500 and above)
      let game5 = finalResults.slice(xp15 + xp10, finalResults.length);
      game5 = game5.filter((obj: any) => {
        return obj.score >= xp5min;
      });

      console.log("game 5:", game5.length);

      console.log(
        "Total Gotchis:",
        game15.length + game10.length + game5.length
      );

      let groups: MinigameGroup[] = [
        { xpAmount: 15, aavegotchis: game15 },
        { xpAmount: 10, aavegotchis: game10 },
        { xpAmount: 5, aavegotchis: game5 },
      ];
      const maxProcess = 500;

      for (let index = 0; index < groups.length; index++) {
        const group: MinigameGroup = groups[index];

        console.log(
          `GROUP ${index}: Sending ${group.xpAmount} XP to ${group.aavegotchis.length} aavegotchis!`
        );

        // group the data
        const txData = [];
        let txGroup = [];
        let tokenIdsNum = 0;
        for (const obj of group.aavegotchis) {
          const gotchiID = obj.tokenId;

          if (isNaN(Number(gotchiID))) {
            throw new Error(`Not a number: ${gotchiID}`);
          }

          if (maxProcess < tokenIdsNum + 1) {
            txData.push(txGroup);
            txGroup = [];
            tokenIdsNum = 0;
          }
          txGroup.push(gotchiID);
          tokenIdsNum += 1;
        }

        if (tokenIdsNum > 0) {
          txData.push(txGroup);
          txGroup = [];
          tokenIdsNum = 0;
        }

        // send transactions
        let addressIndex = 0;
        for (const txGroup of txData) {
          console.log("tx group:", txGroup);

          const tokenIds = txGroup;

          console.log(
            `Sending ${group.xpAmount} XP to ${tokenIds.length} Aavegotchis `
          );

          const tx = await dao.grantExperience(
            tokenIds,
            Array(tokenIds.length).fill(group.xpAmount),
            { gasPrice: gasPrice }
          );
          let receipt = await tx.wait();

          if (!receipt.status) {
            throw Error(`Error:: ${tx.hash}`);
          }
          console.log(
            "Airdropped XP to Aaavegotchis. Last address:",
            tokenIds[tokenIds.length - 1]
          );
          console.log("A total of", tokenIds.length, "Aavegotchis");
          console.log("Current address index:", addressIndex);
          console.log("");
        }
      }
    }
  );
