import { ethers } from "hardhat";
import {
  getDiamondSigner,
  maticDiamondAddress,
} from "../scripts/helperFunctions";
import {
  ERC1155MarketplaceFacet,
  ERC721MarketplaceFacet,
  IERC20,
} from "../typechain";
import { Signer } from "@ethersproject/abstract-signer";
import { expect } from "chai";
import { upgradeBatchExecuteListings } from "../scripts/upgrades/upgrade-batchExecuteListings";
import { ghstAddress } from "../helpers/constants";

const hre = require("hardhat");

describe("Batch execute listings", async function () {
  this.timeout(200000000);

  let erc721MarketplaceFacet: ERC721MarketplaceFacet;
  let erc1155MarketplaceFacet: ERC1155MarketplaceFacet;
  const testAccount = "0xF977814e90dA44bFA03b6295A0616a897441aceC"; // GHST, MATIC holder
  let erc721ListingParams: any;
  let erc1155ListingParams: any;

  before(async function () {
    await upgradeBatchExecuteListings();

    const signer: Signer = await getDiamondSigner(hre, testAccount, false);

    erc721MarketplaceFacet = (await ethers.getContractAt(
      "ERC721MarketplaceFacet",
      maticDiamondAddress,
      signer
    )) as ERC721MarketplaceFacet;

    erc1155MarketplaceFacet = (await ethers.getContractAt(
      "ERC1155MarketplaceFacet",
      maticDiamondAddress,
      signer
    )) as ERC1155MarketplaceFacet;

    const ghst = (await ethers.getContractAt(
      "contracts/shared/interfaces/IERC20.sol:IERC20",
      ghstAddress,
      signer
    )) as IERC20;
    //approve
    await ghst.approve(
      maticDiamondAddress,
      ethers.utils.parseEther("10000000")
    );

    const erc721Listings = await erc721MarketplaceFacet.getERC721Listings(
      2,
      "listed",
      11
    );
    erc721ListingParams = erc721Listings.map((listing) => ({
      listingId: listing.listingId,
      contractAddress: listing.erc721TokenAddress,
      priceInWei: listing.priceInWei,
      tokenId: listing.erc721TokenId,
      recipient: testAccount,
    }));
    const erc1155Listings = await erc1155MarketplaceFacet.getERC1155Listings(
      0,
      "listed",
      11
    );
    erc1155ListingParams = erc1155Listings.map((listing) => ({
      listingId: listing.listingId,
      contractAddress: listing.erc1155TokenAddress,
      priceInWei: listing.priceInWei,
      itemId: listing.erc1155TypeId,
      quantity: listing.quantity,
      recipient: testAccount,
    }));
    // console.log("erc721ListingParams", erc721ListingParams);
    // console.log("erc1155ListingParams", erc1155ListingParams);
  });

  describe("Testing batchExecuteERC721Listing", async function () {
    it("Should revert if length exceeds 10", async function () {
      await expect(
        erc721MarketplaceFacet.batchExecuteERC721Listing(erc721ListingParams)
      ).to.be.revertedWith("ERC721Marketplace: length should be lower than 10");
    });
    it("Should succeed if length is less than 10 and all are valid", async function () {
      const receipt = await (
        await erc721MarketplaceFacet.batchExecuteERC721Listing(
          erc721ListingParams.slice(0, 10)
        )
      ).wait();
      const events = receipt!.events!.filter(
        (event) => event.event === "ERC721ExecutedListing"
      );
      expect(events.length).to.equal(10);
      for (let i = 0; i < events.length; i++) {
        // @ts-ignore
        expect(events[i].args.buyer).to.equal(testAccount);
      }
    });
  });

  describe("Testing batchExecuteERC1155Listing", async function () {
    it("Should revert if length exceeds 10", async function () {
      await expect(
        erc1155MarketplaceFacet.batchExecuteERC1155Listing(erc1155ListingParams)
      ).to.be.revertedWith(
        "ERC1155Marketplace: length should be lower than 10"
      );
    });
    it("Should succeed if length is less than 10 and all are valid", async function () {
      const receipt = await (
        await erc1155MarketplaceFacet.batchExecuteERC1155Listing(
          erc1155ListingParams.slice(0, 10)
        )
      ).wait();
      const events = receipt!.events!.filter(
        (event) => event.event === "ERC1155ExecutedListing"
      );
      expect(events.length).to.equal(10);
      for (let i = 0; i < events.length; i++) {
        // @ts-ignore
        expect(events[i].args.buyer).to.equal(testAccount);
      }
    });
  });
});
