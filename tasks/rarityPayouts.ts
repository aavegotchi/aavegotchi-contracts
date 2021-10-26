import { LedgerSigner } from "@ethersproject/hardware-wallets";
import { task } from "hardhat/config";
import { ContractReceipt, ContractTransaction } from "@ethersproject/contracts";
import { Signer } from "@ethersproject/abstract-signer";
import { BigNumber } from "@ethersproject/bignumber";
import { parseEther, formatEther, parseUnits } from "@ethersproject/units";
import { EscrowFacet } from "../typechain";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import {
  maticDiamondAddress,
  gameManager,
  gasPrice,
} from "../scripts/helperFunctions";

import {
  RarityFarmingData,
  RarityFarmingRewardArgs,
  rarityRewards,
} from "../types";

function addCommas(nStr: string) {
  nStr += "";
  const x = nStr.split(".");
  let x1 = x[0];
  const x2 = x.length > 1 ? "." + x[1] : "";
  var rgx = /(\d+)(\d{3})/;
  while (rgx.test(x1)) {
    x1 = x1.replace(rgx, "$1" + "," + "$2");
  }
  return x1 + x2;
}

function strDisplay(str: string) {
  return addCommas(str.toString());
}

export interface RarityPayoutTaskArgs {
  rarityDataFile: string;
  season: string;
  rounds: string;
  totalAmount: string;
}

