/* global describe it before ethers network */
/* eslint prefer-const: "off" */

//@ts-ignore
import { ethers, network } from "hardhat";
import chai from "chai";
import { upgrade } from "../scripts/upgrades/upgrade-gotchiLendingRefactor";
import { impersonate } from "../scripts/helperFunctions";
import {
  AavegotchiFacet,
  AavegotchiGameFacet,
  GotchiLendingFacet,
  LendingGetterAndSetterFacet,
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
import { BigNumberish } from "ethers";

const { expect } = chai;

describe("Testing Aavegotchi Lending Refactor", async function () {
  this.timeout(300000);

  const listedFilter = ethers.utils.formatBytes32String("listed");
  const agreedFilter = ethers.utils.formatBytes32String("agreed");
  const ghstAddress = "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7";

  const collateral = "0x8df3aad3a84da6b69a4da8aec3ea40d9091b2ac4";

  const revenueTokens: string[] = [ghstAddress, kekAddress];
  const claimerAddress = "0x3507e4978e0eb83315d20df86ca0b976c0e40ccb";
  const borrowerAddress = "0xb4473cfEeDC9a0E94612c6ce883677b63f830DB8"; // borrower should be GHST holder
  const nonGhstHolderAddress = "0x725Fe4790fC6435B5161f88636C2A50e43247A4b"; // GHST holder balance should be 0
  const nonWhitelistedAddress = "0xaA3B1fDC3Aa57Bf24418E397f8c80e7385aAa594"; // non-whitelisted address should be GHST holder
  const ghstHolderAddress = "0x3721546e51258065bfdb9746b2e442c7671b0298";
  const thirdParty = "0x382038b034fa8Ea64C74C81d680669bDaC4D0636";
  const originalPetOperator = "0x4E59235b35d504D1372ABf67a835031F98114d64"; // original pet operator should be MATIC holder
  const lockedAavegotchiId = 22003;
  const unlockedAavegotchiId = 11939;
  let lendingFacet: GotchiLendingFacet;
  let lendingGetterAndSetterFacet: LendingGetterAndSetterFacet;
  let whitelistFacet: WhitelistFacet;
  let aavegotchiFacet: AavegotchiFacet;
  let erc721MarketplaceFacet: ERC721MarketplaceFacet;
  let aavegotchiGameFacet: AavegotchiGameFacet;
  let ghstToken: ERC20Token;
  let aavegotchiOwnerAddress: string;

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

    ghstToken = (await ethers.getContractAt(
      "ERC20Token",
      ghstAddress
    )) as ERC20Token;

    // This is needed for impersonating owner of test aavegotchi
    aavegotchiOwnerAddress = await aavegotchiFacet.ownerOf(lockedAavegotchiId);

    // set pet operator
    aavegotchiFacet = await impersonate(
      aavegotchiOwnerAddress,
      aavegotchiFacet,
      ethers,
      network
    );

    // set approval
    await (
      await aavegotchiFacet.setApprovalForAll(
        aavegotchiDiamondAddressMatic,
        true
      )
    ).wait();
  });
});

describe("Lending Facet Test", async () => {
  describe("Add Gotchi Listing", async () => {
    it("Should not allow anyone but lender or operator add listing");
    it("Should add listing");
    it("Should add batch listing");
    it("Should allow lending operator to add listing");
  });
  describe("Agree Gotchi Listing", async () => {
    it("Should borrow a gotchi");
    it("Should not be able to borrow a second gotchi");
    it("Should be able to borrow another gotchi after returning a gotchi");
    it("Should not allow non-whitelisted addresses to agree");
  });
  describe("Cancel Gotchi Listing", async () => {
    it("Should not allow anyone but lender or operator cancel listing");
    it("Should cancel listing");
    it("Should cancel batch listing");
    it("Should allow lending operator to cancel listing");
  });
  describe("Claim Gotchi Listing", async () => {
    it("Should not allow claiming if a listing is not borrowed");
    it(
      "Should not allow anyone but lender,borrower, or operator claim listing"
    );
    it("Should allow lender to claim listing");
    it("Should allow borrower to claim listing");
    it("Should allow lending operator to claim listing");
    it("Should allow batch claiming");
  });
  describe("Claim and End Gotchi Listing", async () => {
    it(
      "Should not allow anyone but lender, borrower, or operator claim and end listing"
    );
    it("Should allow lender to claim and end listing");
    it("Should allow borrower to claim and end listing");
    it("Should allow borrower to claim and end early");
    it("Should allow lending operator to claim and end listing");
    it("Should allow batch claim and end");
  });
  describe("Extend Gotchi Listing", async () => {
    it("Should not allow anyone but lender or operator extend listing");
    it("Should allow lender to extend listing");
    it("Should allow borrower to extend listing");
    it("Should allow lending operator to extend listing");
    it("Should allow batch extensions");
  });
});
describe("Lending Getter and Setter Test", async () => {
  describe("Revenue Tokens", async () => {
    it("Should allow diamond owner to set revenue tokens");
    it("Should not allow anyone but the diamond owner to set revenue tokens");
    it("Should allow diamond owner to remove revenue tokens");
    it(
      "Should not allow anyone but the diamond owner to remove revenue tokens"
    );
    it("Should get token balances in escrow");
  });
  describe("Setters and Getters", async () => {
    it("Should get the token id of a borrower");
    it("Should set lending operator for a token");
    it("Should be able to batch set lending operator");
    it("Should not be able to set lending operator if not owner");
    it("Should not be able to set lending operator if aavegotchi is locked");
    it("Should get lending operator for a token");
  });
});
describe("Whitelist Facet Test", async () => {});
describe("Escrow Facet Test", async () => {});
