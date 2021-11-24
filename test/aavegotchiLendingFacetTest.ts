/* global describe it before ethers network */
/* eslint prefer-const: "off" */

//@ts-ignore
import { ethers, network } from "hardhat";
import chai from "chai";
import { upgrade } from "../scripts/upgrades/upgrade-aavegotchiLendingFacet";
import { impersonate } from "../scripts/helperFunctions";
import {
  AavegotchiFacet,
  AavegotchiLendingFacet,
  ERC20Token,
  ERC721MarketplaceFacet
} from "../typechain";
import { BigNumberish } from "ethers";

const { expect } = chai;

describe("Testing Aavegotchi Lending", async function () {
  this.timeout(300000);

  const ghstAddress = "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7";
  const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
  const claimerAddress = "0x3507e4978e0eb83315d20df86ca0b976c0e40ccb";
  const renterAddress = "0xBC67F26c2b87e16e304218459D2BB60Dac5C80bC"; // renter should be GHST holder
  const nonGhstHolderAddress = "0x725Fe4790fC6435B5161f88636C2A50e43247A4b"; // GHST holder balance should be 0
  const ghstHolderAddress = "0x3721546e51258065bfdb9746b2e442c7671b0298";
  const receiver = "0x382038b034fa8Ea64C74C81d680669bDaC4D0636";
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
  let aavegotchiFacet: AavegotchiFacet;
  let erc721MarketplaceFacet: ERC721MarketplaceFacet;
  let ghstERC20: ERC20Token;
  let aavegotchiOwnerAddress: any;
  let escrowAddress: any;
  let firstRentalId: any;
  let secondRentalId: any;
  let fourthRentalId: any;

  before(async function () {
    await upgrade();

    const aavegotchiLendingFacet = (await ethers.getContractAt(
      "AavegotchiLendingFacet",
      diamondAddress
    )) as AavegotchiLendingFacet;
    aavegotchiFacet = (await ethers.getContractAt(
      "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
      diamondAddress
    )) as AavegotchiFacet;
    erc721MarketplaceFacet = (await ethers.getContractAt(
      "ERC721MarketplaceFacet",
      diamondAddress
    )) as ERC721MarketplaceFacet;

    ghstERC20 = (await ethers.getContractAt('ERC20Token', ghstAddress)) as ERC20Token;

    // This is needed for impersonating owner of test aavegotchi
    aavegotchiOwnerAddress = await aavegotchiFacet.ownerOf(lockedAavegotchiId);

    lendingFacetWithOwner = await impersonate(aavegotchiOwnerAddress, aavegotchiLendingFacet, ethers, network);
    lendingFacetWithRenter = await impersonate(renterAddress, aavegotchiLendingFacet, ethers, network);
    lendingFacetWithClaimer = await impersonate(claimerAddress, aavegotchiLendingFacet, ethers, network);
    aavegotchiFacet = await impersonate(renterAddress, aavegotchiFacet, ethers, network);
    ghstERC20 = await impersonate(ghstHolderAddress, ghstERC20, ethers, network);
  });

  describe("Testing addAavegotchiRental", async function () {
    it("Should revert if non-owner try to add", async function () {
      await expect(lendingFacetWithRenter.addAavegotchiRental(diamondAddress, unlockedAavegotchiId, amountPerDay, period, revenueSplitWithoutReceiver, ethers.constants.AddressZero))
        .to.be.revertedWith("AavegotchiLending: Not owner of aavegotchi");
    });
    it("Should revert if period is zero", async function () {
      await expect(lendingFacetWithOwner.addAavegotchiRental(diamondAddress, unlockedAavegotchiId, amountPerDay, 0, revenueSplitWithoutReceiver, ethers.constants.AddressZero))
        .to.be.revertedWith("AavegotchiLending: period should be larger than 0");
    });
    it("Should revert if sum of revenue split values is invalid", async function () {
      const invalidRevenueSplit: [BigNumberish, BigNumberish, BigNumberish] = [10, 50, 0];
      await expect(lendingFacetWithOwner.addAavegotchiRental(diamondAddress, unlockedAavegotchiId, amountPerDay, period, invalidRevenueSplit, ethers.constants.AddressZero))
        .to.be.revertedWith("AavegotchiLending: sum of revenue split should be 100");
    });
    it("Should revert if revenue split values is invalid when receiver exist", async function () {
      await expect(lendingFacetWithOwner.addAavegotchiRental(diamondAddress, unlockedAavegotchiId, amountPerDay, period, revenueSplitForReceiver, ethers.constants.AddressZero))
        .to.be.revertedWith("AavegotchiLending: revenue split for invalid receiver should be zero");
    });
    it("Should revert if try to add rental for not aavegotchi", async function () {
      const portalOwnerAddress = await aavegotchiFacet.ownerOf(lockedPortalId);
      await network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [portalOwnerAddress]
      });
      const portalOwner = await ethers.getSigner(portalOwnerAddress);
      await (await (await erc721MarketplaceFacet.connect(portalOwner)).cancelERC721ListingByToken(diamondAddress, lockedPortalId)).wait()

      await expect((await lendingFacetWithOwner.connect(portalOwner)).addAavegotchiRental(diamondAddress, lockedPortalId, amountPerDay, period, revenueSplitWithoutReceiver, ethers.constants.AddressZero))
        .to.be.revertedWith("AavegotchiLending: Only aavegotchi available");
    });
    describe("If there's no rental for the aavegotchi", async function () {
      it("Should revert if aavegotchi is locked", async function() {
        await expect(lendingFacetWithOwner.addAavegotchiRental(diamondAddress, lockedAavegotchiId, amountPerDay, period, revenueSplitWithoutReceiver, ethers.constants.AddressZero))
          .to.be.revertedWith("AavegotchiLending: Only callable on unlocked Aavegotchis");
      });
      it("Should succeed if all parameters are valid", async function() {
        const receipt = await (await lendingFacetWithOwner.addAavegotchiRental(diamondAddress, unlockedAavegotchiId, amountPerDay, period, revenueSplitWithoutReceiver, ethers.constants.AddressZero)).wait();
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
        const receipt = await (await lendingFacetWithOwner.addAavegotchiRental(diamondAddress, unlockedAavegotchiId, amountPerDay, period, revenueSplitWithoutReceiver, ethers.constants.AddressZero)).wait();
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
      await (await lendingFacetWithOwner.addAavegotchiRental(diamondAddress, unlockedAavegotchiId, amountPerDay, period, revenueSplitWithoutReceiver, ethers.constants.AddressZero)).wait();
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
  });

  describe("Testing agreeAavegotchiRental", async function () {
    before(async function () {
      const receipt = await (await lendingFacetWithOwner.addAavegotchiRental(diamondAddress, unlockedAavegotchiId, amountPerDay, period, revenueSplitForReceiver, receiver)).wait();
      const event = receipt!.events!.find(event => event.event === 'AavegotchiRentalAdd');
      fourthRentalId = event!.args!.rentalId
    });
    it("Should revert when try to agree rental with wrong rental id", async function () {
      await expect(lendingFacetWithRenter.agreeAavegotchiRental(fourthRentalId.add(10)))
        .to.be.revertedWith("AavegotchiLending: rental not found");
    });
    it("Should revert when try to agree canceled rental", async function () {
      await expect(lendingFacetWithRenter.agreeAavegotchiRental(secondRentalId))
        .to.be.revertedWith("AavegotchiLending: rental canceled");
    });
    it("Should revert when try to agree rental with original owner", async function () {
      await expect(lendingFacetWithOwner.agreeAavegotchiRental(fourthRentalId))
        .to.be.revertedWith("AavegotchiLending: renter can't be original owner");
    });
    it("Should revert when non GHST holder try to agree rental whose amount per day is not zero", async function () {
      const lendingFacetWithNonGhstHolder = await impersonate(nonGhstHolderAddress, lendingFacetWithOwner, ethers, network);
      await expect(lendingFacetWithNonGhstHolder.agreeAavegotchiRental(fourthRentalId))
        .to.be.revertedWith("AavegotchiLending: not enough GHST");
    });
    it("Should succeed when agree rental with valid data", async function () {
      const renterOldBalance = await ghstERC20.balanceOf(renterAddress);
      const ownerOldBalance = await ghstERC20.balanceOf(aavegotchiOwnerAddress);
      const receipt = await (await lendingFacetWithRenter.agreeAavegotchiRental(fourthRentalId)).wait();
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
      await expect(lendingFacetWithRenter.agreeAavegotchiRental(fourthRentalId))
        .to.be.revertedWith("AavegotchiLending: rental already agreed");
    });
  });

  describe("Testing other functions during agreement", async function () {
    it("Should revert when try to send aavegotchi in rental", async function () {
      await expect(aavegotchiFacet.transferFrom(renterAddress, aavegotchiOwnerAddress, unlockedAavegotchiId))
        .to.be.revertedWith("AavegotchiLending: Aavegotchi is in rental");
    });
  });

  describe("Testing claimAavegotchiRental", async function () {
    it("Should revert when try to claim rental with wrong rental id", async function () {
      await expect(lendingFacetWithRenter.claimAavegotchiRental(fourthRentalId.add(10)))
        .to.be.revertedWith("AavegotchiLending: rental not found");
    });
    it("Should revert when try to claim canceled rental", async function () {
      await expect(lendingFacetWithRenter.claimAavegotchiRental(secondRentalId))
        .to.be.revertedWith("AavegotchiLending: rental not agreed");
    });
    it("Should revert when try to claim rental with non original owner during agreement", async function () {
      await expect(lendingFacetWithClaimer.claimAavegotchiRental(fourthRentalId))
        .to.be.revertedWith("AavegotchiLending: only owner can claim during agreement");
    });
    it("Should succeed when claim rental with original owner during agreement", async function () {
      // Impersonate revenue
      await (await ghstERC20.transfer(escrowAddress, ethers.utils.parseUnits('100', 'ether'))).wait();

      const revenue = await ghstERC20.balanceOf(escrowAddress);
      const renterOldBalance = await ghstERC20.balanceOf(renterAddress);
      const ownerOldBalance = await ghstERC20.balanceOf(aavegotchiOwnerAddress);
      const receiverOldBalance = await ghstERC20.balanceOf(receiver);
      await (await lendingFacetWithOwner.claimAavegotchiRental(fourthRentalId)).wait();
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
    it("Should revert when try to claim rental with non original owner with in 1 days after agreement", async function () {
      // Simulate within 1 days after agreement
      await ethers.provider.send("evm_increaseTime", [24 * 3600 * period])
      await ethers.provider.send("evm_mine", [])

      await expect(lendingFacetWithClaimer.claimAavegotchiRental(fourthRentalId))
        .to.be.revertedWith("AavegotchiLending: only owner can claim during agreement");
    });
    it("Should succeed when claim rental with any account after agreement", async function () {
      // Simulate 1 days after agreement
      await ethers.provider.send("evm_increaseTime", [24 * 3600])
      await ethers.provider.send("evm_mine", [])

      // Impersonate revenue
      await (await ghstERC20.transfer(escrowAddress, ethers.utils.parseUnits('100', 'ether'))).wait();

      const revenue = await ghstERC20.balanceOf(escrowAddress);
      const renterOldBalance = await ghstERC20.balanceOf(renterAddress);
      const ownerOldBalance = await ghstERC20.balanceOf(aavegotchiOwnerAddress);
      const receiverOldBalance = await ghstERC20.balanceOf(receiver);
      const claimerOldBalance = await ghstERC20.balanceOf(claimerAddress);
      await (await lendingFacetWithClaimer.claimAavegotchiRental(fourthRentalId)).wait();
      const escrowNewBalance = await ghstERC20.balanceOf(escrowAddress);
      const renterNewBalance = await ghstERC20.balanceOf(renterAddress);
      const ownerNewBalance = await ghstERC20.balanceOf(aavegotchiOwnerAddress);
      const receiverNewBalance = await ghstERC20.balanceOf(receiver);
      const claimerNewBalance = await ghstERC20.balanceOf(claimerAddress);

      // Check ghst balance changes
      expect(escrowNewBalance).to.equal(0);
      expect(ownerNewBalance.sub(ownerOldBalance)).to.equal(revenue.mul(revenueSplitForReceiver[0]).mul(97).div(10000));
      expect(renterNewBalance.sub(renterOldBalance)).to.equal(revenue.mul(revenueSplitForReceiver[1]).mul(97).div(10000));
      expect(receiverNewBalance.sub(receiverOldBalance)).to.equal(revenue.mul(revenueSplitForReceiver[2]).mul(97).div(10000));
      expect(claimerNewBalance.sub(claimerOldBalance)).to.equal(revenue.mul(3).div(100));

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
    it("Should revert when try to claim completed rental", async function () {
      await expect(lendingFacetWithRenter.claimAavegotchiRental(fourthRentalId))
        .to.be.revertedWith("AavegotchiLending: rental already completed");
    });
  });
});