/* global describe it before ethers network */
/* eslint prefer-const: "off" */

//@ts-ignore
import { ethers, network } from "hardhat";
import chai from "chai";
import { upgrade } from "../scripts/upgrades/upgrade-aavegotchiLendingFacet";
import { impersonate } from "../scripts/helperFunctions";
import {
  AavegotchiFacet,
  AavegotchiGameFacet,
  AavegotchiLendingFacet,
  ERC20Token,
  ERC721MarketplaceFacet,
  WhitelistFacet
} from "../typechain";
import { BigNumberish } from "ethers";

const { expect } = chai;

describe("Testing Aavegotchi Lending", async function () {
  this.timeout(300000);

  const ghstAddress = "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7";
  const revenueTokens: string[] = [ghstAddress];
  const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
  const claimerAddress = "0x3507e4978e0eb83315d20df86ca0b976c0e40ccb";
  const renterAddress = "0x5A27DBBfF05F36DC927137855E3381f0c20C1CDd"; // renter should be GHST holder
  const nonGhstHolderAddress = "0x725Fe4790fC6435B5161f88636C2A50e43247A4b"; // GHST holder balance should be 0
  const nonWhitelistedAddress = "0xaA3B1fDC3Aa57Bf24418E397f8c80e7385aAa594"; // non-whitelisted address should be GHST holder
  const ghstHolderAddress = "0x3721546e51258065bfdb9746b2e442c7671b0298";
  const receiver = "0x382038b034fa8Ea64C74C81d680669bDaC4D0636";
  const originalPetOperator = "0x4E59235b35d504D1372ABf67a835031F98114d64"; // original pet operator should be MATIC holder
  const lockedPortalId = 0;
  const lockedAavegotchiId = 16911;
  const unlockedAavegotchiId = 15589;
  const amountPerDay = ethers.utils.parseUnits('1', 'ether');
  const period = 10;
  const revenueSplitWithoutReceiver: [BigNumberish, BigNumberish, BigNumberish] = [50, 50, 0];
  const revenueSplitForReceiver: [BigNumberish, BigNumberish, BigNumberish] = [25, 50, 25];
  let lendingFacetWithOwner: AavegotchiLendingFacet;
  let lendingFacetWithRenter: AavegotchiLendingFacet;
  let lendingFacetWithClaimer: AavegotchiLendingFacet;
  let lendingFacetWithPortalOwner: AavegotchiLendingFacet;
  let whitelistFacetWithOwner: WhitelistFacet;
  let whitelistFacetWithPortalOwner: WhitelistFacet;
  let aavegotchiFacet: AavegotchiFacet;
  let erc721MarketplaceFacet: ERC721MarketplaceFacet;
  let aavegotchiGameFacet: AavegotchiGameFacet;
  let ghstERC20: ERC20Token;
  let aavegotchiOwnerAddress: any;
  let escrowAddress: any;
  let firstRentalId: any;
  let secondRentalId: any;
  let fourthRentalId: any;
  let whitelistId: any;
  let secondWhitelistId: any;

  before(async function () {
    await upgrade();

    const aavegotchiLendingFacet = (await ethers.getContractAt(
      "AavegotchiLendingFacet",
      diamondAddress
    )) as AavegotchiLendingFacet;
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

    ghstERC20 = (await ethers.getContractAt('ERC20Token', ghstAddress)) as ERC20Token;

    // This is needed for impersonating owner of test aavegotchi
    aavegotchiOwnerAddress = await aavegotchiFacet.ownerOf(lockedAavegotchiId);
    const portalOwnerAddress = await aavegotchiFacet.ownerOf(lockedPortalId);

    // set pet operator
    aavegotchiFacet = await impersonate(aavegotchiOwnerAddress, aavegotchiFacet, ethers, network);
    await (await aavegotchiFacet.setPetOperatorForAll(originalPetOperator, true)).wait();

    // set approval
    await (await aavegotchiFacet.setApprovalForAll(diamondAddress, true)).wait();

    const aavegotchiFacetWithPortalOwner = await impersonate(portalOwnerAddress, aavegotchiFacet, ethers, network);
    await (await aavegotchiFacetWithPortalOwner.setApprovalForAll(diamondAddress, true)).wait();

    // Impersonating facets for test
    lendingFacetWithOwner = await impersonate(aavegotchiOwnerAddress, aavegotchiLendingFacet, ethers, network);
    lendingFacetWithRenter = await impersonate(renterAddress, aavegotchiLendingFacet, ethers, network);
    lendingFacetWithClaimer = await impersonate(claimerAddress, aavegotchiLendingFacet, ethers, network);
    lendingFacetWithPortalOwner = await impersonate(portalOwnerAddress, aavegotchiLendingFacet, ethers, network);
    whitelistFacetWithOwner = await impersonate(aavegotchiOwnerAddress, whitelistFacet, ethers, network);
    whitelistFacetWithPortalOwner = await impersonate(portalOwnerAddress, whitelistFacet, ethers, network);
    erc721MarketplaceFacet = await impersonate(portalOwnerAddress, erc721MarketplaceFacet, ethers, network);
    aavegotchiFacet = await impersonate(renterAddress, aavegotchiFacet, ethers, network);
    aavegotchiGameFacet = await impersonate(originalPetOperator, aavegotchiGameFacet, ethers, network);
    ghstERC20 = await impersonate(ghstHolderAddress, ghstERC20, ethers, network);
  });

  describe("Testing createWhitelist", async function () {
    it("Should revert if whitelist is empty", async function () {
      await expect(whitelistFacetWithOwner.createWhitelist('', [])).to.be.revertedWith("WhitelistFacet: Whitelist length should be larger than zero");
    });
    // it("Should revert if whitelist length exceeds limit", async function () {
    //   const whitelistLargerThanLimit = Array(101).fill(renterAddress);
    //   await expect(whitelistFacetWithOwner.createWhitelist('', whitelistLargerThanLimit)).to.be.revertedWith("WhitelistFacet: Whitelist length exceeds limit");
    // });
    // it("Should revert if whitelist contains address-zero", async function () {
    //   await expect(whitelistFacetWithOwner.createWhitelist([renterAddress, ethers.constants.AddressZero])).to.be.revertedWith("WhitelistFacet: There's invalid address in the list");
    // });
    it("Should succeed if whitelist is valid", async function() {
      const receipt = await (await whitelistFacetWithOwner.createWhitelist('', [renterAddress])).wait();
      const event = receipt!.events!.find(event => event.event === 'WhitelistCreated');
      whitelistId = event!.args!.whitelistId
      expect(whitelistId).to.equal(0);
    });
  });

  describe("Testing updateWhitelist", async function () {
    it("Should revert if invalid whitelist id", async function () {
      await expect(whitelistFacetWithOwner.updateWhitelist(whitelistId + 1, [])).to.be.revertedWith("WhitelistFacet: whitelist not found");
    });
    it("Should revert if invalid whitelist id", async function () {
      const receipt = await (await whitelistFacetWithPortalOwner.createWhitelist('',[nonWhitelistedAddress])).wait();
      const event = receipt!.events!.find(event => event.event === 'WhitelistCreated');
      secondWhitelistId = event!.args!.whitelistId
      await expect(whitelistFacetWithOwner.updateWhitelist(secondWhitelistId, [])).to.be.revertedWith("WhitelistFacet: not whitelist owner");
    });
    it("Should revert if whitelist is empty", async function () {
      await expect(whitelistFacetWithOwner.updateWhitelist(whitelistId, [])).to.be.revertedWith("WhitelistFacet: Whitelist length should be larger than zero");
    });
    // it("Should revert if whitelist length exceeds limit", async function () {
    //   const whitelistLargerThanLimit = Array(100).fill(renterAddress);
    //   await expect(whitelistFacetWithOwner.updateWhitelist(whitelistId, whitelistLargerThanLimit)).to.be.revertedWith("WhitelistFacet: Whitelist length exceeds limit");
    // });
    // it("Should revert if whitelist contains address-zero", async function () {
    //   await expect(whitelistFacetWithOwner.updateWhitelist(whitelistId, [nonGhstHolderAddress, ethers.constants.AddressZero])).to.be.revertedWith("WhitelistFacet: There's invalid address in the list");
    // });
    it("Should succeed if all parameters are valid", async function() {
      const receipt = await (await whitelistFacetWithOwner.updateWhitelist(whitelistId,[nonGhstHolderAddress, renterAddress])).wait();
      const event = receipt!.events!.find(event => event.event === 'WhitelistUpdated');
      expect(event!.args!.whitelistId).to.equal(whitelistId);
    });
  });

  describe("Testing getWhitelist", async function () {
    it("Should revert if invalid whitelist id", async function () {
      await expect(whitelistFacetWithOwner.getWhitelist(secondWhitelistId + 1)).to.be.revertedWith("WhitelistFacet: whitelist not found");
    });
    it("Should return array if valid whitelist id", async function () {
      const whitelist = await whitelistFacetWithOwner.getWhitelist(whitelistId);
      expect(whitelist.owner).to.equal(aavegotchiOwnerAddress);
      expect(whitelist.addresses.length).to.equal(2);
      expect(whitelist.addresses[0]).to.equal(renterAddress);
    });
  });

  describe("Testing getWhitelists", async function () {
    it("Should return array", async function () {
      const whitelists = await whitelistFacetWithOwner.getWhitelists();
      expect(whitelists.length).to.equal(2);
      expect(whitelists[0].owner).to.equal(aavegotchiOwnerAddress);
      expect(whitelists[0].addresses.length).to.equal(2);
      expect(whitelists[0].addresses[0]).to.equal(renterAddress);
      expect(whitelists[1].addresses.length).to.equal(1);
      expect(whitelists[1].addresses[0]).to.equal(nonWhitelistedAddress);
    });
  });

  describe("Testing addAavegotchiRental", async function () {
    it("Should revert if non-owner try to add", async function () {
      await expect(lendingFacetWithRenter.addAavegotchiRental(unlockedAavegotchiId, amountPerDay, period, revenueSplitWithoutReceiver, ethers.constants.AddressZero, whitelistId))
        .to.be.revertedWith("AavegotchiLending: Not owner of aavegotchi");
    });
    it("Should revert if period is zero", async function () {
      await expect(lendingFacetWithOwner.addAavegotchiRental(unlockedAavegotchiId, amountPerDay, 0, revenueSplitWithoutReceiver, ethers.constants.AddressZero, whitelistId))
        .to.be.revertedWith("AavegotchiLending: period should be larger than 0");
    });
    it("Should revert if sum of revenue split values is invalid", async function () {
      const invalidRevenueSplit: [BigNumberish, BigNumberish, BigNumberish] = [10, 50, 0];
      await expect(lendingFacetWithOwner.addAavegotchiRental(unlockedAavegotchiId, amountPerDay, period, invalidRevenueSplit, ethers.constants.AddressZero, whitelistId))
        .to.be.revertedWith("AavegotchiLending: sum of revenue split should be 100");
    });
    it("Should revert if revenue split values is invalid when receiver exist", async function () {
      await expect(lendingFacetWithOwner.addAavegotchiRental(unlockedAavegotchiId, amountPerDay, period, revenueSplitForReceiver, ethers.constants.AddressZero, whitelistId))
        .to.be.revertedWith("AavegotchiLending: revenue split for invalid receiver should be zero");
    });
    it("Should revert if whitelist id is invalid", async function () {
      await expect(lendingFacetWithOwner.addAavegotchiRental(unlockedAavegotchiId, amountPerDay, period, revenueSplitWithoutReceiver, ethers.constants.AddressZero, whitelistId + 10))
        .to.be.revertedWith("AavegotchiLending: whitelist not found");
    });
    it("Should revert if try to add rental for not aavegotchi", async function () {
      await (await erc721MarketplaceFacet.cancelERC721ListingByToken(diamondAddress, lockedPortalId)).wait()

      await expect(lendingFacetWithPortalOwner.addAavegotchiRental(lockedPortalId, amountPerDay, period, revenueSplitWithoutReceiver, ethers.constants.AddressZero, secondWhitelistId))
        .to.be.revertedWith("AavegotchiLending: Only aavegotchi available");
    });
    describe("If there's no rental for the aavegotchi", async function () {
      it("Should revert if aavegotchi is locked", async function() {
        await expect(lendingFacetWithOwner.addAavegotchiRental(lockedAavegotchiId, amountPerDay, period, revenueSplitWithoutReceiver, ethers.constants.AddressZero, whitelistId))
          .to.be.revertedWith("AavegotchiLending: Only callable on unlocked Aavegotchis");
      });
      it("Should succeed if all parameters are valid", async function() {
        const receipt = await (await lendingFacetWithOwner.addAavegotchiRental(unlockedAavegotchiId, amountPerDay, period, revenueSplitWithoutReceiver, ethers.constants.AddressZero, 0)).wait();
        const event = receipt!.events!.find(event => event.event === 'AavegotchiRentalAdd');
        firstRentalId = event!.args!.rentalId
        expect(event!.args!.originalOwner).to.equal(aavegotchiOwnerAddress);
        expect(event!.args!.erc721TokenId).to.equal(unlockedAavegotchiId);
        expect(event!.args!.amountPerDay).to.equal(amountPerDay);
        expect(event!.args!.period).to.equal(period);
      });
    });
    describe("If there's already rental for the aavegotchi", async function () {
      it("Should succeed and if all parameters are valid", async function() {
        const receipt = await (await lendingFacetWithOwner.addAavegotchiRental(unlockedAavegotchiId, amountPerDay, period, revenueSplitWithoutReceiver, ethers.constants.AddressZero, whitelistId)).wait();
        const event = receipt!.events!.find(event => event.event === 'AavegotchiRentalAdd');
        secondRentalId = event!.args!.rentalId
        expect(event!.args!.originalOwner).to.equal(aavegotchiOwnerAddress);
        expect(event!.args!.erc721TokenId).to.equal(unlockedAavegotchiId);
        expect(event!.args!.amountPerDay).to.equal(amountPerDay);
        expect(event!.args!.period).to.equal(period);
      });
    });
  });

  describe("Testing getAavegotchiRental", async function () {
    it("Should revert when try to get rental with wrong id", async function () {
      await expect(lendingFacetWithOwner.getAavegotchiRental(secondRentalId.add(10)))
        .to.be.revertedWith("AavegotchiLending: rental does not exist");
    });
    it("Should fetch rental data with correct rental id", async function () {
      const rental = await lendingFacetWithOwner.getAavegotchiRental(firstRentalId);
      expect(rental.rentalId).to.equal(firstRentalId);
      expect(rental.originalOwner).to.equal(aavegotchiOwnerAddress);
      expect(rental.erc721TokenId).to.equal(unlockedAavegotchiId);
      expect(rental.completed).to.equal(false);
    });
  });

  describe("Testing getAavegotchiRentalInfo", async function () {
    it("Should revert when try to get rental with wrong id", async function () {
      await expect(lendingFacetWithOwner.getAavegotchiRentalInfo(secondRentalId.add(10)))
        .to.be.revertedWith("AavegotchiLending: rental does not exist");
    });
    it("Should fetch rental data with correct rental id", async function () {
      const rentalInfo = await lendingFacetWithOwner.getAavegotchiRentalInfo(firstRentalId);
      expect(rentalInfo[0].rentalId).to.equal(firstRentalId);
      expect(rentalInfo[0].originalOwner).to.equal(aavegotchiOwnerAddress);
      expect(rentalInfo[0].erc721TokenId).to.equal(unlockedAavegotchiId);
      expect(rentalInfo[0].completed).to.equal(false);
      expect(rentalInfo[1].tokenId).to.equal(unlockedAavegotchiId);
      expect(rentalInfo[1].owner).to.equal(aavegotchiOwnerAddress);
      expect(rentalInfo[1].locked).to.equal(true);
    });
  });

  describe("Testing getAavegotchiRentalFromToken", async function () {
    it("Should revert when try to get rental with wrong aavegotchi id", async function () {
      await expect(lendingFacetWithOwner.getAavegotchiRentalFromToken(lockedAavegotchiId))
        .to.be.revertedWith("AavegotchiLending: rental doesn't exist");
    });
    it("Should fetch rental data with correct aavegotchi id", async function () {
      const rental = await lendingFacetWithOwner.getAavegotchiRentalFromToken(unlockedAavegotchiId);
      expect(rental.rentalId).to.equal(secondRentalId);
      expect(rental.originalOwner).to.equal(aavegotchiOwnerAddress);
      expect(rental.erc721TokenId).to.equal(unlockedAavegotchiId);
      expect(rental.completed).to.equal(false);
    });
  });

  describe("Testing isAavegotchiLent before and after aavegotchi rental added", async function () {
    it("Should return false if aavegotchi is not lent", async function() {
      const status = await lendingFacetWithOwner.isAavegotchiLent(lockedAavegotchiId);
      expect(status).to.equal(false);
    });
    it("Should return true if aavegotchi rental is not agreed yet", async function() {
      const status = await lendingFacetWithOwner.isAavegotchiLent(unlockedAavegotchiId);
      expect(status).to.equal(false);
    });
  })

  describe("Testing cancelAavegotchiRental", async function () {
    it("Should revert when try to cancel rental with wrong id", async function () {
      await expect(lendingFacetWithOwner.cancelAavegotchiRental(secondRentalId.add(10)))
        .to.be.revertedWith("AavegotchiLending: rental not found");
    });
    it("Should revert when try to cancel rental with non original owner", async function () {
      await expect(lendingFacetWithClaimer.cancelAavegotchiRental(secondRentalId))
        .to.be.revertedWith("AavegotchiLending: not original owner");
    });
    it("Should succeed, but no event when try to cancel canceled rental", async function () {
      const receipt = await (await lendingFacetWithOwner.cancelAavegotchiRental(firstRentalId)).wait();
      expect(receipt!.events!.length).to.equal(0);
    });
    it("Should succeed if cancel valid rental", async function () {
      let rental = await lendingFacetWithOwner.getAavegotchiRental(secondRentalId);
      expect(rental.canceled).to.equal(false);
      await (await lendingFacetWithOwner.cancelAavegotchiRental(secondRentalId)).wait();
      rental = await lendingFacetWithOwner.getAavegotchiRental(secondRentalId);
      expect(rental.canceled).to.equal(true);
    });
  });

  describe("Testing cancelAavegotchiRentalByToken", async function () {
    before(async function () {
      await (await lendingFacetWithOwner.addAavegotchiRental(unlockedAavegotchiId, amountPerDay, period, revenueSplitWithoutReceiver, ethers.constants.AddressZero, whitelistId)).wait();
    });
    it("Should revert when try to cancel rental with wrong aavegotchi id", async function () {
      await expect(lendingFacetWithOwner.cancelAavegotchiRentalByToken(lockedAavegotchiId))
        .to.be.revertedWith("AavegotchiLending: rental not found");
    });
    it("Should revert when try to cancel rental with non original owner", async function () {
      await expect(lendingFacetWithClaimer.cancelAavegotchiRentalByToken(unlockedAavegotchiId))
        .to.be.revertedWith("AavegotchiLending: not original owner");
    });
    it("Should succeed if cancel rental with valid aavegotchi id", async function () {
      let rental = await lendingFacetWithOwner.getAavegotchiRentalFromToken(unlockedAavegotchiId);
      expect(rental.canceled).to.equal(false);
      await (await lendingFacetWithOwner.cancelAavegotchiRentalByToken(unlockedAavegotchiId)).wait();
      await expect(lendingFacetWithOwner.getAavegotchiRentalFromToken(unlockedAavegotchiId))
        .to.be.revertedWith("AavegotchiLending: rental doesn't exist");
    });
    it("isAavegotchiLent function should return true if aavegotchi rental is canceld", async function() {
      const status = await lendingFacetWithOwner.isAavegotchiLent(unlockedAavegotchiId);
      expect(status).to.equal(false);
    });
  });

  describe("Testing agreeAavegotchiRental", async function () {
    before(async function () {
      const receipt = await (await lendingFacetWithOwner.addAavegotchiRental(unlockedAavegotchiId, amountPerDay, period, revenueSplitForReceiver, receiver, whitelistId)).wait();
      const event = receipt!.events!.find(event => event.event === 'AavegotchiRentalAdd');
      fourthRentalId = event!.args!.rentalId
    });
    it("Should revert when try to agree rental with wrong rental id", async function () {
      await expect(lendingFacetWithRenter.agreeAavegotchiRental(fourthRentalId.add(10), unlockedAavegotchiId, amountPerDay, period, revenueSplitForReceiver))
        .to.be.revertedWith("AavegotchiLending: rental not found");
    });
    it("Should revert when try to agree canceled rental", async function () {
      await expect(lendingFacetWithRenter.agreeAavegotchiRental(secondRentalId, unlockedAavegotchiId, amountPerDay, period, revenueSplitForReceiver))
        .to.be.revertedWith("AavegotchiLending: rental canceled");
    });
    it("Should revert when try to agree rental with wrong token id", async function () {
      await expect(lendingFacetWithRenter.agreeAavegotchiRental(fourthRentalId, lockedAavegotchiId, amountPerDay, period, revenueSplitForReceiver))
        .to.be.revertedWith("AavegotchiLending: Invalid token id");
    });
    it("Should revert when try to agree rental with wrong amount per day", async function () {
      await expect(lendingFacetWithRenter.agreeAavegotchiRental(fourthRentalId, unlockedAavegotchiId, ethers.utils.parseUnits('1.1', 'ether'), period, revenueSplitForReceiver))
        .to.be.revertedWith("AavegotchiLending: Invalid amount per day");
    });
    it("Should revert when try to agree rental with wrong rental period", async function () {
      await expect(lendingFacetWithRenter.agreeAavegotchiRental(fourthRentalId, unlockedAavegotchiId, amountPerDay, period + 1, revenueSplitForReceiver))
        .to.be.revertedWith("AavegotchiLending: Invalid rental period");
    });
    it("Should revert when try to agree rental with wrong revenue split", async function () {
      await expect(lendingFacetWithRenter.agreeAavegotchiRental(fourthRentalId, unlockedAavegotchiId, amountPerDay, period, revenueSplitWithoutReceiver))
        .to.be.revertedWith("AavegotchiLending: Invalid revenue split");
    });
    it("Should revert when try to agree rental with original owner", async function () {
      await expect(lendingFacetWithOwner.agreeAavegotchiRental(fourthRentalId, unlockedAavegotchiId, amountPerDay, period, revenueSplitForReceiver))
        .to.be.revertedWith("AavegotchiLending: renter can't be original owner");
    });
    it("Should revert when non whitelisted account try to agree rental", async function () {
      const lendingFacetWithNonWhitelisted = await impersonate(nonWhitelistedAddress, lendingFacetWithOwner, ethers, network);
      await expect(lendingFacetWithNonWhitelisted.agreeAavegotchiRental(fourthRentalId, unlockedAavegotchiId, amountPerDay, period, revenueSplitForReceiver))
        .to.be.revertedWith("AavegotchiLending: Not whitelisted address");
    });
    it("Should revert when non GHST holder try to agree rental whose amount per day is not zero", async function () {
      const lendingFacetWithNonGhstHolder = await impersonate(nonGhstHolderAddress, lendingFacetWithOwner, ethers, network);
      await expect(lendingFacetWithNonGhstHolder.agreeAavegotchiRental(fourthRentalId, unlockedAavegotchiId, amountPerDay, period, revenueSplitForReceiver))
        .to.be.revertedWith("AavegotchiLending: not enough GHST");
    });
    it("Should succeed when agree rental with valid data", async function () {
      const renterOldBalance = await ghstERC20.balanceOf(renterAddress);
      const ownerOldBalance = await ghstERC20.balanceOf(aavegotchiOwnerAddress);
      const ghstERC20WithRenter = await impersonate(renterAddress, ghstERC20, ethers, network);
      await ghstERC20WithRenter.approve(diamondAddress, amountPerDay.mul(period));
      const receipt = await (await lendingFacetWithRenter.agreeAavegotchiRental(fourthRentalId, unlockedAavegotchiId, amountPerDay, period, revenueSplitForReceiver)).wait();
      const event = receipt!.events!.find(event => event.event === 'ERC721ExecutedRental');
      expect(event!.args!.renter).to.equal(renterAddress);
      const renterNewBalance = await ghstERC20.balanceOf(renterAddress);
      const ownerNewBalance = await ghstERC20.balanceOf(aavegotchiOwnerAddress);

      // Check ghst balance changes
      expect(renterOldBalance.sub(renterNewBalance)).to.equal(amountPerDay.mul(period));
      expect(ownerNewBalance.sub(ownerOldBalance)).to.equal(amountPerDay.mul(period));

      // Check rental and aavegotchi status
      const rentalInfo = await lendingFacetWithRenter.getAavegotchiRentalInfo(fourthRentalId);
      expect(rentalInfo[0].rentalId).to.equal(fourthRentalId);
      expect(rentalInfo[0].originalOwner).to.equal(aavegotchiOwnerAddress);
      expect(rentalInfo[0].erc721TokenId).to.equal(unlockedAavegotchiId);
      expect(rentalInfo[0].completed).to.equal(false);
      expect(rentalInfo[0].timeAgreed.gt(0)).to.equal(true);
      expect(rentalInfo[1].tokenId).to.equal(unlockedAavegotchiId);
      expect(rentalInfo[1].owner).to.equal(renterAddress);
      expect(rentalInfo[1].locked).to.equal(true);
      escrowAddress = rentalInfo[1].escrow
    });
    it("Should revert when try to agree agreed rental", async function () {
      await expect(lendingFacetWithRenter.agreeAavegotchiRental(fourthRentalId, unlockedAavegotchiId, amountPerDay, period, revenueSplitForReceiver))
        .to.be.revertedWith("AavegotchiLending: rental already agreed");
    });
    it("isAavegotchiLent function should return true if aavegotchi rental is agreed", async function() {
      const status = await lendingFacetWithOwner.isAavegotchiLent(unlockedAavegotchiId);
      expect(status).to.equal(true);
    });
  });

  describe("Testing other functions during agreement", async function () {
    it("Should revert when try to send aavegotchi in rental", async function () {
      await expect(aavegotchiFacet.transferFrom(renterAddress, aavegotchiOwnerAddress, unlockedAavegotchiId))
        .to.be.revertedWith("AavegotchiLending: Aavegotchi is in rental");
    });
    it("Should allow original pet operators interact during the agreement", async function () {
      const receipt = await (await aavegotchiGameFacet.interact([unlockedAavegotchiId])).wait();
      expect(receipt.status).to.equal(1);
    });
  });

  describe("Testing claimAavegotchiRental and claimAndEndAavegotchiRental", async function () {
    it("Should revert when try to claim rental with non original owner during agreement", async function () {
      await expect(lendingFacetWithClaimer.claimAavegotchiRental(unlockedAavegotchiId, revenueTokens))
        .to.be.revertedWith("AavegotchiLending: only owner or renter can claim");
    });
    it("Should revert when try to end rental with non original owner or non renter", async function () {
      await expect(lendingFacetWithClaimer.claimAndEndAavegotchiRental(unlockedAavegotchiId, revenueTokens))
        .to.be.revertedWith("AavegotchiLending: only owner or renter can claim and end agreement");
    });
    it("Should revert when try to end rental with original owner or renter during agreement", async function () {
      await expect(lendingFacetWithOwner.claimAndEndAavegotchiRental(unlockedAavegotchiId, revenueTokens))
        .to.be.revertedWith("AavegotchiLending: not allowed during agreement");
    });
    it("Should succeed when claim rental with original owner during agreement", async function () {
      // Impersonate revenue
      await (await ghstERC20.transfer(escrowAddress, ethers.utils.parseUnits('100', 'ether'))).wait();

      const revenue = await ghstERC20.balanceOf(escrowAddress);
      const renterOldBalance = await ghstERC20.balanceOf(renterAddress);
      const ownerOldBalance = await ghstERC20.balanceOf(aavegotchiOwnerAddress);
      const receiverOldBalance = await ghstERC20.balanceOf(receiver);
      await (await lendingFacetWithOwner.claimAavegotchiRental(unlockedAavegotchiId, revenueTokens)).wait();
      const escrowNewBalance = await ghstERC20.balanceOf(escrowAddress);
      const renterNewBalance = await ghstERC20.balanceOf(renterAddress);
      const ownerNewBalance = await ghstERC20.balanceOf(aavegotchiOwnerAddress);
      const receiverNewBalance = await ghstERC20.balanceOf(receiver);

      // Check ghst balance changes
      expect(escrowNewBalance).to.equal(0);
      expect(ownerNewBalance.sub(ownerOldBalance)).to.equal(revenue.mul(revenueSplitForReceiver[0]).div(100));
      expect(renterNewBalance.sub(renterOldBalance)).to.equal(revenue.mul(revenueSplitForReceiver[1]).div(100));
      expect(receiverNewBalance.sub(receiverOldBalance)).to.equal(revenue.mul(revenueSplitForReceiver[2]).div(100));

      // Check rental and aavegotchi status
      const rentalInfo = await lendingFacetWithRenter.getAavegotchiRentalInfo(fourthRentalId);
      expect(rentalInfo[0].rentalId).to.equal(fourthRentalId);
      expect(rentalInfo[0].originalOwner).to.equal(aavegotchiOwnerAddress);
      expect(rentalInfo[0].erc721TokenId).to.equal(unlockedAavegotchiId);
      expect(rentalInfo[0].completed).to.equal(false);
      expect(rentalInfo[0].timeAgreed.gt(0)).to.equal(true);
      expect(rentalInfo[0].lastClaimed.gt(0)).to.equal(true);
      expect(rentalInfo[1].tokenId).to.equal(unlockedAavegotchiId);
      expect(rentalInfo[1].owner).to.equal(renterAddress);
      expect(rentalInfo[1].locked).to.equal(true);
    });
    it("Should revert when try to claim rental with non original owner after agreement", async function () {
      // Simulate within 1 days after agreement
      await ethers.provider.send("evm_increaseTime", [24 * 3600 * period])
      await ethers.provider.send("evm_mine", [])

      await expect(lendingFacetWithClaimer.claimAavegotchiRental(unlockedAavegotchiId, revenueTokens))
        .to.be.revertedWith("AavegotchiLending: only owner or renter can claim");
    });
    it("isAavegotchiLent function should return true if aavegotchi rental is not completed", async function() {
      const status = await lendingFacetWithOwner.isAavegotchiLent(unlockedAavegotchiId);
      expect(status).to.equal(true);
    });
    it("Should succeed when claim rental with original owner after agreement", async function () {
      // Impersonate revenue
      await (await ghstERC20.transfer(escrowAddress, ethers.utils.parseUnits('100', 'ether'))).wait();

      const revenue = await ghstERC20.balanceOf(escrowAddress);
      const renterOldBalance = await ghstERC20.balanceOf(renterAddress);
      const ownerOldBalance = await ghstERC20.balanceOf(aavegotchiOwnerAddress);
      const receiverOldBalance = await ghstERC20.balanceOf(receiver);
      await (await lendingFacetWithOwner.claimAndEndAavegotchiRental(unlockedAavegotchiId, revenueTokens)).wait();
      const escrowNewBalance = await ghstERC20.balanceOf(escrowAddress);
      const renterNewBalance = await ghstERC20.balanceOf(renterAddress);
      const ownerNewBalance = await ghstERC20.balanceOf(aavegotchiOwnerAddress);
      const receiverNewBalance = await ghstERC20.balanceOf(receiver);

      // Check ghst balance changes
      expect(escrowNewBalance).to.equal(0);
      expect(ownerNewBalance.sub(ownerOldBalance)).to.equal(revenue.mul(revenueSplitForReceiver[0]).div(100));
      expect(renterNewBalance.sub(renterOldBalance)).to.equal(revenue.mul(revenueSplitForReceiver[1]).div(100));
      expect(receiverNewBalance.sub(receiverOldBalance)).to.equal(revenue.mul(revenueSplitForReceiver[2]).div(100));

      // Check rental and aavegotchi status
      const rentalInfo = await lendingFacetWithRenter.getAavegotchiRentalInfo(fourthRentalId);
      expect(rentalInfo[0].rentalId).to.equal(fourthRentalId);
      expect(rentalInfo[0].originalOwner).to.equal(aavegotchiOwnerAddress);
      expect(rentalInfo[0].erc721TokenId).to.equal(unlockedAavegotchiId);
      expect(rentalInfo[0].completed).to.equal(true);
      expect(rentalInfo[0].timeAgreed.gt(0)).to.equal(true);
      expect(rentalInfo[0].lastClaimed.gt(0)).to.equal(true);
      expect(rentalInfo[1].tokenId).to.equal(unlockedAavegotchiId);
      expect(rentalInfo[1].owner).to.equal(aavegotchiOwnerAddress);
      expect(rentalInfo[1].locked).to.equal(false);
    });
    it("isAavegotchiLent function should return false if aavegotchi rental is completed", async function() {
      const status = await lendingFacetWithOwner.isAavegotchiLent(unlockedAavegotchiId);
      expect(status).to.equal(false);
    });
  });
});
