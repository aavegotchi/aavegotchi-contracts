/* global ethers */
/* eslint-disable  prefer-const */

import { ethers, network } from "hardhat";
import { GotchiLendingFacet } from "../../typechain";
import { AavegotchiFacet } from "../../typechain/AavegotchiFacet";
import { maticDiamondAddress } from "../helperFunctions";

async function main() {
  console.log(maticDiamondAddress);

  const EthDater = require("ethereum-block-by-date");

  const dates = [
    "2022-04-08 05:57:24",
    "2022-04-08 05:57:23",
    "2022-04-08 05:57:23",
    "2022-04-08 05:57:22",
    "2022-04-08 05:35:05 ",
  ];

  const dater = new EthDater(ethers.provider);

  for (const element of dates) {
    let block = await dater.getDate(
      element, // Date, required. Any valid moment.js value: string, milliseconds, Date() object, moment() object.
      true, // Block after, optional. Search for the nearest block before or after the given date. By default true.
      false // Refresh boundaries, optional. Recheck the latest block before request. By default false.
    );

    console.log("block:", block);
  }

  const aavegotchiFacet = (await ethers.getContractAt(
    "GotchiLendingFacet",
    maticDiamondAddress
  )) as GotchiLendingFacet;

  // const listing = await aavegotchiFacet.getGotchiLendingFromToken("14946", {
  //   blockTag: block,
  // });

  // console.log("listing:", listing);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
