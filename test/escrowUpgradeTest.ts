/* global describe it before ethers network */
/* eslint prefer-const: "off" */

//@ts-ignore
import { ethers, network } from "hardhat";
import chai from "chai";
import { upgrade } from "../scripts/upgrades/upgrade-escrow";
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

  describe("Escrow Test", async () => {
    before(async () => {
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
      let lendingLength =
        await lendingGetterAndSetterFacet.getGotchiLendingsLength();
      await lendingFacet
        .connect(borrower)
        .agreeGotchiLending(
          lendingLength,
          unlockedAavegotchiId[0],
          0,
          10000,
          [50, 50, 0]
        );
    });
    it("Should revert on transfer escrow if borrower initiates", async () => {
      await expect(
        escrowFacet
          .connect(borrower)
          .transferEscrow(
            unlockedAavegotchiId[0],
            ghstAddress,
            await lender.getAddress(),
            1
          )
      ).to.be.revertedWith(
        "EscrowFacet: Only the lender can transfer out the escrow"
      );
    });
    it("Should not allow transfer of collateral tokens", async () => {
      await expect(
        escrowFacet
          .connect(lender)
          .transferEscrow(
            unlockedAavegotchiId[0],
            "0x1d2a0e5ec8e5bbdca5cb219e649b565d8e5c3360",
            await lender.getAddress(),
            1
          )
      ).to.be.revertedWith(
        "EscrowFacet: Transferring ERC20 token CANNOT be same as collateral ERC20 token"
      );
    });
    it("Only owner can transfer when borrowed", async () => {
      await escrowFacet
        .connect(lender)
        .transferEscrow(
          unlockedAavegotchiId[0],
          ghstAddress,
          await lender.getAddress(),
          1
        );
    });
    it("Only owner can transfer when listed", async () => {
      await escrowFacet
        .connect(lender)
        .transferEscrow(
          unlockedAavegotchiId[0],
          ghstAddress,
          await lender.getAddress(),
          1
        );
    });
    it("Should allow transfers if not listed", async () => {
      await lendingFacet
        .connect(borrower)
        .claimAndEndGotchiLending(unlockedAavegotchiId[0]);
      await escrowFacet
        .connect(lender)
        .transferEscrow(
          unlockedAavegotchiId[0],
          ghstAddress,
          await lender.getAddress(),
          1
        );
    });
  });
});
