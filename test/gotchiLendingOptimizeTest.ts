/* global describe it before ethers network */
/* eslint prefer-const: "off" */

//@ts-ignore
import { ethers, network } from "hardhat";
import chai from "chai";
import { upgrade } from "../scripts/upgrades/upgrade-gotchiLendingOptimize";
import { impersonate } from "../scripts/helperFunctions";
import {
  AavegotchiFacet,
  AavegotchiGameFacet,
  GotchiLendingFacet,
  WhitelistFacet,
} from "../typechain";
import { BigNumberish } from "ethers";

const { expect } = chai;

describe("Testing Aavegotchi Lending", async function () {
  this.timeout(300000);

  const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
  const borrowerAddress = "0xb4473cfEeDC9a0E94612c6ce883677b63f830DB8"; // borrower should be GHST holder
  const thirdParty = "0x382038b034fa8Ea64C74C81d680669bDaC4D0636";
  const originalPetOperator = "0x4E59235b35d504D1372ABf67a835031F98114d64"; // original pet operator should be MATIC holder
  const gotchiHolder = "0x8FEebfA4aC7AF314d90a0c17C3F91C800cFdE44B";
  const gameManager = "0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119";
  const linkiest = "0xaCC227235cCAb6C058B76600D4EC2e86072d0813";
  const diamondOwner = "0x35FE3dF776474a7B24B3B1EC6e745a830FdAd351";
  const tokens = [
    "0x403E967b044d4Be25170310157cB1A4Bf10bdD0f",
    "0x44A6e0BE76e1D9620A7F76588e4509fE4fa8E8C8",
    "0x6a3E7C3c6EF65Ee26975b12293cA1AAD7e1dAeD2",
    "0x42E5E06EF5b90Fe15F853F59299Fc96259209c5C",
    "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7",
    "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
  ];
  const lockedAavegotchiId = 16911;
  let lendingFacetWithBorrower: GotchiLendingFacet;
  let lendingFacetWithGotchiOwner: GotchiLendingFacet;
  let lendingFacetWithGameManager: GotchiLendingFacet;
  let lendingFacetWithSirLinkiest: GotchiLendingFacet;
  let lendingFacetWithDiamondOwner: GotchiLendingFacet;
  let whitelistFacetWithOwner: WhitelistFacet;
  let aavegotchiFacet: AavegotchiFacet;
  let aavegotchiGameFacet: AavegotchiGameFacet;
  let aavegotchiOwnerAddress: any;
  let whitelistId: any;

  before(async function () {
    await upgrade();

    const gotchiLendingFacet = (await ethers.getContractAt(
      "GotchiLendingFacet",
      diamondAddress
    )) as GotchiLendingFacet;
    const whitelistFacet = (await ethers.getContractAt(
      "WhitelistFacet",
      diamondAddress
    )) as WhitelistFacet;
    aavegotchiFacet = (await ethers.getContractAt(
      "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
      diamondAddress
    )) as AavegotchiFacet;
    aavegotchiGameFacet = (await ethers.getContractAt(
      "AavegotchiGameFacet",
      diamondAddress
    )) as AavegotchiGameFacet;

    aavegotchiOwnerAddress = await aavegotchiFacet.ownerOf(lockedAavegotchiId);

    lendingFacetWithDiamondOwner = await impersonate(
      diamondOwner,
      gotchiLendingFacet,
      ethers,
      network
    );
    lendingFacetWithBorrower = await impersonate(
      borrowerAddress,
      gotchiLendingFacet,
      ethers,
      network
    );
    lendingFacetWithGotchiOwner = await impersonate(
      gotchiHolder,
      gotchiLendingFacet,
      ethers,
      network
    );
    lendingFacetWithGameManager = await impersonate(
      gameManager,
      gotchiLendingFacet,
      ethers,
      network
    );
    lendingFacetWithSirLinkiest = await impersonate(
      linkiest,
      gotchiLendingFacet,
      ethers,
      network
    );
    whitelistFacetWithOwner = await impersonate(
      aavegotchiOwnerAddress,
      whitelistFacet,
      ethers,
      network
    );
    aavegotchiFacet = await impersonate(
      borrowerAddress,
      aavegotchiFacet,
      ethers,
      network
    );
    aavegotchiGameFacet = await impersonate(
      originalPetOperator,
      aavegotchiGameFacet,
      ethers,
      network
    );
  });

  describe("Testing lending and whitelist", async () => {
    it("Should be able to add revenue tokens to a revenue token whitelist", async () => {
      // Already allowed in upgrade script
      for (let i = 0; i < tokens.length; i++) {
        expect(
          await lendingFacetWithDiamondOwner.revenueTokenAllowed(tokens[i])
        ).to.be.true;
      }
    });
    it("Should not be able to add revenue tokens to a revenue token whitelist if not owner", async () => {
      await expect(
        lendingFacetWithBorrower.allowRevenueTokens([diamondOwner])
      ).to.be.revertedWith("LibDiamond: Must be contract owner");
    });
    it("Should be able to remove revenue tokens from a revenue token whitelist", async () => {
      await lendingFacetWithDiamondOwner.disallowRevenueTokens(tokens);
      for (let i = 0; i < tokens.length; i++) {
        expect(
          await lendingFacetWithDiamondOwner.revenueTokenAllowed(tokens[i])
        ).to.be.false;
      }
    });
    it("Should not be able to remove revenue tokens from a revenue token whitelist if not owner", async () => {
      await expect(
        lendingFacetWithBorrower.disallowRevenueTokens([diamondOwner])
      ).to.be.revertedWith("LibDiamond: Must be contract owner");
    });
    it("Should be able to list a gotchi if a revenue token is whitelisted", async () => {
      await lendingFacetWithDiamondOwner.allowRevenueTokens(tokens);
      await lendingFacetWithGotchiOwner.addGotchiLending(
        11939,
        0,
        2591000,
        [50, 50, 0],
        gotchiHolder,
        ethers.constants.AddressZero,
        0,
        tokens
      );
      expect(
        await lendingFacetWithGotchiOwner.getGotchiLendingIdByToken(11939)
      ).to.be.gt(0);
    });
    it("Should not be able to list a gotchi if a revenue token is not whitelisted", async () => {
      await lendingFacetWithDiamondOwner.disallowRevenueTokens(tokens);
      await expect(
        lendingFacetWithGotchiOwner.addGotchiLending(
          22003,
          0,
          1,
          [50, 50, 0],
          gotchiHolder,
          ethers.constants.AddressZero,
          0,
          tokens
        )
      ).to.be.revertedWith("GotchiLending: Invalid revenue token address");
    });
    it("Diamond owner should be able to change revenue tokens of a listing", async () => {
      await lendingFacetWithGameManager.emergencyChangeRevenueTokens(
        [11939],
        [diamondOwner]
      );
      const lendingInfo =
        await lendingFacetWithGotchiOwner.getLendingListingInfo(11939);
      expect(lendingInfo.revenueTokens).to.be.deep.equal([diamondOwner]);
    });
    it("Nobody but the diamond owner should be able to change revenue tokens of a listing", async () => {
      await expect(
        lendingFacetWithBorrower.emergencyChangeRevenueTokens(
          [11939],
          [diamondOwner]
        )
      ).to.be.revertedWith("LibAppStorage: Do not have access");
    });
    it("Should be able to transfer ownership of a whitelist", async () => {
      await whitelistFacetWithOwner.createWhitelist("yore mum", [thirdParty]);
      whitelistId = await whitelistFacetWithOwner.getWhitelistsLength();
      await whitelistFacetWithOwner.transferOwnershipOfWhitelist(
        whitelistId,
        ethers.constants.AddressZero
      );
      expect(
        await whitelistFacetWithOwner.whitelistOwner(whitelistId)
      ).to.equal(ethers.constants.AddressZero);
    });
    it("Should not be able to transfer ownership of a whitelist if not the owner", async () => {
      await expect(
        whitelistFacetWithOwner.transferOwnershipOfWhitelist(
          1,
          ethers.constants.AddressZero
        )
      ).to.be.revertedWith("WhitelistFacet: Not whitelist owner");
    });
    it("Shouldn't be able to list with a period of more than 30 days", async () => {
      await expect(
        lendingFacetWithGotchiOwner.addGotchiLending(
          22003,
          0,
          2_600_000,
          [50, 50, 0],
          gotchiHolder,
          ethers.constants.AddressZero,
          0,
          []
        )
      ).to.be.revertedWith("GotchiLending: Period too long");
    });
    it("Setup for next tests", async () => {
      let lendingIds: [BigNumberish, BigNumberish] = [
        await lendingFacetWithGotchiOwner.getGotchiLendingIdByToken(11939),
        await lendingFacetWithGotchiOwner.getGotchiLendingIdByToken(22003),
      ];
      await lendingFacetWithBorrower.agreeGotchiLending(
        lendingIds[0],
        11939,
        0,
        2591000,
        [50, 50, 0]
      );
    });
    it("Lender cannot end the term early", async () => {
      await expect(
        lendingFacetWithGotchiOwner.claimAndEndGotchiLending(11939)
      ).to.be.revertedWith("GotchiLending: Not allowed during agreement");
    });
    it("Borrower should be able to end lending early", async () => {
      await lendingFacetWithBorrower.claimAndEndGotchiLending(11939);
      expect(await lendingFacetWithBorrower.isAavegotchiLent(22003)).to.be
        .false;
    });
    it("Lender should be able to end a long existing borrow early", async () => {
      await network.provider.send("evm_increaseTime", [2592000]);
      await network.provider.send("evm_mine");
      await lendingFacetWithSirLinkiest.claimAndEndGotchiLending(13835);
      expect(await lendingFacetWithSirLinkiest.isAavegotchiLent(13835)).to.be
        .false;
    });
  });
});
