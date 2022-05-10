/* global describe it before ethers network */
/* eslint prefer-const: "off" */

//@ts-ignore
import { ethers, network } from "hardhat";
import chai from "chai";
import { upgrade } from "../scripts/upgrades/upgrade-gotchiLendingRefactor";
import {
  AavegotchiFacet,
  AavegotchiGameFacet,
  GotchiLendingFacet,
  LendingGetterAndSetterFacet,
  EscrowFacet,
  ERC20Token,
  ERC721MarketplaceFacet,
  WhitelistFacet,
} from "../typechain";
import {
  fudAddress,
  fomoAddress,
  alphaAddress,
  kekAddress,
  ghstAddress,
  aavegotchiDiamondAddressMatic,
} from "../helpers/constants";
import { impersonateAndFundSigner } from "../helpers/helpers";
import { BigNumberish, Signer, BigNumber } from "ethers";

const { expect } = chai;

describe("Testing Aavegotchi Lending Refactor", async function () {
  this.timeout(300000);

  const listedFilter = ethers.utils.formatBytes32String("listed");
  const agreedFilter = ethers.utils.formatBytes32String("agreed");
  const ghstAddress = "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7";

  const collateral = "0x8df3aad3a84da6b69a4da8aec3ea40d9091b2ac4";

  const revenueTokens: string[] = [ghstAddress, kekAddress];
  const lenderAddress = "0x8FEebfA4aC7AF314d90a0c17C3F91C800cFdE44B";
  const borrowerAddress = "0xb4473cfEeDC9a0E94612c6ce883677b63f830DB8"; // borrower should be GHST holder
  const nonGhstHolderAddress = "0x725Fe4790fC6435B5161f88636C2A50e43247A4b"; // GHST holder balance should be 0
  const ghstHolderAddress = "0x3721546e51258065bfdb9746b2e442c7671b0298";
  const thirdPartyAddress = "0x382038b034fa8Ea64C74C81d680669bDaC4D0636";
  const lendingOperatorAddress = "0x4E59235b35d504D1372ABf67a835031F98114d64"; // original pet operator should be MATIC holder
  const lockedAavegotchiId = 22003;
  const unlockedAavegotchiId = [21655, 11939];
  let lendingFacet: GotchiLendingFacet;
  let lendingGetterAndSetterFacet: LendingGetterAndSetterFacet;
  let whitelistFacet: WhitelistFacet;
  let aavegotchiFacet: AavegotchiFacet;
  let erc721MarketplaceFacet: ERC721MarketplaceFacet;
  let aavegotchiGameFacet: AavegotchiGameFacet;
  let escrowFacet: EscrowFacet;
  let ghstToken: ERC20Token;
  let lender: Signer;
  let borrower: Signer;
  let lendingOperator: Signer;
  let thirdParty: Signer;
  let listingId: BigNumberish;

  before(async function () {
    await upgrade();

    lendingFacet = (await ethers.getContractAt(
      "GotchiLendingFacet",
      aavegotchiDiamondAddressMatic
    )) as GotchiLendingFacet;
    whitelistFacet = (await ethers.getContractAt(
      "WhitelistFacet",
      aavegotchiDiamondAddressMatic
    )) as WhitelistFacet;
    lendingGetterAndSetterFacet = (await ethers.getContractAt(
      "LendingGetterAndSetterFacet",
      aavegotchiDiamondAddressMatic
    )) as LendingGetterAndSetterFacet;
    aavegotchiFacet = (await ethers.getContractAt(
      "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
      aavegotchiDiamondAddressMatic
    )) as AavegotchiFacet;
    erc721MarketplaceFacet = (await ethers.getContractAt(
      "ERC721MarketplaceFacet",
      aavegotchiDiamondAddressMatic
    )) as ERC721MarketplaceFacet;
    aavegotchiGameFacet = (await ethers.getContractAt(
      "AavegotchiGameFacet",
      aavegotchiDiamondAddressMatic
    )) as AavegotchiGameFacet;
    escrowFacet = (await ethers.getContractAt(
      "EscrowFacet",
      aavegotchiDiamondAddressMatic
    )) as EscrowFacet;

    ghstToken = (await ethers.getContractAt(
      "ERC20Token",
      ghstAddress
    )) as ERC20Token;

    lender = await impersonateAndFundSigner(
      network,
      await aavegotchiFacet.ownerOf(lockedAavegotchiId)
    );
    borrower = await impersonateAndFundSigner(network, borrowerAddress);
    lendingOperator = await impersonateAndFundSigner(
      network,
      lendingOperatorAddress
    );
    thirdParty = await impersonateAndFundSigner(network, thirdPartyAddress);

    // set approval
    await (
      await aavegotchiFacet
        .connect(lender)
        .setApprovalForAll(aavegotchiDiamondAddressMatic, true)
    ).wait();
  });

  describe("Lending Facet Test (To compliment gotchiLendingFacetTest)", async () => {
    describe("Setters and Getters", async () => {
      // it("Borrower should not be borrowing", async () => {
      //   expect(await lendingGetterAndSetterFacet.isBorrowing(borrowerAddress))
      //     .to.be.false;
      // });
      it("Should set lending operator for a token", async () => {
        await lendingGetterAndSetterFacet
          .connect(lender)
          .setLendingOperator(
            await lendingOperator.getAddress(),
            unlockedAavegotchiId[0],
            true
          );
        expect(
          await lendingGetterAndSetterFacet.isLendingOperator(
            await lender.getAddress(),
            await lendingOperator.getAddress(),
            unlockedAavegotchiId[0]
          )
        ).to.be.true;
      });
      it("Should revoke lending operator for a token", async () => {
        await lendingGetterAndSetterFacet
          .connect(lender)
          .setLendingOperator(
            await lendingOperator.getAddress(),
            unlockedAavegotchiId[0],
            false
          );
        expect(
          await lendingGetterAndSetterFacet.isLendingOperator(
            await lender.getAddress(),
            await lendingOperator.getAddress(),
            unlockedAavegotchiId[0]
          )
        ).to.be.false;
      });
      it("Should be able to batch set lending operator", async () => {
        await lendingGetterAndSetterFacet
          .connect(lender)
          .batchSetLendingOperator(await lendingOperator.getAddress(), [
            { _tokenId: unlockedAavegotchiId[0], _isLendingOperator: true },
            { _tokenId: unlockedAavegotchiId[1], _isLendingOperator: true },
          ]);
        expect(
          await lendingGetterAndSetterFacet.isLendingOperator(
            await lender.getAddress(),
            await lendingOperator.getAddress(),
            unlockedAavegotchiId[0]
          )
        ).to.be.true;
        expect(
          await lendingGetterAndSetterFacet.isLendingOperator(
            await lender.getAddress(),
            await lendingOperator.getAddress(),
            unlockedAavegotchiId[1]
          )
        ).to.be.true;
        await lendingGetterAndSetterFacet
          .connect(lender)
          .batchSetLendingOperator(await lendingOperator.getAddress(), [
            { _tokenId: unlockedAavegotchiId[0], _isLendingOperator: false },
            { _tokenId: unlockedAavegotchiId[1], _isLendingOperator: false },
          ]);
      });
      it("Should not be able to set lending operator if not owner", async () => {
        await expect(
          lendingGetterAndSetterFacet
            .connect(borrower)
            .setLendingOperator(
              await lendingOperator.getAddress(),
              unlockedAavegotchiId[0],
              true
            )
        ).to.be.revertedWith(
          "LibAppStorage: Only aavegotchi owner can call this function"
        );
      });
      it("Should not be able to set lending operator if aavegotchi is locked", async () => {
        await expect(
          lendingGetterAndSetterFacet
            .connect(lender)
            .setLendingOperator(
              await lendingOperator.getAddress(),
              lockedAavegotchiId,
              true
            )
        ).to.be.revertedWith(
          "LibAppStorage: Only callable on unlocked Aavegotchis"
        );
      });
    });
    describe("Add Gotchi Listing", async () => {
      it("Should add listing", async () => {
        const lastListingId =
          await lendingGetterAndSetterFacet.getGotchiLendingsLength();
        await lendingFacet.connect(lender).addGotchiListing({
          tokenId: unlockedAavegotchiId[0],
          initialCost: 0,
          period: 10000,
          revenueSplit: [50, 50, 0],
          originalOwner: await lender.getAddress(),
          thirdParty: await thirdParty.getAddress(),
          whitelistId: 0,
          revenueTokens: [],
        });
        const listingId =
          await lendingGetterAndSetterFacet.getGotchiLendingsLength();
        expect(listingId).to.equal(lastListingId.add(1));
        const lending = await lendingGetterAndSetterFacet.getLendingListingInfo(
          listingId
        );
        expect(lending.lender).to.equal(await lender.getAddress());
        expect(lending.initialCost).to.equal(0);
        expect(lending.period).to.equal(10000);
        expect(lending.borrower).to.equal(ethers.constants.AddressZero);
        expect(lending.listingId).to.equal(listingId);
        expect(lending.erc721TokenId).to.equal(unlockedAavegotchiId[0]);
        expect(lending.revenueSplit).to.deep.equal([50, 50, 0]);
        expect(lending.originalOwner).to.equal(await lender.getAddress());
        expect(lending.thirdParty).to.equal(await thirdParty.getAddress());
        expect(lending.whitelistId).to.equal(0);
        expect(lending.revenueTokens).to.deep.equal([]);
        expect(lending.timeCreated).to.be.gt(0);
        expect(lending.timeAgreed).to.equal(0);
        expect(lending.canceled).to.be.false;
        expect(lending.completed).to.be.false;
        expect(lending.lastClaimed).to.equal(0);

        await lendingFacet.connect(lender).cancelGotchiLending(listingId);
        expect(
          await lendingGetterAndSetterFacet.isAavegotchiListed(
            unlockedAavegotchiId[0]
          )
        ).to.be.false;
      });
      it("Should add batch listing", async () => {
        const lastListingId =
          await lendingGetterAndSetterFacet.getGotchiLendingsLength();
        await lendingFacet.connect(lender).batchAddGotchiListing([
          {
            tokenId: unlockedAavegotchiId[0],
            initialCost: 0,
            period: 10000,
            revenueSplit: [50, 50, 0],
            originalOwner: await lender.getAddress(),
            thirdParty: await thirdParty.getAddress(),
            whitelistId: 0,
            revenueTokens: [],
          },
          {
            tokenId: unlockedAavegotchiId[1],
            initialCost: 0,
            period: 10000,
            revenueSplit: [50, 50, 0],
            originalOwner: await lender.getAddress(),
            thirdParty: await thirdParty.getAddress(),
            whitelistId: 0,
            revenueTokens: [],
          },
        ]);
        await lendingFacet
          .connect(lender)
          .batchCancelGotchiLending([
            lastListingId.add(1),
            lastListingId.add(2),
          ]);
      });
      it("Should allow lending operator to add listing", async () => {
        const lastListingId =
          await lendingGetterAndSetterFacet.getGotchiLendingsLength();
        await lendingGetterAndSetterFacet
          .connect(lender)
          .setLendingOperator(
            await lendingOperator.getAddress(),
            unlockedAavegotchiId[0],
            true
          );
        await lendingFacet.connect(lendingOperator).addGotchiListing({
          tokenId: unlockedAavegotchiId[0],
          initialCost: 0,
          period: 10000,
          revenueSplit: [50, 50, 0],
          originalOwner: await lender.getAddress(),
          thirdParty: await thirdParty.getAddress(),
          whitelistId: 0,
          revenueTokens: [],
        });
        expect(lastListingId.add(1)).to.be.equal(
          await lendingGetterAndSetterFacet.getGotchiLendingsLength()
        );
        await lendingFacet
          .connect(lendingOperator)
          .cancelGotchiLending(lastListingId.add(1));
      });
    });
    describe("Agree Gotchi Listing", async () => {
      // it("Should not be able to borrow a second gotchi", async () => {
      //   await lendingFacet.connect(lender).batchAddGotchiListing([
      //     {
      //       tokenId: unlockedAavegotchiId[0],
      //       initialCost: 0,
      //       period: 10000,
      //       revenueSplit: [50, 50, 0],
      //       originalOwner: await lender.getAddress(),
      //       thirdParty: await thirdParty.getAddress(),
      //       whitelistId: 0,
      //       revenueTokens: [],
      //     },
      //     {
      //       tokenId: unlockedAavegotchiId[1],
      //       initialCost: 0,
      //       period: 10000,
      //       revenueSplit: [50, 50, 0],
      //       originalOwner: await lender.getAddress(),
      //       thirdParty: await thirdParty.getAddress(),
      //       whitelistId: 0,
      //       revenueTokens: [],
      //     },
      //   ]);
      //   let lendingLength =
      //     await lendingGetterAndSetterFacet.getGotchiLendingsLength();
      //   const listingIds = [lendingLength.sub(1), lendingLength];
      //   await lendingFacet
      //     .connect(borrower)
      //     .agreeGotchiLending(
      //       listingIds[0],
      //       unlockedAavegotchiId[0],
      //       0,
      //       10000,
      //       [50, 50, 0]
      //     );
      //   expect(
      //     await lendingGetterAndSetterFacet.isBorrowing(
      //       await borrower.getAddress()
      //     )
      //   ).to.be.true;
      //   await expect(
      //     lendingFacet
      //       .connect(borrower)
      //       .agreeGotchiLending(
      //         listingIds[1],
      //         unlockedAavegotchiId[1],
      //         0,
      //         10000,
      //         [50, 50, 0]
      //       )
      //   ).to.be.revertedWith("LibGotchiLending: Borrower already has a token");
      // });
      // it("Should be able to borrow another gotchi after returning a gotchi early", async () => {
      //   await lendingFacet
      //     .connect(borrower)
      //     .claimAndEndGotchiLending(unlockedAavegotchiId[0]);
      //   expect(
      //     await lendingGetterAndSetterFacet.isBorrowing(
      //       await borrower.getAddress()
      //     )
      //   ).to.be.false;
      //   await lendingFacet
      //     .connect(borrower)
      //     .agreeGotchiLending(
      //       await lendingGetterAndSetterFacet.getGotchiLendingsLength(),
      //       unlockedAavegotchiId[1],
      //       0,
      //       10000,
      //       [50, 50, 0]
      //     );
      //   expect(
      //     await lendingGetterAndSetterFacet.isBorrowing(
      //       await borrower.getAddress()
      //     )
      //   ).to.be.true;
      //   await lendingFacet
      //     .connect(borrower)
      //     .claimAndEndGotchiLending(unlockedAavegotchiId[1]);
      //   expect(
      //     await lendingGetterAndSetterFacet.isBorrowing(
      //       await borrower.getAddress()
      //     )
      //   ).to.be.false;
      // });
      it("Should not allow non-whitelisted addresses to agree", async () => {
        await whitelistFacet
          .connect(lender)
          .createWhitelist("ayoooo", [await lender.getAddress()]);
        const whitelistId = await whitelistFacet.getWhitelistsLength();
        await lendingFacet.connect(lender).addGotchiListing({
          tokenId: unlockedAavegotchiId[0],
          initialCost: 0,
          period: 1,
          revenueSplit: [50, 50, 0],
          originalOwner: await lender.getAddress(),
          thirdParty: await thirdParty.getAddress(),
          whitelistId: whitelistId,
          revenueTokens: [],
        });
        await expect(
          lendingFacet
            .connect(borrower)
            .agreeGotchiLending(
              await lendingGetterAndSetterFacet.getGotchiLendingsLength(),
              unlockedAavegotchiId[0],
              0,
              1,
              [50, 50, 0]
            )
        ).to.be.revertedWith("LibGotchiLending: Not whitelisted address");
      });
      it("Should allow agree on whitelisted addresses", async () => {
        await whitelistFacet
          .connect(lender)
          .updateWhitelist(await whitelistFacet.getWhitelistsLength(), [
            await borrower.getAddress(),
          ]);
        await lendingFacet
          .connect(borrower)
          .agreeGotchiLending(
            await lendingGetterAndSetterFacet.getGotchiLendingsLength(),
            unlockedAavegotchiId[0],
            0,
            1,
            [50, 50, 0]
          );
      });
    });
    describe("Claim Gotchi Listing", async () => {
      it("Should allow lending operator to claim listing", async () => {
        await lendingFacet
          .connect(lendingOperator)
          .claimGotchiLending(unlockedAavegotchiId[0]);
      });
      it("Should allow batch claiming", async () => {
        await lendingFacet
          .connect(lendingOperator)
          .batchClaimGotchiLending([unlockedAavegotchiId[0]]);
      });
    });
    describe("Claim and End Gotchi Listing", async () => {
      it("Should allow batch claim and end", async () => {
        await lendingFacet
          .connect(lendingOperator)
          .batchClaimAndEndGotchiLending([unlockedAavegotchiId[0]]);
      });
    });
    describe("Extend Gotchi Listing", async () => {
      it("Should not allow anyone but lender or operator extend listing", async () => {
        await lendingFacet.connect(lender).addGotchiListing({
          tokenId: unlockedAavegotchiId[0],
          initialCost: 0,
          period: 10000,
          revenueSplit: [50, 50, 0],
          originalOwner: await lender.getAddress(),
          thirdParty: await thirdParty.getAddress(),
          whitelistId: 0,
          revenueTokens: [],
        });
        await lendingFacet
          .connect(borrower)
          .agreeGotchiLending(
            await lendingGetterAndSetterFacet.getGotchiLendingsLength(),
            unlockedAavegotchiId[0],
            0,
            10000,
            [50, 50, 0]
          );
        await expect(
          lendingFacet
            .connect(borrower)
            .extendGotchiLending(unlockedAavegotchiId[0], 10000)
        ).to.be.revertedWith(
          "GotchiLending: Only lender or lending operator can extend"
        );
      });
      it("Should not allow extensions beyond the max period", async () => {
        await expect(
          lendingFacet
            .connect(lender)
            .extendGotchiLending(unlockedAavegotchiId[0], 30000000)
        ).to.be.revertedWith(
          "GotchiLending: Cannot extend a listing beyond the maximum period"
        );
      });
      it("Should not allow extensions if the listing is not borrowed", async () => {
        await lendingFacet.connect(lender).addGotchiListing({
          tokenId: unlockedAavegotchiId[1],
          initialCost: 0,
          period: 10000,
          revenueSplit: [50, 50, 0],
          originalOwner: await lender.getAddress(),
          thirdParty: await thirdParty.getAddress(),
          whitelistId: 0,
          revenueTokens: [],
        });
        await expect(
          lendingFacet
            .connect(lender)
            .extendGotchiLending(unlockedAavegotchiId[1], 10000)
        ).to.be.revertedWith(
          "GotchiLending: Cannot extend a listing that has not been borrowed"
        );
      });
      it("Should allow lender to extend listing", async () => {
        await lendingFacet
          .connect(lender)
          .extendGotchiLending(unlockedAavegotchiId[0], 10000);
        const lending =
          await lendingGetterAndSetterFacet.getGotchiLendingFromToken(
            unlockedAavegotchiId[0]
          );
        expect(lending.period).to.be.equal(20000);
      });
      it("Should allow lending operator to extend listing", async () => {
        await lendingFacet
          .connect(lendingOperator)
          .extendGotchiLending(unlockedAavegotchiId[0], 10000);
        const lending =
          await lendingGetterAndSetterFacet.getGotchiLendingFromToken(
            unlockedAavegotchiId[0]
          );
        expect(lending.period).to.be.equal(30000);
      });
      it("Should allow batch extensions", async () => {
        await lendingFacet.connect(lendingOperator).batchExtendGotchiLending([
          {
            tokenId: unlockedAavegotchiId[0],
            extension: 10000,
          },
        ]);
        const lending =
          await lendingGetterAndSetterFacet.getGotchiLendingFromToken(
            unlockedAavegotchiId[0]
          );
        expect(lending.period).to.be.equal(40000);
      });
    });
  });
});
