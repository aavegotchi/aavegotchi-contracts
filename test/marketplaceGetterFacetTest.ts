/* global describe it before ethers network */
/* eslint prefer-const: "off" */

//@ts-ignore
import { ethers, network } from "hardhat";
import { upgrade } from "../scripts/upgrades/upgrade-MarketplaceGetterFacet";
import { MarketplaceGetterFacet } from "../typechain";
import { aavegotchiDiamondAddressMatic } from "../helpers/constants";
import { expect } from "chai";
import { maticDiamondAddress } from "../scripts/helperFunctions";

describe("Testing MarketplaceGetterFacet", async function () {
  this.timeout(300000);

  const diamondAddress = aavegotchiDiamondAddressMatic;
  const erc721ListingId = 263824;
  const erc721TokenId = 6259; // token id for listing
  const erc1155ListingId = 349873;
  const erc1155TokenId = 303;
  let marketplaceGetter: MarketplaceGetterFacet;

  before(async function () {
    await upgrade();

    marketplaceGetter = (await ethers.getContractAt(
      "MarketplaceGetterFacet",
      diamondAddress
    )) as MarketplaceGetterFacet;
  });

  describe("getter functions of ERC721 Listings", async function () {
    it("getERC721Listing", async function () {
      const listing = await marketplaceGetter.getERC721Listing(erc721ListingId);
      expect(listing.listingId).to.equal(erc721ListingId);
      expect(listing.erc721TokenAddress).to.equal(maticDiamondAddress);
      expect(listing.erc721TokenId).to.equal(erc721TokenId);
    });
    it("getAavegotchiListing", async function () {
      const { listing_, aavegotchiInfo_ } =
        await marketplaceGetter.getAavegotchiListing(erc721ListingId);
      expect(listing_.listingId).to.equal(erc721ListingId);
      expect(listing_.erc721TokenAddress).to.equal(maticDiamondAddress);
      expect(listing_.erc721TokenId).to.equal(erc721TokenId);
      expect(aavegotchiInfo_.tokenId).to.equal(erc721TokenId);
    });
  });

  describe("getter functions of ERC1155 Listings", async function () {
    it("getERC1155Listing", async function () {
      const listing = await marketplaceGetter.getERC1155Listing(
        erc1155ListingId
      );
      expect(listing.listingId).to.equal(erc1155ListingId);
      expect(listing.erc1155TokenAddress).to.equal(maticDiamondAddress);
      expect(listing.erc1155TypeId).to.equal(erc1155TokenId);
    });
  });
});
