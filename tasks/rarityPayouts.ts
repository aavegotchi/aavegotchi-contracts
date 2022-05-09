import { task } from "hardhat/config";
import { ContractReceipt } from "@ethersproject/contracts";
import { Signer } from "@ethersproject/abstract-signer";
import { BigNumber } from "@ethersproject/bignumber";
import { parseEther, formatEther } from "@ethersproject/units";
import { EscrowFacet } from "../typechain";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { maticDiamondAddress, gasPrice } from "../scripts/helperFunctions";
import { LeaderboardDataName, LeaderboardType } from "../types";
import { NonceManager } from "@ethersproject/experimental";
import {
  stripGotchis,
  confirmCorrectness,
  fetchAndSortLeaderboard,
} from "../scripts/raritySortHelpers";

export let tiebreakerIndex: string;
// const rookieFilter: string = "hauntId:2";

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
  blockNumber: string;
  tieBreakerIndex: string;
  deployerAddress: string;
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
  .addParam("deployerAddress")
  .addParam("tieBreakerIndex", "The Tiebreaker index")
  .setAction(
    async (taskArgs: RarityPayoutTaskArgs, hre: HardhatRuntimeEnvironment) => {
      const filename: string = taskArgs.rarityDataFile;
      const diamondAddress = maticDiamondAddress;
      const deployerAddress = taskArgs.deployerAddress;

      console.log("deployer:", deployerAddress);
      const accounts = await hre.ethers.getSigners();
      tiebreakerIndex = taskArgs.tieBreakerIndex;

      const testing = ["hardhat", "localhost"].includes(hre.network.name);
      let signer: Signer;
      if (testing) {
        await hre.network.provider.request({
          method: "hardhat_impersonateAccount",
          params: [deployerAddress],
        });
        signer = await hre.ethers.provider.getSigner(deployerAddress);
      } else if (hre.network.name === "matic") {
        signer = accounts[0];
      } else {
        throw Error("Incorrect network selected");
      }

      const managedSigner = new NonceManager(signer);

      const rounds = Number(taskArgs.rounds);

      const signerAddress = await signer.getAddress();
      if (signerAddress !== deployerAddress) {
        throw new Error(
          `Deployer ${deployerAddress} does not match signer ${signerAddress}`
        );
      }

      //Get rewards for this season
      const {
        rewardArgs,
      } = require(`../data/airdrops/rarityfarming/szn${taskArgs.season}/rewards`);
      const rewards: RarityFarmingRewardArgs = rewardArgs;

      const maxProcess = 500;
      const finalRewards: rarityRewards = {};

      //Get data for this round from file
      const {
        dataArgs,
      } = require(`../data/airdrops/rarityfarming/szn${taskArgs.season}/${filename}.ts`);
      const data: RarityFarmingData = dataArgs;

      const leaderboards = [
        "withSetsRarityScore",
        "kinship",
        "experience",
        // "kinship",
        // "experience",
      ];
      const dataNames: LeaderboardDataName[] = [
        "rarityGotchis",
        "kinshipGotchis",
        "xpGotchis",
        // "rookieKinshipGotchis",
        // "rookieXpGotchis",
      ];

      //handle rookie now

      const leaderboardResults: RarityFarmingData = {
        rarityGotchis: [],
        xpGotchis: [],
        kinshipGotchis: [],
      };

      // let extraFilter: string = "";
      for (let index = 0; index < leaderboards.length; index++) {
        // if (
        //   index === leaderboards.length - 1 ||
        //   index === leaderboards.length - 2
        // ) {
        //   console.log("getting rookies");
        //   // extraFilter = rookieFilter;
        // }
        let element: LeaderboardType = leaderboards[index] as LeaderboardType;

        const result = stripGotchis(
          await fetchAndSortLeaderboard(
            element,
            taskArgs.blockNumber,
            Number(taskArgs.tieBreakerIndex)
          )
        );

        const dataName: LeaderboardDataName = dataNames[
          index
        ] as LeaderboardDataName;

        const correct = confirmCorrectness(result, data[dataName]);

        console.log("correct:", correct);

        if (correct !== 7500) {
          throw new Error("Results do not line up with subgraph");
        }

        leaderboardResults[dataName] = result;
      }

      //get rewards
      const rarityRoundRewards: string[] = rewards.rarity;
      const kinshipRoundRewards: string[] = rewards.kinship;
      const xpRoundRewards: string[] = rewards.xp;
      // const rookieKinshipRoundRewards: string[] = rewards.rookieKinship;
      // const rookieXpRoundRewards: string[] = rewards.rookieXp;

      //Iterate through all 5000 spots
      for (let index = 0; index < 7500; index++) {
        const gotchis: string[] = [
          leaderboardResults.rarityGotchis[index],
          leaderboardResults.kinshipGotchis[index],
          leaderboardResults.xpGotchis[index],
          // leaderboardResults.rookieKinshipGotchis[index],
          // leaderboardResults.rookieXpGotchis[index],
        ];

        const rewards: string[][] = [
          rarityRoundRewards,
          kinshipRoundRewards,
          xpRoundRewards,
          // rookieKinshipRoundRewards,
          // rookieXpRoundRewards,
        ];

        rewards.forEach((leaderboard, i) => {
          const gotchi = gotchis[i];
          const reward = leaderboard[index];

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

      const sorted: string[] = [];
      const sortedKeys = Object.keys(finalRewards).sort((a, b) => {
        return finalRewards[b] - finalRewards[a];
      });

      sortedKeys.forEach((key) => {
        sorted.push(`${key}: ${finalRewards[key]}`);
      });

      console.log("Total GHST to send:", talliedAmount);
      console.log("Round amount:", roundAmount);

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

        if (i < 10) continue;

        let tokenIds: string[] = [];
        let amounts: string[] = [];

        const removeList = ["17231", "21129", "21944", "16681"];

        txGroup.forEach((sendData) => {
          if (removeList.includes(sendData.tokenID)) {
            console.log(
              `Removing ${sendData.tokenID} because it's on the bad list`
            );
          } else {
            tokenIds.push(sendData.tokenID);
            amounts.push(sendData.parsedAmount);
          }
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

        const escrowFacet = (
          await hre.ethers.getContractAt("EscrowFacet", diamondAddress)
        ).connect(managedSigner) as EscrowFacet;
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
