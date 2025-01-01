/* global describe it before ethers network */
/* eslint prefer-const: "off" */

//@ts-ignore
import { ethers, network } from "hardhat";
import chai from "chai";
import { upgrade } from "../scripts/upgrades/upgrade-wearablesConfigFacet";
import { impersonate, resetChain } from "../scripts/helperFunctions";
import {
  AavegotchiFacet,
  WearablesConfigFacet,
  GotchiLendingFacet,
  LendingGetterAndSetterFacet,
} from "../typechain";
import * as helpers from "@nomicfoundation/hardhat-network-helpers";

const { expect } = chai;

describe("Testing Wearables Config", async function () {
  this.timeout(300000);

  const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d"; // polygon mainnet

  const slotPrice = ethers.utils.parseUnits("1", "ether");
  const wearablesToStore = [
    105, 209, 159, 104, 106, 65, 413, 210, 0, 0, 0, 0, 0, 0, 0, 0,
  ];
  const wearablesToStoreWithInvalidId = [
    418, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ];
  const wearablesToStoreWithInvalidSlot = [
    104, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ];
  const aavegotchiId = 4895;
  const rentedOutAavegotchiId = 9121;
  const unsummonedAavegotchiId = 945;
  const someoneElseAavegotchiId = 10356;

  let aavegotchiOwnerAddress: any;
  let anotherAavegotchiOwnerAddress: any;
  let daoAddress: any;
  let aavegotchiFacet: AavegotchiFacet;
  let lendingGetterFacet: LendingGetterAndSetterFacet;
  let aavegotchiFacetWithOwner: AavegotchiFacet;
  let wearablesConfigFacetWithOwner: WearablesConfigFacet;
  let wearablesConfigFacetWithOtherOwner: WearablesConfigFacet;
  let gotchiLendingFacetWithOwner: GotchiLendingFacet;
  let gotchiLendingFacetWithOtherOwner: GotchiLendingFacet;

  before(async function () {
    //await resetChain(hre);
    // workaround for issue https://github.com/NomicFoundation/hardhat/issues/5511
    await helpers.mine();

    await upgrade();

    aavegotchiFacet = (await ethers.getContractAt(
      "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
      diamondAddress,
    )) as AavegotchiFacet;

    lendingGetterFacet = await ethers.getContractAt(
      "LendingGetterAndSetterFacet",
      diamondAddress,
    );

    aavegotchiOwnerAddress = await aavegotchiFacet.ownerOf(aavegotchiId);
    anotherAavegotchiOwnerAddress = await aavegotchiFacet.ownerOf(someoneElseAavegotchiId);

    daoAddress = "0xb208f8BB431f580CC4b216826AFfB128cd1431aB";

    const gotchiLendingFacet = (await ethers.getContractAt(
      "GotchiLendingFacet",
      diamondAddress,
    )) as GotchiLendingFacet;

    const wearablesConfigFacet = (await ethers.getContractAt(
      "WearablesConfigFacet",
      diamondAddress,
    )) as WearablesConfigFacet;

    aavegotchiFacetWithOwner = await impersonate(
      anotherAavegotchiOwnerAddress,
      aavegotchiFacet,
      ethers,
      network,
    );

    wearablesConfigFacetWithOwner = await impersonate(
      aavegotchiOwnerAddress,
      wearablesConfigFacet,
      ethers,
      network,
    );

    wearablesConfigFacetWithOtherOwner = await impersonate(
      anotherAavegotchiOwnerAddress,
      wearablesConfigFacet,
      ethers,
      network,
    );

    gotchiLendingFacetWithOwner = await impersonate(
      aavegotchiOwnerAddress,
      gotchiLendingFacet,
      ethers,
      network,
    );

    gotchiLendingFacetWithOtherOwner = await impersonate(
      anotherAavegotchiOwnerAddress,
      gotchiLendingFacet,
      ethers,
      network,
    );
  });

  describe("Testing createWearablesConfig", async function () {
    it("Should revert if wearables list is invalid", async function () {
      const invalidWearables = new Array(16).fill(1);
      await expect(
        wearablesConfigFacetWithOwner.createWearablesConfig(
          aavegotchiId,
          "Test",
          invalidWearables,
        ),
      ).to.be.revertedWith("WearablesConfigFacet: Invalid wearables");
    });
    it("Should revert if wearablesConfig name is empty", async function () {
      await expect(
        wearablesConfigFacetWithOwner.createWearablesConfig(
          aavegotchiId,
          "",
          wearablesToStore,
        ),
      ).to.be.revertedWith(
        "WearablesConfigFacet: WearablesConfig name cannot be blank",
      );
    });
    it("Should succeed to create wearablesConfig if all parameters are valid and emit event", async function () {
      const receipt = await // config #1 (id: 0)
      (
        await wearablesConfigFacetWithOwner.createWearablesConfig(
          aavegotchiId,
          "Test",
          wearablesToStore,
        )
      ).wait();
      // check that event is emitted with the right parameters
      const event = receipt!.events!.find(
        (event) => event.event === "WearablesConfigCreated",
      );
      const owner = event!.args!.owner;
      const tokenId = event!.args!.tokenId;
      const wearablesConfigId = event!.args!.wearablesConfigId;
      const wearables = event!.args!.wearables;
      const value = event!.args!.value;
      expect(owner).to.equal(aavegotchiOwnerAddress);
      expect(tokenId).to.equal(aavegotchiId);
      expect(wearablesConfigId).to.equal(0);
      expect(wearables).to.eql(wearablesToStore);
      expect(value).to.equal(0);
    });
  });

  describe("Testing getWearablesConfigName", async function () {
    it("Should revert if invalid wearablesConfig id", async function () {
      await expect(
        wearablesConfigFacetWithOwner.getWearablesConfigName(
          aavegotchiOwnerAddress,
          aavegotchiId,
          99,
        ),
      ).to.be.revertedWith(
        "WearablesConfigFacet: invalid id, WearablesConfig not found",
      );
    });
    it("Should revert if invalid aavegotchi id for owner", async function () {
      await expect(
        wearablesConfigFacetWithOwner.getWearablesConfigName(
          aavegotchiOwnerAddress,
          someoneElseAavegotchiId,
          0,
        ),
      ).to.be.revertedWith(
        "WearablesConfigFacet: invalid id, WearablesConfig not found",
      );
    });
    it("Should return the name of a valid wearablesConfig id", async function () {
      expect(
        await wearablesConfigFacetWithOwner.getWearablesConfigName(
          aavegotchiOwnerAddress,
          aavegotchiId,
          0,
        ),
      ).to.equal("Test");
    });
  });

  describe("Testing getWearablesConfigWearables", async function () {
    it("Should revert if invalid wearablesConfig id", async function () {
      await expect(
        wearablesConfigFacetWithOwner.getWearablesConfigWearables(
          aavegotchiOwnerAddress,
          aavegotchiId,
          99,
        ),
      ).to.be.revertedWith(
        "WearablesConfigFacet: invalid id, WearablesConfig not found",
      );
    });
    it("Should revert if invalid aavegotchi id for owner", async function () {
      await expect(
        wearablesConfigFacetWithOwner.getWearablesConfigWearables(
          aavegotchiOwnerAddress,
          someoneElseAavegotchiId,
          0,
        ),
      ).to.be.revertedWith(
        "WearablesConfigFacet: invalid id, WearablesConfig not found",
      );
    });
    it("Should return the wearables array of a valid wearablesConfig id", async function () {
      expect(
        await wearablesConfigFacetWithOwner.getWearablesConfigWearables(
          aavegotchiOwnerAddress,
          aavegotchiId,
          0,
        ),
      ).to.eql(wearablesToStore);
    });
  });

  describe("Testing getWearablesConfig", async function () {
    it("Should revert if invalid wearablesConfig id", async function () {
      await expect(
        wearablesConfigFacetWithOwner.getWearablesConfig(
          aavegotchiOwnerAddress,
          aavegotchiId,
          99,
        ),
      ).to.be.revertedWith(
        "WearablesConfigFacet: invalid id, WearablesConfig not found",
      );
    });
    it("Should revert if invalid aavegotchi id for owner", async function () {
      await expect(
        wearablesConfigFacetWithOwner.getWearablesConfig(
          aavegotchiOwnerAddress,
          someoneElseAavegotchiId,
          0,
        ),
      ).to.be.revertedWith(
        "WearablesConfigFacet: invalid id, WearablesConfig not found",
      );
    });
    it("Should return name and wearables array if valid wearablesConfig id", async function () {
      const wearablesConfig =
        await wearablesConfigFacetWithOwner.getWearablesConfig(
          aavegotchiOwnerAddress,
          aavegotchiId,
          0,
        );
      expect(wearablesConfig.name).to.equal("Test");
      expect(wearablesConfig.wearables).to.eql(wearablesToStore);
    });
  });

  describe("Testing updateWearablesConfig", async function () {
    it("Should be able to update existing WearablesConfig and emit event if all parameters are valid", async function () {
      const newWearablesToStore = new Array(16).fill(0);
      const receipt = await (
        await wearablesConfigFacetWithOwner.updateWearablesConfig(
          aavegotchiId,
          0,
          "New Name",
          newWearablesToStore,
        )
      ).wait();
      // check that event is emitted with the right parameters
      const event = receipt!.events!.find(
        (event) => event.event === "WearablesConfigUpdated",
      );
      const owner = event!.args!.owner;
      const tokenId = event!.args!.tokenId;
      const wearablesConfigId = event!.args!.wearablesConfigId;
      const wearables = event!.args!.wearables;
      expect(owner).to.equal(aavegotchiOwnerAddress);
      expect(tokenId).to.equal(aavegotchiId);
      expect(wearablesConfigId).to.equal(0);
      expect(wearables).to.eql(newWearablesToStore);
      // check wearablesConfig name has been updated
      expect(
        await wearablesConfigFacetWithOwner.getWearablesConfigName(
          aavegotchiOwnerAddress,
          aavegotchiId,
          0,
        ),
      ).to.equal("New Name");
      // check wearablesConfig stored wearables have been updated
      expect(
        await wearablesConfigFacetWithOwner.getWearablesConfigWearables(
          aavegotchiOwnerAddress,
          aavegotchiId,
          0,
        ),
      ).to.eql(newWearablesToStore);
    });
    it("Should not update the name if the new name is empty", async function () {
      await wearablesConfigFacetWithOwner.updateWearablesConfig(
        aavegotchiId,
        0,
        "",
        wearablesToStore,
      );
      // check wearablesConfig name has been updated
      expect(
        await wearablesConfigFacetWithOwner.getWearablesConfigName(
          aavegotchiOwnerAddress,
          aavegotchiId,
          0,
        ),
      ).to.equal("New Name");
      // check wearablesConfig stored wearables have been updated
      expect(
        await wearablesConfigFacetWithOwner.getWearablesConfigWearables(
          aavegotchiOwnerAddress,
          aavegotchiId,
          0,
        ),
      ).to.eql(wearablesToStore);
    });
    it("Should revert if invalid wearablesConfig id", async function () {
      await expect(
        wearablesConfigFacetWithOwner.updateWearablesConfig(
          aavegotchiId,
          99,
          "Test",
          wearablesToStore,
        ),
      ).to.be.revertedWith(
        "WearablesConfigFacet: invalid id, WearablesConfig not found",
      );
    });
  });

  describe("Testing wearablesConfigExists", async function () {
    it("Should return true for valid wearablesConfig", async function () {
      expect(
        await wearablesConfigFacetWithOwner.wearablesConfigExists(
          aavegotchiOwnerAddress,
          aavegotchiId,
          0,
        ),
      ).to.be.true;
    });
    it("Should return false for invalid wearablesConfig", async function () {
      expect(
        await wearablesConfigFacetWithOwner.wearablesConfigExists(
          aavegotchiOwnerAddress,
          aavegotchiId,
          99,
        ),
      ).to.be.false;
    });
  });

  describe("Testing getAavegotchiWearablesConfigCount", async function () {
    it("Should return the right amount of wearablesConfig", async function () {
      expect(
        await wearablesConfigFacetWithOwner.getAavegotchiWearablesConfigCount(
          aavegotchiOwnerAddress,
          aavegotchiId,
        ),
      ).to.equal(1);
      // config #2 (id: 1)
      await wearablesConfigFacetWithOwner.createWearablesConfig(
        aavegotchiId,
        "Test",
        wearablesToStore,
      );
      expect(
        await wearablesConfigFacetWithOwner.getAavegotchiWearablesConfigCount(
          aavegotchiOwnerAddress,
          aavegotchiId,
        ),
      ).to.equal(2);
      expect(
        await wearablesConfigFacetWithOwner.getAavegotchiWearablesConfigCount(
          aavegotchiOwnerAddress,
          2499,
        ),
      ).to.equal(0);
    });
  });

  describe("Testing createWearablesConfig with payment", async function () {
    it("Should be able to create a 3rd for free", async function () {
      // config #3 (id: 2)
      await wearablesConfigFacetWithOwner.createWearablesConfig(
        aavegotchiId,
        "Test",
        wearablesToStore,
      );
      expect(
        await wearablesConfigFacetWithOwner.getAavegotchiWearablesConfigCount(
          aavegotchiOwnerAddress,
          aavegotchiId,
        ),
      ).to.equal(3);
    });
    it("Should not be able to create a 4th for free", async function () {
      await expect(
        wearablesConfigFacetWithOwner.createWearablesConfig(
          aavegotchiId,
          "Test 4th",
          wearablesToStore,
        ),
      ).to.be.revertedWith("WearablesConfigFacet: Incorrect GHST value sent");
    });
    it("Should not be able to create a 4th for more than 1 GHST", async function () {
      await expect(
        wearablesConfigFacetWithOwner.createWearablesConfig(
          aavegotchiId,
          "Test 4th",
          wearablesToStore,
          { value: ethers.utils.parseEther("10") },
        ),
      ).to.be.revertedWith("WearablesConfigFacet: Incorrect GHST value sent");
    });
    it("Should be able to pay for the 4th (with event emitted)", async function () {
      const daoBalanceBefore = await ethers.provider.getBalance(daoAddress);
      const receipt = await // config #4 (id: 3)
      (
        await wearablesConfigFacetWithOwner.createWearablesConfig(
          aavegotchiId,
          "Test 4th",
          wearablesToStore,
          { value: ethers.utils.parseEther("1") },
        )
      ).wait();
      // check that event is emitted with the right parameters
      const event = receipt!.events!.find(
        (event) => event.event === "WearablesConfigDaoPaymentReceived",
      );
      const owner = event!.args!.owner;
      const tokenId = event!.args!.tokenId;
      const wearablesConfigId = event!.args!.wearablesConfigId;
      const value = event!.args!.value;
      expect(owner).to.equal(aavegotchiOwnerAddress);
      expect(tokenId).to.equal(aavegotchiId);
      expect(wearablesConfigId).to.equal(3);
      expect(value).to.equal(ethers.utils.parseEther("1"));
      // compare balance before and after for dao address
      const daoBalanceAfter = await ethers.provider.getBalance(daoAddress);
      expect(daoBalanceAfter).to.equal(
        daoBalanceBefore.add(ethers.utils.parseEther("1")),
      );
      expect(
        await wearablesConfigFacetWithOwner.getWearablesConfigName(
          aavegotchiOwnerAddress,
          aavegotchiId,
          3,
        ),
      ).to.equal("Test 4th");
    });
  });
  describe("Testing for rented gotchis", async function () {

    it("Should be able to save for a rented gotchi", async function () {

      // create a listing rent a gotchi
      const revenueSplit = [100, 0, 0] as [
        BigNumberish,
        BigNumberish,
        BigNumberish
      ];
      await gotchiLendingFacetWithOwner.addGotchiListing({
        tokenId: aavegotchiId,
        initialCost: 0,
        period: 86400,
        revenueSplit: revenueSplit,
        originalOwner: aavegotchiOwnerAddress,
        thirdParty: ethers.constants.AddressZero,
        whitelistId: 0,
        revenueTokens: [],
        permissions: 0,
      });

      const listing = await lendingGetterFacet.getGotchiLendingFromToken(
        aavegotchiId
      );

      await gotchiLendingFacetWithOtherOwner.agreeGotchiLending(
        listing.listingId,
        aavegotchiId,
        0,
        86400,
        revenueSplit,
      );

      const lending = await lendingGetterFacet.getGotchiLendingFromToken(
        aavegotchiId
      );
      expect(lending.borrower).to.equal(anotherAavegotchiOwnerAddress);

      // config #5 (id: 4)
      await wearablesConfigFacetWithOtherOwner.createWearablesConfig(aavegotchiId, "Test Rental", wearablesToStore, { value: ethers.utils.parseEther("1") })
      expect(
        await wearablesConfigFacetWithOwner.getWearablesConfigName(anotherAavegotchiOwnerAddress, aavegotchiId, 0)
      ).to.equal("Test Rental");
    });
    it("Should be able to update for a rented gotchi", async function () {
      const newWearablesToStore = new Array(16).fill(0);
      await wearablesConfigFacetWithOtherOwner.updateWearablesConfig(aavegotchiId, 0, "Test Update Rental", newWearablesToStore)
      expect(
        await wearablesConfigFacetWithOwner.getWearablesConfigName(anotherAavegotchiOwnerAddress, aavegotchiId, 0)
      ).to.equal("Test Update Rental");
      expect(
        await wearablesConfigFacetWithOwner.getWearablesConfigWearables(anotherAavegotchiOwnerAddress, aavegotchiId, 0)
      ).to.eql(newWearablesToStore);
    });
    it("Should have to pay a fee on create for rented out gotchi", async function () {
      const owner = await aavegotchiFacet.ownerOf(rentedOutAavegotchiId);
      const ownerBalanceBefore = await ethers.provider.getBalance(owner);
      await wearablesConfigFacetWithOwner.createWearablesConfig(
        rentedOutAavegotchiId,
        "Test Rented Out",
        wearablesToStore,
        { value: ethers.utils.parseEther("0.1") }
      );
      const ownerBalanceAfter = await ethers.provider.getBalance(owner);
      expect(ownerBalanceAfter).to.equal(
        ownerBalanceBefore.add(ethers.utils.parseEther("0.1")),
      );
      expect(
        await wearablesConfigFacetWithOwner.getWearablesConfigName(
          owner,
          rentedOutAavegotchiId,
          0,
        ),
      ).to.equal("Test Rented Out");
    });
  });
  describe("Testing for other owners gotchis", async function () {
    it("Should have to pay a fee for a gotchi not owned (create)", async function () {
      const owner = await aavegotchiFacet.ownerOf(someoneElseAavegotchiId);
      const ownerBalanceBefore = await ethers.provider.getBalance(owner);
      // alt config #1 (id: 0)
      await wearablesConfigFacetWithOwner.createWearablesConfig(
        someoneElseAavegotchiId,
        "Test Create for Aavegotchi not Owned",
        wearablesToStore,
        { value: ethers.utils.parseEther("0.1") },
      );
      const ownerBalanceAfter = await ethers.provider.getBalance(owner);
      expect(ownerBalanceAfter).to.equal(
        ownerBalanceBefore.add(ethers.utils.parseEther("0.1")),
      );
      expect(
        await wearablesConfigFacetWithOwner.getWearablesConfigName(
          owner,
          someoneElseAavegotchiId,
          0,
        ),
      ).to.equal("Test Create for Aavegotchi not Owned");
    });
    it("Should have to pay a fee in addition of the slot for a gotchi not owned (create)", async function () {
      const owner = await aavegotchiFacet.ownerOf(someoneElseAavegotchiId);
      const ownerBalanceBefore = await ethers.provider.getBalance(owner);
      const daoBalanceBefore = await ethers.provider.getBalance(daoAddress);
      // alt config #2 (id: 1)
      await wearablesConfigFacetWithOwner.createWearablesConfig(
        someoneElseAavegotchiId,
        "Test Create for Aavegotchi not Owned",
        wearablesToStore,
        { value: ethers.utils.parseEther("0.1") },
      );
      // alt config #3 (id: 2)
      await wearablesConfigFacetWithOwner.createWearablesConfig(
        someoneElseAavegotchiId,
        "Test Create for Aavegotchi not Owned",
        wearablesToStore,
        { value: ethers.utils.parseEther("0.1") },
      );
      // alt config #4 (id: 3)
      await wearablesConfigFacetWithOwner.createWearablesConfig(
        someoneElseAavegotchiId,
        "Test Create for Aavegotchi not Owned",
        wearablesToStore,
        { value: ethers.utils.parseEther("1.1") },
      );
      const ownerBalanceAfter = await ethers.provider.getBalance(owner);
      expect(ownerBalanceAfter).to.equal(
        ownerBalanceBefore.add(ethers.utils.parseEther("0.3")),
      );
      const daoBalanceAfter = await ethers.provider.getBalance(daoAddress);
      expect(daoBalanceAfter).to.equal(
        daoBalanceBefore.add(ethers.utils.parseEther("1")),
      );
    });
    it("Should revert for a gotchi not owned (update)", async function () {
      await expect(
        wearablesConfigFacetWithOwner.updateWearablesConfig(
          someoneElseAavegotchiId,
          0,
          "",
          wearablesToStore,
        ),
      ).to.be.revertedWith(
        "WearablesConfigFacet: Only the owner can update wearables config",
      );
    });
  });
  describe("Testing for invalid gotchis", async function () {
    it("Should revert for a portal", async function () {
      await expect(
        wearablesConfigFacetWithOwner.createWearablesConfig(
          unsummonedAavegotchiId,
          "Test Portal",
          wearablesToStore,
        ),
      ).to.be.revertedWith(
        "WearablesConfigFacet: Not allowed to create wearables config",
      );
    });
    it("Should revert for an invalid id (over max supply)", async function () {
      await expect(
        wearablesConfigFacetWithOwner.createWearablesConfig(
          25000,
          "Test Invalid Id",
          wearablesToStore,
        ),
      ).to.be.revertedWith(
        "LibWearablesConfig: Invalid tokenId for unbridged aavegotchi",
      );
    });
  });
  describe("Testing for invalid wearables", async function () {
    it("Should revert for an invalid wearable id (create)", async function () {
      await expect(
        wearablesConfigFacetWithOwner.createWearablesConfig(
          aavegotchiId,
          "Test Invalid Wearable Id",
          wearablesToStoreWithInvalidId,
          { value: ethers.utils.parseEther("1") },
        ),
      ).to.be.revertedWith("LibWearablesConfig: Item type does not exist");
    });
    it("Should revert for an invalid wearable id (update)", async function () {
      await expect(
        wearablesConfigFacetWithOwner.updateWearablesConfig(
          aavegotchiId,
          0,
          "",
          wearablesToStoreWithInvalidId,
        ),
      ).to.be.revertedWith("LibWearablesConfig: Item type does not exist");
    });
    it("Should revert for an invalid wearable slot (create)", async function () {
      await expect(
        wearablesConfigFacetWithOwner.createWearablesConfig(
          aavegotchiId,
          "Test Invalid Wearable Slot",
          wearablesToStoreWithInvalidSlot,
          { value: ethers.utils.parseEther("1") },
        ),
      ).to.be.revertedWith("WearablesConfigFacet: Invalid wearables");
    });
    it("Should revert for an invalid wearable slot (update)", async function () {
      await expect(
        wearablesConfigFacetWithOwner.updateWearablesConfig(
          aavegotchiId,
          0,
          "",
          wearablesToStoreWithInvalidSlot,
        ),
      ).to.be.revertedWith("WearablesConfigFacet: Invalid wearables");
    });
  });
});
