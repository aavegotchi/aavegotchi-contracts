/* global describe it before ethers network */
/* eslint prefer-const: "off" */

//@ts-ignore
import { ethers, network } from "hardhat";
import { upgrade } from "../scripts/upgrades/upgrade-xpMerkleFacet";
import { impersonate, propType, gameManager } from "../scripts/helperFunctions";
import { AavegotchiFacet, MerkleDropFacet } from "../typechain";
import { run } from "hardhat";
import { expect } from "chai";
import { getProposalDetails, ProposalDetails } from "../tasks/grantXP_snapshot";
import { getGotchiIds, getProof } from "../scripts/query/getAavegotchisXPData";

import { BigNumber } from "ethers";

describe("Testing Xp Merkle Airdrops", async function () {
  this.timeout(300000);
  const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";

  const testAddress1 = "0xfef3afcc1de62f8a50eebd5eeffa1623b383db9f";
  const testAddress2 = "0x01c28a969a7d0ba03419c8c80be59928c4732cd9";

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
    //  xpDrop = await impersonate(testAddress1, xpDrop, ethers, network);

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
    const proof1: string[] | null = await getProof(
      testAddress1,
      sampleCoreProp
    );
    const gotchiIds1: string[] | null = await getGotchiIds(
      testAddress1,
      sampleCoreProp
    );
    await expect(
      xpDrop.claimXPDrop(sampleSigProp, testAddress1, gotchiIds1!, proof1!)
    ).to.revertedWith("NonExistentDrop");
  });

  it("Cannot claim with an incorrect proof ", async function () {
    xpDrop = await impersonate(testAddress1, xpDrop, ethers, network);
    const proof1: string[] | null = await getProof(
      testAddress2,
      sampleCoreProp
    );
    const gotchiIds1: string[] | null = await getGotchiIds(
      testAddress1,
      sampleCoreProp
    );
    await expect(
      xpDrop.claimXPDrop(sampleCoreProp, testAddress1, gotchiIds1!, proof1!)
    ).to.revertedWith("IncorrectProofOrAddress");
  });

  it("Allows eligible claimers to claim xp ", async function () {
    const gotchiIds1: string[] | null = await getGotchiIds(
      testAddress1,
      sampleCoreProp
    );
    //get previous xp
    let prevXp: BigNumber[] = [];

    for (let i = 0; i < gotchiIds1!.length; i++) {
      //@ts-ignore
      const xp = await aavegotchiFacet.getAavegotchi(gotchiIds1[i]);

      prevXp.push(xp.experience);
    }

    const proof1: string[] | null = await getProof(
      testAddress1,
      sampleCoreProp
    );

    await xpDrop.claimXPDrop(
      sampleCoreProp,
      testAddress1,
      gotchiIds1!,
      proof1!
    );
    //make sure xp increases by 20 each
    for (let i = 0; i < gotchiIds1!.length; i++) {
      //@ts-ignore
      const xp = await aavegotchiFacet.getAavegotchi(gotchiIds1[i]);

      expect(xp.experience).to.equal(prevXp[i].add(20));
    }
  });

  it("Should not allow users to claim twice ", async function () {
    const proof1: string[] | null = await getProof(
      testAddress1,
      sampleCoreProp
    );
    const gotchiIds1: string[] | null = await getGotchiIds(
      testAddress1,
      sampleCoreProp
    );
    await expect(
      xpDrop.claimXPDrop(sampleCoreProp, testAddress1, gotchiIds1!, proof1!)
    ).to.revertedWith("XPClaimedAlready");
  });

  it("test for sigprop amounts too", async function () {
    await run("deployXPDrop", {
      proposalId: sampleSigProp,
    });
    xpDrop = await impersonate(testAddress2, xpDrop, ethers, network);

    const proof2: string[] | null = await getProof(testAddress2, sampleSigProp);
    const gotchiIds2: string[] | null = await getGotchiIds(
      testAddress2,
      sampleSigProp
    );

    let prevXp: BigNumber[] = [];

    for (let i = 0; i < gotchiIds2!.length; i++) {
      //@ts-ignore
      const xp = await aavegotchiFacet.getAavegotchi(gotchiIds2[i]);

      prevXp.push(xp.experience);
    }

    //claim xp
    await xpDrop.claimXPDrop(sampleSigProp, testAddress2, gotchiIds2!, proof2!);

    //make sure xp increases by 10 each
    for (let i = 0; i < gotchiIds2!.length; i++) {
      //@ts-ignore
      const xp = await aavegotchiFacet.getAavegotchi(gotchiIds2[i]);

      expect(xp.experience).to.equal(prevXp[i].add(10));
    }
  });
});
