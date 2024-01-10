/* global ethers hre */
/* eslint-disable  prefer-const */

import { ethers } from "hardhat";
import { LibGotchiLending } from "../../typechain";

async function main() {
  const startBlock = 32499320;
  const endBlock = 35499320;
  const aavegotchiDiamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
  let diamond;
  diamond = (await ethers.getContractAt(
    "LibGotchiLending",
    aavegotchiDiamondAddress
  )) as LibGotchiLending;

  const filter = diamond.filters.GotchiLendingCancel();

  const range = endBlock - startBlock;
  const batchSize = 9999;
  const runs = range / batchSize;

  console.log("# of runs:", runs);

  const listingIds = [1323128, 1263878];

  const final = [];

  for (let index = 0; index < runs; index++) {
    console.log("index:", index);
    // const element = array[index];

    const searchBlock = startBlock + (index + 1) * batchSize;

    console.log(
      `Searching blocks from ${
        startBlock + index * batchSize
      } to ${searchBlock}`
    );

    const results = await diamond.queryFilter(filter, startBlock, searchBlock);

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      //@ts-ignore

      if (listingIds.includes(result.args.listingId)) {
        console.log(
          `Found txid for ${result.args.listingId}: txhash ${result.transactionHash}`
        );
      }
    }

    final.push(results);
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
