import { ethers, network } from "hardhat";
import { upgrade } from "../scripts/upgrades/upgrade-batchUpdateItemPrice";
import { impersonate, maticDiamondAddress } from "../scripts/helperFunctions";
import { AavegotchiFacet } from "../typechain";
import { Signer } from "@ethersproject/abstract-signer";
import { expect } from "chai";
import { main } from "../scripts/airdrops/rfSzn2BaadgesAirdrop";
import {
  kinship,
  rarity,
  rookKin,
  rookXP,
  xp,
  topTenKinship,
  top100Kinship,
  topTenRarity,
  top100Rarity,
  topTenRookKin,
  top100RookKin,
  topTenRookXP,
  top100RookXP,
  topTenXP,
  top100XP,
} from "../scripts/airdrops/airdropTokenIdArrays";

describe("Airdrop SZN2 Baadges", async function () {
  this.timeout(200000000);

  let aavegotchiFacet: AavegotchiFacet;

  let signer: Signer;

  before(async function () {
    signer = await ethers.getSigner(maticDiamondAddress);

    aavegotchiFacet = (await ethers.getContractAt(
      "AavegotchiFacet",
      maticDiamondAddress,
      signer
    )) as AavegotchiFacet;

    // await main();
  });

  it.only("Should airdrop szn2 baadges", async function () {
    let rookKinTopTen = await aavegotchiFacet.getAavegotchi(topTenRookKin[0]);
    console.log("topTenRookKin[0]: ", rookKinTopTen);
  });
});
