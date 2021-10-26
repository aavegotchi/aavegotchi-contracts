import { LedgerSigner } from "@ethersproject/hardware-wallets";
import { task } from "hardhat/config";
import { ContractReceipt, ContractTransaction } from "@ethersproject/contracts";
import { Signer } from "@ethersproject/abstract-signer";
import { BigNumber } from "@ethersproject/bignumber";
import { parseEther, formatEther, parseUnits } from "@ethersproject/units";
import { EscrowFacet } from "../typechain";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { maticDiamondAddress, gameManager } from "../scripts/helperFunctions";
import { rewardArgs } from "../data/airdrops/rarityfarming/rarityFarmingRoundRewards";
import { rarityRewards } from "../types";
//import { rarityRoundRewards,kinshipRoundRewards,xpRoundRewards } from "../data/airdrops/rarityfarming/rarityFarmingRoundRewards";

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

interface TaskArgs {
  rarityDataFile: string;
}

interface TxArgs {
  tokenID: string;
  amount: Number;
  parsedAmount: string;
}
task("rarityPayout")
  .addParam(
    "rarityDataFile",
    "File that contains all the data related to the particular rarity round"
  )
  .setAction(async (taskArgs: TaskArgs, hre: HardhatRuntimeEnvironment) => {
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
      signer = new LedgerSigner(hre.ethers.provider, "hid", "m/44'/60'/2'/0/0");
    } else {
      throw Error("Incorrect network selected");
    }

    const maxProcess = 500;
    const finalRewards: rarityRewards = {};
    const {
      dataArgs,
    } = require(`../data/airdrops/rarityfarming/${filename}.ts`);
    const rarity: string[] = dataArgs.rarityGotchis;
    const kinship: string[] = dataArgs.kinshipGotchis;
    const xp: string[] = dataArgs.xpGotchis;
    const rarityRoundRewards: string[] = rewardArgs.rarity;
    const kinshipRoundRewards: string[] = rewardArgs.kinship;
    const xpRoundRewards: string[] = rewardArgs.xp;
    for (let index = 0; index < 5000; index++) {
      const rarityGotchiID = rarity[index];
      const kinshipGotchiID = kinship[index];
      const xpGotchiID = xp[index];

      const rarityReward = rarityRoundRewards[index];
      const kinshipReward = kinshipRoundRewards[index];
      const xpReward = xpRoundRewards[index];

      //Add Rarity
      if (finalRewards[rarityGotchiID])
        finalRewards[rarityGotchiID] += Number(rarityReward);
      else {
        finalRewards[rarityGotchiID] = Number(rarityReward);
      }

      //Add Kinship
      if (finalRewards[kinshipGotchiID])
        finalRewards[kinshipGotchiID] += Number(kinshipReward);
      else {
        finalRewards[kinshipGotchiID] = Number(kinshipReward);
      }

      //Add XP
      if (finalRewards[xpGotchiID])
        finalRewards[xpGotchiID] += Number(xpReward);
      else {
        finalRewards[xpGotchiID] = Number(xpReward);
      }
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
        gasPrice: parseUnits("5", "gwei"),
      });
      let receipt: ContractReceipt = await tx.wait();
      console.log("receipt:", receipt.transactionHash);
      console.log("Gas used:", strDisplay(receipt.gasUsed.toString()));
      if (!receipt.status) {
        throw Error(`Error:: ${tx.hash}`);
      }
      console.log("Total GHST Sent:", formatEther(totalGhstSent));
    }
  });
