/* global ethers */
/* eslint-disable  prefer-const */
import { network, ethers } from "hardhat";
import { gasPrice, itemManager } from "../../helperFunctions";

import { results } from "../../../data/airdrops/minigames/astegotchi";
import { MinigameGroup, MinigameResult } from "../../../types";

async function main() {
  const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";

  console.log(itemManager);
  let signer;
  const testing = ["hardhat", "localhost"].includes(network.name);
  if (testing) {
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [itemManager],
    });
    signer = await ethers.provider.getSigner(itemManager);
  } else if (network.name === "matic") {
    const accounts = await ethers.getSigners();
    signer = accounts[0]; //new LedgerSigner(ethers.provider, "hid", "m/44'/60'/2'/0/0");
  } else {
    throw Error("Incorrect network selected");
  }

  const dao = (await ethers.getContractAt("DAOFacet", diamondAddress)).connect(
    signer
  );

  //First order by score

  const orderByScore = (a: MinigameResult, b: MinigameResult) => {
    return b.score - a.score;
  };

  const finalResults = results.sort(orderByScore);

  const xp15 = 100;
  const xp10 = 400;
  const xp5min = 10000;

  //15xp (0,100)
  let game15 = finalResults.slice(0, xp15);
  if (game15.length !== xp15) throw new Error("XP 15 length incorrect");
  console.log("game15:", game15.length);

  //10xp (101,500)
  let game10 = finalResults.slice(xp15 + 1, xp15 + 1 + xp10);
  if (game10.length !== xp10) throw new Error("XP 15 length incorrect");
  console.log("game 10:", game10.length);

  //5xp (501 and above)
  let game5 = finalResults.slice(xp15 + xp10 + 1, finalResults.length);
  game5 = game5.filter((obj) => {
    return obj.score >= xp5min;
  });

  console.log("game 5:", game5.length);

  let groups: MinigameGroup[] = [
    { xpAmount: 15, aavegotchis: game15 },
    { xpAmount: 10, aavegotchis: game10 },
    { xpAmount: 5, aavegotchis: game5 },
  ];
  const maxProcess = 500;

  for (let index = 0; index < groups.length; index++) {
    const group: MinigameGroup = groups[index];

    console.log(
      `Sending ${group.xpAmount} XP to ${group.aavegotchis.length} aavegotchis!`
    );

    // group the data
    const txData = [];
    let txGroup = [];
    let tokenIdsNum = 0;
    for (const obj of group.aavegotchis) {
      const gotchiID = obj.tokenId;
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

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
