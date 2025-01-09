/* global ethers */
/* eslint-disable  prefer-const */

import { run } from "hardhat";
import { leaderboard } from "../../../data/airdrops/minigames/rektless";

async function main() {
  // Extract addresses and amounts from rektless data
  const addresses = leaderboard.map((entry: any) => entry.address);
  const amounts = leaderboard.map((entry: any) => entry.amount);
  const name = "rektlessTournament";

  // Process each batch

  if (addresses.length !== amounts.length) {
    throw new Error("Addresses and amounts length mismatch");
  }

  // Run the batchTransferGHST task
  await run("batchTransferGHST", {
    addresses: addresses.join(","),
    amounts: amounts.join(","),
    airdropName: name,
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
