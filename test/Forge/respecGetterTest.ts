import { ethers, network } from "hardhat";
import { expect } from "chai";
import { AavegotchiGameFacet } from "../../typechain";
import {
  impersonate,
  maticDiamondAddress,
} from "../../scripts/helperFunctions";

import { upgradeAavegotchiRepecCountGetter } from "../../scripts/upgrades/upgrade-aavegotchiRespecCountGetter";

let impGame : AavegotchiGameFacet;

describe("Testing Respec getter", async function () {
  const testUser = "0x60c4ae0EE854a20eA7796a9678090767679B30FC";
  let aavegotchiGameFacet: AavegotchiGameFacet;

  before(async function () {
    await upgradeAavegotchiRepecCountGetter();

    aavegotchiGameFacet = (await ethers.getContractAt(
      "contracts/Aavegotchi/facets/AavegotchiGameFacet.sol:AavegotchiGameFacet",
      maticDiamondAddress
    )) as AavegotchiGameFacet;

    impGame = await impersonate(
      testUser,
      aavegotchiGameFacet,
      ethers,
      network
    );
  });

  describe("tests", async function () {
    it("should test getter", async function () {
      expect(await impGame.respecCount(10854)).to.equal(2)
    });
  });
});
