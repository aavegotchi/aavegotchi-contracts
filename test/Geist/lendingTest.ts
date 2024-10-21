import { ethers } from "hardhat";

import {
  Diamond,
  MarketplaceGetterFacet,
  ItemsFacet,
  DAOFacet,
  GotchiLendingFacet,
  LendingGetterAndSetterFacet,
  WGHST,
  AavegotchiFacet,
} from "../../typechain";

import { deployFullDiamond } from "../../scripts/deployFullDiamond";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber, BigNumberish } from "ethers";
import { deployWGHST } from "../../scripts/deployWGHST";

describe("Baazaar Test", function () {
  let aavegotchiDiamond: Diamond;
  let gotchiLendingFacet: GotchiLendingFacet;
  let lendingGetterFacet: LendingGetterAndSetterFacet;

  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let aavegotchiDiamondAddress: string;
  let ghstTokenAddress: string;
  let ghstToken: WGHST;
  let borrower: SignerWithAddress;
  let gotchiLendingListingId: number;
  let aavegotchiFacet: AavegotchiFacet;

  const revenueSplit = [60, 40, 0] as [
    BigNumberish,
    BigNumberish,
    BigNumberish
  ];

  const tokenId = 1;
  const initialCost = ethers.utils.parseEther("100");
  const period = 86400; // 1 day
  const whitelistId = 0;
  let revenueTokens: string[] = [];
  const permissions = 0;

  before(async function () {
    this.timeout(200000);
    [owner, addr1] = await ethers.getSigners();

    borrower = addr1;

    const wghst = await deployWGHST();
    ghstTokenAddress = wghst.address;
    ghstToken = wghst;

    // Deploy the full diamond
    const deployVars = await deployFullDiamond();
    aavegotchiDiamond = deployVars.aavegotchiDiamond;
    aavegotchiDiamondAddress = aavegotchiDiamond.address;
    // Get the marketplace facets

    revenueTokens.push(ghstTokenAddress);

    //@ts-ignore
    aavegotchiFacet = await ethers.getContractAt(
      "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
      aavegotchiDiamondAddress
    );

    lendingGetterFacet = await ethers.getContractAt(
      "LendingGetterAndSetterFacet",
      aavegotchiDiamondAddress
    );

    gotchiLendingFacet = await ethers.getContractAt(
      "GotchiLendingFacet",
      aavegotchiDiamondAddress
    );
  });

  describe("Gotchi Lending", () => {
    it("should be able to add revenue tokens", async function () {
      await lendingGetterFacet.allowRevenueTokens(revenueTokens);
    });

    it("should be able to add a listing", async function () {
      await gotchiLendingFacet.connect(owner).addGotchiListing({
        tokenId,
        initialCost,
        period,
        revenueSplit,
        originalOwner: owner.address,
        thirdParty: ethers.constants.AddressZero,
        whitelistId,
        revenueTokens,
        permissions,
      });

      const listing = await lendingGetterFacet.getGotchiLendingFromToken(
        tokenId
      );
      gotchiLendingListingId = listing.listingId;
    });

    it("should be able to lend a gotchi", async function () {
      const listing = await lendingGetterFacet.getGotchiLendingFromToken(
        tokenId
      );

      gotchiLendingListingId = listing.listingId;

      expect(listing.lender).to.equal(owner.address);
      expect(listing.erc721TokenId).to.equal(tokenId);
      expect(listing.initialCost).to.equal(initialCost);
      expect(listing.period).to.equal(period);
    });

    it("should be able to agree to a lending with upfront GHST", async function () {
      const tokenId = 1;
      const initialCost = ethers.utils.parseEther("100");

      console.log("gotchiLendingListingId", gotchiLendingListingId);

      // await ghstToken
      // .connect(borrower)
      // .approve(aavegotchiDiamondAddress, initialCost);

      await gotchiLendingFacet
        .connect(borrower)
        .agreeGotchiLending(
          gotchiLendingListingId,
          tokenId,
          initialCost,
          86400,
          revenueSplit,
          { value: initialCost }
        );

      const lending = await lendingGetterFacet.getGotchiLendingFromToken(
        tokenId
      );
      expect(lending.borrower).to.equal(borrower.address);
    });

    it("upfront GHST should be paid to the lender", async function () {
      const initialCost = ethers.utils.parseEther("100");
      const lenderBalanceBefore = await ghstToken.balanceOf(owner.address);

      await gotchiLendingFacet
        .connect(borrower)
        .agreeGotchiLending(
          gotchiLendingListingId,
          1,
          initialCost,
          86400,
          revenueSplit,
          {
            value: initialCost,
          }
        );

      const lenderBalanceAfter = await ghstToken.balanceOf(owner.address);
      expect(lenderBalanceAfter.sub(lenderBalanceBefore)).to.equal(initialCost);
    });

    it("should be able to claim revenue", async function () {
      const tokenId = 1;
      const revenueAmount = ethers.utils.parseEther("10");

      // Simulate some revenue
      await ghstToken.transfer(aavegotchiDiamondAddress, revenueAmount);

      const lenderBalanceBefore = await ghstToken.balanceOf(owner.address);
      const borrowerBalanceBefore = await ghstToken.balanceOf(borrower.address);

      await gotchiLendingFacet.connect(owner).claimGotchiLending(tokenId);

      const lenderBalanceAfter = await ghstToken.balanceOf(owner.address);
      const borrowerBalanceAfter = await ghstToken.balanceOf(borrower.address);

      expect(lenderBalanceAfter.sub(lenderBalanceBefore)).to.be.gt(0);
      expect(borrowerBalanceAfter.sub(borrowerBalanceBefore)).to.be.gt(0);
    });

    it("should be able to cancel a listing", async function () {
      const tokenId = 2;
      await gotchiLendingFacet.connect(owner).addGotchiListing({
        tokenId,
        initialCost: ethers.utils.parseEther("100"),
        period: 86400,
        revenueSplit: revenueSplit,
        originalOwner: owner.address,
        thirdParty: ethers.constants.AddressZero,
        whitelistId: 0,
        revenueTokens: [ghstTokenAddress],
        permissions: 0,
      });

      await expect(
        gotchiLendingFacet.connect(owner).cancelGotchiLendingByToken(tokenId)
      ).to.emit(gotchiLendingFacet, "GotchiLendingCancel");

      const listing = await lendingGetterFacet.getGotchiLendingFromToken(
        tokenId
      );
      expect(listing.lender).to.equal(ethers.constants.AddressZero);
    });

    it("should not allow non-owner to cancel a listing", async function () {
      const tokenId = 3;
      await gotchiLendingFacet.connect(owner).addGotchiListing({
        tokenId,
        initialCost: ethers.utils.parseEther("100"),
        period: 86400,
        revenueSplit: revenueSplit,
        originalOwner: owner.address,
        thirdParty: ethers.constants.AddressZero,
        whitelistId: 0,
        revenueTokens: [ghstTokenAddress],
        permissions: 0,
      });

      await expect(
        gotchiLendingFacet.connect(borrower).cancelGotchiLendingByToken(tokenId)
      ).to.be.revertedWith(
        "GotchiLending: Only the lender or lending operator can cancel the lending"
      );
    });

    it("should be able to extend a lending", async function () {
      const tokenId = 1;
      const extension = 86400; // 1 day

      await gotchiLendingFacet
        .connect(owner)
        .extendGotchiLending(tokenId, extension);

      const lending = await lendingGetterFacet.getGotchiLendingFromToken(
        tokenId
      );
      expect(lending.period).to.equal(86400 * 2); // Original period + extension
    });

    it("should be able to claim and end a lending", async function () {
      const tokenId = 1;

      // Fast forward time to end of lending period
      await ethers.provider.send("evm_increaseTime", [86400 * 2]);
      await ethers.provider.send("evm_mine", []);

      await expect(
        gotchiLendingFacet.connect(owner).claimAndEndGotchiLending(tokenId)
      ).to.emit(gotchiLendingFacet, "GotchiLendingEnd");

      const lending = await lendingGetterFacet.getGotchiLendingFromToken(
        tokenId
      );
      expect(lending.completed).to.be.true;
    });

    it("should be able to batch add gotchi listings", async function () {
      const listings = [
        {
          tokenId: 4,
          initialCost: ethers.utils.parseEther("100"),
          period: 86400,
          revenueSplit: revenueSplit,
          originalOwner: owner.address,
          thirdParty: ethers.constants.AddressZero,
          whitelistId: 0,
          revenueTokens: [ghstTokenAddress],
          permissions: 0,
        },
        {
          tokenId: 5,
          initialCost: ethers.utils.parseEther("200"),
          period: 172800,
          revenueSplit: revenueSplit,
          originalOwner: owner.address,
          thirdParty: ethers.constants.AddressZero,
          whitelistId: 0,
          revenueTokens: [ghstTokenAddress],
          permissions: 0,
        },
      ];

      // await expect(
      //   gotchiLendingFacet.connect(owner).batchAddGotchiListing(listings)
      // )
      //   .to.emit(gotchiLendingFacet, "GotchiLendingAdd")
      //   .withArgs(4, owner.address, ethers.utils.parseEther("100"), 86400)
      //   .to.emit(gotchiLendingFacet, "GotchiLendingAdd")
      //   .withArgs(5, owner.address, ethers.utils.parseEther("200"), 172800);
    });
  });
});