interface TxArgs {
  tokenID: string;
  amount: Number;
  parsedAmount: string;
}
task("rarityPayout")
  .addParam("season")
  .addParam(
    "rarityDataFile",
    "File that contains all the data related to the particular rarity round"
  )
  .setAction(
    async (taskArgs: RarityPayoutTaskArgs, hre: HardhatRuntimeEnvironment) => {
      const filename: string = taskArgs.rarityDataFile;
      const diamondAddress = maticDiamondAddress;
      const testing = ["hardhat", "localhost"].includes(hre.network.name);
      let signer: Signer;
      if (testing) {
        await hre.network.provider.request({
          method: "hardhat_impersonateAccount",
          params: [gameManager],
        });
        signer = await hre.ethers.provider.getSigner(gameManager);
      } else if (hre.network.name === "matic") {
        signer = new LedgerSigner(
          hre.ethers.provider,
          "hid",
          "m/44'/60'/2'/0/0"
        );
      } else {
        throw Error("Incorrect network selected");
      }

      const rounds = Number(taskArgs.rounds);

      //Get rewards for this season
      const {
        rewardArgs,
      } = require(`../data/airdrops/rarityfarming/szn${taskArgs.season}/rewards`);
      const rewards: RarityFarmingRewardArgs = rewardArgs;

      const maxProcess = 500;
      const finalRewards: rarityRewards = {};

      //Get data for this round
      const {
        dataArgs,
      } = require(`../data/airdrops/rarityfarming/szn${taskArgs.season}/${filename}.ts`);
      const data: RarityFarmingData = dataArgs;

      //get gotchi data for this round
      const rarity: string[] = data.rarityGotchis;
      const kinship: string[] = data.kinshipGotchis;
      const xp: string[] = data.xpGotchis;
      const rookieXp = data.rookieXpGotchis;
      const rookieKinship = data.rookieKinshipGotchis;

      //get rewards
      const rarityRoundRewards: string[] = rewards.rarity;
      const kinshipRoundRewards: string[] = rewards.kinship;
      const xpRoundRewards: string[] = rewards.xp;
      const rookieKinshipRoundRewards: string[] = rewards.rookieKinship;
      const rookieXpRoundRewards: string[] = rewards.rookieXp;

      //Iterate through all 5000 spots
      for (let index = 0; index < 5000; index++) {
        const gotchis: string[] = [
          rarity[index],
          kinship[index],
          xp[index],
          // rookieKinship[index],
          // rookieXp[index],
        ];

        console.log("gotchis:", gotchis);

        const rewardNames = [
          "rarity",
          "kinship",
          "xp",
          // "rookieKinship",
          // "rookieXp",
        ];

        const rewards: string[][] = [
          rarityRoundRewards,
          kinshipRoundRewards,
          xpRoundRewards,
          // rookieKinshipRoundRewards,
          // rookieXpRoundRewards,
        ];

        rewards.forEach((leaderboard, i) => {
          const rewardName = rewardNames[i];
          const gotchi = gotchis[i];
          const reward = leaderboard[index];

          console.log(
            `Adding ${reward} GHST to #${gotchi} in leaderboard ${rewardName}`
          );

          //Add rewards divided by 4 (per season)
          if (finalRewards[gotchi])
            finalRewards[gotchi] += Number(reward) / rounds;
          else {
            finalRewards[gotchi] = Number(reward) / rounds;
          }
        });
      }

      //Check that sent amount matches total amount per round
      const roundAmount = Number(taskArgs.totalAmount) / rounds;
      let talliedAmount = 0;

      Object.keys(finalRewards).map((gotchiId) => {
        const amount = finalRewards[gotchiId];

        if (!isNaN(amount)) {
          talliedAmount = talliedAmount + amount;
        }
      });

      console.log("tallied amount:", talliedAmount);

      console.log("final rewards:", finalRewards);

      const sorted: string[] = [];
      const sortedKeys = Object.keys(finalRewards).sort((a, b) => {
        return finalRewards[b] - finalRewards[a];
      });

      sortedKeys.forEach((key) => {
        sorted.push(`${key}: ${finalRewards[key]}`);
      });

      console.log("sorted:", sorted);

      if (talliedAmount !== roundAmount) {
        throw new Error(
          `Tallied amount of ${talliedAmount} does not match round amount of ${roundAmount}`
        );
      }

      let totalGhstSent = BigNumber.from(0);
      let txData = [];
      let txGroup: TxArgs[] = [];
      let tokenIdsNum = 0;
      for (const gotchiID of Object.keys(finalRewards)) {
        let amount = finalRewards[gotchiID];
        let parsedAmount = BigNumber.from(parseEther(amount.toString()));
        let finalParsed = parsedAmount.toString();

        if (maxProcess < tokenIdsNum + 1) {
          txData.push(txGroup);
          txGroup = [];
          tokenIdsNum = 0;
        }

        txGroup.push({
          tokenID: gotchiID,
          amount: amount,
          parsedAmount: finalParsed,
        });
        tokenIdsNum += 1;
      }

      if (tokenIdsNum > 0) {
        txData.push(txGroup);
        txGroup = [];
        tokenIdsNum = 0;
      }

      for (const [i, txGroup] of txData.entries()) {
        console.log("current index:", i);

        if (i === 0) {
          console.log("skip!");
          continue;
        }

        let tokenIds: string[] = [];
        let amounts: string[] = [];

        txGroup.forEach((sendData) => {
          tokenIds.push(sendData.tokenID);
          amounts.push(sendData.parsedAmount);
          //  console.log(`Sending ${sendData.amount} to ${sendData.tokenID}`)
        });

        let totalAmount = amounts.reduce((prev, curr) => {
          return BigNumber.from(prev).add(BigNumber.from(curr)).toString();
        });

        totalGhstSent = totalGhstSent.add(totalAmount);

        console.log(
          `Sending ${formatEther(totalAmount)} GHST to ${
            tokenIds.length
          } Gotchis (from ${tokenIds[0]} to ${tokenIds[tokenIds.length - 1]})`
        );

        // const escrowFacet = await ethers.getContractAt("EscrowFacet",diamondAddress,signer)
        const escrowFacet = (
          await hre.ethers.getContractAt("EscrowFacet", diamondAddress)
        ).connect(signer) as EscrowFacet;
        const tx = await escrowFacet.batchDepositGHST(tokenIds, amounts, {
          gasPrice: gasPrice,
        });
        let receipt: ContractReceipt = await tx.wait();
        console.log("receipt:", receipt.transactionHash);
        console.log("Gas used:", strDisplay(receipt.gasUsed.toString()));
        if (!receipt.status) {
          throw Error(`Error:: ${tx.hash}`);
        }
        console.log("Total GHST Sent:", formatEther(totalGhstSent));
      }
    }
  );
