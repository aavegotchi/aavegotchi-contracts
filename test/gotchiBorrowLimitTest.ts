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

describe("Testing Aavegotchi Lending Limit", async function () {
  let lendingFacet: GotchiLendingFacet;
  let lendingGetterAndSetterFacet: LendingGetterAndSetterFacet;
  let whitelistFacet: WhitelistFacet;
  let lender: Signer;
  let borrower: Signer;

  before(async function () {});
  it("Should let users set borrow limit", async () => {});
  it("Should not have a limit if limit is 0", async () => {});
  it("Should only let users borrow up to the borrow limit", async () => {});
  it("Should not let users borrow more than one gotchi when no whitelist is set", async () => {});
  it("Should end gotchi lending and be able to borrow again", async () => {});
});
