/* global describe it before ethers network */
/* eslint prefer-const: "off" */

//@ts-ignore
import { ethers } from "hardhat";
import { upgrade } from "../scripts/upgrades/upgrade-xpPrecalculatedLeaves";
import { maticDiamondAddress } from "../scripts/helperFunctions";
import { AavegotchiFacet, MerkleDropFacet } from "../typechain";
import { expect } from "chai";
import {
  getProof,
  getGotchiIds,
  getLeaf,
} from "../scripts/query/getAavegotchisXPData";

import { BigNumber } from "ethers";

describe("Testing Xp Merkle Airdrops with precalculated leaves", async function () {
  this.timeout(3000000);
  const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";

  //multiple gotchis
  const testAddress1 = "0x00504a2263be7a73a7173d82aba03e29817a6b5e";
  const testAddress2 = "0x059c78aadca79427358c3d6a2e1877494e78ca8a";

  const sampleSigProp1 =
    "0x9ea87c07638280312a87f9e59f795710bd982e44214b5d796e9502bc3362e4e8";

  const sampleSigProp2 =
    "0x894039351d89063285281b2d941c7b5ffc2dcde5899b981785843fe7bc3eb37c";

  let xpDrop: MerkleDropFacet;
  let aavegotchiFacet: AavegotchiFacet;

  // this.timeout(300000)
  before(async function () {
    await upgrade();

    xpDrop = (await ethers.getContractAt(
      "MerkleDropFacet",
      diamondAddress
    )) as MerkleDropFacet;

    aavegotchiFacet = (await ethers.getContractAt(
      "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
      diamondAddress
    )) as AavegotchiFacet;
  });

  it("Cannot claim with an incorrect leaf ", async function () {
    const proof1: string[] | null = await getProof(
      testAddress1,
      sampleSigProp1
    );

    //use a wrong leaf
    const leaf: string | null = await getLeaf(testAddress2, sampleSigProp1);

    const gotchiIds1: string[] | null = await getGotchiIds(
      testAddress1,
      sampleSigProp1
    );

    const currentXP = await getCurrentXp(gotchiIds1 as string[]);

    await xpDrop.claimXPDropWithLeaf(
      sampleSigProp1,
      leaf!.substring(2),
      gotchiIds1!,
      proof1!,
      []
    );

    const xpAfter = await getCurrentXp(gotchiIds1 as string[]);
    //all xp remain the same

    for (let i = 0; i < gotchiIds1!.length; i++) {
      expect(currentXP[i]).to.equal(xpAfter[i]);
    }
  });

  it("Allows eligible claimers to claim xp ", async function () {
    const proof1x: string[] | null = await getProof(
      testAddress1,
      sampleSigProp1
    );
    const proof2x: string[] | null = await getProof(
      testAddress2,
      sampleSigProp2
    );

    const leaf1x: string | null = await getLeaf(testAddress1, sampleSigProp1);
    const leaf2x: string | null = await getLeaf(testAddress2, sampleSigProp2);

    const allProofs: string[][] = [proof1x!, proof2x!];

    let allGotchis: string[][] = [];
    const gotchis1x = await getGotchiIds(testAddress1, sampleSigProp1);
    const gotchis2x = await getGotchiIds(testAddress2, sampleSigProp2);

    //get previous xp
    const prevXP1 = await getCurrentXp(gotchis1x as string[]);
    const prevXP2 = await getCurrentXp(gotchis2x as string[]);

    allGotchis.push(gotchis1x!, gotchis2x!);

    const tx = await xpDrop.batchClaimMultipleXPDropsWithLeaves(
      [sampleSigProp1, sampleSigProp2],
      [leaf1x!.substring(2), leaf2x!.substring(2)],
      allGotchis,
      allProofs!,
      [[], []]
    );
    const tx2 = await tx.wait();
    console.log(tx2.gasUsed.toString());

    const afterXP1 = await getCurrentXp(gotchis1x as string[]);
    const afterXP2 = await getCurrentXp(gotchis2x as string[]);

    //make sure xp increases by 20 for all gotchis

    for (let i = 0; i < gotchis1x!.length; i++) {
      expect(prevXP1[i].add(10)).to.equal(afterXP1[i]);
    }

    for (let i = 0; i < gotchis2x!.length; i++) {
      expect(prevXP2[i].add(10)).to.equal(afterXP2[i]);
    }
  });
});

//get previous xp for an array of gotchiIds
async function getCurrentXp(gotchiIds: string[]) {
  let prevXp: BigNumber[] = [];

  const aFacet = (await ethers.getContractAt(
    "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
    maticDiamondAddress
  )) as AavegotchiFacet;
  for (let i = 0; i < gotchiIds.length; i++) {
    //@ts-ignore
    const xp = await aFacet.getAavegotchi(gotchiIds[i]);
    prevXp.push(xp.experience);
  }
  return prevXp;
}
