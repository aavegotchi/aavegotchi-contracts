/* global describe it before ethers network */
/* eslint prefer-const: "off" */

//@ts-ignore
import { ethers, network } from "hardhat";
import chai from "chai";
import { upgrade } from "../scripts/upgrades/upgrade-gotchiLendingFacet";
import { impersonate } from "../scripts/helperFunctions";
import {
  AavegotchiFacet,
  AavegotchiGameFacet,
  GotchiLendingFacet,
  ERC20Token,
  ERC721MarketplaceFacet,
  WhitelistFacet,
} from "../typechain";
import { BigNumberish } from "ethers";

const { expect } = chai;

//Best used with block 26256003, before Gotchi Lending went live

describe("Testing Aavegotchi Lending", async function () {
  this.timeout(300000);

  const listedFilter = ethers.utils.formatBytes32String("listed");
  const agreedFilter = ethers.utils.formatBytes32String("agreed");
  const ghstAddress = "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7";

  const collateral = "0x8df3aad3a84da6b69a4da8aec3ea40d9091b2ac4";

  const revenueTokens: string[] = [ghstAddress, collateral];
  const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
  const claimerAddress = "0x3507e4978e0eb83315d20df86ca0b976c0e40ccb";
  const borrowerAddress = "0xb4473cfEeDC9a0E94612c6ce883677b63f830DB8"; // borrower should be GHST holder
  const nonGhstHolderAddress = "0x725Fe4790fC6435B5161f88636C2A50e43247A4b"; // GHST holder balance should be 0
  const nonWhitelistedAddress = "0xaA3B1fDC3Aa57Bf24418E397f8c80e7385aAa594"; // non-whitelisted address should be GHST holder
  const ghstHolderAddress = "0x3721546e51258065bfdb9746b2e442c7671b0298";
  const thirdParty = "0x382038b034fa8Ea64C74C81d680669bDaC4D0636";
  const originalPetOperator = "0x4E59235b35d504D1372ABf67a835031F98114d64"; // original pet operator should be MATIC holder
  const lockedPortalId = 0;
  const lockedAavegotchiId = 16911;
  const unlockedAavegotchiId = 15589;
  const initialCost = ethers.utils.parseUnits("1", "ether");
  const period = 10 * 86400; // 10 days
  const revenueSplitWithoutThirdParty: [
    BigNumberish,
    BigNumberish,
    BigNumberish
  ] = [50, 50, 0];
  const revenueSplitForThirdParty: [BigNumberish, BigNumberish, BigNumberish] =
    [25, 50, 25];
  let lendingFacetWithOwner: GotchiLendingFacet;
  let lendingFacetWithBorrower: GotchiLendingFacet;
  let lendingFacetWithClaimer: GotchiLendingFacet;
  let lendingFacetWithPortalOwner: GotchiLendingFacet;
  let whitelistFacetWithOwner: WhitelistFacet;
  let whitelistFacetWithPortalOwner: WhitelistFacet;
  let aavegotchiFacet: AavegotchiFacet;
  let erc721MarketplaceFacet: ERC721MarketplaceFacet;
  let aavegotchiGameFacet: AavegotchiGameFacet;
  let ghstERC20: ERC20Token;
  let aavegotchiOwnerAddress: any;
  let escrowAddress: any;
  let firstListingId: any;
  let secondListingId: any;
  let fourthListingId: any;
  let whitelistId: any;
  let secondWhitelistId: any;

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
    erc721MarketplaceFacet = (await ethers.getContractAt(
      "ERC721MarketplaceFacet",
      diamondAddress
    )) as ERC721MarketplaceFacet;
    aavegotchiGameFacet = (await ethers.getContractAt(
      "AavegotchiGameFacet",
      diamondAddress
    )) as AavegotchiGameFacet;

    ghstERC20 = (await ethers.getContractAt(
      "ERC20Token",
      ghstAddress
    )) as ERC20Token;

    // This is needed for impersonating owner of test aavegotchi
    aavegotchiOwnerAddress = await aavegotchiFacet.ownerOf(lockedAavegotchiId);
    const portalOwnerAddress = await aavegotchiFacet.ownerOf(lockedPortalId);

    // set pet operator
    aavegotchiFacet = await impersonate(
      aavegotchiOwnerAddress,
      aavegotchiFacet,
      ethers,
      network
    );

    //@ts-ignore
    await aavegotchiFacet.setPetOperatorForAll(originalPetOperator, true);

    // set approval
    await (
      await aavegotchiFacet.setApprovalForAll(diamondAddress, true)
    ).wait();

    const aavegotchiFacetWithPortalOwner = await impersonate(
      portalOwnerAddress,
      aavegotchiFacet,
      ethers,
      network
    );
    await (
      await aavegotchiFacetWithPortalOwner.setApprovalForAll(
        diamondAddress,
        true
      )
    ).wait();

    // Impersonating facets for test
    lendingFacetWithOwner = await impersonate(
      aavegotchiOwnerAddress,
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
    lendingFacetWithClaimer = await impersonate(
      claimerAddress,
      gotchiLendingFacet,
      ethers,
      network
    );
    lendingFacetWithPortalOwner = await impersonate(
      portalOwnerAddress,
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
    whitelistFacetWithPortalOwner = await impersonate(
      portalOwnerAddress,
      whitelistFacet,
      ethers,
      network
    );
    erc721MarketplaceFacet = await impersonate(
      portalOwnerAddress,
      erc721MarketplaceFacet,
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
    ghstERC20 = await impersonate(
      ghstHolderAddress,
      ghstERC20,
      ethers,
      network
    );
  });

  describe("Testing createWhitelist", async function () {
    it("Should revert if whitelist is empty", async function () {
      await expect(
        whitelistFacetWithOwner.createWhitelist("", [])
      ).to.be.revertedWith(
        "WhitelistFacet: Whitelist length should be larger than zero"
      );
    });
    // it("Should revert if whitelist length exceeds limit", async function () {
    //   const whitelistLargerThanLimit = Array(101).fill(borrowerAddress);
    //   await expect(whitelistFacetWithOwner.createWhitelist('', whitelistLargerThanLimit)).to.be.revertedWith("WhitelistFacet: Whitelist length exceeds limit");
    // });
    // it("Should revert if whitelist contains address-zero", async function () {
    //   await expect(whitelistFacetWithOwner.createWhitelist([borrowerAddress, ethers.constants.AddressZero])).to.be.revertedWith("WhitelistFacet: There's invalid address in the list");
    // });
    it("Should succeed if whitelist is valid", async function () {
      const receipt = await (
        await whitelistFacetWithOwner.createWhitelist("", [borrowerAddress])
      ).wait();
      const event = receipt!.events!.find(
        (event) => event.event === "WhitelistCreated"
      );
      whitelistId = event!.args!.whitelistId;
      expect(whitelistId).to.equal(1);
    });
  });

  describe("Testing updateWhitelist", async function () {
    it("Should revert if invalid whitelist id", async function () {
      await expect(
        whitelistFacetWithOwner.updateWhitelist(whitelistId + 1, [])
      ).to.be.revertedWith("WhitelistFacet: Whitelist not found");
    });
    it("Should revert if invalid whitelist id", async function () {
      const receipt = await (
        await whitelistFacetWithPortalOwner.createWhitelist("", [
          nonWhitelistedAddress,
        ])
      ).wait();
      const event = receipt!.events!.find(
        (event) => event.event === "WhitelistCreated"
      );
      secondWhitelistId = event!.args!.whitelistId;
      await expect(
        whitelistFacetWithOwner.updateWhitelist(secondWhitelistId, [])
      ).to.be.revertedWith("WhitelistFacet: Not whitelist owner");
    });
    it("Should revert if whitelist is empty", async function () {
      await expect(
        whitelistFacetWithOwner.updateWhitelist(whitelistId, [])
      ).to.be.revertedWith(
        "WhitelistFacet: Whitelist length should be larger than zero"
      );
    });
    // it("Should revert if whitelist length exceeds limit", async function () {
    //   const whitelistLargerThanLimit = Array(100).fill(borrowerAddress);
    //   await expect(whitelistFacetWithOwner.updateWhitelist(whitelistId, whitelistLargerThanLimit)).to.be.revertedWith("WhitelistFacet: Whitelist length exceeds limit");
    // });
    // it("Should revert if whitelist contains address-zero", async function () {
    //   await expect(whitelistFacetWithOwner.updateWhitelist(whitelistId, [nonGhstHolderAddress, ethers.constants.AddressZero])).to.be.revertedWith("WhitelistFacet: There's invalid address in the list");
    // });
    it("Should succeed if all parameters are valid", async function () {
      const receipt = await (
        await whitelistFacetWithOwner.updateWhitelist(whitelistId, [
          nonGhstHolderAddress,
          borrowerAddress,
        ])
      ).wait();
      const event = receipt!.events!.find(
        (event) => event.event === "WhitelistUpdated"
      );
      expect(event!.args!.whitelistId).to.equal(whitelistId);
    });
  });

  describe("Testing getWhitelist", async function () {
    it("Should revert if invalid whitelist id", async function () {
      await expect(
        whitelistFacetWithOwner.getWhitelist(secondWhitelistId + 1)
      ).to.be.revertedWith("WhitelistFacet: Whitelist not found");
    });
    it("Should return array if valid whitelist id", async function () {
      const whitelist = await whitelistFacetWithOwner.getWhitelist(whitelistId);
      expect(whitelist.owner).to.equal(aavegotchiOwnerAddress);
      expect(whitelist.addresses.length).to.equal(2);
      expect(whitelist.addresses[0]).to.equal(borrowerAddress);
    });
  });

  describe("Testing getWhitelists", async function () {
    it("Should return array", async function () {
      const whitelists = await whitelistFacetWithOwner.getWhitelists();
      expect(whitelists.length).to.equal(2);
      expect(whitelists[0].owner).to.equal(aavegotchiOwnerAddress);
      expect(whitelists[0].addresses.length).to.equal(2);
      expect(whitelists[0].addresses[0]).to.equal(borrowerAddress);
      expect(whitelists[1].addresses.length).to.equal(1);
      expect(whitelists[1].addresses[0]).to.equal(nonWhitelistedAddress);
    });
  });

  describe("Testing remove from whitelist", async () => {
    it("Should remove elements from whitelist", async () => {
      let addresses: string[] = [];
      for (let i = 0; i < 10; i++) {
        addresses.push(
          ethers.utils.computeAddress(
            ethers.utils.keccak256(ethers.utils.hexlify(i))
          )
        );
      }
      await whitelistFacetWithOwner.createWhitelist("OMEGALUL", addresses);
      let whitelists = await whitelistFacetWithOwner.getWhitelists();
      expect(whitelists.length).to.equal(3);
      expect(whitelists[2].addresses.length).to.equal(10);

      await whitelistFacetWithOwner.removeAddressesFromWhitelist(
        whitelists.length,
        [addresses[0], addresses[5], addresses[9]]
      );

      whitelists = await whitelistFacetWithOwner.getWhitelists();
      expect(whitelists.length).to.equal(3);
      expect(whitelists[2].addresses.length).to.equal(7);

      for (let i = 1; i < 9; i++) {
        expect(whitelists[2].addresses).to.include(addresses[i]);
        expect(
          await whitelistFacetWithOwner.isWhitelisted(
            whitelists.length,
            addresses[i]
          )
        ).to.be.gt(0);
        if (i == 4) i++;
      }
      expect(
        await whitelistFacetWithOwner.isWhitelisted(
          whitelists.length,
          addresses[0]
        )
      ).to.be.eq(0);
      expect(
        await whitelistFacetWithOwner.isWhitelisted(
          whitelists.length,
          addresses[5]
        )
      ).to.be.eq(0);
      expect(
        await whitelistFacetWithOwner.isWhitelisted(
          whitelists.length,
          addresses[9]
        )
      ).to.be.eq(0);

      // REMOVE THEM ALLLLLL
      await whitelistFacetWithOwner.removeAddressesFromWhitelist(
        whitelists.length,
        addresses
      );
      whitelists = await whitelistFacetWithOwner.getWhitelists();
      expect(whitelists.length).to.equal(3);
      expect(whitelists[2].addresses.length).to.equal(0);
      for (let i = 0; i < 10; i++) {
        expect(
          await whitelistFacetWithOwner.isWhitelisted(
            whitelists.length,
            addresses[i]
          )
        ).to.be.eq(0);
      }
    });
  });

  describe("Testing addGotchiLending", async function () {
    it("Should revert if non-owner try to add", async function () {
      await expect(
        lendingFacetWithBorrower.addGotchiLending(
          unlockedAavegotchiId,
          initialCost,
          period,
          revenueSplitWithoutThirdParty,
          aavegotchiOwnerAddress,
          ethers.constants.AddressZero,
          whitelistId,
          []
        )
      ).to.be.revertedWith(
        "LibAppStorage: Only aavegotchi owner can call this function"
      );
    });
    it("Should revert if period is zero", async function () {
      await expect(
        lendingFacetWithOwner.addGotchiLending(
          unlockedAavegotchiId,
          initialCost,
          0,
          revenueSplitWithoutThirdParty,
          aavegotchiOwnerAddress,
          ethers.constants.AddressZero,
          whitelistId,
          []
        )
      ).to.be.revertedWith("GotchiLending: Period should be larger than 0");
    });
    it("Should revert if sum of revenue split values is invalid", async function () {
      const invalidRevenueSplit: [BigNumberish, BigNumberish, BigNumberish] = [
        10, 50, 0,
      ];
      await expect(
        lendingFacetWithOwner.addGotchiLending(
          unlockedAavegotchiId,
          initialCost,
          period,
          invalidRevenueSplit,
          aavegotchiOwnerAddress,
          ethers.constants.AddressZero,
          whitelistId,
          []
        )
      ).to.be.revertedWith("GotchiLending: Sum of revenue split should be 100");
    });
    it("Should revert if revenue split values is invalid when thirdParty exist", async function () {
      await expect(
        lendingFacetWithOwner.addGotchiLending(
          unlockedAavegotchiId,
          initialCost,
          period,
          revenueSplitForThirdParty,
          aavegotchiOwnerAddress,
          ethers.constants.AddressZero,
          whitelistId,
          []
        )
      ).to.be.revertedWith(
        "GotchiLending: Revenue split for invalid thirdParty should be zero"
      );
    });
    it("Should revert if whitelist id is invalid", async function () {
      await expect(
        lendingFacetWithOwner.addGotchiLending(
          unlockedAavegotchiId,
          initialCost,
          period,
          revenueSplitWithoutThirdParty,
          aavegotchiOwnerAddress,
          ethers.constants.AddressZero,
          whitelistId + 10,
          []
        )
      ).to.be.revertedWith("GotchiLending: Whitelist not found");
    });
    it("Should revert if try to add lending for not aavegotchi", async function () {
      await (
        await erc721MarketplaceFacet.cancelERC721ListingByToken(
          diamondAddress,
          lockedPortalId
        )
      ).wait();

      await expect(
        lendingFacetWithPortalOwner.addGotchiLending(
          lockedPortalId,
          initialCost,
          period,
          revenueSplitWithoutThirdParty,
          aavegotchiOwnerAddress,
          ethers.constants.AddressZero,
          secondWhitelistId,
          []
        )
      ).to.be.revertedWith("GotchiLending: Can only lend Aavegotchi");
    });
    describe("If there's no lending for the aavegotchi", async function () {
      it("Should revert if aavegotchi is locked", async function () {
        await expect(
          lendingFacetWithOwner.addGotchiLending(
            lockedAavegotchiId,
            initialCost,
            period,
            revenueSplitWithoutThirdParty,
            aavegotchiOwnerAddress,
            ethers.constants.AddressZero,
            whitelistId,
            []
          )
        ).to.be.revertedWith(
          "GotchiLending: Only callable on unlocked Aavegotchis"
        );
      });
      it("Should succeed if all parameters are valid", async function () {
        const receipt = await (
          await lendingFacetWithOwner.addGotchiLending(
            unlockedAavegotchiId,
            initialCost,
            period,
            revenueSplitWithoutThirdParty,
            aavegotchiOwnerAddress,
            ethers.constants.AddressZero,
            0,
            []
          )
        ).wait();
        const event = receipt!.events!.find(
          (event: any) => event.event === "GotchiLendingAdd"
        );
        firstListingId = event!.args!.listingId;
        // expect(event!.args!.lender).to.equal(aavegotchiOwnerAddress);
        // expect(event!.args!.erc721TokenId).to.equal(unlockedAavegotchiId);
        // expect(event!.args!.initialCost).to.equal(initialCost);
        // expect(event!.args!.period).to.equal(period);
      });
    });
    describe("If there's already lending for the aavegotchi", async function () {
      it("Should succeed and if all parameters are valid", async function () {
        const receipt = await (
          await lendingFacetWithOwner.addGotchiLending(
            unlockedAavegotchiId,
            initialCost,
            period,
            revenueSplitWithoutThirdParty,
            aavegotchiOwnerAddress,
            ethers.constants.AddressZero,
            whitelistId,
            []
          )
        ).wait();
        const event = receipt!.events!.find(
          (event: any) => event.event === "GotchiLendingAdd"
        );
        secondListingId = event!.args!.listingId;
        // expect(event!.args!.lender).to.equal(aavegotchiOwnerAddress);
        // expect(event!.args!.erc721TokenId).to.equal(unlockedAavegotchiId);
        // expect(event!.args!.initialCost).to.equal(initialCost);
        // expect(event!.args!.period).to.equal(period);
      });
    });
  });

  describe("Testing getGotchiLending", async function () {
    it("Should revert when try to get lending with wrong id", async function () {
      await expect(
        lendingFacetWithOwner.getLendingListingInfo(secondListingId + 10)
      ).to.be.revertedWith("GotchiLending: Listing does not exist");
    });
    it("Should fetch lending data with correct lending id", async function () {
      const lending = await lendingFacetWithOwner.getLendingListingInfo(
        firstListingId
      );
      expect(lending.listingId).to.equal(firstListingId);
      expect(lending.lender).to.equal(aavegotchiOwnerAddress);
      expect(lending.erc721TokenId).to.equal(unlockedAavegotchiId);
      expect(lending.completed).to.equal(false);
    });
  });

  describe("Testing getGotchiLendingInfo", async function () {
    it("Should revert when try to get lending with wrong id", async function () {
      await expect(
        lendingFacetWithOwner.getGotchiLendingListingInfo(secondListingId + 10)
      ).to.be.revertedWith("GotchiLending: Listing does not exist");
    });
    it("Should fetch lending data with correct lending id", async function () {
      const lendingInfo =
        await lendingFacetWithOwner.getGotchiLendingListingInfo(firstListingId);
      expect(lendingInfo[0].listingId).to.equal(firstListingId);
      expect(lendingInfo[0].lender).to.equal(aavegotchiOwnerAddress);
      expect(lendingInfo[0].erc721TokenId).to.equal(unlockedAavegotchiId);
      expect(lendingInfo[0].completed).to.equal(false);
      expect(lendingInfo[1].tokenId).to.equal(unlockedAavegotchiId);
      expect(lendingInfo[1].owner).to.equal(aavegotchiOwnerAddress);
      expect(lendingInfo[1].locked).to.equal(true);
    });
  });

  describe("Testing getGotchiLendingFromToken", async function () {
    it("Should revert when try to get lending with wrong aavegotchi id", async function () {
      await expect(
        lendingFacetWithOwner.getGotchiLendingFromToken(lockedAavegotchiId)
      ).to.be.revertedWith("GotchiLending: Listing doesn't exist");
    });
    it("Should fetch lending data with correct aavegotchi id", async function () {
      const lending = await lendingFacetWithOwner.getGotchiLendingFromToken(
        unlockedAavegotchiId
      );
      expect(lending.listingId).to.equal(secondListingId);
      expect(lending.lender).to.equal(aavegotchiOwnerAddress);
      expect(lending.erc721TokenId).to.equal(unlockedAavegotchiId);
      expect(lending.completed).to.equal(false);
    });
  });

  describe("Testing getOwnerGotchiLendings and getGotchiLendings after aavegotchi lending added", async function () {
    it("Should fetch lending list", async function () {
      let lendings = await lendingFacetWithOwner.getGotchiLendings(
        listedFilter,
        5
      );
      expect(lendings[0].listingId).to.equal(secondListingId);
      lendings = await lendingFacetWithOwner.getOwnerGotchiLendings(
        aavegotchiOwnerAddress,
        listedFilter,
        5
      );
      expect(lendings[0].listingId).to.equal(secondListingId);
      lendings = await lendingFacetWithOwner.getOwnerGotchiLendings(
        thirdParty,
        listedFilter,
        5
      );
      expect(lendings.length).to.equal(0);
    });
  });

  describe("Testing isAavegotchiLent before and after aavegotchi lending added", async function () {
    it("Should return false if aavegotchi is not lent", async function () {
      const status = await lendingFacetWithOwner.isAavegotchiLent(
        lockedAavegotchiId
      );
      expect(status).to.equal(false);
    });
    it("Should return true if aavegotchi lending is not agreed yet", async function () {
      const status = await lendingFacetWithOwner.isAavegotchiLent(
        unlockedAavegotchiId
      );
      expect(status).to.equal(false);
    });
  });

  describe("Testing cancelGotchiLending", async function () {
    it("Should revert when try to cancel lending with wrong id", async function () {
      await expect(
        lendingFacetWithOwner.cancelGotchiLending(secondListingId + 10)
      ).to.be.revertedWith("GotchiLending: Listing not found");
    });
    it("Should revert when try to cancel lending with non lender", async function () {
      await expect(
        lendingFacetWithClaimer.cancelGotchiLending(secondListingId)
      ).to.be.revertedWith("GotchiLending: Not lender");
    });
    it("Should succeed, but no event when try to cancel canceled lending", async function () {
      const receipt = await (
        await lendingFacetWithOwner.cancelGotchiLending(firstListingId)
      ).wait();
      expect(receipt!.events!.length).to.equal(0);
    });
    it("Should succeed if cancel valid lending", async function () {
      let lending = await lendingFacetWithOwner.getLendingListingInfo(
        secondListingId
      );
      expect(lending.canceled).to.equal(false);
      await (
        await lendingFacetWithOwner.cancelGotchiLending(secondListingId)
      ).wait();
      lending = await lendingFacetWithOwner.getLendingListingInfo(
        secondListingId
      );
      expect(lending.canceled).to.equal(true);
    });
  });

  describe("Testing getOwnerGotchiLendings and getGotchiLendings after canceled", async function () {
    it("Should fetch lending list", async function () {
      let lendings = await lendingFacetWithOwner.getGotchiLendings(
        listedFilter,
        5
      );
      expect(lendings.length).to.equal(0);
      lendings = await lendingFacetWithOwner.getOwnerGotchiLendings(
        aavegotchiOwnerAddress,
        listedFilter,
        5
      );
      expect(lendings.length).to.equal(0);
      lendings = await lendingFacetWithOwner.getOwnerGotchiLendings(
        thirdParty,
        listedFilter,
        5
      );
      expect(lendings.length).to.equal(0);
    });
  });

  describe("Testing cancelGotchiLendingByToken", async function () {
    before(async function () {
      await (
        await lendingFacetWithOwner.addGotchiLending(
          unlockedAavegotchiId,
          initialCost,
          period,
          revenueSplitWithoutThirdParty,
          aavegotchiOwnerAddress,
          ethers.constants.AddressZero,
          whitelistId,
          []
        )
      ).wait();
    });
    it("Should revert when try to cancel lending with wrong aavegotchi id", async function () {
      await expect(
        lendingFacetWithOwner.cancelGotchiLendingByToken(lockedAavegotchiId)
      ).to.be.revertedWith("GotchiLending: Listing not found");
    });
    it("Should revert when try to cancel lending with non lender", async function () {
      await expect(
        lendingFacetWithClaimer.cancelGotchiLendingByToken(unlockedAavegotchiId)
      ).to.be.revertedWith("GotchiLending: Not lender");
    });
    it("Should succeed if cancel lending with valid aavegotchi id", async function () {
      let lending = await lendingFacetWithOwner.getGotchiLendingFromToken(
        unlockedAavegotchiId
      );
      expect(lending.canceled).to.equal(false);
      await (
        await lendingFacetWithOwner.cancelGotchiLendingByToken(
          unlockedAavegotchiId
        )
      ).wait();
      await expect(
        lendingFacetWithOwner.getGotchiLendingFromToken(unlockedAavegotchiId)
      ).to.be.revertedWith("GotchiLending: Listing doesn't exist");
    });
    it("isAavegotchiLent function should return true if aavegotchi lending is canceld", async function () {
      const status = await lendingFacetWithOwner.isAavegotchiLent(
        unlockedAavegotchiId
      );
      expect(status).to.equal(false);
    });
  });

  describe("Testing agreeGotchiLending", async function () {
    before(async function () {
      const receipt = await (
        await lendingFacetWithOwner.addGotchiLending(
          unlockedAavegotchiId,
          initialCost,
          period,
          revenueSplitForThirdParty,
          aavegotchiOwnerAddress,
          thirdParty,
          whitelistId,
          revenueTokens
        )
      ).wait();
      const event = receipt!.events!.find(
        (event: any) => event.event === "GotchiLendingAdd"
      );
      fourthListingId = event!.args!.listingId;
    });
    it("Should revert when try to agree lending with wrong lending id", async function () {
      await expect(
        lendingFacetWithBorrower.agreeGotchiLending(
          fourthListingId + 10,
          unlockedAavegotchiId,
          initialCost,
          period,
          revenueSplitForThirdParty
        )
      ).to.be.revertedWith("GotchiLending: Listing not found");
    });
    it("Should revert when try to agree canceled lending", async function () {
      await expect(
        lendingFacetWithBorrower.agreeGotchiLending(
          secondListingId,
          unlockedAavegotchiId,
          initialCost,
          period,
          revenueSplitForThirdParty
        )
      ).to.be.revertedWith("GotchiLending: Listing canceled");
    });
    it("Should revert when try to agree lending with wrong token id", async function () {
      await expect(
        lendingFacetWithBorrower.agreeGotchiLending(
          fourthListingId,
          lockedAavegotchiId,
          initialCost,
          period,
          revenueSplitForThirdParty
        )
      ).to.be.revertedWith("GotchiLending: Invalid token id");
    });
    it("Should revert when try to agree lending with wrong initial cost", async function () {
      await expect(
        lendingFacetWithBorrower.agreeGotchiLending(
          fourthListingId,
          unlockedAavegotchiId,
          ethers.utils.parseUnits("1.1", "ether"),
          period,
          revenueSplitForThirdParty
        )
      ).to.be.revertedWith("GotchiLending: Invalid initial cost");
    });
    it("Should revert when try to agree lending with wrong lending period", async function () {
      await expect(
        lendingFacetWithBorrower.agreeGotchiLending(
          fourthListingId,
          unlockedAavegotchiId,
          initialCost,
          period + 1,
          revenueSplitForThirdParty
        )
      ).to.be.revertedWith("GotchiLending: Invalid lending period");
    });
    it("Should revert when try to agree lending with wrong revenue split", async function () {
      await expect(
        lendingFacetWithBorrower.agreeGotchiLending(
          fourthListingId,
          unlockedAavegotchiId,
          initialCost,
          period,
          revenueSplitWithoutThirdParty
        )
      ).to.be.revertedWith("GotchiLending: Invalid revenue split");
    });
    it("Should revert when try to agree lending with lender", async function () {
      await expect(
        lendingFacetWithOwner.agreeGotchiLending(
          fourthListingId,
          unlockedAavegotchiId,
          initialCost,
          period,
          revenueSplitForThirdParty
        )
      ).to.be.revertedWith("GotchiLending: Borrower can't be lender");
    });
    it("Should revert when non whitelisted account try to agree lending", async function () {
      const lendingFacetWithNonWhitelisted = await impersonate(
        nonWhitelistedAddress,
        lendingFacetWithOwner,
        ethers,
        network
      );
      await expect(
        lendingFacetWithNonWhitelisted.agreeGotchiLending(
          fourthListingId,
          unlockedAavegotchiId,
          initialCost,
          period,
          revenueSplitForThirdParty
        )
      ).to.be.revertedWith("GotchiLending: Not whitelisted address");
    });
    it("Should revert when non GHST holder try to agree lending whose initial cost is not zero", async function () {
      const lendingFacetWithNonGhstHolder = await impersonate(
        nonGhstHolderAddress,
        lendingFacetWithOwner,
        ethers,
        network
      );
      await expect(
        lendingFacetWithNonGhstHolder.agreeGotchiLending(
          fourthListingId,
          unlockedAavegotchiId,
          initialCost,
          period,
          revenueSplitForThirdParty
        )
      ).to.be.revertedWith("GotchiLending: Not enough GHST");
    });
    it("Should succeed when agree lending with valid data", async function () {
      const borrowerOldBalance = await ghstERC20.balanceOf(borrowerAddress);
      const lenderOldBalance = await ghstERC20.balanceOf(
        aavegotchiOwnerAddress
      );
      const ghstERC20WithBorrower = await impersonate(
        borrowerAddress,
        ghstERC20,
        ethers,
        network
      );
      await ghstERC20WithBorrower.approve(diamondAddress, initialCost);
      const receipt = await (
        await lendingFacetWithBorrower.agreeGotchiLending(
          fourthListingId,
          unlockedAavegotchiId,
          initialCost,
          period,
          revenueSplitForThirdParty
        )
      ).wait();
      // const event = receipt!.events!.find(
      //   (event) => event.event === "GotchiLendingExecute"
      // );
      // expect(event!.args!.borrower).to.equal(borrowerAddress);
      const borrowerNewBalance = await ghstERC20.balanceOf(borrowerAddress);
      const lenderNewBalance = await ghstERC20.balanceOf(
        aavegotchiOwnerAddress
      );

      // Check ghst balance changes
      expect(borrowerOldBalance.sub(borrowerNewBalance)).to.equal(initialCost);
      expect(lenderNewBalance.sub(lenderOldBalance)).to.equal(initialCost);

      // Check lending and aavegotchi status
      const lendingInfo =
        await lendingFacetWithBorrower.getGotchiLendingListingInfo(
          fourthListingId
        );
      expect(lendingInfo[0].listingId).to.equal(fourthListingId);
      expect(lendingInfo[0].lender).to.equal(aavegotchiOwnerAddress);
      expect(lendingInfo[0].erc721TokenId).to.equal(unlockedAavegotchiId);
      expect(lendingInfo[0].completed).to.equal(false);
      expect(lendingInfo[0].timeAgreed > 0).to.equal(true);
      expect(lendingInfo[1].tokenId).to.equal(unlockedAavegotchiId);
      expect(lendingInfo[1].owner).to.equal(borrowerAddress);
      expect(lendingInfo[1].locked).to.equal(true);
      escrowAddress = lendingInfo[1].escrow;
    });
    it("Should revert when try to agree agreed lending", async function () {
      await expect(
        lendingFacetWithBorrower.agreeGotchiLending(
          fourthListingId,
          unlockedAavegotchiId,
          initialCost,
          period,
          revenueSplitForThirdParty
        )
      ).to.be.revertedWith("GotchiLending: Listing already agreed");
    });
    it("isAavegotchiLent function should return true if aavegotchi lending is agreed", async function () {
      const status = await lendingFacetWithOwner.isAavegotchiLent(
        unlockedAavegotchiId
      );
      expect(status).to.equal(true);
    });

    describe("Testing getOwnerGotchiLendings and getGotchiLendings after agree", async function () {
      it("Should fetch lending list", async function () {
        let lendings = await lendingFacetWithOwner.getGotchiLendings(
          listedFilter,
          5
        );
        expect(lendings.length).to.equal(0);
        lendings = await lendingFacetWithOwner.getGotchiLendings(
          agreedFilter,
          5
        );
        expect(lendings.length).to.equal(1);
        lendings = await lendingFacetWithOwner.getOwnerGotchiLendings(
          aavegotchiOwnerAddress,
          listedFilter,
          5
        );
        expect(lendings.length).to.equal(0);
        lendings = await lendingFacetWithOwner.getOwnerGotchiLendings(
          escrowAddress,
          listedFilter,
          5
        );
        expect(lendings.length).to.equal(0);
        lendings = await lendingFacetWithOwner.getOwnerGotchiLendings(
          aavegotchiOwnerAddress,
          agreedFilter,
          5
        );
        expect(lendings.length).to.equal(1);
        lendings = await lendingFacetWithOwner.getOwnerGotchiLendings(
          escrowAddress,
          agreedFilter,
          5
        );
        expect(lendings.length).to.equal(0);
      });
    });
  });

  describe("Testing other functions during agreement", async function () {
    it("Should revert when try to send aavegotchi in lending", async function () {
      await expect(
        aavegotchiFacet.transferFrom(
          borrowerAddress,
          aavegotchiOwnerAddress,
          unlockedAavegotchiId
        )
      ).to.be.revertedWith("GotchiLending: Aavegotchi is in lending");
    });
    it("Should allow original pet operators interact during the agreement", async function () {
      const receipt = await (
        await aavegotchiGameFacet.interact([unlockedAavegotchiId])
      ).wait();
      expect(receipt.status).to.equal(1);
    });
  });

  describe("Testing claimGotchiLending and claimAndEndGotchiLending", async function () {
    it("Should revert when try to claim lending with non lender during agreement", async function () {
      await expect(
        lendingFacetWithClaimer.claimGotchiLending(unlockedAavegotchiId)
      ).to.be.revertedWith("GotchiLending: Only lender or borrower can claim");
    });
    it("Should revert when try to end lending with non lender or non borrower", async function () {
      await expect(
        lendingFacetWithClaimer.claimAndEndGotchiLending(unlockedAavegotchiId)
      ).to.be.revertedWith(
        "GotchiLending: Only lender or borrower can claim and end agreement"
      );
    });
    it("Should revert when try to end lending with lender or borrower during agreement", async function () {
      await expect(
        lendingFacetWithOwner.claimAndEndGotchiLending(unlockedAavegotchiId)
      ).to.be.revertedWith("GotchiLending: Not allowed during agreement");
    });
    it("Should succeed when claim lending with lender during agreement", async function () {
      // Impersonate revenue
      await (
        await ghstERC20.transfer(
          escrowAddress,
          ethers.utils.parseUnits("100", "ether")
        )
      ).wait();

      const revenue = await ghstERC20.balanceOf(escrowAddress);
      const borrowerOldBalance = await ghstERC20.balanceOf(borrowerAddress);
      const lenderOldBalance = await ghstERC20.balanceOf(
        aavegotchiOwnerAddress
      );
      const thirdPartyOldBalance = await ghstERC20.balanceOf(thirdParty);
      await (
        await lendingFacetWithOwner.claimGotchiLending(unlockedAavegotchiId)
      ).wait();
      const escrowNewBalance = await ghstERC20.balanceOf(escrowAddress);
      const borrowerNewBalance = await ghstERC20.balanceOf(borrowerAddress);
      const lenderNewBalance = await ghstERC20.balanceOf(
        aavegotchiOwnerAddress
      );
      const thirdPartyNewBalance = await ghstERC20.balanceOf(thirdParty);

      // Check ghst balance changes
      expect(escrowNewBalance).to.equal(0);
      expect(lenderNewBalance.sub(lenderOldBalance)).to.equal(
        revenue.mul(revenueSplitForThirdParty[0]).div(100)
      );
      expect(borrowerNewBalance.sub(borrowerOldBalance)).to.equal(
        revenue.mul(revenueSplitForThirdParty[1]).div(100)
      );
      expect(thirdPartyNewBalance.sub(thirdPartyOldBalance)).to.equal(
        revenue.mul(revenueSplitForThirdParty[2]).div(100)
      );

      // Check lending and aavegotchi status
      const lendingInfo =
        await lendingFacetWithBorrower.getGotchiLendingListingInfo(
          fourthListingId
        );
      expect(lendingInfo[0].listingId).to.equal(fourthListingId);
      expect(lendingInfo[0].lender).to.equal(aavegotchiOwnerAddress);
      expect(lendingInfo[0].erc721TokenId).to.equal(unlockedAavegotchiId);
      expect(lendingInfo[0].completed).to.equal(false);
      expect(lendingInfo[0].timeAgreed > 0).to.equal(true);
      expect(lendingInfo[0].lastClaimed > 0).to.equal(true);
      expect(lendingInfo[1].tokenId).to.equal(unlockedAavegotchiId);
      expect(lendingInfo[1].owner).to.equal(borrowerAddress);
      expect(lendingInfo[1].locked).to.equal(true);
    });
    it("Should revert when try to claim lending with non lender after agreement", async function () {
      // Simulate within 1 days after agreement
      await ethers.provider.send("evm_increaseTime", [period]);
      await ethers.provider.send("evm_mine", []);

      await expect(
        lendingFacetWithClaimer.claimGotchiLending(unlockedAavegotchiId)
      ).to.be.revertedWith("GotchiLending: Only lender or borrower can claim");
    });
    it("isAavegotchiLent function should return true if aavegotchi lending is not completed", async function () {
      const status = await lendingFacetWithOwner.isAavegotchiLent(
        unlockedAavegotchiId
      );
      expect(status).to.equal(true);
    });
    it("Should succeed when claim lending with lender after agreement", async function () {
      // Impersonate revenue
      await (
        await ghstERC20.transfer(
          escrowAddress,
          ethers.utils.parseUnits("100", "ether")
        )
      ).wait();

      const revenue = await ghstERC20.balanceOf(escrowAddress);
      const borrowerOldBalance = await ghstERC20.balanceOf(borrowerAddress);
      const lenderOldBalance = await ghstERC20.balanceOf(
        aavegotchiOwnerAddress
      );
      const thirdPartyOldBalance = await ghstERC20.balanceOf(thirdParty);
      await (
        await lendingFacetWithOwner.claimAndEndGotchiLending(
          unlockedAavegotchiId
        )
      ).wait();
      const escrowNewBalance = await ghstERC20.balanceOf(escrowAddress);
      const borrowerNewBalance = await ghstERC20.balanceOf(borrowerAddress);
      const lenderNewBalance = await ghstERC20.balanceOf(
        aavegotchiOwnerAddress
      );
      const thirdPartyNewBalance = await ghstERC20.balanceOf(thirdParty);

      // Check ghst balance changes
      expect(escrowNewBalance).to.equal(0);
      expect(lenderNewBalance.sub(lenderOldBalance)).to.equal(
        revenue.mul(revenueSplitForThirdParty[0]).div(100)
      );
      expect(borrowerNewBalance.sub(borrowerOldBalance)).to.equal(
        revenue.mul(revenueSplitForThirdParty[1]).div(100)
      );
      expect(thirdPartyNewBalance.sub(thirdPartyOldBalance)).to.equal(
        revenue.mul(revenueSplitForThirdParty[2]).div(100)
      );

      // Check lending and aavegotchi status
      const lendingInfo =
        await lendingFacetWithBorrower.getGotchiLendingListingInfo(
          fourthListingId
        );
      expect(lendingInfo[0].listingId).to.equal(fourthListingId);
      expect(lendingInfo[0].lender).to.equal(aavegotchiOwnerAddress);
      expect(lendingInfo[0].erc721TokenId).to.equal(unlockedAavegotchiId);
      expect(lendingInfo[0].completed).to.equal(true);
      expect(lendingInfo[0].timeAgreed > 0).to.equal(true);
      expect(lendingInfo[0].lastClaimed > 0).to.equal(true);
      expect(lendingInfo[1].tokenId).to.equal(unlockedAavegotchiId);
      expect(lendingInfo[1].owner).to.equal(aavegotchiOwnerAddress);
      expect(lendingInfo[1].locked).to.equal(false);
    });
    it("isAavegotchiLent function should return false if aavegotchi lending is completed", async function () {
      const status = await lendingFacetWithOwner.isAavegotchiLent(
        unlockedAavegotchiId
      );
      expect(status).to.equal(false);
    });
  });

  describe("Testing getOwnerGotchiLendings and getGotchiLendings after agreement is ended", async function () {
    it("Should fetch lending list", async function () {
      let lendings = await lendingFacetWithOwner.getGotchiLendings(
        listedFilter,
        5
      );
      expect(lendings.length).to.equal(0);
      lendings = await lendingFacetWithOwner.getGotchiLendings(agreedFilter, 5);
      expect(lendings.length).to.equal(0);
      lendings = await lendingFacetWithOwner.getOwnerGotchiLendings(
        aavegotchiOwnerAddress,
        listedFilter,
        5
      );
      expect(lendings.length).to.equal(0);
      lendings = await lendingFacetWithOwner.getOwnerGotchiLendings(
        escrowAddress,
        listedFilter,
        5
      );
      expect(lendings.length).to.equal(0);
      lendings = await lendingFacetWithOwner.getOwnerGotchiLendings(
        aavegotchiOwnerAddress,
        agreedFilter,
        5
      );
      expect(lendings.length).to.equal(0);
      lendings = await lendingFacetWithOwner.getOwnerGotchiLendings(
        escrowAddress,
        agreedFilter,
        5
      );
      expect(lendings.length).to.equal(0);
    });
  });

  describe("Testing include logic", async function () {
    let listingId;
    before(async function () {
      const receipt = await (
        await lendingFacetWithOwner.addGotchiLending(
          unlockedAavegotchiId,
          initialCost,
          period,
          revenueSplitForThirdParty,
          aavegotchiOwnerAddress,
          thirdParty,
          whitelistId,
          []
        )
      ).wait();
      const event = receipt!.events!.find(
        (event: any) => event.event === "GotchiLendingAdd"
      );
      listingId = event!.args!.listingId;
      const ghstERC20WithBorrower = await impersonate(
        borrowerAddress,
        ghstERC20,
        ethers,
        network
      );
      await ghstERC20WithBorrower.approve(diamondAddress, initialCost);
      await (
        await lendingFacetWithBorrower.agreeGotchiLending(
          listingId,
          unlockedAavegotchiId,
          initialCost,
          period,
          revenueSplitForThirdParty
        )
      ).wait();
    });
    it("Should not change excluded revenue tokens when claim", async function () {
      await ethers.provider.send("evm_increaseTime", [period]);
      await ethers.provider.send("evm_mine", []);

      // Impersonate revenue
      await (
        await ghstERC20.transfer(
          escrowAddress,
          ethers.utils.parseUnits("100", "ether")
        )
      ).wait();

      const revenue = await ghstERC20.balanceOf(escrowAddress);
      const borrowerOldBalance = await ghstERC20.balanceOf(borrowerAddress);
      const lenderOldBalance = await ghstERC20.balanceOf(
        aavegotchiOwnerAddress
      );
      const thirdPartyOldBalance = await ghstERC20.balanceOf(thirdParty);
      await (
        await lendingFacetWithOwner.claimAndEndGotchiLending(
          unlockedAavegotchiId
        )
      ).wait();
      const escrowNewBalance = await ghstERC20.balanceOf(escrowAddress);
      const borrowerNewBalance = await ghstERC20.balanceOf(borrowerAddress);
      const lenderNewBalance = await ghstERC20.balanceOf(
        aavegotchiOwnerAddress
      );
      const thirdPartyNewBalance = await ghstERC20.balanceOf(thirdParty);

      // Check ghst balance changed
      expect(escrowNewBalance).to.equal(revenue);
      expect(lenderNewBalance).to.equal(lenderOldBalance);
      expect(borrowerNewBalance).to.equal(borrowerOldBalance);
      expect(thirdPartyNewBalance).to.equal(thirdPartyOldBalance);
    });
  });

  describe("Testing logic for GotchiVault", async function () {
    let listingId;
    let mockOriginalOwner = "0x0E93AD7C720177d4E2c48465C83A50579Bd521C1";
    before(async function () {
      const receipt = await (
        await lendingFacetWithOwner.addGotchiLending(
          unlockedAavegotchiId,
          initialCost,
          period,
          revenueSplitForThirdParty,
          mockOriginalOwner,
          thirdParty,
          whitelistId,
          revenueTokens
        )
      ).wait();
      const event = receipt!.events!.find(
        (event: any) => event.event === "GotchiLendingAdd"
      );
      listingId = event!.args!.listingId;
      const ghstERC20WithBorrower = await impersonate(
        borrowerAddress,
        ghstERC20,
        ethers,
        network
      );
      await ghstERC20WithBorrower.approve(diamondAddress, initialCost);
      await (
        await lendingFacetWithBorrower.agreeGotchiLending(
          listingId,
          unlockedAavegotchiId,
          initialCost,
          period,
          revenueSplitForThirdParty
        )
      ).wait();
    });
    it("Balance of original owner should be changed, but no for lender when claim", async function () {
      // Impersonate revenue
      await (
        await ghstERC20.transfer(
          escrowAddress,
          ethers.utils.parseUnits("100", "ether")
        )
      ).wait();

      const revenue = await ghstERC20.balanceOf(escrowAddress);
      const borrowerOldBalance = await ghstERC20.balanceOf(borrowerAddress);
      const lenderOldBalance = await ghstERC20.balanceOf(
        aavegotchiOwnerAddress
      );
      const originalOwnerOldBalance = await ghstERC20.balanceOf(
        mockOriginalOwner
      );
      const thirdPartyOldBalance = await ghstERC20.balanceOf(thirdParty);
      await (
        await lendingFacetWithOwner.claimGotchiLending(unlockedAavegotchiId)
      ).wait();
      const escrowNewBalance = await ghstERC20.balanceOf(escrowAddress);
      const borrowerNewBalance = await ghstERC20.balanceOf(borrowerAddress);
      const lenderNewBalance = await ghstERC20.balanceOf(
        aavegotchiOwnerAddress
      );
      const originalOwnerNewBalance = await ghstERC20.balanceOf(
        mockOriginalOwner
      );
      const thirdPartyNewBalance = await ghstERC20.balanceOf(thirdParty);

      // Check ghst balance changed
      expect(escrowNewBalance).to.equal(0);
      expect(lenderNewBalance).to.equal(lenderOldBalance);
      expect(originalOwnerNewBalance.sub(originalOwnerOldBalance)).to.equal(
        revenue.mul(revenueSplitForThirdParty[0]).div(100)
      );
      expect(borrowerNewBalance.sub(borrowerOldBalance)).to.equal(
        revenue.mul(revenueSplitForThirdParty[1]).div(100)
      );
      expect(thirdPartyNewBalance.sub(thirdPartyOldBalance)).to.equal(
        revenue.mul(revenueSplitForThirdParty[2]).div(100)
      );
    });
  });
});
