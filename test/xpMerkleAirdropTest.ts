/* global describe it before ethers network */
/* eslint prefer-const: "off" */

//@ts-ignore
import { ethers } from "hardhat";
import { upgrade } from "../scripts/upgrades/upgrade-xpMerkleFacet";
import { propType, maticDiamondAddress } from "../scripts/helperFunctions";
import { AavegotchiFacet, MerkleDropFacet } from "../typechain";
import { run } from "hardhat";
import { expect } from "chai";
import { getProposalDetails, ProposalDetails } from "../tasks/grantXP_snapshot";
import { getProof, getGotchiIds } from "../scripts/query/getAavegotchisXPData";

import { BigNumber } from "ethers";

describe("Testing Xp Merkle Airdrops", async function () {
  this.timeout(3000000);
  const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";

  //multiple gotchis
  const testAddress1 = "0xffa63650fda779f51d017c5a448c310c4ebb8106";
  const testAddress2 = "0xfe519ff03a09cb802dfb8e2011052969ded3d635";
  const testAddress3 = "0xfd86d28a6df8635c47af7c6ac5597893070d6336";
  const testAddress5 = "0xfd41bef1fd45d7db65fb8f4cd3804e4c8daff6b9";

  //sigprop
  const testAddress4 = "0xfb1394ce21ef1347a38276c44d69ccc3e6467fa4";

  const sampleCoreProp =
    "0x1930189873f7591fa60fc108d632c0f11fc35d8fff3eaccc349d05756c54c321";
  const sampleSigProp =
    "0xa9fb5cbdeae064bf114b27ea77390e93d8515c6c3512d4352f21e99212628483";

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

    await run("deployXPDrop", {
      proposalId: sampleCoreProp,
    });
  });

  it("Allows the admin to add new airdrops ", async function () {
    const xpDropDetails = await xpDrop.viewXPDrop(sampleCoreProp);
    const prop: ProposalDetails = await getProposalDetails(sampleCoreProp);
    const propInt =
      propType(prop.title) === "sigprop"
        ? 10
        : propType(prop.title) === "coreprop"
        ? 20
        : 0;
    expect(xpDropDetails.xpAmount).to.equal(propInt);
  });

  it("Cannot claim a non-existent drop", async function () {
    //using hardcoded values since the tree isn't generated yet
    const proof1 = [
      "0xd976c777b1c343657295789ac4e7893a9588e8a8869ce99df004ed49ea15eb83",
      "0x30539df661ef46f935a95e734d7dd1675fa9ee514b6bb8b71d4931f1a430c922",
      "0x0915527efceb1ca703ffef39f0aaa1d94c7572c7d224ed775f4c3448fa128716",
      "0x6c17ed1cb8f0d4f2730b9442ecc465479839d5e50947be1fe847c0dbf1868227",
      "0xb873b8a52e07eb360fadd40f31316dfdea6bc8c1e8ce78908646711a48d747e5",
      "0xaf0f557068a1dade74076436709562029e3c46971cebed2115baa7246332cfdf",
      "0x6aeed7153938c8ea8b5c36a1f927b6ae7b71c5284d6e12240b427b797771bdb9",
      "0x97e83620753f163887ea04b218695e8739d52daa9266ecdae1d9724aaf10c831",
      "0x163d069eacf6a6da8d3727b9af620742c5cfe301d769425eb53fe7e658d9798c",
    ];

    const gotchiIds1 = [
      "10150",
      "10311",
      "11148",
      "12592",
      "12695",
      "13625",
      "14501",
      "14790",
      "15554",
      "15609",
      "17248",
      "18595",
      "18852",
      "19114",
      "19142",
      "21940",
    ];
    await expect(
      xpDrop.claimXPDrop(sampleSigProp, testAddress1, gotchiIds1, proof1, [])
    ).to.be.revertedWith("NonExistentDrop");
  });

  it("Cannot claim with an incorrect proof ", async function () {
    const proof1: string[] | null = await getProof(
      testAddress2,
      sampleCoreProp
    );

    const gotchiIds1: string[] | null = await getGotchiIds(
      testAddress1,
      sampleCoreProp
    );

    const currentXP = await getCurrentXp(gotchiIds1 as string[]);

    await xpDrop.claimXPDrop(
      sampleCoreProp,
      testAddress1,
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
      sampleCoreProp
    );
    const proof2x: string[] | null = await getProof(
      testAddress2,
      sampleCoreProp
    );

    const allProofs: string[][] = [proof1x!, proof2x!];

    let allGotchis: string[][] = [];
    const gotchis1x = await getGotchiIds(testAddress1, sampleCoreProp);
    const gotchis2x = await getGotchiIds(testAddress2, sampleCoreProp);

    //get previous xp
    const prevXP1 = await getCurrentXp(gotchis1x as string[]);
    const prevXP2 = await getCurrentXp(gotchis2x as string[]);

    allGotchis.push(gotchis1x!, gotchis2x!);

    await xpDrop.batchGotchiClaimXPDrop(
      sampleCoreProp,
      [testAddress1, testAddress2],
      allGotchis,
      allProofs!,
      [[], []]
    );

    const afterXP1 = await getCurrentXp(gotchis1x as string[]);
    const afterXP2 = await getCurrentXp(gotchis2x as string[]);

    //make sure xp increases by 20 for all gotchis

    for (let i = 0; i < gotchis1x!.length; i++) {
      expect(prevXP1[i].add(20)).to.equal(afterXP1[i]);
    }

    for (let i = 0; i < gotchis2x!.length; i++) {
      expect(prevXP2[i].add(20)).to.equal(afterXP2[i]);
    }
  });

  it("Should not allow users to claim twice ", async function () {
    const proof1: string[] | null = await getProof(
      testAddress2,
      sampleCoreProp
    );
    const gotchiIds1: string[] | null = await getGotchiIds(
      testAddress2,
      sampleCoreProp
    );
    //@ts-ignore
    let prevXp = await aavegotchiFacet.getAavegotchi(gotchiIds1[0]);
    prevXp = prevXp.experience;

    await xpDrop.claimXPDrop(
      sampleCoreProp,
      testAddress2,
      gotchiIds1!,
      proof1!,
      []
    );
    //@ts-ignore
    const xp = await aavegotchiFacet.getAavegotchi(gotchiIds1[0]);
    expect(xp.experience).to.equal(prevXp);
  });

  it("test multiple prop claims", async function () {
    //deploy xp drop for sigprop
    await run("deployXPDrop", {
      proposalId: sampleSigProp,
    });

    const proof1x: string[] | null = await getProof(
      testAddress3,
      sampleCoreProp
    );
    const proof2x: string[] | null = await getProof(
      testAddress4,
      sampleSigProp
    );

    const allProofs: string[][] = [proof1x!, proof2x!];

    let allGotchis: string[][] = [];
    const gotchis1x = await getGotchiIds(testAddress3, sampleCoreProp);
    const gotchis2x = await getGotchiIds(testAddress4, sampleSigProp);

    //get previous xp
    const prevXP1 = await getCurrentXp(gotchis1x as string[]);
    const prevXP2 = await getCurrentXp(gotchis2x as string[]);

    allGotchis.push(gotchis1x!, gotchis2x!);

    await xpDrop.batchDropClaimXPDrop(
      [sampleCoreProp, sampleSigProp],
      [testAddress3, testAddress4],
      allGotchis,
      allProofs!,
      [[], []]
    );

    const afterXP1 = await getCurrentXp(gotchis1x as string[]);
    const afterXP2 = await getCurrentXp(gotchis2x as string[]);

    //test for coreprop xp increase

    for (let i = 0; i < gotchis1x!.length; i++) {
      expect(prevXP1[i].add(20)).to.equal(afterXP1[i]);
    }

    //test for sigprop xp increase
    for (let i = 0; i < gotchis2x!.length; i++) {
      expect(prevXP2[i].add(10)).to.equal(afterXP2[i]);
    }
  });

  it("Should allow partial xp claiming ", async function () {
    const proof1: string[] | null = await getProof(
      testAddress5,
      sampleCoreProp
    );
    const gotchiIds1: string[] | null = (await getGotchiIds(
      testAddress5,
      sampleCoreProp
    )) as string[];

    const toClaim = [gotchiIds1[0]];

    const prevXp = await getCurrentXp(gotchiIds1);

    await xpDrop.claimXPDrop(
      sampleCoreProp,
      testAddress5,
      gotchiIds1!,
      proof1!,
      toClaim
    );

    const xpAfter = await getCurrentXp(gotchiIds1);

    //only first gotchi got xp
    for (let i = 0; i < gotchiIds1.length; i++) {
      if (i === 0) {
        expect(xpAfter[i]).to.equal(prevXp[i].add(20));
      } else {
        expect(xpAfter[i]).to.equal(prevXp[i]);
      }
    }

    //now claim for remaining, should ignore first gotchi

    await xpDrop.claimXPDrop(
      sampleCoreProp,
      testAddress5,
      gotchiIds1!,
      proof1!,
      []
    );

    const xpAfter2 = await getCurrentXp(gotchiIds1);

    //remaining gotchis receive xp
    for (let i = 0; i < gotchiIds1.length; i++) {
      if (i === 0) {
        expect(xpAfter2[i]).to.equal(xpAfter[i]);
      } else {
        expect(xpAfter2[i]).to.equal(xpAfter[i].add(20));
      }
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
