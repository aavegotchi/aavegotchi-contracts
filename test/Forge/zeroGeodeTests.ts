import { ethers, network } from "hardhat";
import { expect } from "chai";
import { ForgeVRFFacet } from "../../typechain";
import {
  impersonate,
  itemManagerAlt,
  maticDiamondAddress,
  maticDiamondUpgrader,
  maticForgeDiamond,
} from "../../scripts/helperFunctions";

import { releaseZeroGeodesFix } from "../../scripts/upgrades/forge/geodes/upgrade-zeroGeodeFix";

describe("Testing Geodes", async function () {
  const testUser = "0x60c4ae0EE854a20eA7796a9678090767679B30FC";
  let forgeDiamondAddress = maticForgeDiamond;
  let forgeVrfFacet: ForgeVRFFacet;

  before(async function () {
    await releaseZeroGeodesFix();
    forgeVrfFacet = (await ethers.getContractAt(
      "contracts/Aavegotchi/ForgeDiamond/facets/ForgeVRFFacet.sol:ForgeVRFFacet",
      forgeDiamondAddress
    )) as ForgeVRFFacet;
  });

  describe("tests", async function () {
    it("should test zero geode fix", async function () {
      await expect(forgeVrfFacet.openGeodes([], [])).to.be.revertedWith(
        "ForgeVRFFacet: Cannot open 0 geodes"
      );
    });
  });
});
