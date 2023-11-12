import { ethers, network } from "hardhat";
import { expect } from "chai";
import { AavegotchiGameFacet } from "../../typechain";
import {
  impersonate,
  itemManagerAlt,
  maticDiamondAddress,
  maticDiamondUpgrader,
  maticForgeDiamond,
} from "../../scripts/helperFunctions";

import { upgradeAavegotchiForRepec } from "../../scripts/upgrades/forge/upgrade-aavegotchiForRespec";

let imp : AavegotchiGameFacet;
describe("Testing Respec potion", async function () {
  const testUser = "0x60c4ae0EE854a20eA7796a9678090767679B30FC";
  let aavegotchiGameFacet: AavegotchiGameFacet;

  before(async function () {
    // await upgradeAavegotchiForRepec();

    aavegotchiGameFacet = (await ethers.getContractAt(
      "contracts/Aavegotchi/facets/AavegotchiGameFacet.sol:AavegotchiGameFacet",
      maticDiamondAddress
    )) as AavegotchiGameFacet;

    imp = await impersonate(
      testUser,
      aavegotchiGameFacet,
      ethers,
      network
    );
  });

  describe("tests", async function () {
    it("should reset skill points", async function () {
      await imp.resetUsedSkillPoints(474)
      console.log(await imp.availableSkillPoints(474))

      expect(await imp.availableSkillPoints(474)).to.equal(9)
    });

    it("should revert", async function () {
      await expect(imp.resetUsedSkillPoints(1)).to.be.reverted
    });
  });
});
