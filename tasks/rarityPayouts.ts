import { task } from "hardhat/config";
import { ContractReceipt } from "@ethersproject/contracts";
import { Signer } from "@ethersproject/abstract-signer";
import { BigNumber } from "@ethersproject/bignumber";
import { parseEther, formatEther } from "@ethersproject/units";
import { ERC20, EscrowFacet } from "../typechain";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import {
  getRelayerSigner,
  maticDiamondAddress,
} from "../scripts/helperFunctions";
import { LeaderboardDataName, LeaderboardType } from "../types";
import {
  stripGotchis,
  confirmCorrectness,
  fetchAndSortLeaderboard,
  fetchSacrificedGotchis,
} from "../scripts/raritySortHelpers";

import { RarityFarmingData, rarityRewards } from "../types";
import { generateSeasonRewards } from "../scripts/generateRewards";

export let tiebreakerIndex: string;

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
  rarityParams: string;
  kinshipParams: string;
  xpParams: string;
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
      const deployerAddress = taskArgs.deployerAddress;

      const rarityParams = taskArgs.rarityParams.split(",");
      const kinshipParams = taskArgs.kinshipParams.split(",");
      const xpParams = taskArgs.xpParams.split(",");

      const rounds = Number(taskArgs.rounds);

      const rarityRoundRewards = generateSeasonRewards(
        "rarity",
        Number(rarityParams[0]), //total amount
        Number(rarityParams[1]), //num winners
        Number(rarityParams[2]) //y value
      );

      // check that the total amounts for the three leaderboards add up to the total amount for the round

      const individualRoundAmount =
        Number(rarityParams[0]) +
        Number(kinshipParams[0]) +
        Number(xpParams[0]);

      if (individualRoundAmount !== Number(taskArgs.totalAmount)) {
        throw new Error(
          "Total amount for the round does not match the sum of the individual leaderboard amounts"
        );
      }

      const kinshipRoundRewards = generateSeasonRewards(
        "kinship",
        Number(kinshipParams[0]), //total amount
        Number(kinshipParams[1]), //num winners
        Number(kinshipParams[2]) //y value
      );

      const xpRoundRewards = generateSeasonRewards(
        "xp",
        Number(xpParams[0]), //total amount
        Number(xpParams[1]), //num winners
        Number(xpParams[2]) //y value
      );

      console.log("deployer:", deployerAddress);
      // const accounts = await hre.ethers.getSigners(;
      tiebreakerIndex = taskArgs.tieBreakerIndex;

      const testing = ["hardhat", "localhost"].includes(hre.network.name);
      let signer: Signer;
      if (testing) {
        console.log("impersonating:", deployerAddress);
        await hre.network.provider.request({
          method: "hardhat_impersonateAccount",
          params: [deployerAddress],
        });
        signer = await hre.ethers.provider.getSigner(deployerAddress);
      } else if (hre.network.name === "matic") {
        signer = await getRelayerSigner(hre);
      } else {
        throw Error("Incorrect network selected");
      }

      const signerAddress = await signer.getAddress();
      if (signerAddress.toLowerCase() !== deployerAddress.toLowerCase()) {
        throw new Error(
          `Deployer ${deployerAddress} does not match signer ${signerAddress}`
        );
      }

      const maxProcess = 500;
      const finalRewards: rarityRewards = {};

      //Get data for this round from file
      const {
        dataArgs,
      } = require(`../data/airdrops/rarityfarming/szn${taskArgs.season}/${filename}.ts`);
      const data: RarityFarmingData = dataArgs;

      const leaderboards = ["withSetsRarityScore", "kinship", "experience"];
      const dataNames: LeaderboardDataName[] = [
        "rarityGotchis",
        "kinshipGotchis",
        "xpGotchis",
      ];

      const leaderboardResults: RarityFarmingData = {
        rarityGotchis: [],
        xpGotchis: [],
        kinshipGotchis: [],
      };

      for (let index = 0; index < leaderboards.length; index++) {
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

        console.log("check correctness");

        const correct = confirmCorrectness(result, data[dataName]);

        console.log("correct:", correct);

        if (correct !== 7500) {
          throw new Error("Results do not line up with subgraph");
        }

        leaderboardResults[dataName] = result;
      }

      //Iterate through all 7500 spots
      for (let index = 0; index < 7500; index++) {
        const gotchis: string[] = [
          leaderboardResults.rarityGotchis[index],
          leaderboardResults.kinshipGotchis[index],
          leaderboardResults.xpGotchis[index],
        ];

        const rewards: number[][] = [
          rarityRoundRewards,
          kinshipRoundRewards,
          xpRoundRewards,
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

      if (roundAmount - talliedAmount > 1 || roundAmount - talliedAmount < -1) {
        throw new Error(
          `Tallied amount ${talliedAmount} does not match round amount ${roundAmount}`
        );
      }

      console.log("Total GHST to send:", talliedAmount);
      console.log("Round amount:", roundAmount);

      let txData: TxArgs[][] = [];
      let txGroup: TxArgs[] = [];
      let tokenIdsNum = 0;

      //Prepare rewards for each round

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

      // console.log("set allowance for:", deployerAddress);

      // await setAllowance(
      //   hre,
      //   signer,
      //   deployerAddress,
      //   maticDiamondAddress,
      //   ghstAddress
      // );

      await sendGhst(hre, signer, txData);
    }
  );

