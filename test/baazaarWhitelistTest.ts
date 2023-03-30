/* global describe it before ethers network */
/* eslint prefer-const: "off" */

//@ts-ignore
import { ethers, network } from "hardhat";
import {
  AavegotchiFacet,
  ERC1155MarketplaceFacet,
  ERC721MarketplaceFacet,
  IERC20,
  ItemsFacet,
  MarketplaceGetterFacet,
  WhitelistFacet,
} from "../typechain";
import {
  aavegotchiDAOAddress,
  aavegotchiDiamondAddressMatic,
  ghstAddress,
  pixelcraftAddress,
  playerRewardsAddress,
} from "../helpers/constants";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { impersonate } from "../scripts/helperFunctions";
import { upgradeBaazaarWhitelist } from "../scripts/upgrades/upgrade-baazaarWhitelist";

let ghst: IERC20;

describe("Testing Baazaar Whitelist", async function () {
  //this.timeout(300000);
  const diamondAddress = aavegotchiDiamondAddressMatic;
  const whitelistedBuyerAddress = "0x3721546e51258065bfdb9746b2e442C7671B0298"; // Should be GHST holder
  const nonWhitelistedBuyerAddress =
    "0xF977814e90dA44bFA03b6295A0616a897441aceC"; // Should be GHST holder
  const gotchiOwnerAddress = "0xb7601193f559de56D67FB8e6a2AF219b05BD36c7"; // Should be Gotchi owner
  const itemOwnerAddress = "0xb7601193f559de56D67FB8e6a2AF219b05BD36c7"; // Should be Item owner
  const erc721Id = 16911; // Should be unlocked erc721/gotchi
  const testPrice = "1";
  const principalSplit: [number, number] = [10000, 0]; // 100% and 0%
  const affiliate = ethers.constants.AddressZero;
  const erc1155Id = 138; // Should be erc1155/item
  const test1155Quantity = "1";

  let marketplaceGetter: MarketplaceGetterFacet;
  let erc721MarketWithGotchiSeller: ERC721MarketplaceFacet;
  let erc721MarketWithWhitelistedBuyer: ERC721MarketplaceFacet;
  let erc721MarketWithNonWhitelistedBuyer: ERC721MarketplaceFacet;
  let erc1155MarketWithItemSeller: ERC1155MarketplaceFacet;
  let erc1155MarketWithWhitelistedBuyer: ERC1155MarketplaceFacet;
  let erc1155MarketWithNonWhitelistedBuyer: ERC1155MarketplaceFacet;
  let erc721: AavegotchiFacet;
  let erc1155: ItemsFacet;
  let snapshotInit: any;
  let snapshot: any;

  let whitelistId: BigNumber;
  let erc721ListingId: BigNumber;
  let erc1155ListingId: BigNumber;

  before(async function () {
    await upgradeBaazaarWhitelist();

    const erc721MarketplaceFacet = (await ethers.getContractAt(
      "ERC721MarketplaceFacet",
      diamondAddress
    )) as ERC721MarketplaceFacet;
    const erc1155MarketplaceFacet = (await ethers.getContractAt(
      "ERC1155MarketplaceFacet",
      diamondAddress
    )) as ERC1155MarketplaceFacet;
    const whitelistFacet = (await ethers.getContractAt(
      "WhitelistFacet",
      diamondAddress
    )) as WhitelistFacet;
    marketplaceGetter = (await ethers.getContractAt(
      "MarketplaceGetterFacet",
      diamondAddress
    )) as MarketplaceGetterFacet;

    erc721 = (await ethers.getContractAt(
      "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
      diamondAddress
    )) as AavegotchiFacet;

    erc1155 = (await ethers.getContractAt(
      "contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet",
      diamondAddress
    )) as ItemsFacet;

    erc721MarketWithGotchiSeller = await impersonate(
      gotchiOwnerAddress,
      erc721MarketplaceFacet,
      ethers,
      network
    );
    erc721MarketWithWhitelistedBuyer = await impersonate(
      whitelistedBuyerAddress,
      erc721MarketplaceFacet,
      ethers,
      network
    );
    erc721MarketWithNonWhitelistedBuyer = await impersonate(
      nonWhitelistedBuyerAddress,
      erc721MarketplaceFacet,
      ethers,
      network
    );

    erc1155MarketWithItemSeller = await impersonate(
      itemOwnerAddress,
      erc1155MarketplaceFacet,
      ethers,
      network
    );
    erc1155MarketWithWhitelistedBuyer = await impersonate(
      whitelistedBuyerAddress,
      erc1155MarketplaceFacet,
      ethers,
      network
    );
    erc1155MarketWithNonWhitelistedBuyer = await impersonate(
      nonWhitelistedBuyerAddress,
      erc1155MarketplaceFacet,
      ethers,
      network
    );

    // create whitelist for test
    const whitelistFacetWithOwner = await impersonate(
      gotchiOwnerAddress,
      whitelistFacet,
      ethers,
      network
    );
    const receipt = await (
      await whitelistFacetWithOwner.createWhitelist("test", [
        whitelistedBuyerAddress,
      ])
    ).wait();
    const event = receipt!.events!.find(
      (event) => event.event === "WhitelistCreated"
    );
    whitelistId = event!.args!.whitelistId;

    await network.provider.request({
      method: "hardhat_setBalance",
      params: [gotchiOwnerAddress, "0x100000000000000000000000"],
    });

    ghst = (await ethers.getContractAt(
      "contracts/shared/interfaces/IERC20.sol:IERC20",
      ghstAddress
    )) as IERC20;
    ghst = await impersonate(whitelistedBuyerAddress, ghst, ethers, network);
    await ghst.approve(diamondAddress, ethers.utils.parseEther("100000000"));
    ghst = await impersonate(nonWhitelistedBuyerAddress, ghst, ethers, network);
    await ghst.approve(diamondAddress, ethers.utils.parseEther("100000000"));

    snapshotInit = await ethers.provider.send("evm_snapshot", []);
  });

  describe("ERC721MarketplaceFacet", async function () {
    describe("ERC721 listing without whitelist", async function () {
      after(async function () {
        await ethers.provider.send("evm_revert", [snapshotInit]);
      });
      describe("addERC721ListingWithWhitelist", async function () {
        it("Should success if all parameters are valid", async function () {
          const receipt = await (
            await erc721MarketWithGotchiSeller.addERC721ListingWithWhitelist(
              diamondAddress,
              erc721Id,
              ethers.utils.parseEther(testPrice),
              principalSplit,
              affiliate,
              0
            )
          ).wait();
          let event = receipt!.events!.find(
            (event) => event.event === "ERC721ListingAdd"
          );
          erc721ListingId = event!.args!.listingId;
          expect(event!.args!.seller).to.equal(gotchiOwnerAddress);
          expect(event!.args!.erc721TokenAddress).to.equal(diamondAddress);
          expect(event!.args!.erc721TokenId).to.equal(erc721Id);

          event = receipt!.events!.find(
            (event) => event.event === "ERC721ListingWhitelistSet"
          );
          expect(event).to.equal(undefined);

          snapshot = await ethers.provider.send("evm_snapshot", []);
        });
      });
      describe("getERC721Listing", async function () {
        it("Should return correct params if valid listing id", async function () {
          const listing = await marketplaceGetter.getERC721Listing(
            erc721ListingId
          );
          expect(listing.seller).to.equal(gotchiOwnerAddress);
          expect(listing.erc721TokenAddress).to.equal(diamondAddress);
          expect(listing.erc721TokenId).to.equal(erc721Id);
          expect(listing.whitelistId).to.equal(0);
        });
      });
      describe("executeERC721Listing", async function () {
        afterEach(async function () {
          await ethers.provider.send("evm_revert", [snapshot]);
        });
        it("Should success even if buyer is non-whitelisted", async function () {
          const ghstBalanceBuyerBefore = await ghst.balanceOf(
            nonWhitelistedBuyerAddress
          );
          const ghstBalanceSellerBefore = await ghst.balanceOf(
            gotchiOwnerAddress
          );
          const ghstBalancePixelCraftBefore = await ghst.balanceOf(
            pixelcraftAddress
          );
          const ghstBalanceDaoBefore = await ghst.balanceOf(
            aavegotchiDAOAddress
          );
          const ghstBalancePlayerBefore = await ghst.balanceOf(
            playerRewardsAddress
          );

          const receipt = await (
            await erc721MarketWithNonWhitelistedBuyer.executeERC721Listing(
              erc721ListingId
            )
          ).wait();
          const event = receipt!.events!.find(
            (event) => event.event === "ERC721ExecutedListing"
          );
          expect(event!.args!.seller).to.equal(gotchiOwnerAddress);
          expect(event!.args!.buyer).to.equal(nonWhitelistedBuyerAddress);
          expect(event!.args!.erc721TokenAddress).to.equal(diamondAddress);
          expect(event!.args!.erc721TokenId).to.equal(erc721Id);

          const ghstBalanceBuyerAfter = await ghst.balanceOf(
            nonWhitelistedBuyerAddress
          );
          const ghstBalanceSellerAfter = await ghst.balanceOf(
            gotchiOwnerAddress
          );
          const ghstBalancePixelCraftAfter = await ghst.balanceOf(
            pixelcraftAddress
          );
          const ghstBalanceDaoAfter = await ghst.balanceOf(
            aavegotchiDAOAddress
          );
          const ghstBalancePlayerAfter = await ghst.balanceOf(
            playerRewardsAddress
          );

          expect(
            ghstBalancePixelCraftAfter.sub(ghstBalancePixelCraftBefore)
          ).to.equal(ethers.utils.parseEther(testPrice).div(50)); // 2%
          expect(ghstBalanceDaoAfter.sub(ghstBalanceDaoBefore)).to.equal(
            ethers.utils.parseEther(testPrice).div(100)
          ); // 1%
          expect(ghstBalancePlayerAfter.sub(ghstBalancePlayerBefore)).to.equal(
            ethers.utils.parseEther(testPrice).div(200)
          ); // 0.5%
          expect(ghstBalanceBuyerBefore.sub(ghstBalanceBuyerAfter)).to.equal(
            ethers.utils.parseEther(testPrice)
          );
          expect(ghstBalanceSellerAfter.sub(ghstBalanceSellerBefore)).to.equal(
            ethers.utils.parseEther(testPrice).mul(965).div(1000)
          ); // 96.5%

          const ownerAfter = await erc721.ownerOf(erc721Id);
          expect(ownerAfter).to.equal(nonWhitelistedBuyerAddress);
        });
        it("Should success if buyer is whitelisted", async function () {
          const ghstBalanceBuyerBefore = await ghst.balanceOf(
            whitelistedBuyerAddress
          );
          const ghstBalanceSellerBefore = await ghst.balanceOf(
            gotchiOwnerAddress
          );
          const ghstBalancePixelCraftBefore = await ghst.balanceOf(
            pixelcraftAddress
          );
          const ghstBalanceDaoBefore = await ghst.balanceOf(
            aavegotchiDAOAddress
          );
          const ghstBalancePlayerBefore = await ghst.balanceOf(
            playerRewardsAddress
          );

          const receipt = await (
            await erc721MarketWithWhitelistedBuyer.executeERC721Listing(
              erc721ListingId
            )
          ).wait();
          const event = receipt!.events!.find(
            (event) => event.event === "ERC721ExecutedListing"
          );
          expect(event!.args!.seller).to.equal(gotchiOwnerAddress);
          expect(event!.args!.buyer).to.equal(whitelistedBuyerAddress);
          expect(event!.args!.erc721TokenAddress).to.equal(diamondAddress);
          expect(event!.args!.erc721TokenId).to.equal(erc721Id);

          const ghstBalanceBuyerAfter = await ghst.balanceOf(
            whitelistedBuyerAddress
          );
          const ghstBalanceSellerAfter = await ghst.balanceOf(
            gotchiOwnerAddress
          );
          const ghstBalancePixelCraftAfter = await ghst.balanceOf(
            pixelcraftAddress
          );
          const ghstBalanceDaoAfter = await ghst.balanceOf(
            aavegotchiDAOAddress
          );
          const ghstBalancePlayerAfter = await ghst.balanceOf(
            playerRewardsAddress
          );

          expect(
            ghstBalancePixelCraftAfter.sub(ghstBalancePixelCraftBefore)
          ).to.equal(ethers.utils.parseEther(testPrice).div(50)); // 2%
          expect(ghstBalanceDaoAfter.sub(ghstBalanceDaoBefore)).to.equal(
            ethers.utils.parseEther(testPrice).div(100)
          ); // 1%
          expect(ghstBalancePlayerAfter.sub(ghstBalancePlayerBefore)).to.equal(
            ethers.utils.parseEther(testPrice).div(200)
          ); // 0.5%
          expect(ghstBalanceBuyerBefore.sub(ghstBalanceBuyerAfter)).to.equal(
            ethers.utils.parseEther(testPrice)
          );
          expect(ghstBalanceSellerAfter.sub(ghstBalanceSellerBefore)).to.equal(
            ethers.utils.parseEther(testPrice).mul(965).div(1000)
          ); // 96.5%

          const ownerAfter = await erc721.ownerOf(erc721Id);
          expect(ownerAfter).to.equal(whitelistedBuyerAddress);
        });
      });
    });
    describe("ERC721 listing with whitelist", async function () {
      after(async function () {
        await ethers.provider.send("evm_revert", [snapshotInit]);
      });
      describe("addERC721ListingWithWhitelist", async function () {
        it("Should success if all parameters are valid", async function () {
          const receipt = await (
            await erc721MarketWithGotchiSeller.addERC721ListingWithWhitelist(
              diamondAddress,
              erc721Id,
              ethers.utils.parseEther(testPrice),
              principalSplit,
              affiliate,
              whitelistId
            )
          ).wait();
          let event = receipt!.events!.find(
            (event) => event.event === "ERC721ListingAdd"
          );
          erc721ListingId = event!.args!.listingId;
          expect(event!.args!.seller).to.equal(gotchiOwnerAddress);
          expect(event!.args!.erc721TokenAddress).to.equal(diamondAddress);
          expect(event!.args!.erc721TokenId).to.equal(erc721Id);

          event = receipt!.events!.find(
            (event) => event.event === "ERC721ListingWhitelistSet"
          );
          expect(event!.args!.whitelistId).to.equal(whitelistId);
        });
      });
      describe("getERC721Listing", async function () {
        it("Should return correct params if valid listing id", async function () {
          const listing = await marketplaceGetter.getERC721Listing(
            erc721ListingId
          );
          expect(listing.seller).to.equal(gotchiOwnerAddress);
          expect(listing.erc721TokenAddress).to.equal(diamondAddress);
          expect(listing.erc721TokenId).to.equal(erc721Id);
          expect(listing.whitelistId).to.equal(whitelistId);
        });
      });
      describe("executeERC721Listing", async function () {
        it("Should revert if buyer is non-whitelisted", async function () {
          await expect(
            erc721MarketWithNonWhitelistedBuyer.executeERC721Listing(
              erc721ListingId
            )
          ).to.be.revertedWith("ERC721Marketplace: Not whitelisted address");
        });
        it("Should success if buyer is whitelisted", async function () {
          const ghstBalanceBuyerBefore = await ghst.balanceOf(
            whitelistedBuyerAddress
          );
          const ghstBalanceSellerBefore = await ghst.balanceOf(
            gotchiOwnerAddress
          );
          const ghstBalancePixelCraftBefore = await ghst.balanceOf(
            pixelcraftAddress
          );
          const ghstBalanceDaoBefore = await ghst.balanceOf(
            aavegotchiDAOAddress
          );
          const ghstBalancePlayerBefore = await ghst.balanceOf(
            playerRewardsAddress
          );

          const receipt = await (
            await erc721MarketWithWhitelistedBuyer.executeERC721Listing(
              erc721ListingId
            )
          ).wait();
          const event = receipt!.events!.find(
            (event) => event.event === "ERC721ExecutedListing"
          );
          expect(event!.args!.seller).to.equal(gotchiOwnerAddress);
          expect(event!.args!.buyer).to.equal(whitelistedBuyerAddress);
          expect(event!.args!.erc721TokenAddress).to.equal(diamondAddress);
          expect(event!.args!.erc721TokenId).to.equal(erc721Id);

          const ghstBalanceBuyerAfter = await ghst.balanceOf(
            whitelistedBuyerAddress
          );
          const ghstBalanceSellerAfter = await ghst.balanceOf(
            gotchiOwnerAddress
          );
          const ghstBalancePixelCraftAfter = await ghst.balanceOf(
            pixelcraftAddress
          );
          const ghstBalanceDaoAfter = await ghst.balanceOf(
            aavegotchiDAOAddress
          );
          const ghstBalancePlayerAfter = await ghst.balanceOf(
            playerRewardsAddress
          );

          expect(
            ghstBalancePixelCraftAfter.sub(ghstBalancePixelCraftBefore)
          ).to.equal(ethers.utils.parseEther(testPrice).div(50)); // 2%
          expect(ghstBalanceDaoAfter.sub(ghstBalanceDaoBefore)).to.equal(
            ethers.utils.parseEther(testPrice).div(100)
          ); // 1%
          expect(ghstBalancePlayerAfter.sub(ghstBalancePlayerBefore)).to.equal(
            ethers.utils.parseEther(testPrice).div(200)
          ); // 0.5%
          expect(ghstBalanceBuyerBefore.sub(ghstBalanceBuyerAfter)).to.equal(
            ethers.utils.parseEther(testPrice)
          );
          expect(ghstBalanceSellerAfter.sub(ghstBalanceSellerBefore)).to.equal(
            ethers.utils.parseEther(testPrice).mul(965).div(1000)
          ); // 96.5%

          const ownerAfter = await erc721.ownerOf(erc721Id);
          expect(ownerAfter).to.equal(whitelistedBuyerAddress);
        });
      });
    });
  });

  describe("ERC1155MarketplaceFacet", async function () {
    before(async function () {
      snapshotInit = await ethers.provider.send("evm_snapshot", []);
    });
    describe("ERC1155 listing without whitelist", async function () {
      after(async function () {
        await ethers.provider.send("evm_revert", [snapshotInit]);
      });
      describe("setERC1155Listing", async function () {
        it("Should success if all parameters are valid", async function () {
          const receipt = await (
            await erc1155MarketWithItemSeller.setERC1155ListingWithWhitelist(
              diamondAddress,
              erc1155Id,
              test1155Quantity,
              ethers.utils.parseEther(testPrice),
              principalSplit,
              affiliate,
              0
            )
          ).wait();
          let event = receipt!.events!.find(
            (event) => event.event === "ERC1155ListingAdd"
          );
          erc1155ListingId = event!.args!.listingId;
          expect(event!.args!.seller).to.equal(itemOwnerAddress);
          expect(event!.args!.erc1155TokenAddress).to.equal(diamondAddress);
          expect(event!.args!.erc1155TypeId).to.equal(erc1155Id);
          expect(event!.args!.quantity).to.equal(test1155Quantity);

          event = receipt!.events!.find(
            (event) => event.event === "ERC1155ListingWhitelistSet"
          );
          expect(event).to.equal(undefined);

          snapshot = await ethers.provider.send("evm_snapshot", []);
        });
      });
      describe("getERC1155Listing", async function () {
        it("Should return correct params if valid listing id", async function () {
          const listing = await marketplaceGetter.getERC1155Listing(
            erc1155ListingId
          );
          expect(listing.seller).to.equal(itemOwnerAddress);
          expect(listing.erc1155TokenAddress).to.equal(diamondAddress);
          expect(listing.erc1155TypeId).to.equal(erc1155Id);
          expect(listing.whitelistId).to.equal(0);
        });
      });
      describe("executeERC1155Listing", async function () {
        afterEach(async function () {
          await ethers.provider.send("evm_revert", [snapshot]);
        });
        it("Should success even if buyer is non-whitelisted", async function () {
          const ghstBalanceBuyerBefore = await ghst.balanceOf(
            nonWhitelistedBuyerAddress
          );
          const ghstBalanceSellerBefore = await ghst.balanceOf(
            itemOwnerAddress
          );
          const ghstBalancePixelCraftBefore = await ghst.balanceOf(
            pixelcraftAddress
          );
          const ghstBalanceDaoBefore = await ghst.balanceOf(
            aavegotchiDAOAddress
          );
          const ghstBalancePlayerBefore = await ghst.balanceOf(
            playerRewardsAddress
          );
          const erc1155BalanceOwnerBefore = await erc1155.balanceOf(
            itemOwnerAddress,
            erc1155Id
          );
          const erc1155BalanceBuyerBefore = await erc1155.balanceOf(
            nonWhitelistedBuyerAddress,
            erc1155Id
          );

          const receipt = await (
            await erc1155MarketWithNonWhitelistedBuyer.executeERC1155Listing(
              erc1155ListingId,
              test1155Quantity,
              ethers.utils.parseEther(testPrice)
            )
          ).wait();
          const event = receipt!.events!.find(
            (event) => event.event === "ERC1155ExecutedListing"
          );
          expect(event!.args!.seller).to.equal(itemOwnerAddress);
          expect(event!.args!.buyer).to.equal(nonWhitelistedBuyerAddress);
          expect(event!.args!.erc1155TokenAddress).to.equal(diamondAddress);
          expect(event!.args!.erc1155TypeId).to.equal(erc1155Id);
          expect(event!.args!._quantity).to.equal(test1155Quantity);

          const ghstBalanceBuyerAfter = await ghst.balanceOf(
            nonWhitelistedBuyerAddress
          );
          const ghstBalanceSellerAfter = await ghst.balanceOf(itemOwnerAddress);
          const ghstBalancePixelCraftAfter = await ghst.balanceOf(
            pixelcraftAddress
          );
          const ghstBalanceDaoAfter = await ghst.balanceOf(
            aavegotchiDAOAddress
          );
          const ghstBalancePlayerAfter = await ghst.balanceOf(
            playerRewardsAddress
          );

          const cost = ethers.utils.parseEther(testPrice).mul(test1155Quantity);
          expect(
            ghstBalancePixelCraftAfter.sub(ghstBalancePixelCraftBefore)
          ).to.equal(cost.div(50)); // 2%
          expect(ghstBalanceDaoAfter.sub(ghstBalanceDaoBefore)).to.equal(
            cost.div(100)
          ); // 1%
          expect(ghstBalancePlayerAfter.sub(ghstBalancePlayerBefore)).to.equal(
            cost.div(200)
          ); // 0.5%
          expect(ghstBalanceBuyerBefore.sub(ghstBalanceBuyerAfter)).to.equal(
            cost
          );
          expect(ghstBalanceSellerAfter.sub(ghstBalanceSellerBefore)).to.equal(
            cost.mul(965).div(1000)
          ); // 96.5%

          const erc1155BalanceOwnerAfter = await erc1155.balanceOf(
            itemOwnerAddress,
            erc1155Id
          );
          const erc1155BalanceBuyerAfter = await erc1155.balanceOf(
            nonWhitelistedBuyerAddress,
            erc1155Id
          );
          expect(
            erc1155BalanceOwnerBefore.sub(erc1155BalanceOwnerAfter)
          ).to.equal(test1155Quantity);
          expect(
            erc1155BalanceBuyerAfter.sub(erc1155BalanceBuyerBefore)
          ).to.equal(test1155Quantity);
        });
        it("Should success if buyer is whitelisted", async function () {
          const ghstBalanceBuyerBefore = await ghst.balanceOf(
            whitelistedBuyerAddress
          );
          const ghstBalanceSellerBefore = await ghst.balanceOf(
            itemOwnerAddress
          );
          const ghstBalancePixelCraftBefore = await ghst.balanceOf(
            pixelcraftAddress
          );
          const ghstBalanceDaoBefore = await ghst.balanceOf(
            aavegotchiDAOAddress
          );
          const ghstBalancePlayerBefore = await ghst.balanceOf(
            playerRewardsAddress
          );
          const erc1155BalanceOwnerBefore = await erc1155.balanceOf(
            itemOwnerAddress,
            erc1155Id
          );
          const erc1155BalanceBuyerBefore = await erc1155.balanceOf(
            whitelistedBuyerAddress,
            erc1155Id
          );

          const receipt = await (
            await erc1155MarketWithWhitelistedBuyer.executeERC1155Listing(
              erc1155ListingId,
              test1155Quantity,
              ethers.utils.parseEther(testPrice)
            )
          ).wait();
          const event = receipt!.events!.find(
            (event) => event.event === "ERC1155ExecutedListing"
          );
          expect(event!.args!.seller).to.equal(itemOwnerAddress);
          expect(event!.args!.buyer).to.equal(whitelistedBuyerAddress);
          expect(event!.args!.erc1155TokenAddress).to.equal(diamondAddress);
          expect(event!.args!.erc1155TypeId).to.equal(erc1155Id);
          expect(event!.args!._quantity).to.equal(test1155Quantity);

          const ghstBalanceBuyerAfter = await ghst.balanceOf(
            whitelistedBuyerAddress
          );
          const ghstBalanceSellerAfter = await ghst.balanceOf(itemOwnerAddress);
          const ghstBalancePixelCraftAfter = await ghst.balanceOf(
            pixelcraftAddress
          );
          const ghstBalanceDaoAfter = await ghst.balanceOf(
            aavegotchiDAOAddress
          );
          const ghstBalancePlayerAfter = await ghst.balanceOf(
            playerRewardsAddress
          );

          const cost = ethers.utils.parseEther(testPrice).mul(test1155Quantity);
          expect(
            ghstBalancePixelCraftAfter.sub(ghstBalancePixelCraftBefore)
          ).to.equal(cost.div(50)); // 2%
          expect(ghstBalanceDaoAfter.sub(ghstBalanceDaoBefore)).to.equal(
            cost.div(100)
          ); // 1%
          expect(ghstBalancePlayerAfter.sub(ghstBalancePlayerBefore)).to.equal(
            cost.div(200)
          ); // 0.5%
          expect(ghstBalanceBuyerBefore.sub(ghstBalanceBuyerAfter)).to.equal(
            cost
          );
          expect(ghstBalanceSellerAfter.sub(ghstBalanceSellerBefore)).to.equal(
            cost.mul(965).div(1000)
          ); // 96.5%

          const erc1155BalanceOwnerAfter = await erc1155.balanceOf(
            itemOwnerAddress,
            erc1155Id
          );
          const erc1155BalanceBuyerAfter = await erc1155.balanceOf(
            whitelistedBuyerAddress,
            erc1155Id
          );
          expect(
            erc1155BalanceOwnerBefore.sub(erc1155BalanceOwnerAfter)
          ).to.equal(test1155Quantity);
          expect(
            erc1155BalanceBuyerAfter.sub(erc1155BalanceBuyerBefore)
          ).to.equal(test1155Quantity);
        });
      });
    });
    describe("ERC1155 listing with whitelist", async function () {
      describe("setERC1155Listing", async function () {
        it("Should success if all parameters are valid", async function () {
          const receipt = await (
            await erc1155MarketWithItemSeller.setERC1155ListingWithWhitelist(
              diamondAddress,
              erc1155Id,
              test1155Quantity,
              ethers.utils.parseEther(testPrice),
              principalSplit,
              affiliate,
              whitelistId
            )
          ).wait();
          let event = receipt!.events!.find(
            (event) => event.event === "ERC1155ListingAdd"
          );
          erc1155ListingId = event!.args!.listingId;
          expect(event!.args!.seller).to.equal(itemOwnerAddress);
          expect(event!.args!.erc1155TokenAddress).to.equal(diamondAddress);
          expect(event!.args!.erc1155TypeId).to.equal(erc1155Id);
          expect(event!.args!.quantity).to.equal(test1155Quantity);

          event = receipt!.events!.find(
            (event) => event.event === "ERC1155ListingWhitelistSet"
          );
          expect(event!.args!.whitelistId).to.equal(whitelistId);
        });
      });
      describe("getERC1155Listing", async function () {
        it("Should return correct params if valid listing id", async function () {
          const listing = await marketplaceGetter.getERC1155Listing(
            erc1155ListingId
          );
          expect(listing.seller).to.equal(itemOwnerAddress);
          expect(listing.erc1155TokenAddress).to.equal(diamondAddress);
          expect(listing.erc1155TypeId).to.equal(erc1155Id);
          expect(listing.whitelistId).to.equal(whitelistId);
        });
      });
      describe("executeERC1155Listing", async function () {
        it("Should revert if buyer is non-whitelisted", async function () {
          await expect(
            erc1155MarketWithNonWhitelistedBuyer.executeERC1155Listing(
              erc1155ListingId,
              test1155Quantity,
              ethers.utils.parseEther(testPrice)
            )
          ).to.be.revertedWith("ERC1155Marketplace: Not whitelisted address");
        });
        it("Should success if buyer is whitelisted", async function () {
          const ghstBalanceBuyerBefore = await ghst.balanceOf(
            whitelistedBuyerAddress
          );
          const ghstBalanceSellerBefore = await ghst.balanceOf(
            itemOwnerAddress
          );
          const ghstBalancePixelCraftBefore = await ghst.balanceOf(
            pixelcraftAddress
          );
          const ghstBalanceDaoBefore = await ghst.balanceOf(
            aavegotchiDAOAddress
          );
          const ghstBalancePlayerBefore = await ghst.balanceOf(
            playerRewardsAddress
          );
          const erc1155BalanceOwnerBefore = await erc1155.balanceOf(
            itemOwnerAddress,
            erc1155Id
          );
          const erc1155BalanceBuyerBefore = await erc1155.balanceOf(
            whitelistedBuyerAddress,
            erc1155Id
          );

          const receipt = await (
            await erc1155MarketWithWhitelistedBuyer.executeERC1155Listing(
              erc1155ListingId,
              test1155Quantity,
              ethers.utils.parseEther(testPrice)
            )
          ).wait();
          const event = receipt!.events!.find(
            (event) => event.event === "ERC1155ExecutedListing"
          );
          expect(event!.args!.seller).to.equal(itemOwnerAddress);
          expect(event!.args!.buyer).to.equal(whitelistedBuyerAddress);
          expect(event!.args!.erc1155TokenAddress).to.equal(diamondAddress);
          expect(event!.args!.erc1155TypeId).to.equal(erc1155Id);
          expect(event!.args!._quantity).to.equal(test1155Quantity);

          const ghstBalanceBuyerAfter = await ghst.balanceOf(
            whitelistedBuyerAddress
          );
          const ghstBalanceSellerAfter = await ghst.balanceOf(itemOwnerAddress);
          const ghstBalancePixelCraftAfter = await ghst.balanceOf(
            pixelcraftAddress
          );
          const ghstBalanceDaoAfter = await ghst.balanceOf(
            aavegotchiDAOAddress
          );
          const ghstBalancePlayerAfter = await ghst.balanceOf(
            playerRewardsAddress
          );

          const cost = ethers.utils.parseEther(testPrice).mul(test1155Quantity);
          expect(
            ghstBalancePixelCraftAfter.sub(ghstBalancePixelCraftBefore)
          ).to.equal(cost.div(50)); // 2%
          expect(ghstBalanceDaoAfter.sub(ghstBalanceDaoBefore)).to.equal(
            cost.div(100)
          ); // 1%
          expect(ghstBalancePlayerAfter.sub(ghstBalancePlayerBefore)).to.equal(
            cost.div(200)
          ); // 0.5%
          expect(ghstBalanceBuyerBefore.sub(ghstBalanceBuyerAfter)).to.equal(
            cost
          );
          expect(ghstBalanceSellerAfter.sub(ghstBalanceSellerBefore)).to.equal(
            cost.mul(965).div(1000)
          ); // 96.5%

          const erc1155BalanceOwnerAfter = await erc1155.balanceOf(
            itemOwnerAddress,
            erc1155Id
          );
          const erc1155BalanceBuyerAfter = await erc1155.balanceOf(
            whitelistedBuyerAddress,
            erc1155Id
          );
          expect(
            erc1155BalanceOwnerBefore.sub(erc1155BalanceOwnerAfter)
          ).to.equal(test1155Quantity);
          expect(
            erc1155BalanceBuyerAfter.sub(erc1155BalanceBuyerBefore)
          ).to.equal(test1155Quantity);
        });
      });
    });
  });
});
