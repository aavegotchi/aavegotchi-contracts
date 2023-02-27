import { ethers, network } from "hardhat";
import { expect } from "chai";
import {
  ForgeDAOFacet,
  ForgeFacet,
  ForgeTokenFacet,
  WearablesFacet,
  CollateralFacet,
  DAOFacet,
  ItemsFacet,
  GotchiLendingFacet,
  LendingGetterAndSetterFacet,
  AavegotchiFacet,
  IERC20,
} from "../../typechain";
import {
  impersonate,
  itemManagerAlt,
  maticDiamondAddress,
  maticDiamondUpgrader,
  maticForgeDiamond,
} from "../../scripts/helperFunctions";
import { JsonRpcSigner } from "@ethersproject/providers";
import { releaseForge } from "../../scripts/upgrades/forge/upgrade-forgeFinal";
import { upgradeForgeDiamondForPet } from "../../scripts/upgrades/forge/upgrade-forgePet";
import { ALL } from "dns";
import exp from "constants";

// See contracts/Aavegotchi/ForgeDiamond/libraries/LibAppStorage.sol
// All non-schematic items (cores, alloy, essence, etc) IDs start at this offset number.
const WEARABLE_GAP_OFFSET = 1000000000;

// Forge asset token IDs
const ALLOY = WEARABLE_GAP_OFFSET + 0;
const ESSENCE = WEARABLE_GAP_OFFSET + 1;
const GEODE_COMMON = WEARABLE_GAP_OFFSET + 2;
const GEODE_UNCOMMON = WEARABLE_GAP_OFFSET + 3;
const GEODE_RARE = WEARABLE_GAP_OFFSET + 4;
const GEODE_LEGENDARY = WEARABLE_GAP_OFFSET + 5;
const GEODE_MYTHICAL = WEARABLE_GAP_OFFSET + 6;
const GEODE_GODLIKE = WEARABLE_GAP_OFFSET + 7;

const CORE_BODY_COMMON = WEARABLE_GAP_OFFSET + 8;
const CORE_BODY_UNCOMMON = WEARABLE_GAP_OFFSET + 9;
const CORE_BODY_RARE = WEARABLE_GAP_OFFSET + 10;
const CORE_BODY_LEGENDARY = WEARABLE_GAP_OFFSET + 11;
const CORE_BODY_MYTHICAL = WEARABLE_GAP_OFFSET + 12;
const CORE_BODY_GODLIKE = WEARABLE_GAP_OFFSET + 13;

const CORE_FACE_COMMON = WEARABLE_GAP_OFFSET + 14;
const CORE_FACE_UNCOMMON = WEARABLE_GAP_OFFSET + 15;
const CORE_FACE_RARE = WEARABLE_GAP_OFFSET + 16;
const CORE_FACE_LEGENDARY = WEARABLE_GAP_OFFSET + 17;
const CORE_FACE_MYTHICAL = WEARABLE_GAP_OFFSET + 18;
const CORE_FACE_GODLIKE = WEARABLE_GAP_OFFSET + 19;

const CORE_EYES_COMMON = WEARABLE_GAP_OFFSET + 20;
const CORE_EYES_UNCOMMON = WEARABLE_GAP_OFFSET + 21;
const CORE_EYES_RARE = WEARABLE_GAP_OFFSET + 22;
const CORE_EYES_LEGENDARY = WEARABLE_GAP_OFFSET + 23;
const CORE_EYES_MYTHICAL = WEARABLE_GAP_OFFSET + 24;
const CORE_EYES_GODLIKE = WEARABLE_GAP_OFFSET + 25;

const CORE_HEAD_COMMON = WEARABLE_GAP_OFFSET + 26;
const CORE_HEAD_UNCOMMON = WEARABLE_GAP_OFFSET + 27;
const CORE_HEAD_RARE = WEARABLE_GAP_OFFSET + 28;
const CORE_HEAD_LEGENDARY = WEARABLE_GAP_OFFSET + 29;
const CORE_HEAD_MYTHICAL = WEARABLE_GAP_OFFSET + 30;
const CORE_HEAD_GODLIKE = WEARABLE_GAP_OFFSET + 31;

const CORE_HANDS_COMMON = WEARABLE_GAP_OFFSET + 32;
const CORE_HANDS_UNCOMMON = WEARABLE_GAP_OFFSET + 33;
const CORE_HANDS_RARE = WEARABLE_GAP_OFFSET + 34;
const CORE_HANDS_LEGENDARY = WEARABLE_GAP_OFFSET + 35;
const CORE_HANDS_MYTHICAL = WEARABLE_GAP_OFFSET + 36;
const CORE_HANDS_GODLIKE = WEARABLE_GAP_OFFSET + 37;

