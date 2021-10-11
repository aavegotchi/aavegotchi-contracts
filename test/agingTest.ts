/* global describe it before ethers network */
/* eslint prefer-const: "off" */

//@ts-ignore
import { ethers } from "hardhat";
import { expect } from "chai";
import { AavegotchiGameFacet } from "../typechain";
import { upgrade } from "../scripts/upgrades/upgrade-aging";

describe("Testing Aging", async function () {
  const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
  let aavegotchiGameFacet: AavegotchiGameFacet;
  before(async function () {
    await upgrade();

    aavegotchiGameFacet = (await ethers.getContractAt(
      "AavegotchiGameFacet",
      diamondAddress
    )) as AavegotchiGameFacet;
  });

  it("Check against top 10 BRS", async function () {
    const g1 = await aavegotchiGameFacet.availableSkillPoints(6908);
    expect(g1).to.equal(6);
    const g2 = await aavegotchiGameFacet.availableSkillPoints(15560);
    expect(g2).to.equal(1);
    const g3 = await aavegotchiGameFacet.availableSkillPoints(22324);
    expect(g3).to.equal(1);
    const g4 = await aavegotchiGameFacet.availableSkillPoints(16559);
    expect(g4).to.equal(1);
    const g5 = await aavegotchiGameFacet.availableSkillPoints(5205);
    expect(g5).to.equal(5);
    const g6 = await aavegotchiGameFacet.availableSkillPoints(9369);
    expect(g6).to.equal(5);
    const g7 = await aavegotchiGameFacet.availableSkillPoints(22197);
    expect(g7).to.equal(1);
    const g8 = await aavegotchiGameFacet.availableSkillPoints(13996);
    expect(g8).to.equal(1);
    const g9 = await aavegotchiGameFacet.availableSkillPoints(11663);
    expect(g9).to.equal(1);
    const g10 = await aavegotchiGameFacet.availableSkillPoints(15243);
    expect(g10).to.equal(0);
    const g11 = await aavegotchiGameFacet.availableSkillPoints(2057);
    expect(g11).to.equal(4);
  });
});