async function setAllowance(
  hre: HardhatRuntimeEnvironment,
  signer: Signer,
  deployerAddress: string,
  aavegotchiDiamondAddressMatic: string,
  ghstAddress: string
) {
  const ghstToken = (await hre.ethers.getContractAt(
    "@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20",
    ghstAddress,
    signer
  )) as ERC20;

  console.log("ghst token signer:", ghstToken.signer);

  const allowance = await ghstToken.allowance(
    deployerAddress,
    aavegotchiDiamondAddressMatic
  );

  console.log("allownce:", allowance.toString());

  if (allowance.lt(hre.ethers.utils.parseEther("375000"))) {
    console.log("Setting allowance");

    const tx = await ghstToken.approve(
      aavegotchiDiamondAddressMatic,
      hre.ethers.constants.MaxUint256
    );
    await tx.wait();
    console.log("Allowance set!");
  }
}

interface SacrificedGotchi {
  id: string;
  // Add other properties if needed
}

async function sendGhst(
  hre: HardhatRuntimeEnvironment,
  signer: Signer,
  txData: TxArgs[][]
) {
  let totalGhstSent = BigNumber.from(0);

  // Fetch sacrificed gotchis dynamically to ensure they don't break the batchDepositGHST function
  const sacrificedList: SacrificedGotchi[] = await fetchSacrificedGotchis();

  for (const [i, txGroup] of txData.entries()) {
    console.log("Current index is:", i);

    // if (i < 1) continue; // Skip the indices before this one

    let tokenIds: string[] = [];
    let amounts: string[] = [];

    txGroup.forEach((sendData) => {
      if (sacrificedList.map((val) => val.id).includes(sendData.tokenID)) {
        console.log(
          `Removing ${sendData.tokenID} because it's been sacrificed`
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
      await hre.ethers.getContractAt("EscrowFacet", maticDiamondAddress)
    ).connect(signer) as EscrowFacet;

    try {
      const tx = await escrowFacet.batchDepositGHST(tokenIds, amounts);
      console.log("Transaction completed with tx hash:", tx.hash);

      let receipt: ContractReceipt = await tx.wait();
      console.log("receipt:", receipt.transactionHash);
      console.log("Gas used:", strDisplay(receipt.gasUsed.toString()));
      if (!receipt.status) {
        throw Error(`Error:: ${tx.hash}`);
      }
      console.log("Total GHST Sent:", formatEther(totalGhstSent));
    } catch (error) {
      console.log("error:", error);
    }
  }
}