const CORE_PET_COMMON = WEARABLE_GAP_OFFSET + 38;
const CORE_PET_UNCOMMON = WEARABLE_GAP_OFFSET + 39;
const CORE_PET_RARE = WEARABLE_GAP_OFFSET + 40;
const CORE_PET_LEGENDARY = WEARABLE_GAP_OFFSET + 41;
const CORE_PET_MYTHICAL = WEARABLE_GAP_OFFSET + 42;
const CORE_PET_GODLIKE = WEARABLE_GAP_OFFSET + 43;

describe("Testing Forge", async function () {
  let signer: JsonRpcSigner, signer2: JsonRpcSigner;
  let testUser = "0x60c4ae0EE854a20eA7796a9678090767679B30FC";
  let rentalTestUser = "0x3E9c2Ee838072b370567efC2DF27602d776B341c";
  let felonOwner = "0x60eD33735C9C29ec2c26B8eC734e36D5B6fa1EAB";
  let daoAddr = "0x6fb7e0AAFBa16396Ad6c1046027717bcA25F821f"; // DTF multisig
  let WEARABLE_DIAMOND = "0x58de9AaBCaeEC0f69883C94318810ad79Cc6a44f";
  let GLTR = "0x3801C3B3B5c98F88a9c9005966AA96aa440B9Afc";

  let forgeDiamondAddress: string;
  let forgeFacet: ForgeFacet;
  let forgeDaoFacet: ForgeDAOFacet;
  let forgeTokenFacet: ForgeTokenFacet;
  // let forgeVrfFacet: ForgeVRFFacet;
  let aavegotchiFacet: AavegotchiFacet;
  let wearablesFacet: WearablesFacet;
  let collateralFacet: CollateralFacet;
  let itemsFacet: ItemsFacet;
  let aavegotchiDaoFacet: DAOFacet;
  let lendingFacet: GotchiLendingFacet;
  let lendingGetSetFacet: LendingGetterAndSetterFacet;
  let gltrContract: IERC20;

  // let hardhatVrfCoordinatorV2Mock;

  before(async function () {
    await upgradeForgeDiamondForPet();

    forgeDiamondAddress = maticForgeDiamond;

    forgeFacet = (await ethers.getContractAt(
      "contracts/Aavegotchi/ForgeDiamond/facets/ForgeFacet.sol:ForgeFacet",
      forgeDiamondAddress
    )) as ForgeFacet;

    forgeFacet = await impersonate(
      // maticDiamondUpgrader,
      itemManagerAlt,
      forgeFacet,
      ethers,
      network
    );

    forgeDaoFacet = (await ethers.getContractAt(
      "contracts/Aavegotchi/ForgeDiamond/facets/ForgeDAOFacet.sol:ForgeDAOFacet",
      forgeDiamondAddress
    )) as ForgeDAOFacet;
    forgeTokenFacet = (await ethers.getContractAt(
      "contracts/Aavegotchi/ForgeDiamond/facets/ForgeTokenFacet.sol:ForgeTokenFacet",
      forgeDiamondAddress
    )) as ForgeTokenFacet;
    // forgeVrfFacet = (await ethers.getContractAt(
    //     "contracts/Aavegotchi/ForgeDiamond/facets/ForgeVRFFacet.sol:ForgeVRFFacet",
    //     forgeDiamondAddress
    // )) as ForgeVRFFacet;
    aavegotchiFacet = (await ethers.getContractAt(
      "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
      maticDiamondAddress
    )) as AavegotchiFacet;
    wearablesFacet = (await ethers.getContractAt(
      "contracts/Aavegotchi/WearableDiamond/facets/WearablesFacet.sol:WearablesFacet",
      WEARABLE_DIAMOND
    )) as WearablesFacet;
    collateralFacet = (await ethers.getContractAt(
      "contracts/Aavegotchi/facets/CollateralFacet.sol:CollateralFacet",
      maticDiamondAddress
    )) as CollateralFacet;
    itemsFacet = (await ethers.getContractAt(
      "contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet",
      maticDiamondAddress
    )) as ItemsFacet;
    aavegotchiDaoFacet = (await ethers.getContractAt(
      "contracts/Aavegotchi/facets/DAOFacet.sol:DAOFacet",
      maticDiamondAddress
    )) as DAOFacet;
    lendingFacet = (await ethers.getContractAt(
      "contracts/Aavegotchi/facets/GotchiLendingFacet.sol:GotchiLendingFacet",
      maticDiamondAddress
    )) as GotchiLendingFacet;
    lendingGetSetFacet = (await ethers.getContractAt(
      "contracts/Aavegotchi/facets/LendingGetterAndSetterFacet.sol:LendingGetterAndSetterFacet",
      maticDiamondAddress
    )) as LendingGetterAndSetterFacet;
    gltrContract = (await ethers.getContractAt(
      "contracts/shared/interfaces/IERC20.sol:IERC20",
      GLTR
    )) as IERC20;

    // let aavegotchiOwner = "0x585E06CA576D0565a035301819FD2cfD7104c1E8"
    // let impOwner: DAOFacet = await impersonate(aavegotchiOwner, aavegotchiDaoFacet, ethers, network)
    // await impOwner.setForge(forgeDiamondAddress);

    // approve for test user
    let imp: WearablesFacet = await impersonate(
      testUser,
      wearablesFacet,
      ethers,
      network
    );
    await imp.setApprovalForAll(forgeDiamondAddress, true);

    let impTestGltr: IERC20 = await impersonate(
      testUser,
      gltrContract,
      ethers,
      network
    );
    await impTestGltr.approve(
      forgeDiamondAddress,
      "999999999999999999999999999999999"
    );
  });

  describe("smelt/forge", async function () {
    it("should smelt and return correct core", async function () {
      let items = [244, 157, 66, 67, 205, 155]; // rare V-Neck, uncommon Goatee, common visor, common hat, common Mug, myth rofl
      let gotchis = [7735, 7735, 7735, 7735, 7735, 7735];
      let priorBalances = [
        Number(await forgeTokenFacet.balanceOf(testUser, CORE_BODY_RARE)),
        Number(await forgeTokenFacet.balanceOf(testUser, CORE_FACE_UNCOMMON)),
        Number(await forgeTokenFacet.balanceOf(testUser, CORE_EYES_COMMON)),
        Number(await forgeTokenFacet.balanceOf(testUser, CORE_HEAD_COMMON)),
        Number(await forgeTokenFacet.balanceOf(testUser, CORE_HANDS_COMMON)),
        Number(await forgeTokenFacet.balanceOf(testUser, CORE_PET_MYTHICAL)),
      ];

      let imp = await impersonate(testUser, forgeFacet, ethers, network);

      await imp.smeltWearables(items, gotchis);

      expect(
        await forgeTokenFacet.balanceOf(testUser, CORE_BODY_RARE)
      ).to.be.equal(priorBalances[0] + 1);
      expect(
        await forgeTokenFacet.balanceOf(testUser, CORE_FACE_UNCOMMON)
      ).to.be.equal(priorBalances[1] + 1);
      expect(
        await forgeTokenFacet.balanceOf(testUser, CORE_EYES_COMMON)
      ).to.be.equal(priorBalances[2] + 1);
      expect(
        await forgeTokenFacet.balanceOf(testUser, CORE_HEAD_COMMON)
      ).to.be.equal(priorBalances[3] + 1);
      expect(
        await forgeTokenFacet.balanceOf(testUser, CORE_HANDS_COMMON)
      ).to.be.equal(priorBalances[4] + 1);
      expect(
        await forgeTokenFacet.balanceOf(testUser, CORE_PET_MYTHICAL)
      ).to.be.equal(priorBalances[5] + 1);
    });

    it("should forge each slot type", async function () {
      let items = [366, 368, 367, 363, 369, 361]; // body, face, eyes, head, hand, pet
      let gotchis = [7735, 7735, 7735, 7735, 7735, 7735];
      let rsms = [50, 50, 50, 20, 50, 10];
      let gltr = [
        await forgeFacet.forgeTime(7735, 50),
        await forgeFacet.forgeTime(7735, 50),
        await forgeFacet.forgeTime(7735, 50),
        await forgeFacet.forgeTime(7735, 25),
        await forgeFacet.forgeTime(7735, 50),
        await forgeFacet.forgeTime(7735, 10),
      ];

      // mint test user all necessary items
      await forgeFacet.adminMint(testUser, ALLOY, 999999999999999);
      await forgeFacet.adminMint(testUser, ESSENCE, 999999999999999);

      // 366 - godlike body
      await forgeFacet.adminMint(testUser, 366, 1);
      await forgeFacet.adminMint(testUser, CORE_BODY_GODLIKE, 1);

      // 368 - godlike face
      await forgeFacet.adminMint(testUser, 368, 1);
      await forgeFacet.adminMint(testUser, CORE_FACE_GODLIKE, 1);

      // 367 - godlike eyes
      await forgeFacet.adminMint(testUser, 367, 1);
      await forgeFacet.adminMint(testUser, CORE_EYES_GODLIKE, 1);

      // 363 - myth head
      await forgeFacet.adminMint(testUser, 363, 1);
      await forgeFacet.adminMint(testUser, CORE_HEAD_MYTHICAL, 1);

      // 369 - godlike hand
      await forgeFacet.adminMint(testUser, 369, 1);
      await forgeFacet.adminMint(testUser, CORE_HANDS_GODLIKE, 1);

      // 361 - leg pet
      await forgeFacet.adminMint(testUser, 361, 1);
      await forgeFacet.adminMint(testUser, CORE_PET_LEGENDARY, 1);

      let imp = await impersonate(testUser, forgeFacet, ethers, network);

      for (let i = 0; i < items.length; i++) {
        let gltrAmt = await forgeFacet.forgeTime(7735, rsms[i]);
        let gltrBal = await gltrContract.balanceOf(testUser);

        // console.log("gltrAmt", gltrAmt);
        // console.log("gltrBal", ethers.utils.formatEther(gltrBal.toString()));

        await expect(
          imp.forgeWearables([items[i]], [gotchis[i]], [gltrAmt])
        ).to.emit(forgeFacet, "ForgeTimeReduced");
        // console.log("passing ", i);
      }
    });

    it("should fix invalid IDs", async function () {
      const user1 = "0x478fa4C971a077038B4Fc5C172c3Af5552224ccc";
      const user2 = "0x7D9fb540504D8F277099472b89113485F712c546";
      const user3 = "0x221fb400C8E70472F95ad3dF5456A57a21b54Bf3";
      const user4 = "0x4177a5c0E2369F6830A4c3825aFc8fB3Dd47790D";
      // const user5 = "0x7D9fb540504D8F277099472b89113485F712c546"; //duplicate

      const users = [user1, user2, user3, user4];
      let priorBalances = [];

      for (let i = 0; i < users.length; i++) {
        priorBalances.push([
          Number(await forgeTokenFacet.balanceOf(users[i], 1000000044)) +
            Number(await forgeTokenFacet.balanceOf(users[i], CORE_PET_COMMON)),
          Number(await forgeTokenFacet.balanceOf(users[i], 1000000045)) +
            Number(
              await forgeTokenFacet.balanceOf(users[i], CORE_PET_UNCOMMON)
            ),
          Number(await forgeTokenFacet.balanceOf(users[i], 1000000046)) +
            Number(await forgeTokenFacet.balanceOf(users[i], CORE_PET_RARE)),
          Number(await forgeTokenFacet.balanceOf(users[i], 1000000047)) +
            Number(
              await forgeTokenFacet.balanceOf(users[i], CORE_PET_LEGENDARY)
            ),
          Number(await forgeTokenFacet.balanceOf(users[i], 1000000048)) +
            Number(
              await forgeTokenFacet.balanceOf(users[i], CORE_PET_MYTHICAL)
            ),
          Number(await forgeTokenFacet.balanceOf(users[i], 1000000049)) +
            Number(await forgeTokenFacet.balanceOf(users[i], CORE_PET_GODLIKE)),
        ]);
      }

      await forgeFacet.fixInvalidTokenIds(users);

      for (let i = 0; i < users.length; i++) {
        expect(
          await forgeTokenFacet.balanceOf(users[i], CORE_PET_COMMON)
        ).to.be.equal(priorBalances[i][0]);

        expect(
          await forgeTokenFacet.balanceOf(users[i], CORE_PET_UNCOMMON)
        ).to.be.equal(priorBalances[i][1]);

        expect(
          await forgeTokenFacet.balanceOf(users[i], CORE_PET_RARE)
        ).to.be.equal(priorBalances[i][2]);

        expect(
          await forgeTokenFacet.balanceOf(users[i], CORE_PET_LEGENDARY)
        ).to.be.equal(priorBalances[i][3]);

        expect(
          await forgeTokenFacet.balanceOf(users[i], CORE_PET_MYTHICAL)
        ).to.be.equal(priorBalances[i][4]);

        expect(
          await forgeTokenFacet.balanceOf(users[i], CORE_PET_GODLIKE)
        ).to.be.equal(priorBalances[i][5]);
      }
    });
  });
});
