import { ethers, network } from "hardhat";
import { expect } from "chai";
import {
  ForgeDAOFacet,
  ForgeVRFFacet,
  ForgeFacet,
  ForgeTokenFacet,
  WearablesFacet,
} from "../../typechain";
import { impersonate, maticForgeDiamond } from "../../scripts/helperFunctions";

import { releaseMultiTierGeodes } from "../../scripts/upgrades/forge/geodes/upgrade-forgeMultiTierGeodeFinal";

import { upgradeForgeGeodeFix } from "../../scripts/upgrades/forge/geodes/upgrade-fixGeodePrizeIssues";

const WEARABLE_GAP_OFFSET = 1_000_000_000;
const GEODE_GODLIKE = WEARABLE_GAP_OFFSET + 7;

// NOTE: tests use tempFulfillRandomness in ForgeVRFFacet
describe("Testing Geodes", async function () {
  const testUser = "0x77427023e70cafd983dabaf3488d8d83ecb15b96";
  let WEARABLE_DIAMOND = "0x58de9AaBCaeEC0f69883C94318810ad79Cc6a44f";

  let forgeDiamondAddress = maticForgeDiamond;
  let forgeFacet: ForgeFacet;
  let forgeDaoFacet: ForgeDAOFacet;
  let forgeTokenFacet: ForgeTokenFacet;
  let forgeVrfFacet: ForgeVRFFacet;
  let wearablesFacet: WearablesFacet;

  let testVrf: ForgeVRFFacet;
  let testForge: ForgeFacet;
  let testForgeToken: ForgeTokenFacet;
  let adminDao: ForgeDAOFacet;
  let adminForge: ForgeFacet;

  before(async function () {
    await upgradeForgeGeodeFix();

    // const geodePrizeIds = [370, 371, 372, 373, 374, 375, 376, 377, 378, 379, 380, 381, 382, 383, 384, 385, 386, 387];
    // const geodePrizeQuantities = [100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100];
    // const geodePrizeRarities = [1, 1, 1, 2, 5, 1, 5, 2, 5, 5, 10, 10, 10, 10, 20, 50, 50, 50];

    forgeFacet = (await ethers.getContractAt(
      "contracts/Aavegotchi/ForgeDiamond/facets/ForgeFacet.sol:ForgeFacet",
      forgeDiamondAddress
    )) as ForgeFacet;

    forgeDaoFacet = (await ethers.getContractAt(
      "contracts/Aavegotchi/ForgeDiamond/facets/ForgeDAOFacet.sol:ForgeDAOFacet",
      forgeDiamondAddress
    )) as ForgeDAOFacet;
    forgeTokenFacet = (await ethers.getContractAt(
      "contracts/Aavegotchi/ForgeDiamond/facets/ForgeTokenFacet.sol:ForgeTokenFacet",
      forgeDiamondAddress
    )) as ForgeTokenFacet;
    forgeVrfFacet = (await ethers.getContractAt(
      "contracts/Aavegotchi/ForgeDiamond/facets/ForgeVRFFacet.sol:ForgeVRFFacet",
      forgeDiamondAddress
    )) as ForgeVRFFacet;
    wearablesFacet = (await ethers.getContractAt(
      "contracts/Aavegotchi/WearableDiamond/facets/WearablesFacet.sol:WearablesFacet",
      WEARABLE_DIAMOND
    )) as WearablesFacet;

    adminDao = await impersonate(
      // itemManagerAlt,
      "0x01F010a5e001fe9d6940758EA5e8c777885E351e",
      forgeDaoFacet,
      ethers,
      network
    );
    adminForge = await impersonate(
      "0x01F010a5e001fe9d6940758EA5e8c777885E351e",
      forgeFacet,
      ethers,
      network
    );

    testForgeToken = await impersonate(
      testUser,
      forgeTokenFacet,
      ethers,
      network
    );

    forgeVrfFacet = await impersonate(testUser, forgeVrfFacet, ethers, network);

    testVrf = await impersonate(testUser, forgeVrfFacet, ethers, network);
    testForge = await impersonate(testUser, forgeFacet, ethers, network);

    // transfer testing LINK amount
    // await linkContractTest.transferFrom(
    //   testUser,
    //   maticForgeDiamond,
    //   "1000000000000000000"
    // );

    //await testForgeToken.setApprovalForAll(maticForgeDiamond, true);
    // await adminDao.setMultiTierGeodePrizes(geodePrizeIds, geodePrizeQuantities, geodePrizeRarities)
  });

  describe("tests", async function () {
    // it("should get probabilities", async function () {
    //   let geodePrizeIds = [
    //     370, 371, 372, 373, 374, 375, 376, 377, 378, 379, 380, 381, 382, 383,
    //     384, 385, 386, 387,
    //   ];
    //   let geodePrizeQuantities = [
    //     100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100,
    //     100, 100, 100, 100,
    //   ];
    //   let geodePrizeRarities = [
    //     1, 1, 1, 2, 5, 1, 5, 2, 5, 5, 10, 10, 10, 10, 20, 50, 50, 50,
    //   ];

    //   await adminDao.setMultiTierGeodePrizes(
    //     geodePrizeIds,
    //     geodePrizeQuantities,
    //     geodePrizeRarities
    //   );

    //   // full prize pool, godlike geode
    //   let prob = await forgeVrfFacet.getCurrentPrizeProbabilityForGeode("50");
    //   expect(Number(prob[0])).to.equal(0);
    //   expect(Number(prob[1])).to.equal(0);
    //   expect(Number(prob[2])).to.equal(0);
    //   expect(Number(prob[3])).to.equal(1700);
    //   expect(Number(prob[4])).to.equal(5400);
    //   expect(Number(prob[5])).to.equal(2900);

    //   // Setup only legendary prizes and test for a godlike and rare geode
    //   geodePrizeIds = [370, 371];
    //   geodePrizeQuantities = [100, 100];
    //   geodePrizeRarities = [10, 10];

    //   await adminDao.setMultiTierGeodePrizes(
    //     geodePrizeIds,
    //     geodePrizeQuantities,
    //     geodePrizeRarities
    //   );

    //   prob = await forgeVrfFacet.getCurrentPrizeProbabilityForGeode("50");
    //   expect(Number(prob[0])).to.equal(0);
    //   expect(Number(prob[1])).to.equal(0);
    //   expect(Number(prob[2])).to.equal(0);
    //   expect(Number(prob[3])).to.equal(10000);
    //   expect(Number(prob[4])).to.equal(0);
    //   expect(Number(prob[5])).to.equal(0);

    //   prob = await forgeVrfFacet.getCurrentPrizeProbabilityForGeode("5");
    //   expect(Number(prob[0])).to.equal(0);
    //   expect(Number(prob[1])).to.equal(0);
    //   expect(Number(prob[2])).to.equal(0);
    //   expect(Number(prob[3])).to.equal(400);
    //   expect(Number(prob[4])).to.equal(0);
    //   expect(Number(prob[5])).to.equal(0);

    //   // missing godlike prize, godlike and mythical geodes
    //   geodePrizeIds = [370, 371, 372, 373, 374];
    //   geodePrizeQuantities = [100, 100, 100, 100, 100];
    //   geodePrizeRarities = [1, 2, 5, 10, 20];

    //   await adminDao.setMultiTierGeodePrizes(
    //     geodePrizeIds,
    //     geodePrizeQuantities,
    //     geodePrizeRarities
    //   );

    //   prob = await forgeVrfFacet.getCurrentPrizeProbabilityForGeode("50");
    //   expect(Number(prob[0])).to.equal(0);
    //   expect(Number(prob[1])).to.equal(0);
    //   expect(Number(prob[2])).to.equal(0);
    //   expect(Number(prob[3])).to.equal(1700);
    //   expect(Number(prob[4])).to.equal(8300);
    //   expect(Number(prob[5])).to.equal(0);

    //   prob = await forgeVrfFacet.getCurrentPrizeProbabilityForGeode("20");
    //   expect(Number(prob[0])).to.equal(0);
    //   expect(Number(prob[1])).to.equal(800);
    //   expect(Number(prob[2])).to.equal(1800);
    //   expect(Number(prob[3])).to.equal(3800);
    //   expect(Number(prob[4])).to.equal(2200);
    //   expect(Number(prob[5])).to.equal(0);

    //   // only common prizes, godlike and mythical geodes
    //   geodePrizeIds = [370, 371];
    //   geodePrizeQuantities = [100, 100];
    //   geodePrizeRarities = [1, 1];

    //   await adminDao.setMultiTierGeodePrizes(
    //     geodePrizeIds,
    //     geodePrizeQuantities,
    //     geodePrizeRarities
    //   );

    //   prob = await forgeVrfFacet.getCurrentPrizeProbabilityForGeode("50");
    //   expect(Number(prob[0])).to.equal(10000);
    //   expect(Number(prob[1])).to.equal(0);
    //   expect(Number(prob[2])).to.equal(0);
    //   expect(Number(prob[3])).to.equal(0);
    //   expect(Number(prob[4])).to.equal(0);
    //   expect(Number(prob[5])).to.equal(0);

    //   prob = await forgeVrfFacet.getCurrentPrizeProbabilityForGeode("20");
    //   expect(Number(prob[0])).to.equal(8600);
    //   expect(Number(prob[1])).to.equal(0);
    //   expect(Number(prob[2])).to.equal(0);
    //   expect(Number(prob[3])).to.equal(0);
    //   expect(Number(prob[4])).to.equal(0);
    //   expect(Number(prob[5])).to.equal(0);

    //   // only godlike prizes, common and mythical geodes
    //   geodePrizeIds = [370, 371];
    //   geodePrizeQuantities = [100, 100];
    //   geodePrizeRarities = [50, 50];

    //   await adminDao.setMultiTierGeodePrizes(
    //     geodePrizeIds,
    //     geodePrizeQuantities,
    //     geodePrizeRarities
    //   );

    //   prob = await forgeVrfFacet.getCurrentPrizeProbabilityForGeode("1");
    //   expect(Number(prob[0])).to.equal(0);
    //   expect(Number(prob[1])).to.equal(0);
    //   expect(Number(prob[2])).to.equal(0);
    //   expect(Number(prob[3])).to.equal(0);
    //   expect(Number(prob[4])).to.equal(0);
    //   expect(Number(prob[5])).to.equal(0);

    //   prob = await forgeVrfFacet.getCurrentPrizeProbabilityForGeode("20");
    //   expect(Number(prob[0])).to.equal(0);
    //   expect(Number(prob[1])).to.equal(0);
    //   expect(Number(prob[2])).to.equal(0);
    //   expect(Number(prob[3])).to.equal(0);
    //   expect(Number(prob[4])).to.equal(0);
    //   expect(Number(prob[5])).to.equal(200);

    //   // empty prizes, godlike geode
    //   geodePrizeIds = [];
    //   geodePrizeQuantities = [];
    //   geodePrizeRarities = [];

    //   await adminDao.setMultiTierGeodePrizes(
    //     geodePrizeIds,
    //     geodePrizeQuantities,
    //     geodePrizeRarities
    //   );

    //   prob = await forgeVrfFacet.getCurrentPrizeProbabilityForGeode("50");
    //   expect(Number(prob[0])).to.equal(0);
    //   expect(Number(prob[1])).to.equal(0);
    //   expect(Number(prob[2])).to.equal(0);
    //   expect(Number(prob[3])).to.equal(0);
    //   expect(Number(prob[4])).to.equal(0);
    //   expect(Number(prob[5])).to.equal(0);
    // });

    it("claiming should work fine", async function () {
      const r = forgeVrfFacet.claimWinnings();
      expect(r).to.not.be.reverted;
    });
  });
});
