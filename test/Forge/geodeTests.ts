import { ethers, network } from "hardhat";
import { expect } from "chai";
import {
  ForgeDAOFacet,
  ForgeVRFFacet,
  ForgeFacet,
  ForgeTokenFacet,
  WearablesFacet,
  IERC20,
} from "../../typechain";
import {
  impersonate,
  itemManagerAlt,
  maticDiamondAddress,
  maticDiamondUpgrader,
  maticForgeDiamond,
} from "../../scripts/helperFunctions";

import { releaseGeodes } from "../../scripts/upgrades/forge/geodes/upgrade-forgeGeodeFinal";

const WEARABLE_GAP_OFFSET = 1_000_000_000;
const GEODE_COMMON = WEARABLE_GAP_OFFSET + 2;
const GEODE_UNCOMMON = WEARABLE_GAP_OFFSET + 3;
const GEODE_RARE = WEARABLE_GAP_OFFSET + 4;
const GEODE_LEGENDARY = WEARABLE_GAP_OFFSET + 5;
const GEODE_MYTHICAL = WEARABLE_GAP_OFFSET + 6;
const GEODE_GODLIKE = WEARABLE_GAP_OFFSET + 7;

// NOTE: tests use tempFulfillRandomness in ForgeVRFFacet
describe("Testing Geodes", async function () {
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
  let adminDao: ForgeDAOFacet;
  let adminForge: ForgeFacet;

  before(async function () {
    await releaseGeodes();

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
      itemManagerAlt,
      forgeDaoFacet,
      ethers,
      network
    );
    adminForge = await impersonate(itemManagerAlt, forgeFacet, ethers, network);

    let testForgeToken: ForgeTokenFacet = await impersonate(
      testUser,
      forgeTokenFacet,
      ethers,
      network
    );
    let linkContract = (await ethers.getContractAt(
      "contracts/shared/interfaces/IERC20.sol:IERC20",
      "0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39"
    )) as IERC20;
    let linkContractTest = await impersonate(
      testUser,
      linkContract,
      ethers,
      network
    );

    testVrf = await impersonate(testUser, forgeVrfFacet, ethers, network);
    testForge = await impersonate(testUser, forgeFacet, ethers, network);

    // transfer testing LINK amount
    // await linkContractTest.transferFrom(
    //   testUser,
    //   maticForgeDiamond,
    //   "1000000000000000000"
    // );

    await testForgeToken.setApprovalForAll(maticForgeDiamond, true);
  });

  describe("tests", async function () {
    it("should get prizes", async function () {
      let prizes = await forgeDaoFacet.getGeodePrizesRemaining();
      console.log(prizes);
    });
    it("should burn and revert invalid", async function () {
      let priorBal = await forgeTokenFacet.balanceOf(testUser, 361);
      await adminForge.adminMint(testUser, 361, 1);
      await testForge.burn(testUser, 361, 1);
      expect(await forgeTokenFacet.balanceOf(testUser, 361)).to.be.equal(
        priorBal
      );
      await expect(testForge.burn(itemManagerAlt, 361, 1)).to.be.revertedWith(
        "ForgeFacet: caller is not token owner or approved"
      );
    });
    it("should revert if user has no VRF requests", async function () {
      await expect(testVrf.claimWinnings()).to.be.revertedWith(
        "ForgeVRFFacet: No VRF requests"
      );
    });
    it("should refund if prizes run out", async function () {
      let geodePrizeIds = [361];
      let geodePrizeQuantities = [1];

      await adminDao.setGeodePrizes(geodePrizeIds, geodePrizeQuantities);

      // NOTE: this assumes the testing function is enabled for vrf
      await (await testVrf.openGeodes([GEODE_LEGENDARY], [15])).wait();
      await expect(testVrf.claimWinnings()).to.emit(testVrf, "GeodeRefunded");
      await testForge.burn(testUser, 361, 1);

      // reset prize info and balance
      geodePrizeIds = [358, 359, 360, 361];
      geodePrizeQuantities = [100, 100, 100, 100];
      await adminDao.setGeodePrizes(geodePrizeIds, geodePrizeQuantities);
      await adminForge.adminMint(testUser, GEODE_LEGENDARY, 15);
    });

    it("should win some/lose some and have correct balance", async function () {
      const numToOpen = 15;
      let initGeodeBal = await forgeTokenFacet.balanceOf(
        testUser,
        GEODE_LEGENDARY
      );
      console.log("initGeodeBal");
      console.log(initGeodeBal);

      let receipt = await (
        await testVrf.openGeodes([GEODE_LEGENDARY], [numToOpen])
      ).wait();

      let claimTx = await testVrf.claimWinnings();
      let claimTxReceipt = await claimTx.wait();

      // parse all tx events to count results.
      const events = claimTxReceipt.events;
      let wins = {};
      let losses = 0;

      for (const event of events) {
        const eventName = event.event;
        const eventArgs = event.args;

        if (eventName == undefined) {
          // console.log(event);
        } else if (eventName == "GeodeWin") {
          if (!wins[eventArgs[1]]) {
            wins[eventArgs[1]] = 1;
          } else {
            wins[eventArgs[1]]++;
          }
        } else if (eventName == "GeodeEmpty") {
          losses++;
        } else {
          console.log(eventName + "(" + eventArgs + ")");
        }
      }

      // verify balances
      let geodeBal = await forgeTokenFacet.balanceOf(testUser, GEODE_LEGENDARY);
      expect(Number(geodeBal) == Number(initGeodeBal) - numToOpen);

      for (let itemId of Object.keys(wins)) {
        console.log("itemId", itemId);
        expect(
          Number(await forgeTokenFacet.balanceOf(testUser, itemId))
        ).to.be.equal(Number(wins[itemId]));
      }

      console.log(claimTxReceipt.cumulativeGasUsed);
    });
  });
});
