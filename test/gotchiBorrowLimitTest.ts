/* global describe it before ethers network */
/* eslint prefer-const: "off" */

//@ts-ignore
import { ethers, network } from "hardhat";
import chai from "chai";
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
import { upgrade } from "../scripts/upgrades/upgrade-gotchiLendingFacet";

const { expect } = chai;
const lenderAddress = "0x8FEebfA4aC7AF314d90a0c17C3F91C800cFdE44B";
const borrowerAddress = "0xd82974D2E506388e1d82Ab9d77A7337F4A470284";
const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
const gotchiIds = [21655, 22003, 11939];
const whitelistId = 5543;

describe("Testing Aavegotchi Lending Limit", async function () {
  let lendingFacet: GotchiLendingFacet;
  let lendingGetterAndSetterFacet: LendingGetterAndSetterFacet;
  let whitelistFacet: WhitelistFacet;
  let lender: Signer;
  let borrower: Signer;

  before(async function () {
    await upgrade();
    lender = await impersonateAndFundSigner(network, lenderAddress);
    borrower = await impersonateAndFundSigner(network, borrowerAddress);
    lendingFacet = (await ethers.getContractAt(
      "GotchiLendingFacet",
      diamondAddress,
      lender
    )) as GotchiLendingFacet;
    lendingGetterAndSetterFacet = (await ethers.getContractAt(
      "LendingGetterAndSetterFacet",
      diamondAddress,
      lender
    )) as LendingGetterAndSetterFacet;
    whitelistFacet = (await ethers.getContractAt(
      "WhitelistFacet",
      diamondAddress,
      lender
    )) as WhitelistFacet;
  });

  async function addListings(whitelist: number) {
    await lendingFacet.addGotchiListing({
      tokenId: gotchiIds[0],
      initialCost: 0,
      period: 100,
      revenueSplit: [100, 0, 0],
      originalOwner: lenderAddress,
      thirdParty: ethers.constants.AddressZero,
      whitelistId: whitelist,
      revenueTokens: [],
    });
    await lendingFacet.addGotchiListing({
      tokenId: gotchiIds[1],
      initialCost: 0,
      period: 100,
      revenueSplit: [100, 0, 0],
      originalOwner: lenderAddress,
      thirdParty: ethers.constants.AddressZero,
      whitelistId: whitelist,
      revenueTokens: [],
    });
    await lendingFacet.addGotchiListing({
      tokenId: gotchiIds[2],
      initialCost: 0,
      period: 100,
      revenueSplit: [100, 0, 0],
      originalOwner: lenderAddress,
      thirdParty: ethers.constants.AddressZero,
      whitelistId: whitelist,
      revenueTokens: [],
    });
    return [
      await lendingGetterAndSetterFacet.getGotchiLendingIdByToken(gotchiIds[0]),
      await lendingGetterAndSetterFacet.getGotchiLendingIdByToken(gotchiIds[1]),
      await lendingGetterAndSetterFacet.getGotchiLendingIdByToken(gotchiIds[2]),
    ];
  }
  it("Should not have a limit if limit is 0", async () => {
    const lendingIds = await addListings(whitelistId);
    await lendingFacet
      .connect(borrower)
      .agreeGotchiLending(lendingIds[0], gotchiIds[0], 0, 100, [100, 0, 0]);
    await lendingFacet
      .connect(borrower)
      .agreeGotchiLending(lendingIds[1], gotchiIds[1], 0, 100, [100, 0, 0]);
    await lendingFacet
      .connect(borrower)
      .agreeGotchiLending(lendingIds[2], gotchiIds[2], 0, 100, [100, 0, 0]);
    await lendingFacet
      .connect(borrower)
      .batchClaimAndEndGotchiLending(gotchiIds);
  });
  it("Should let users set borrow limit", async () => {
    await whitelistFacet.setBorrowLimit(whitelistId, 1);
    expect(await whitelistFacet.getBorrowLimit(whitelistId)).to.equal(1);
  });
  it("Should only let users borrow up to the borrow limit", async () => {
    const lendingIds = await addListings(whitelistId);
    await lendingFacet
      .connect(borrower)
      .agreeGotchiLending(lendingIds[0], gotchiIds[0], 0, 100, [100, 0, 0]);
    await expect(
      lendingFacet
        .connect(borrower)
        .agreeGotchiLending(lendingIds[1], gotchiIds[1], 0, 100, [100, 0, 0])
    ).to.be.revertedWith(
      "LibGotchiLending: Borrower is over borrow limit for the limit set by whitelist owner"
    );
    await lendingFacet.connect(borrower).claimAndEndGotchiLending(gotchiIds[0]);
    await lendingFacet.batchCancelGotchiLendingByToken([
      gotchiIds[1],
      gotchiIds[2],
    ]);
  });
  it("Should not let users borrow more than one gotchi when no whitelist is set", async () => {
    const lendingIds = await addListings(0);
    await lendingFacet
      .connect(borrower)
      .agreeGotchiLending(lendingIds[0], gotchiIds[0], 0, 100, [100, 0, 0]);
    await expect(
      lendingFacet
        .connect(borrower)
        .agreeGotchiLending(lendingIds[1], gotchiIds[1], 0, 100, [100, 0, 0])
    ).to.be.revertedWith(
      "LibGotchiLending: Borrower is over borrow limit for the limit set by whitelist owner"
    );
  });
  it("Should end gotchi lending and be able to borrow again", async () => {
    await lendingFacet.connect(borrower).claimAndEndGotchiLending(gotchiIds[0]);

    await lendingFacet
      .connect(borrower)
      .agreeGotchiLending(
        await lendingGetterAndSetterFacet.getGotchiLendingIdByToken(
          gotchiIds[2]
        ),
        gotchiIds[2],
        0,
        100,
        [100, 0, 0]
      );
  });
});
