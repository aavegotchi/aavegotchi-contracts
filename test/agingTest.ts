/* global describe it before ethers network */
/* eslint prefer-const: "off" */

//@ts-ignore
import { ethers } from "hardhat";
import { expect } from "chai";
import { AavegotchiGameFacet, AavegotchiFacet } from "../typechain";
import { upgrade } from "../scripts/upgrades/upgrade-aging";
import { BigNumber } from "@ethersproject/bignumber";

describe("Testing Aging", async function () {
  const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
  let aavegotchiGameFacet: AavegotchiGameFacet;
  let aavegotchiFacet: AavegotchiFacet;
  interface Data {
    gotchiId: number;
    skillPointsBefore: BigNumber | null;
    skillPointsAfter: BigNumber | null;
    claimTime: BigNumber | null;
    age: number;
    ageSkillPointsTest: number;
    testSkillPoints: number;
    contractSkillPoints: BigNumber | null;
  }

  let data: Data[] = [
    {
      gotchiId: 6908,
      skillPointsBefore: null,
      skillPointsAfter: null,
      claimTime: null,
      age: 0,
      ageSkillPointsTest: 0,
      testSkillPoints: 0,
      contractSkillPoints: null,
    },
    {
      gotchiId: 15560,
      skillPointsBefore: null,
      skillPointsAfter: null,
      claimTime: null,
      age: 0,
      ageSkillPointsTest: 0,
      testSkillPoints: 0,
      contractSkillPoints: null,
    },
    {
      gotchiId: 22324,
      skillPointsBefore: null,
      skillPointsAfter: null,
      claimTime: null,
      age: 0,
      ageSkillPointsTest: 0,
      testSkillPoints: 0,
      contractSkillPoints: null,
    },
    {
      gotchiId: 16559,
      skillPointsBefore: null,
      skillPointsAfter: null,
      claimTime: null,
      age: 0,
      ageSkillPointsTest: 0,
      testSkillPoints: 0,
      contractSkillPoints: null,
    },
    {
      gotchiId: 5205,
      skillPointsBefore: null,
      skillPointsAfter: null,
      claimTime: null,
      age: 0,
      ageSkillPointsTest: 0,
      testSkillPoints: 0,
      contractSkillPoints: null,
    },
    {
      gotchiId: 9369,
      skillPointsBefore: null,
      skillPointsAfter: null,
      claimTime: null,
      age: 0,
      ageSkillPointsTest: 0,
      testSkillPoints: 0,
      contractSkillPoints: null,
    },
    {
      gotchiId: 22197,
      skillPointsBefore: null,
      skillPointsAfter: null,
      claimTime: null,
      age: 0,
      ageSkillPointsTest: 0,
      testSkillPoints: 0,
      contractSkillPoints: null,
    },
    {
      gotchiId: 13996,
      skillPointsBefore: null,
      skillPointsAfter: null,
      claimTime: null,
      age: 0,
      ageSkillPointsTest: 0,
      testSkillPoints: 0,
      contractSkillPoints: null,
    },
    {
      gotchiId: 11663,
      skillPointsBefore: null,
      skillPointsAfter: null,
      claimTime: null,
      age: 0,
      ageSkillPointsTest: 0,
      testSkillPoints: 0,
      contractSkillPoints: null,
    },
    {
      gotchiId: 15243,
      skillPointsBefore: null,
      skillPointsAfter: null,
      claimTime: null,
      age: 0,
      ageSkillPointsTest: 0,
      testSkillPoints: 0,
      contractSkillPoints: null,
    },
  ];
  before(async function () {
    aavegotchiGameFacet = (await ethers.getContractAt(
      "AavegotchiGameFacet",
      diamondAddress
    )) as AavegotchiGameFacet;
    aavegotchiFacet = (await ethers.getContractAt(
      "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
      diamondAddress
    )) as AavegotchiFacet;
    for (let i = 0; i < data.length; i++) {
      data[i].skillPointsBefore =
        await aavegotchiGameFacet.availableSkillPoints(data[i].gotchiId);
    }

    await upgrade();
  });

  it("Compare skill points before and after upgrade", async function () {
    for (let i = 0; i < data.length; i++) {
      data[i].skillPointsAfter = await aavegotchiGameFacet.availableSkillPoints(
        data[i].gotchiId
      );
      data[i].claimTime = await aavegotchiFacet.aavegotchiClaimTime(
        data[i].gotchiId
      );
      data[i].age = Math.floor(Date.now() / 1000) - Number(data[i].claimTime);
      // check only if gotchi is atleast 1M blocks old
      if (data[i].age > 2300000) {
        expect(data[i].skillPointsAfter).to.above(data[i].skillPointsBefore);
      }
    }
  });

  it("Check that skill points matches", async function () {
    let fibSequence = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89];
    const calcSkillPoints = (age: number) => {
      let skillPoints = 0;
      for (let i = 0; i < fibSequence.length; i++) {
        if (age > fibSequence[i] * 2300000) {
          skillPoints++;
        }
      }
      return skillPoints;
    };
    for (let i = 0; i < data.length; i++) {
      data[i].ageSkillPointsTest = calcSkillPoints(data[i].age);
      data[i].testSkillPoints =
        data[i].ageSkillPointsTest + Number(data[i].skillPointsBefore);
      data[i].contractSkillPoints =
        await aavegotchiGameFacet.availableSkillPoints(data[i].gotchiId);
      expect(data[i].testSkillPoints).to.equal(
        Number(data[i].contractSkillPoints)
      );
    }
  });
});
