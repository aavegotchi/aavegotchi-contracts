import { LedgerSigner } from "@ethersproject/hardware-wallets";
import { task } from "hardhat/config";
import { ContractReceipt, ContractTransaction } from "@ethersproject/contracts";
import { Signer } from "@ethersproject/abstract-signer";
import { BigNumber } from "@ethersproject/bignumber";
import { parseEther, formatEther } from "@ethersproject/units";
import { EscrowFacet } from "../typechain";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { maticDiamondAddress, gasPrice } from "../scripts/helperFunctions";
import { LeaderboardAavegotchi, LeaderboardType } from "../types";
import {
  _sortByBRS,
  findSets,
  calculateRarityScore,
  _sortByKinship,
  _sortByExperience,
  stripGotchis,
  confirmCorrectness,
} from "../scripts/raritySortHelpers";

export let tiebreakerIndex: string;
const totalResults: number = 6000;

import {
  RarityFarmingData,
  RarityFarmingRewardArgs,
  rarityRewards,
} from "../types";
import request from "graphql-request";
import { maticGraphUrl } from "../scripts/query/queryAavegotchis";

let eachFinalResult: LeaderboardAavegotchi[] = [];
let finalll: LeaderboardAavegotchi[];

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

export function leaderboardQuery(
  orderBy: string,
  orderDirection: string,
  blockNumber: string,
  extraFilters?: string
): string {
  const extraWhere = extraFilters ? "," + extraFilters : "";
  const where = `where:{baseRarityScore_gt:0, owner_not:"0x0000000000000000000000000000000000000000" ${extraWhere}}`;
  const aavegotchi = `
    id
    name
    baseRarityScore
    modifiedRarityScore
    withSetsRarityScore
    numericTraits
    modifiedNumericTraits
    withSetsNumericTraits
    stakedAmount
    equippedWearables
    kinship
    equippedSetID
    equippedSetName
    experience
    level
    collateral
    hauntId
    lastInteracted
    owner {
        id
    }`;
  return `
    {
      top1000: aavegotchis(block:{number:${blockNumber}}, orderBy:${orderBy},orderDirection:${orderDirection}, first:1000, ${where}) {
        ${aavegotchi}
      }
      top2000: aavegotchis(block:{number:${blockNumber}}, orderBy:${orderBy},orderDirection:${orderDirection}, first:1000, skip:1000, ${where}) {
        ${aavegotchi}
      }
      top3000: aavegotchis(block:{number:${blockNumber}}, orderBy:${orderBy},orderDirection:${orderDirection}, first:1000, skip:2000, ${where}) {
        ${aavegotchi}
      }
      top4000: aavegotchis(block:{number:${blockNumber}}, orderBy:${orderBy},orderDirection:${orderDirection}, first:1000, skip:3000, ${where}) {
        ${aavegotchi}
      }
      top5000: aavegotchis(block:{number:${blockNumber}}, orderBy:${orderBy},orderDirection:${orderDirection}, first:1000, skip:4000, ${where}) {
        ${aavegotchi}
      }
      top6000: aavegotchis(block:{number:${blockNumber}}, orderBy:${orderBy},orderDirection:${orderDirection}, first:1000, skip:5000, ${where}) {
        ${aavegotchi}
      }
    }
  `;
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

      const rounds = Number(taskArgs.rounds);
      const blockNumber = taskArgs.blockNumber;

      async function masterQuery(
        category: "withSetsRarityScore" | "kinship" | "experience"
      ) {
        const query = leaderboardQuery(`${category}`, "desc", blockNumber);
        const queryresponse = await request(maticGraphUrl, query);

        for (let i = 1; i <= totalResults / 1000; i++) {
          eachFinalResult = eachFinalResult.concat(queryresponse[`top${i}000`]);
        }

        eachFinalResult = eachFinalResult.slice(0, 5000);

        //Add in set bonuses
        eachFinalResult.map((leaderboardGotchi) => {
          //  if (leaderboardGotchi.withSetsRarityScore === null) {
          const foundSets = findSets(leaderboardGotchi.equippedWearables);

          if (foundSets.length > 0) {
            const bestSet = foundSets[0];

            const setTraitBonuses: number[] = bestSet.traitsBonuses;
            const brsBonus = setTraitBonuses[0];

            const nrg = setTraitBonuses[1];
            const agg = setTraitBonuses[2];
            const spk = setTraitBonuses[3];
            const brn = setTraitBonuses[4];
            const setBonusArray = [nrg, agg, spk, brn];

            leaderboardGotchi.equippedSetName = bestSet.name;

            const withSetsNumericTraits =
              leaderboardGotchi.modifiedNumericTraits;

            const beforeSetBonus = calculateRarityScore(
              leaderboardGotchi.modifiedNumericTraits
            );

            setBonusArray.forEach((trait, index) => {
              withSetsNumericTraits[index] =
                withSetsNumericTraits[index] + setBonusArray[index];
            });

            const afterSetBonus = calculateRarityScore(withSetsNumericTraits);

            const bonusDifference = afterSetBonus - beforeSetBonus;

            leaderboardGotchi.withSetsNumericTraits = withSetsNumericTraits;

            leaderboardGotchi.withSetsRarityScore = Number(
              Number(leaderboardGotchi.modifiedRarityScore) +
                Number(bonusDifference) +
                Number(brsBonus)
            ).toString();
          } else {
            leaderboardGotchi.withSetsRarityScore =
              leaderboardGotchi.modifiedRarityScore;
            leaderboardGotchi.withSetsNumericTraits =
              leaderboardGotchi.modifiedNumericTraits;
          }
          // }
          return leaderboardGotchi;
        });

        const sortingOptions: {
          [k in LeaderboardType]: (
            a: LeaderboardAavegotchi,
            b: LeaderboardAavegotchi
          ) => number;
        } = {
          withSetsRarityScore: _sortByBRS,
          kinship: _sortByKinship,
          experience: _sortByExperience,
        };

        const sortedData = eachFinalResult.sort(sortingOptions[`${category}`]);

        eachFinalResult = sortedData.slice(0, 5000);

        //Set position
        const resultsWithPositions = eachFinalResult.map((result, i) => {
          return {
            ...result,
            position: i + 1,
          };
        });
        finalll = resultsWithPositions;
        console.log("the results with positions is", stripGotchis(finalll));
        return eachFinalResult;
      }
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

      //get gotchi data for this round directly from subgraph
      const rarity: string[] = stripGotchis(
        await masterQuery("withSetsRarityScore")
      );
      // console.log(rarity);
      // console.log(data.rarityGotchis);
      const kinship: string[] = stripGotchis(await masterQuery("kinship"));
      const xp: string[] = stripGotchis(await masterQuery("experience"));

      ///Confirming correctness
      //confirmCorrectness(rarity, data.rarityGotchis);
      // confirmCorrectness(kinship, data.kinshipGotchis);
      // confirmCorrectness(xp, data.xpGotchis);
      // const rookieXp = data.rookieXpGotchis;
      // const rookieKinship = data.rookieKinshipGotchis;

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

        const rewardNames = [
          "rarity",
          "kinship",
          "xp",
          "rookieKinship",
          "rookieXp",
        ];

        const rewards: string[][] = [
          rarityRoundRewards,
          kinshipRoundRewards,
          xpRoundRewards,
          rookieKinshipRoundRewards,
          rookieXpRoundRewards,
        ];

        rewards.forEach((leaderboard, i) => {
          const rewardName = rewardNames[i];
          const gotchi = gotchis[i];
          const reward = leaderboard[index];

          // console.log(
          //   `Adding ${
          //     Number(reward) / rounds
          //   } GHST to #${gotchi} in leaderboard ${rewardName}`
          // );

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

      const sorted: string[] = [];
      const sortedKeys = Object.keys(finalRewards).sort((a, b) => {
        return finalRewards[b] - finalRewards[a];
      });

      sortedKeys.forEach((key) => {
        sorted.push(`${key}: ${finalRewards[key]}`);
      });

      // console.log("sorted:", sorted);

      /* if (talliedAmount !== roundAmount) {
        throw new Error(
          `Tallied amount of ${talliedAmount} does not match round amount of ${roundAmount}`
        );
      }
      */

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
