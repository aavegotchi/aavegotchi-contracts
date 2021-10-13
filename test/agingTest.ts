import { ethers } from "hardhat";
import { expect } from "chai";
import { AavegotchiGameFacet, AavegotchiFacet } from "../typechain";
import { upgrade } from "../scripts/upgrades/upgrade-aging";
import { maticDiamondAddress } from "../scripts/helperFunctions";

describe("Testing Aging", async function () {
  this.timeout(200000000);
  const diamondAddress = maticDiamondAddress;
  let aavegotchiGameFacet: AavegotchiGameFacet;
  let aavegotchiFacet: AavegotchiFacet;

  const gotchiIds = [
    6908, 15560, 22324, 16559, 5205, 9369, 22197, 13996, 11663, 15243,
  ];
  const skillPointsBefore: number[] = [];
  const skillPointsAfter: number[] = [];
  const ages: number[] = [];
  const fibSequence = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89];
  const oneMillionBlocks = 2300000;

  const calcSkillPoints = (age: number) => {
    let skillPoints = 0;
    for (let i = 0; i < fibSequence.length; i++) {
      if (age > fibSequence[i] * oneMillionBlocks) {
        skillPoints++;
      }
    }
    return skillPoints;
  };

  before(async function () {
    aavegotchiGameFacet = (await ethers.getContractAt(
      "AavegotchiGameFacet",
      diamondAddress
    )) as AavegotchiGameFacet;
    aavegotchiFacet = (await ethers.getContractAt(
      "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
      diamondAddress
    )) as AavegotchiFacet;
    for (let i = 0; i < gotchiIds.length; i++) {
      const skillPoints = await aavegotchiGameFacet.availableSkillPoints(
        gotchiIds[i]
      );
      skillPointsBefore.push(Number(skillPoints.toString()));
    }

    console.log("skill points:", skillPointsBefore);

    await upgrade();
  });

  it("Compare skill points before and after upgrade", async function () {
    for (let i = 0; i < gotchiIds.length; i++) {
      console.log("gotchi:", gotchiIds[i]);
      const skillPoint = await aavegotchiGameFacet.availableSkillPoints(
        gotchiIds[i]
      );
      skillPointsAfter.push(Number(skillPoint.toString()));
      const claimTime = (
        await aavegotchiFacet.aavegotchiClaimTime(gotchiIds[i])
      ).toString();
      const age = Math.floor(Date.now() / 1000) - Number(claimTime);
      console.log("age:", age);

      ages.push(age);
      // check only if gotchi is atleast 1M blocks old
      if (age > oneMillionBlocks) {
        expect(skillPointsAfter[i]).to.above(skillPointsBefore[i]);
      }

      console.log("skill points:", skillPointsAfter);
    }
  });

  it("Check that skill points matches", async function () {
    for (let i = 0; i < gotchiIds.length; i++) {
      const agePts = calcSkillPoints(ages[i]);
      const totalPts = agePts + Number(skillPointsBefore[i]);
      const onchainPts = await aavegotchiGameFacet.availableSkillPoints(
        gotchiIds[i]
      );
      expect(totalPts).to.equal(Number(onchainPts));
    }
  });
});
