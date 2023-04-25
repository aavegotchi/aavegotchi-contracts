/* global describe it before ethers network */
/* eslint prefer-const: "off" */

//@ts-ignore
import { ethers, network } from "hardhat";
import { upgrade } from "../scripts/upgrades/upgrade-updateERC1155ListingPriceAndQuantity";
import {
  ERC1155MarketplaceFacet,
  IERC20,
  MarketplaceGetterFacet,
} from "../typechain";
import {
  aavegotchiDiamondAddressMatic,
  ghstAddress,
} from "../helpers/constants";
import { expect } from "chai";
import { impersonate } from "../scripts/helperFunctions";

let ghst: IERC20;

describe("Testing update ERC1155 listing price and quantity", async function () {
  this.timeout(300000);

  const diamondAddress = aavegotchiDiamondAddressMatic;
  const erc1155ListingId = 351752;
  const newListingPrice = "1";
  const newListingQuantity = "10";
  const ghstHolderAddress = "0x3721546e51258065bfdb9746b2e442C7671B0298"; // Should be GHST holder
  let erc1155MarketplaceFacet: ERC1155MarketplaceFacet;
  let erc1155MarketWithBuyer: ERC1155MarketplaceFacet;
  let marketplaceGetter: MarketplaceGetterFacet;
  let listing: any;
  let snapshot: any;

  before(async function () {
    await upgrade();

    erc1155MarketplaceFacet = (await ethers.getContractAt(
      "ERC1155MarketplaceFacet",
      diamondAddress
    )) as ERC1155MarketplaceFacet;
    marketplaceGetter = (await ethers.getContractAt(
      "MarketplaceGetterFacet",
      diamondAddress
    )) as MarketplaceGetterFacet;

    // get seller of listing
    listing = await marketplaceGetter.getERC1155Listing(erc1155ListingId);
    const sellerAddress = listing.seller;

    erc1155MarketplaceFacet = await impersonate(
      sellerAddress,
      erc1155MarketplaceFacet,
      ethers,
      network
    );
    erc1155MarketWithBuyer = await impersonate(
      ghstHolderAddress,
      erc1155MarketplaceFacet,
      ethers,
      network
    );

    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [ghstHolderAddress],
    });
    const ghstHolder = await ethers.getSigner(ghstHolderAddress);
    ghst = (await ethers.getContractAt(
      "contracts/shared/interfaces/IERC20.sol:IERC20",
      ghstAddress,
      ghstHolder
    )) as IERC20;
    await ghst.approve(diamondAddress, ethers.utils.parseEther("100000000"));

    snapshot = await ethers.provider.send("evm_snapshot", []);
  });

  afterEach(async function () {
    // rollback
    await ethers.provider.send("evm_revert", [snapshot]);
    snapshot = await ethers.provider.send("evm_snapshot", []);
  });

  describe("updateERC1155ListingPriceAndQuantity", async function () {
    it("Should revert if invalid erc1155 listing id", async function () {
      await expect(
        erc1155MarketplaceFacet.updateERC1155ListingPriceAndQuantity(
          erc1155ListingId + 1000000,
          newListingQuantity,
          ethers.utils.parseEther(newListingPrice)
        )
      ).to.be.revertedWith("ERC1155Marketplace: listing not found");
    });
    it("Should revert if erc1155 listing already sold", async function () {
      await (
        await erc1155MarketWithBuyer.executeERC1155ListingToRecipient(
          erc1155ListingId,
          listing.erc1155TokenAddress,
          listing.erc1155TypeId,
          listing.quantity,
          listing.priceInWei,
          ghstHolderAddress
        )
      ).wait();
      await expect(
        erc1155MarketplaceFacet.updateERC1155ListingPriceAndQuantity(
          erc1155ListingId,
          newListingQuantity,
          ethers.utils.parseEther(newListingPrice)
        )
      ).to.be.revertedWith("ERC1155Marketplace: listing is sold out");
    });
    it("Should revert if erc1155 listing already canceled", async function () {
      await (
        await erc1155MarketplaceFacet.cancelERC1155Listing(erc1155ListingId)
      ).wait();
      await expect(
        erc1155MarketplaceFacet.updateERC1155ListingPriceAndQuantity(
          erc1155ListingId,
          newListingQuantity,
          ethers.utils.parseEther(newListingPrice)
        )
      ).to.be.revertedWith("ERC1155Marketplace: listing already cancelled");
    });
    it("Should revert if cost smaller than 1e18", async function () {
      await expect(
        erc1155MarketWithBuyer.updateERC1155ListingPriceAndQuantity(
          erc1155ListingId,
          0,
          ethers.utils.parseEther(newListingPrice)
        )
      ).to.be.revertedWith(
        "ERC1155Marketplace: cost should be 1 GHST or larger"
      );
      await expect(
        erc1155MarketWithBuyer.updateERC1155ListingPriceAndQuantity(
          erc1155ListingId,
          newListingQuantity,
          ethers.utils.parseEther("0")
        )
      ).to.be.revertedWith(
        "ERC1155Marketplace: cost should be 1 GHST or larger"
      );
    });
    it("Should revert if not seller of ERC1155 listing", async function () {
      await expect(
        erc1155MarketWithBuyer.updateERC1155ListingPriceAndQuantity(
          erc1155ListingId,
          newListingQuantity,
          ethers.utils.parseEther(newListingPrice)
        )
      ).to.be.revertedWith("ERC1155Marketplace: Not seller of ERC1155 listing");
    });
    it("Should success if all parameters are valid", async function () {
      const receipt = await (
        await erc1155MarketplaceFacet.updateERC1155ListingPriceAndQuantity(
          erc1155ListingId,
          newListingQuantity,
          ethers.utils.parseEther(newListingPrice)
        )
      ).wait();
      const listing = await marketplaceGetter.getERC1155Listing(
        erc1155ListingId
      );
      expect(listing.listingId).to.equal(erc1155ListingId);
      expect(listing.priceInWei).to.equal(
        ethers.utils.parseEther(newListingPrice)
      );
    });
  });

  describe("batchUpdateERC1155ListingPriceAndQuantity", async function () {
    it("Should revert if array length not matched", async function () {
      await expect(
        erc1155MarketplaceFacet.batchUpdateERC1155ListingPriceAndQuantity(
          [erc1155ListingId],
          [newListingQuantity, newListingQuantity],
          [ethers.utils.parseEther(newListingPrice)]
        )
      ).to.be.revertedWith(
        "ERC1155Marketplace: listing ids not same length as quantities"
      );
      await expect(
        erc1155MarketplaceFacet.batchUpdateERC1155ListingPriceAndQuantity(
          [erc1155ListingId],
          [newListingQuantity],
          [
            ethers.utils.parseEther(newListingPrice),
            ethers.utils.parseEther(newListingPrice),
          ]
        )
      ).to.be.revertedWith(
        "ERC1155Marketplace: listing ids not same length as prices"
      );
    });
    it("Should revert if invalid erc1155 listing id", async function () {
      await expect(
        erc1155MarketplaceFacet.batchUpdateERC1155ListingPriceAndQuantity(
          [erc1155ListingId + 1000000],
          [newListingQuantity],
          [ethers.utils.parseEther(newListingPrice)]
        )
      ).to.be.revertedWith("ERC1155Marketplace: listing not found");
    });
    it("Should revert if erc1155 listing already sold", async function () {
      await (
        await erc1155MarketWithBuyer.executeERC1155ListingToRecipient(
          erc1155ListingId,
          listing.erc1155TokenAddress,
          listing.erc1155TypeId,
          listing.quantity,
          listing.priceInWei,
          ghstHolderAddress
        )
      ).wait();
      await expect(
        erc1155MarketplaceFacet.batchUpdateERC1155ListingPriceAndQuantity(
          [erc1155ListingId],
          [newListingQuantity],
          [ethers.utils.parseEther(newListingPrice)]
        )
      ).to.be.revertedWith("ERC1155Marketplace: listing is sold out");
    });
    it("Should revert if erc1155 listing already canceled", async function () {
      await (
        await erc1155MarketplaceFacet.cancelERC1155Listing(erc1155ListingId)
      ).wait();
      await expect(
        erc1155MarketplaceFacet.batchUpdateERC1155ListingPriceAndQuantity(
          [erc1155ListingId],
          [newListingQuantity],
          [ethers.utils.parseEther(newListingPrice)]
        )
      ).to.be.revertedWith("ERC1155Marketplace: listing already cancelled");
    });
    it("Should revert if cost smaller than 1e18", async function () {
      await expect(
        erc1155MarketWithBuyer.batchUpdateERC1155ListingPriceAndQuantity(
          [erc1155ListingId],
          [0],
          [ethers.utils.parseEther(newListingPrice)]
        )
      ).to.be.revertedWith(
        "ERC1155Marketplace: cost should be 1 GHST or larger"
      );
      await expect(
        erc1155MarketWithBuyer.batchUpdateERC1155ListingPriceAndQuantity(
          [erc1155ListingId],
          [newListingQuantity],
          [ethers.utils.parseEther("0")]
        )
      ).to.be.revertedWith(
        "ERC1155Marketplace: cost should be 1 GHST or larger"
      );
    });
    it("Should revert if not seller of ERC1155 listing", async function () {
      await expect(
        erc1155MarketWithBuyer.batchUpdateERC1155ListingPriceAndQuantity(
          [erc1155ListingId],
          [newListingQuantity],
          [ethers.utils.parseEther(newListingPrice)]
        )
      ).to.be.revertedWith("ERC1155Marketplace: Not seller of ERC1155 listing");
    });
    it("Should success if all parameters are valid", async function () {
      await (
        await erc1155MarketplaceFacet.batchUpdateERC1155ListingPriceAndQuantity(
          [erc1155ListingId],
          [newListingQuantity],
          [ethers.utils.parseEther(newListingPrice)]
        )
      ).wait();

      const listing = await marketplaceGetter.getERC1155Listing(
        erc1155ListingId
      );
      expect(listing.listingId).to.equal(erc1155ListingId);
      expect(listing.priceInWei).to.equal(
        ethers.utils.parseEther(newListingPrice)
      );
    });
  });
});
