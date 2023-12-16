import { ethers } from "hardhat";
import { maticDiamondAddress } from "../scripts/helperFunctions";
import { AavegotchiGameFacet } from "../typechain";
import { expect } from "chai";

import {
  upgrade,
  tokenIds,
  tokenIds2,
} from "../scripts/upgrades/upgrade-tempKinship";
import { BigNumber } from "ethers";

describe("Kinship tests", async function () {
  this.timeout(200000000);

  it("Should increase kinship appropriately", async function () {
    const prevKinship: BigNumber[] = await getCurrentKinship(tokenIds2);
    //upgrade and buff kinship
    await upgrade();
    const currentKinship: BigNumber[] = await getCurrentKinship(tokenIds2);
    for (let i = 0; i < tokenIds2.length; i++) {
      const occ = countOccurrences(tokenIds2, tokenIds2[i]);
      expect(currentKinship[i]).to.equal(prevKinship[i].add(2 * occ));
    }
  });
});

//get current kinship for an array of gotchiIds
async function getCurrentKinship(gotchiIds: string[]) {
  let prevXp: BigNumber[] = [];

  const aFacet = (await ethers.getContractAt(
    "AavegotchiGameFacet",
    maticDiamondAddress
  )) as AavegotchiGameFacet;
  console.log("fetching current kinship");
  for (let i = 0; i < gotchiIds.length; i++) {
    const kinship = await aFacet.kinship(gotchiIds[i]);
    prevXp.push(kinship);
  }

  return prevXp;
}

function countOccurrences(arr: string[], target: string): number {
  let count = 0;
  for (const str of arr) {
    if (str === target) {
      count++;
    }
  }

  return count;
}
