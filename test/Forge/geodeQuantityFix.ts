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
import * as helpers from "@nomicfoundation/hardhat-network-helpers";

import { releaseMultiTierGeodes } from "../../scripts/upgrades/forge/geodes/upgrade-forgeMultiTierGeodeFinal";

import { upgradeForgeGeodeFix } from "../../scripts/upgrades/forge/geodes/upgrade-fixGeodePrizeIssues";
import {GEODE_LEGENDARY, GEODE_MYTHICAL, GEODE_GODLIKE} from "../../helpers/constants";

const WEARABLE_GAP_OFFSET = 1_000_000_000;
// const GEODE_GODLIKE = WEARABLE_GAP_OFFSET + 7;

// NOTE: tests use tempFulfillRandomness in ForgeVRFFacet
describe("Testing Geodes", async function () {

  // const testUser = "0x77427023e70cafd983dabaf3488d8d83ecb15b96";
  const testUser = "0x60c4ae0EE854a20eA7796a9678090767679B30FC";
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
    await helpers.mine()

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

    adminDao = await impersonate(
        // itemManagerAlt,
        "0x01F010a5e001fe9d6940758EA5e8c777885E351e",
        forgeDaoFacet,
        ethers,
        network
    );
    adminForge = await impersonate("0x01F010a5e001fe9d6940758EA5e8c777885E351e", forgeFacet, ethers, network);

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

    it("claiming should work fine", async function () {
      let failingUser = "0x77427023e70cafd983dabaf3488d8d83ecb15b96"
      const failingForgeVrfFacet = await impersonate(failingUser, forgeVrfFacet, ethers, network);
      const r = failingForgeVrfFacet.claimWinnings();
      expect(r).to.not.be.reverted;
    });

    it('should test array rearrangement', async () => {
      let testLegGeodeAmount = 40
      let testGodGeodeAmount = 15
      let geodePrizeIds = [370, 371, 372, 373, 374, 375, 376, 377, 378, 379, 380, 381, 382, 383, 384, 385, 386, 387];
      let geodePrizeQuantities = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
      let geodePrizeRarities = [1, 1, 1, 2, 5, 1, 5, 2, 5, 5, 10, 10, 10, 10, 20, 50, 50, 50];

      await adminDao.setMultiTierGeodePrizes(geodePrizeIds, geodePrizeQuantities, geodePrizeRarities)
      await adminForge.adminMint(testUser, GEODE_LEGENDARY, testLegGeodeAmount);
      await adminForge.adminMint(testUser, GEODE_GODLIKE, testGodGeodeAmount);

      console.log("prizes remaining", await adminDao.getGeodePrizesRemaining())
      let newGeodePrizeIds = [...geodePrizeIds];
      newGeodePrizeIds = newGeodePrizeIds.map(i => Number(i))

      function findEventArgs(events, eventName) {
        let _event = null;

        for (const event of events) {
          if (event.event === eventName) {
            _event = event.args;
          }
        }
        return _event
      }

      async function testGeodeOfRarity(geodeRarity, amount)  {
        for (let i = 0; i < amount; i++){
          console.log("i", i);

          if (newGeodePrizeIds.length == 0){
            await expect(testVrf.openGeodes([geodeRarity], [1])).to.be.revertedWith("ForgeVRFFacet: No prizes currently available")
            continue;
          }

          const tx = await testVrf.openGeodes([geodeRarity], [1])
          let tmp = await tx.wait()

          const txClaim = await testVrf.claimWinnings()
          let result = await txClaim.wait()

          let events = ["GeodeWin", "GeodeEmpty", "GeodeRefunded"]
          let eventArgs;
          let eventIdx: number;

          for (let i = 0; i < events.length; i++){
            let tmp = findEventArgs(result.events, events[i])
            if (tmp) {
              eventArgs = tmp
              eventIdx = i
              break;
            }
          }

          let prizeIdWon;
          if (events[eventIdx] == "GeodeWin"){
            prizeIdWon = Number(eventArgs[1])
            console.log("prizeIdWon", prizeIdWon);

            let rearranged = (await adminDao.getGeodePrizesRemaining())[0]
            rearranged = rearranged.map(i => Number(i))

            let oldIdx = newGeodePrizeIds.findIndex(n => n == prizeIdWon)
            let oldLastId = newGeodePrizeIds[newGeodePrizeIds.length - 1]

            // if the prize that was won happened to be the last item in the pre-rearranged array,
            // it will be undefined after calling getGeodePrizesRemaining because it was popped.
            if (oldIdx == newGeodePrizeIds.length - 1) {
              expect(rearranged[oldIdx]).to.be.equal(undefined)
            } else {
              expect(rearranged[oldIdx]).to.be.equal(oldLastId)
              expect(rearranged.findIndex(n => n == prizeIdWon)).to.be.equal(-1)
            }

            newGeodePrizeIds = rearranged;
          } else if (events[eventIdx] == "GeodeEmpty"){
            console.log("GeodeEmpty");
          } else if (events[eventIdx] == "GeodeRefunded"){
            console.log("GeodeRefunded");
          }
        }
      }

      console.log("testing legendaries")
      await testGeodeOfRarity(GEODE_LEGENDARY, testLegGeodeAmount)

      console.log("testing gods")
      await testGeodeOfRarity(GEODE_GODLIKE, testGodGeodeAmount)

    });
  });
});
