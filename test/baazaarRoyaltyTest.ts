/* global describe it before ethers network */
/* eslint prefer-const: "off" */

//@ts-ignore
import { ethers, network } from "hardhat";
import { upgrade } from "../scripts/upgrades/upgrade-royalty";
import {
  AavegotchiFacet,
  ERC1155MarketplaceFacet,
  ERC721MarketplaceFacet,
  ERC721WithMultiRoyalties,
  ERC721WithRoyalties,
  IERC20,
  ItemsFacet,
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

let ghst: IERC20;

describe("Testing Baazaar Recipient", async function () {
  //this.timeout(300000);
  const diamondAddress = aavegotchiDiamondAddressMatic;
  const ghstHolderAddress = "0x3721546e51258065bfdb9746b2e442C7671B0298"; // Should be GHST holder
  const gotchiOwnerAddress = "0xb7601193f559de56D67FB8e6a2AF219b05BD36c7"; // Should be Gotchi owner
  const itemOwnerAddress = "0xb7601193f559de56D67FB8e6a2AF219b05BD36c7"; // Should be Item owner
  const royaltyAddress = "0x4E8ffddB1403CF5306C6c7B31dC72EF5f44BC4F5"; // Random address
  const royaltyAddress2 = "0x46a3A41bd932244Dd08186e4c19F1a7E48cbcDf4"; // Random address 2
  const erc721Id = 11600; // Should be unlocked erc721/gotchi
  const testPrice = "1";
  const principalSplit: [number, number] = [6000, 4000]; // 60% and 40%
  const affiliate = "0x3477823dc687e24147494b910b367CC85298DF8C";
  const recipient = "0xF22F00D0B95B1b728078066E5f4410F6B2Be8faE";
  const erc1155Id = 138; // Should be erc1155/item
  const test1155Quantity = "1";

  let snapshot: any;
  let erc721MarketWithBuyer: ERC721MarketplaceFacet;
  let erc721MarketWithGotchiSeller: ERC721MarketplaceFacet;
  let erc1155MarketWithBuyer: ERC1155MarketplaceFacet;
  let erc1155MarketWithItemSeller: ERC1155MarketplaceFacet;
  let erc721: AavegotchiFacet;
  let erc1155: ItemsFacet;
  let erc721Royalty: ERC721WithRoyalties;
  let erc721WithRoyaltiesAddress: any;
  let erc721MultiRoyalty: ERC721WithMultiRoyalties;
  let erc721WithMultiRoyaltiesAddress: any;

  let erc721ListingId: BigNumber;
  let erc1155ListingId: BigNumber;
  let erc721RoyaltyTokenId: any;
  let erc721MultiRoyaltyTokenId: any;

  before(async function () {
    await upgrade();

    const erc721MarketplaceFacet = (await ethers.getContractAt(
      "ERC721MarketplaceFacet",
      diamondAddress
    )) as ERC721MarketplaceFacet;

    const erc1155MarketplaceFacet = (await ethers.getContractAt(
      "ERC1155MarketplaceFacet",
      diamondAddress
    )) as ERC1155MarketplaceFacet;

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
    erc721MarketWithBuyer = await impersonate(
      ghstHolderAddress,
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

    // deploy mock EIP2981 ERC721 and add category for it
    erc721Royalty = (await (
      await ethers.getContractFactory("ERC721WithRoyalties")
    ).deploy("F Gotchi", "FGOTCHI")) as ERC721WithRoyalties;
    erc721WithRoyaltiesAddress = erc721Royalty.address;

    const erc721MarketWithItemManager = await impersonate(
      "0x8D46fd7160940d89dA026D59B2e819208E714E82",
      erc721MarketplaceFacet,
      ethers,
      network
    );
    await (
      await erc721MarketWithItemManager.setERC721Categories([
        {
          erc721TokenAddress: erc721WithRoyaltiesAddress,
          category: 5,
        },
      ])
    ).wait();

    // mint mock EIP2981 supported ERC721 tokens
    let receipt = await (
      await erc721Royalty.mint(gotchiOwnerAddress, royaltyAddress, 400)
    ).wait(); // royalty: 4%
    let event = receipt!.events!.find((event) => event.event === "Transfer");
    erc721RoyaltyTokenId = event!.args!.tokenId;

    // approve diamond to move erc721 with royalty
    const erc721RoyaltyWithTokenOwner = await impersonate(
      gotchiOwnerAddress,
      erc721Royalty,
      ethers,
      network
    );
    await (
      await erc721RoyaltyWithTokenOwner.setApprovalForAll(diamondAddress, true)
    ).wait();

    // deploy mock multi royalty ERC721 and add category for it
    erc721MultiRoyalty = (await (
      await ethers.getContractFactory("ERC721WithMultiRoyalties")
    ).deploy("FM Gotchi", "FMGOTCHI")) as ERC721WithMultiRoyalties;
    erc721WithMultiRoyaltiesAddress = erc721MultiRoyalty.address;

    await (
      await erc721MarketWithItemManager.setERC721Categories([
        {
          erc721TokenAddress: erc721WithMultiRoyaltiesAddress,
          category: 6,
        },
      ])
    ).wait();

    // mint mock multi royalty supported ERC721 tokens
    receipt = await (
      await erc721MultiRoyalty.mint(
        gotchiOwnerAddress,
        [royaltyAddress, royaltyAddress2],
        [100, 300]
      )
    ).wait(); // royalty: 4%
    event = receipt!.events!.find((event) => event.event === "Transfer");
    erc721MultiRoyaltyTokenId = event!.args!.tokenId;

    // approve diamond to move erc721 with royalty
    const erc721MultiRoyaltyWithTokenOwner = await impersonate(
      gotchiOwnerAddress,
      erc721MultiRoyalty,
      ethers,
      network
    );
    await (
      await erc721MultiRoyaltyWithTokenOwner.setApprovalForAll(
        diamondAddress,
        true
      )
    ).wait();

    snapshot = await ethers.provider.send("evm_snapshot", []);
  });

  describe("ERC721MarketplaceFacet without royalty (Non EIP-2981)", async function () {
    after(async function () {
      snapshot = await ethers.provider.send("evm_snapshot", []);
    });
    describe("ERC721 listing without split", async function () {
      describe("addERC721Listing", async function () {
        it("Should revert if invalid erc721 id", async function () {
          await expect(
            erc721MarketWithGotchiSeller.addERC721Listing(
              diamondAddress,
              erc721Id + 1,
              ethers.utils.parseEther(testPrice)
            )
          ).to.be.revertedWith("ERC721Marketplace: Not owner of ERC721 token");
        });
        it("Should revert if invalid price", async function () {
          await expect(
            erc721MarketWithGotchiSeller.addERC721Listing(
              diamondAddress,
              erc721Id,
              ethers.utils.parseEther("0.5")
            )
          ).to.be.revertedWith(
            "ERC721Marketplace: price should be 1 GHST or larger"
          );
        });
        it("Should success if all parameters are valid", async function () {
          const receipt = await (
            await erc721MarketWithGotchiSeller.addERC721Listing(
              diamondAddress,
              erc721Id,
              ethers.utils.parseEther(testPrice)
            )
          ).wait();
          const event = receipt!.events!.find(
            (event) => event.event === "ERC721ListingAdd"
          );
          erc721ListingId = event!.args!.listingId;
          expect(event!.args!.seller).to.equal(gotchiOwnerAddress);
          expect(event!.args!.erc721TokenAddress).to.equal(diamondAddress);
          expect(event!.args!.erc721TokenId).to.equal(erc721Id);
        });
        it("Should revert if locked erc721", async function () {
          await expect(
            erc721MarketWithGotchiSeller.addERC721Listing(
              diamondAddress,
              erc721Id,
              ethers.utils.parseEther(testPrice)
            )
          ).to.be.revertedWith(
            "ERC721Marketplace: Only callable on unlocked Aavegotchis"
          );
        });
      });
      describe("getERC721Listing", async function () {
        it("Should return correct params if valid listing id", async function () {
          const listing = await erc721MarketWithGotchiSeller.getERC721Listing(
            erc721ListingId
          );
          expect(listing.seller).to.equal(gotchiOwnerAddress);
          expect(listing.erc721TokenAddress).to.equal(diamondAddress);
          expect(listing.erc721TokenId).to.equal(erc721Id);
          expect(listing.principalSplit).to.deep.equal([10000, 0]);
          expect(listing.affiliate).to.equal(ethers.constants.AddressZero);
        });
      });
      describe("executeERC721Listing", async function () {
        it("Should revert if invalid listing id", async function () {
          await expect(
            erc721MarketWithBuyer.executeERC721Listing(erc721ListingId.add(1))
          ).to.be.revertedWith("ERC721Marketplace: listing not found");
        });
        it("Should revert if buyer and seller are same", async function () {
          await expect(
            erc721MarketWithGotchiSeller.executeERC721Listing(erc721ListingId)
          ).to.be.revertedWith("ERC721Marketplace: Buyer can't be seller");
        });
        it("Should success if all parameters are valid", async function () {
          const ghstBalanceBuyerBefore = await ghst.balanceOf(
            ghstHolderAddress
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
            await erc721MarketWithBuyer.executeERC721Listing(erc721ListingId)
          ).wait();
          const event = receipt!.events!.find(
            (event) => event.event === "ERC721ExecutedListing"
          );
          expect(event!.args!.seller).to.equal(gotchiOwnerAddress);
          expect(event!.args!.buyer).to.equal(ghstHolderAddress);
          expect(event!.args!.erc721TokenAddress).to.equal(diamondAddress);
          expect(event!.args!.erc721TokenId).to.equal(erc721Id);

          const ghstBalanceBuyerAfter = await ghst.balanceOf(ghstHolderAddress);
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
          expect(ownerAfter).to.equal(ghstHolderAddress);
        });
        it("Should revert if purchased erc721", async function () {
          await expect(
            erc721MarketWithBuyer.executeERC721Listing(erc721ListingId)
          ).to.be.revertedWith("ERC721Marketplace: listing already sold");
        });
      });
    });
    describe("ERC721 listing with split", async function () {
      before(async function () {
        // rollback
        await ethers.provider.send("evm_revert", [snapshot]);
      });
      describe("addERC721ListingWithSplit", async function () {
        it("Should revert if invalid erc721 id", async function () {
          await expect(
            erc721MarketWithGotchiSeller.addERC721ListingWithSplit(
              diamondAddress,
              erc721Id + 1,
              ethers.utils.parseEther(testPrice),
              principalSplit,
              affiliate
            )
          ).to.be.revertedWith("ERC721Marketplace: Not owner of ERC721 token");
        });
        it("Should revert if invalid price", async function () {
          await expect(
            erc721MarketWithGotchiSeller.addERC721ListingWithSplit(
              diamondAddress,
              erc721Id,
              ethers.utils.parseEther("0.5"),
              principalSplit,
              affiliate
            )
          ).to.be.revertedWith(
            "ERC721Marketplace: price should be 1 GHST or larger"
          );
        });
        it("Should revert if invalid sum of principal split", async function () {
          await expect(
            erc721MarketWithGotchiSeller.addERC721ListingWithSplit(
              diamondAddress,
              erc721Id,
              ethers.utils.parseEther(testPrice),
              [9999, 0],
              affiliate
            )
          ).to.be.revertedWith(
            "ERC721Marketplace: Sum of principal splits not 10000"
          );
        });
        it("Should revert if invalid principal split for affiliate", async function () {
          await expect(
            erc721MarketWithGotchiSeller.addERC721ListingWithSplit(
              diamondAddress,
              erc721Id,
              ethers.utils.parseEther(testPrice),
              principalSplit,
              ethers.constants.AddressZero
            )
          ).to.be.revertedWith(
            "ERC721Marketplace: Affiliate split must be 0 for address(0)"
          );
        });
        it("Should success if all parameters are valid", async function () {
          const receipt = await (
            await erc721MarketWithGotchiSeller.addERC721ListingWithSplit(
              diamondAddress,
              erc721Id,
              ethers.utils.parseEther(testPrice),
              principalSplit,
              affiliate
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
            (event) => event.event === "ERC721ListingSplit"
          );
          expect(event!.args!.principalSplit).to.deep.equal(principalSplit);
          expect(event!.args!.affiliate).to.equal(affiliate);
        });
        it("Should revert if locked erc721", async function () {
          await expect(
            erc721MarketWithGotchiSeller.addERC721ListingWithSplit(
              diamondAddress,
              erc721Id,
              ethers.utils.parseEther(testPrice),
              principalSplit,
              affiliate
            )
          ).to.be.revertedWith(
            "ERC721Marketplace: Only callable on unlocked Aavegotchis"
          );
        });
      });
      describe("getERC721Listing", async function () {
        it("Should return correct params if valid listing id", async function () {
          const listing = await erc721MarketWithGotchiSeller.getERC721Listing(
            erc721ListingId
          );
          expect(listing.seller).to.equal(gotchiOwnerAddress);
          expect(listing.erc721TokenAddress).to.equal(diamondAddress);
          expect(listing.erc721TokenId).to.equal(erc721Id);
          expect(listing.principalSplit).to.deep.equal(principalSplit);
          expect(listing.affiliate).to.equal(affiliate);
        });
      });
      describe("executeERC721ListingToRecipient", async function () {
        it("Should revert if invalid listing id", async function () {
          await expect(
            erc721MarketWithBuyer.executeERC721ListingToRecipient(
              erc721ListingId.add(1),
              diamondAddress,
              ethers.utils.parseEther(testPrice),
              erc721Id,
              recipient
            )
          ).to.be.revertedWith("ERC721Marketplace: listing not found");
        });
        it("Should revert if invalid erc721 id", async function () {
          await expect(
            erc721MarketWithBuyer.executeERC721ListingToRecipient(
              erc721ListingId,
              diamondAddress,
              ethers.utils.parseEther(testPrice),
              erc721Id + 1,
              recipient
            )
          ).to.be.revertedWith("ERC721Marketplace: Incorrect tokenID");
        });
        it("Should revert if invalid erc721 address", async function () {
          await expect(
            erc721MarketWithBuyer.executeERC721ListingToRecipient(
              erc721ListingId,
              ethers.constants.AddressZero,
              ethers.utils.parseEther(testPrice),
              erc721Id,
              recipient
            )
          ).to.be.revertedWith("ERC721Marketplace: Incorrect token address");
        });
        it("Should revert if invalid price", async function () {
          await expect(
            erc721MarketWithBuyer.executeERC721ListingToRecipient(
              erc721ListingId,
              diamondAddress,
              ethers.utils.parseEther("0"),
              erc721Id,
              recipient
            )
          ).to.be.revertedWith("ERC721Marketplace: Incorrect price");
        });
        it("Should revert if buyer and seller are same", async function () {
          await expect(
            erc721MarketWithGotchiSeller.executeERC721ListingToRecipient(
              erc721ListingId,
              diamondAddress,
              ethers.utils.parseEther(testPrice),
              erc721Id,
              recipient
            )
          ).to.be.revertedWith("ERC721Marketplace: Buyer can't be seller");
        });
        it("Should success if all parameters are valid", async function () {
          const ghstBalanceBuyerBefore = await ghst.balanceOf(
            ghstHolderAddress
          );
          const ghstBalanceSellerBefore = await ghst.balanceOf(
            gotchiOwnerAddress
          );
          const ghstBalanceAffiliateBefore = await ghst.balanceOf(affiliate);
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
            await erc721MarketWithBuyer.executeERC721ListingToRecipient(
              erc721ListingId,
              diamondAddress,
              ethers.utils.parseEther(testPrice),
              erc721Id,
              recipient
            )
          ).wait();
          let event = receipt!.events!.find(
            (event) => event.event === "ERC721ExecutedListing"
          );
          expect(event!.args!.seller).to.equal(gotchiOwnerAddress);
          expect(event!.args!.buyer).to.equal(recipient);
          expect(event!.args!.erc721TokenAddress).to.equal(diamondAddress);
          expect(event!.args!.erc721TokenId).to.equal(erc721Id);

          event = receipt!.events!.find(
            (event) => event.event === "ERC721ExecutedToRecipient"
          );
          expect(event!.args!.buyer).to.equal(ghstHolderAddress);
          expect(event!.args!.recipient).to.equal(recipient);

          const ghstBalanceBuyerAfter = await ghst.balanceOf(ghstHolderAddress);
          const ghstBalanceSellerAfter = await ghst.balanceOf(
            gotchiOwnerAddress
          );
          const ghstBalanceAffiliateAfter = await ghst.balanceOf(affiliate);
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
          const principalShare = ethers.utils
            .parseEther(testPrice)
            .mul(965)
            .div(1000); // 96.5%
          expect(ghstBalanceSellerAfter.sub(ghstBalanceSellerBefore)).to.equal(
            principalShare.mul(principalSplit[0]).div(10000)
          );
          expect(
            ghstBalanceAffiliateAfter.sub(ghstBalanceAffiliateBefore)
          ).to.equal(principalShare.mul(principalSplit[1]).div(10000));

          const ownerAfter = await erc721.ownerOf(erc721Id);
          expect(ownerAfter).to.equal(recipient);
        });
        it("Should revert if purchased erc721", async function () {
          await expect(
            erc721MarketWithBuyer.executeERC721ListingToRecipient(
              erc721ListingId,
              diamondAddress,
              ethers.utils.parseEther(testPrice),
              erc721Id,
              recipient
            )
          ).to.be.revertedWith("ERC721Marketplace: listing already sold");
        });
      });
    });
  });

  describe("ERC1155MarketplaceFacet without royalty (Non EIP-2981)", async function () {
    describe("ERC1155 listing without split", async function () {
      describe("setERC1155Listing", async function () {
        it("Should revert if invalid erc1155 id", async function () {
          await expect(
            erc1155MarketWithItemSeller.setERC1155Listing(
              diamondAddress,
              erc1155Id + 1,
              test1155Quantity,
              ethers.utils.parseEther(testPrice)
            )
          ).to.be.revertedWith("ERC1155Marketplace: Not enough ERC1155 token");
        });
        it("Should revert if invalid quantity", async function () {
          await expect(
            erc1155MarketWithItemSeller.setERC1155Listing(
              diamondAddress,
              erc1155Id,
              test1155Quantity + 1,
              ethers.utils.parseEther(testPrice)
            )
          ).to.be.revertedWith("ERC1155Marketplace: Not enough ERC1155 token");
        });
        it("Should revert if invalid cost", async function () {
          await expect(
            erc1155MarketWithItemSeller.setERC1155Listing(
              diamondAddress,
              erc1155Id,
              test1155Quantity,
              ethers.utils.parseEther("0.5")
            )
          ).to.be.revertedWith(
            "ERC1155Marketplace: cost should be 1 GHST or larger"
          );
          await expect(
            erc1155MarketWithItemSeller.setERC1155Listing(
              diamondAddress,
              erc1155Id,
              0,
              ethers.utils.parseEther(testPrice)
            )
          ).to.be.revertedWith(
            "ERC1155Marketplace: cost should be 1 GHST or larger"
          );
        });
        it("Should success if all parameters are valid", async function () {
          const receipt = await (
            await erc1155MarketWithItemSeller.setERC1155Listing(
              diamondAddress,
              erc1155Id,
              test1155Quantity,
              ethers.utils.parseEther(testPrice)
            )
          ).wait();
          const event = receipt!.events!.find(
            (event) => event.event === "ERC1155ListingAdd"
          );
          erc1155ListingId = event!.args!.listingId;
          expect(event!.args!.seller).to.equal(itemOwnerAddress);
          expect(event!.args!.erc1155TokenAddress).to.equal(diamondAddress);
          expect(event!.args!.erc1155TypeId).to.equal(erc1155Id);
          expect(event!.args!.quantity).to.equal(test1155Quantity);
        });
      });
      describe("getERC1155Listing", async function () {
        it("Should return correct params if valid listing id", async function () {
          const listing = await erc1155MarketWithItemSeller.getERC1155Listing(
            erc1155ListingId
          );
          expect(listing.seller).to.equal(itemOwnerAddress);
          expect(listing.erc1155TokenAddress).to.equal(diamondAddress);
          expect(listing.erc1155TypeId).to.equal(erc1155Id);
          expect(listing.principalSplit).to.deep.equal([10000, 0]);
          expect(listing.affiliate).to.equal(ethers.constants.AddressZero);
        });
      });
      describe("executeERC1155Listing", async function () {
        it("Should revert if invalid listing id", async function () {
          await expect(
            erc1155MarketWithBuyer.executeERC1155Listing(
              erc1155ListingId.add(1),
              test1155Quantity,
              ethers.utils.parseEther(testPrice)
            )
          ).to.be.revertedWith("ERC1155Marketplace: listing not found");
        });
        it("Should revert if invalid price", async function () {
          await expect(
            erc1155MarketWithBuyer.executeERC1155Listing(
              erc1155ListingId,
              test1155Quantity,
              ethers.utils.parseEther("0")
            )
          ).to.be.revertedWith(
            "ERC1155Marketplace: wrong price or price changed"
          );
        });
        it("Should revert if buyer and seller are same", async function () {
          await expect(
            erc1155MarketWithItemSeller.executeERC1155Listing(
              erc1155ListingId,
              test1155Quantity,
              ethers.utils.parseEther(testPrice)
            )
          ).to.be.revertedWith("ERC1155Marketplace: buyer can't be seller");
        });
        it("Should revert if invalid quantity", async function () {
          await expect(
            erc1155MarketWithBuyer.executeERC1155Listing(
              erc1155ListingId,
              0,
              ethers.utils.parseEther(testPrice)
            )
          ).to.be.revertedWith("ERC1155Marketplace: _quantity can't be zero");
          await expect(
            erc1155MarketWithBuyer.executeERC1155Listing(
              erc1155ListingId,
              test1155Quantity + 1,
              ethers.utils.parseEther(testPrice)
            )
          ).to.be.revertedWith(
            "ERC1155Marketplace: quantity is greater than listing"
          );
        });
        it("Should success if all parameters are valid", async function () {
          const ghstBalanceBuyerBefore = await ghst.balanceOf(
            ghstHolderAddress
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
            ghstHolderAddress,
            erc1155Id
          );

          const receipt = await (
            await erc1155MarketWithBuyer.executeERC1155Listing(
              erc1155ListingId,
              test1155Quantity,
              ethers.utils.parseEther(testPrice)
            )
          ).wait();
          const event = receipt!.events!.find(
            (event) => event.event === "ERC1155ExecutedListing"
          );
          expect(event!.args!.seller).to.equal(itemOwnerAddress);
          expect(event!.args!.buyer).to.equal(ghstHolderAddress);
          expect(event!.args!.erc1155TokenAddress).to.equal(diamondAddress);
          expect(event!.args!.erc1155TypeId).to.equal(erc1155Id);
          expect(event!.args!._quantity).to.equal(test1155Quantity);

          const ghstBalanceBuyerAfter = await ghst.balanceOf(ghstHolderAddress);
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
            ghstHolderAddress,
            erc1155Id
          );
          expect(
            erc1155BalanceOwnerBefore.sub(erc1155BalanceOwnerAfter)
          ).to.equal(test1155Quantity);
          expect(
            erc1155BalanceBuyerAfter.sub(erc1155BalanceBuyerBefore)
          ).to.equal(test1155Quantity);
        });
        it("Should revert if all erc11155 sold", async function () {
          await expect(
            erc1155MarketWithBuyer.executeERC1155Listing(
              erc1155ListingId,
              test1155Quantity,
              ethers.utils.parseEther(testPrice)
            )
          ).to.be.revertedWith("ERC1155Marketplace: listing is sold out");
        });
      });
    });
    describe("ERC1155 listing with split", async function () {
      before(async function () {
        // rollback
        await ethers.provider.send("evm_revert", [snapshot]);
      });
      describe("setERC1155ListingWithSplit", async function () {
        it("Should revert if invalid erc1155 id", async function () {
          await expect(
            erc1155MarketWithItemSeller.setERC1155ListingWithSplit(
              diamondAddress,
              erc1155Id + 1,
              test1155Quantity,
              ethers.utils.parseEther(testPrice),
              principalSplit,
              affiliate
            )
          ).to.be.revertedWith("ERC1155Marketplace: Not enough ERC1155 token");
        });
        it("Should revert if invalid quantity", async function () {
          await expect(
            erc1155MarketWithItemSeller.setERC1155ListingWithSplit(
              diamondAddress,
              erc1155Id,
              test1155Quantity + 1,
              ethers.utils.parseEther(testPrice),
              principalSplit,
              affiliate
            )
          ).to.be.revertedWith("ERC1155Marketplace: Not enough ERC1155 token");
        });
        it("Should revert if invalid cost", async function () {
          await expect(
            erc1155MarketWithItemSeller.setERC1155ListingWithSplit(
              diamondAddress,
              erc1155Id,
              test1155Quantity,
              ethers.utils.parseEther("0.5"),
              principalSplit,
              affiliate
            )
          ).to.be.revertedWith(
            "ERC1155Marketplace: cost should be 1 GHST or larger"
          );
          await expect(
            erc1155MarketWithItemSeller.setERC1155ListingWithSplit(
              diamondAddress,
              erc1155Id,
              0,
              ethers.utils.parseEther(testPrice),
              principalSplit,
              affiliate
            )
          ).to.be.revertedWith(
            "ERC1155Marketplace: cost should be 1 GHST or larger"
          );
        });
        it("Should revert if invalid sum of principal split", async function () {
          await expect(
            erc1155MarketWithItemSeller.setERC1155ListingWithSplit(
              diamondAddress,
              erc1155Id,
              test1155Quantity,
              ethers.utils.parseEther(testPrice),
              [9999, 0],
              affiliate
            )
          ).to.be.revertedWith(
            "ERC1155Marketplace: Sum of principal splits not 10000"
          );
        });
        it("Should revert if invalid principal split for affiliate", async function () {
          await expect(
            erc1155MarketWithItemSeller.setERC1155ListingWithSplit(
              diamondAddress,
              erc1155Id,
              test1155Quantity,
              ethers.utils.parseEther(testPrice),
              principalSplit,
              ethers.constants.AddressZero
            )
          ).to.be.revertedWith(
            "ERC1155Marketplace: Affiliate split must be 0 for address(0)"
          );
        });
        it("Should success if all parameters are valid", async function () {
          const receipt = await (
            await erc1155MarketWithItemSeller.setERC1155ListingWithSplit(
              diamondAddress,
              erc1155Id,
              test1155Quantity,
              ethers.utils.parseEther(testPrice),
              principalSplit,
              affiliate
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
            (event) => event.event === "ERC1155ListingSplit"
          );
          expect(event!.args!.principalSplit).to.deep.equal(principalSplit);
          expect(event!.args!.affiliate).to.equal(affiliate);
        });
      });
      describe("getERC1155Listing", async function () {
        it("Should return correct params if valid listing id", async function () {
          const listing = await erc1155MarketWithItemSeller.getERC1155Listing(
            erc1155ListingId
          );
          expect(listing.seller).to.equal(itemOwnerAddress);
          expect(listing.erc1155TokenAddress).to.equal(diamondAddress);
          expect(listing.erc1155TypeId).to.equal(erc1155Id);
          expect(listing.principalSplit).to.deep.equal(principalSplit);
          expect(listing.affiliate).to.equal(affiliate);
        });
      });
      describe("executeERC1155ListingToRecipient", async function () {
        it("Should revert if invalid listing id", async function () {
          await expect(
            erc1155MarketWithBuyer.executeERC1155ListingToRecipient(
              erc1155ListingId.add(1),
              diamondAddress,
              erc1155Id,
              test1155Quantity,
              ethers.utils.parseEther(testPrice),
              recipient
            )
          ).to.be.revertedWith("ERC1155Marketplace: listing not found");
        });
        it("Should revert if invalid price", async function () {
          await expect(
            erc1155MarketWithBuyer.executeERC1155ListingToRecipient(
              erc1155ListingId,
              diamondAddress,
              erc1155Id,
              test1155Quantity,
              ethers.utils.parseEther("0"),
              recipient
            )
          ).to.be.revertedWith(
            "ERC1155Marketplace: wrong price or price changed"
          );
        });
        it("Should revert if invalid erc1155 address", async function () {
          await expect(
            erc1155MarketWithBuyer.executeERC1155ListingToRecipient(
              erc1155ListingId,
              ethers.constants.AddressZero,
              erc1155Id,
              test1155Quantity,
              ethers.utils.parseEther(testPrice),
              recipient
            )
          ).to.be.revertedWith("ERC1155Marketplace: Incorrect token address");
        });
        it("Should revert if invalid erc1155 id", async function () {
          await expect(
            erc1155MarketWithBuyer.executeERC1155ListingToRecipient(
              erc1155ListingId,
              diamondAddress,
              erc1155Id + 1,
              test1155Quantity,
              ethers.utils.parseEther(testPrice),
              recipient
            )
          ).to.be.revertedWith("ERC1155Marketplace: Incorrect token id");
        });
        it("Should revert if buyer and seller are same", async function () {
          await expect(
            erc1155MarketWithItemSeller.executeERC1155ListingToRecipient(
              erc1155ListingId,
              diamondAddress,
              erc1155Id,
              test1155Quantity,
              ethers.utils.parseEther(testPrice),
              recipient
            )
          ).to.be.revertedWith("ERC1155Marketplace: buyer can't be seller");
        });
        it("Should revert if invalid quantity", async function () {
          await expect(
            erc1155MarketWithBuyer.executeERC1155ListingToRecipient(
              erc1155ListingId,
              diamondAddress,
              erc1155Id,
              0,
              ethers.utils.parseEther(testPrice),
              recipient
            )
          ).to.be.revertedWith("ERC1155Marketplace: _quantity can't be zero");
          await expect(
            erc1155MarketWithBuyer.executeERC1155ListingToRecipient(
              erc1155ListingId,
              diamondAddress,
              erc1155Id,
              test1155Quantity + 1,
              ethers.utils.parseEther(testPrice),
              recipient
            )
          ).to.be.revertedWith(
            "ERC1155Marketplace: quantity is greater than listing"
          );
        });
        it("Should success if all parameters are valid", async function () {
          const ghstBalanceBuyerBefore = await ghst.balanceOf(
            ghstHolderAddress
          );
          const ghstBalanceSellerBefore = await ghst.balanceOf(
            itemOwnerAddress
          );
          const ghstBalanceAffiliateBefore = await ghst.balanceOf(affiliate);
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
            recipient,
            erc1155Id
          );

          const receipt = await (
            await erc1155MarketWithBuyer.executeERC1155ListingToRecipient(
              erc1155ListingId,
              diamondAddress,
              erc1155Id,
              test1155Quantity,
              ethers.utils.parseEther(testPrice),
              recipient
            )
          ).wait();
          let event = receipt!.events!.find(
            (event) => event.event === "ERC1155ExecutedListing"
          );
          expect(event!.args!.seller).to.equal(itemOwnerAddress);
          expect(event!.args!.buyer).to.equal(recipient);
          expect(event!.args!.erc1155TokenAddress).to.equal(diamondAddress);
          expect(event!.args!.erc1155TypeId).to.equal(erc1155Id);
          expect(event!.args!._quantity).to.equal(test1155Quantity);

          event = receipt!.events!.find(
            (event) => event.event === "ERC1155ExecutedToRecipient"
          );
          expect(event!.args!.buyer).to.equal(ghstHolderAddress);
          expect(event!.args!.recipient).to.equal(recipient);

          const ghstBalanceBuyerAfter = await ghst.balanceOf(ghstHolderAddress);
          const ghstBalanceSellerAfter = await ghst.balanceOf(itemOwnerAddress);
          const ghstBalanceAffiliateAfter = await ghst.balanceOf(affiliate);
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
          const principalShare = cost.mul(965).div(1000); // 96.5%
          expect(ghstBalanceSellerAfter.sub(ghstBalanceSellerBefore)).to.equal(
            principalShare.mul(principalSplit[0]).div(10000)
          );
          expect(
            ghstBalanceAffiliateAfter.sub(ghstBalanceAffiliateBefore)
          ).to.equal(principalShare.mul(principalSplit[1]).div(10000));

          const erc1155BalanceOwnerAfter = await erc1155.balanceOf(
            itemOwnerAddress,
            erc1155Id
          );
          const erc1155BalanceBuyerAfter = await erc1155.balanceOf(
            recipient,
            erc1155Id
          );
          expect(
            erc1155BalanceOwnerBefore.sub(erc1155BalanceOwnerAfter)
          ).to.equal(test1155Quantity);
          expect(
            erc1155BalanceBuyerAfter.sub(erc1155BalanceBuyerBefore)
          ).to.equal(test1155Quantity);
        });
        it("Should revert if all erc11155 sold", async function () {
          await expect(
            erc1155MarketWithBuyer.executeERC1155ListingToRecipient(
              erc1155ListingId,
              diamondAddress,
              erc1155Id,
              test1155Quantity,
              ethers.utils.parseEther(testPrice),
              recipient
            )
          ).to.be.revertedWith("ERC1155Marketplace: listing is sold out");
        });
      });
    });
  });

  describe("ERC721MarketplaceFacet with royalty (EIP-2981)", async function () {
    // note: adding and executing cases (success only) are added.
    before(async function () {
      snapshot = await ethers.provider.send("evm_snapshot", []);
    });
    describe("ERC721 listing without split", async function () {
      describe("addERC721Listing", async function () {
        it("Should success if all parameters are valid", async function () {
          const receipt = await (
            await erc721MarketWithGotchiSeller.addERC721Listing(
              erc721WithRoyaltiesAddress,
              erc721RoyaltyTokenId,
              ethers.utils.parseEther(testPrice)
            )
          ).wait();
          const event = receipt!.events!.find(
            (event) => event.event === "ERC721ListingAdd"
          );
          erc721ListingId = event!.args!.listingId;
          expect(event!.args!.seller).to.equal(gotchiOwnerAddress);
          expect(event!.args!.erc721TokenAddress).to.equal(
            erc721WithRoyaltiesAddress
          );
          expect(event!.args!.erc721TokenId).to.equal(erc721RoyaltyTokenId);
        });
      });
      describe("executeERC721Listing", async function () {
        it("Should success if all parameters are valid", async function () {
          const ghstBalanceBuyerBefore = await ghst.balanceOf(
            ghstHolderAddress
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
          const ghstBalanceRoyaltyBefore = await ghst.balanceOf(royaltyAddress);

          const receipt = await (
            await erc721MarketWithBuyer.executeERC721Listing(erc721ListingId)
          ).wait();
          const event = receipt!.events!.find(
            (event) => event.event === "ERC721ExecutedListing"
          );
          expect(event!.args!.seller).to.equal(gotchiOwnerAddress);
          expect(event!.args!.buyer).to.equal(ghstHolderAddress);
          expect(event!.args!.erc721TokenAddress).to.equal(
            erc721WithRoyaltiesAddress
          );
          expect(event!.args!.erc721TokenId).to.equal(erc721RoyaltyTokenId);

          const ghstBalanceBuyerAfter = await ghst.balanceOf(ghstHolderAddress);
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
          const ghstBalanceRoyaltyAfter = await ghst.balanceOf(royaltyAddress);

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
          expect(
            ghstBalanceRoyaltyAfter.sub(ghstBalanceRoyaltyBefore)
          ).to.equal(ethers.utils.parseEther(testPrice).mul(4).div(100)); // 4%
          expect(ghstBalanceSellerAfter.sub(ghstBalanceSellerBefore)).to.equal(
            ethers.utils.parseEther(testPrice).mul(925).div(1000)
          ); // 92.5% (96.5% - royalty)

          const ownerAfter = await erc721Royalty.ownerOf(erc721RoyaltyTokenId);
          expect(ownerAfter).to.equal(ghstHolderAddress);
        });
      });
    });
    describe("ERC721 listing with split", async function () {
      before(async function () {
        // rollback
        await ethers.provider.send("evm_revert", [snapshot]);
      });
      describe("addERC721ListingWithSplit", async function () {
        it("Should success if all parameters are valid", async function () {
          const receipt = await (
            await erc721MarketWithGotchiSeller.addERC721ListingWithSplit(
              erc721WithRoyaltiesAddress,
              erc721RoyaltyTokenId,
              ethers.utils.parseEther(testPrice),
              principalSplit,
              affiliate
            )
          ).wait();
          let event = receipt!.events!.find(
            (event) => event.event === "ERC721ListingAdd"
          );
          erc721ListingId = event!.args!.listingId;
          expect(event!.args!.seller).to.equal(gotchiOwnerAddress);
          expect(event!.args!.erc721TokenAddress).to.equal(
            erc721WithRoyaltiesAddress
          );
          expect(event!.args!.erc721TokenId).to.equal(erc721RoyaltyTokenId);

          event = receipt!.events!.find(
            (event) => event.event === "ERC721ListingSplit"
          );
          expect(event!.args!.principalSplit).to.deep.equal(principalSplit);
          expect(event!.args!.affiliate).to.equal(affiliate);
        });
      });
      describe("executeERC721ListingToRecipient", async function () {
        it("Should success if all parameters are valid", async function () {
          const ghstBalanceBuyerBefore = await ghst.balanceOf(
            ghstHolderAddress
          );
          const ghstBalanceSellerBefore = await ghst.balanceOf(
            gotchiOwnerAddress
          );
          const ghstBalanceAffiliateBefore = await ghst.balanceOf(affiliate);
          const ghstBalancePixelCraftBefore = await ghst.balanceOf(
            pixelcraftAddress
          );
          const ghstBalanceDaoBefore = await ghst.balanceOf(
            aavegotchiDAOAddress
          );
          const ghstBalancePlayerBefore = await ghst.balanceOf(
            playerRewardsAddress
          );
          const ghstBalanceRoyaltyBefore = await ghst.balanceOf(royaltyAddress);

          const receipt = await (
            await erc721MarketWithBuyer.executeERC721ListingToRecipient(
              erc721ListingId,
              erc721WithRoyaltiesAddress,
              ethers.utils.parseEther(testPrice),
              erc721RoyaltyTokenId,
              recipient
            )
          ).wait();
          let event = receipt!.events!.find(
            (event) => event.event === "ERC721ExecutedListing"
          );
          expect(event!.args!.seller).to.equal(gotchiOwnerAddress);
          expect(event!.args!.buyer).to.equal(recipient);
          expect(event!.args!.erc721TokenAddress).to.equal(
            erc721WithRoyaltiesAddress
          );
          expect(event!.args!.erc721TokenId).to.equal(erc721RoyaltyTokenId);

          event = receipt!.events!.find(
            (event) => event.event === "ERC721ExecutedToRecipient"
          );
          expect(event!.args!.buyer).to.equal(ghstHolderAddress);
          expect(event!.args!.recipient).to.equal(recipient);

          const ghstBalanceBuyerAfter = await ghst.balanceOf(ghstHolderAddress);
          const ghstBalanceSellerAfter = await ghst.balanceOf(
            gotchiOwnerAddress
          );
          const ghstBalanceAffiliateAfter = await ghst.balanceOf(affiliate);
          const ghstBalancePixelCraftAfter = await ghst.balanceOf(
            pixelcraftAddress
          );
          const ghstBalanceDaoAfter = await ghst.balanceOf(
            aavegotchiDAOAddress
          );
          const ghstBalancePlayerAfter = await ghst.balanceOf(
            playerRewardsAddress
          );
          const ghstBalanceRoyaltyAfter = await ghst.balanceOf(royaltyAddress);

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
          expect(
            ghstBalanceRoyaltyAfter.sub(ghstBalanceRoyaltyBefore)
          ).to.equal(ethers.utils.parseEther(testPrice).mul(4).div(100)); // 4%
          const principalShare = ethers.utils
            .parseEther(testPrice)
            .mul(925)
            .div(1000); // 92.5% (96.5% - royalty)
          expect(ghstBalanceSellerAfter.sub(ghstBalanceSellerBefore)).to.equal(
            principalShare.mul(principalSplit[0]).div(10000)
          );
          expect(
            ghstBalanceAffiliateAfter.sub(ghstBalanceAffiliateBefore)
          ).to.equal(principalShare.mul(principalSplit[1]).div(10000));

          const ownerAfter = await erc721Royalty.ownerOf(erc721RoyaltyTokenId);
          expect(ownerAfter).to.equal(recipient);
        });
      });
    });
  });

  describe("ERC721MarketplaceFacet with multi royalty", async function () {
    // note: adding and executing cases (success only) are added.
    before(async function () {
      snapshot = await ethers.provider.send("evm_snapshot", []);
    });
    describe("ERC721 listing without split", async function () {
      describe("addERC721Listing", async function () {
        it("Should success if all parameters are valid", async function () {
          const receipt = await (
            await erc721MarketWithGotchiSeller.addERC721Listing(
              erc721WithMultiRoyaltiesAddress,
              erc721MultiRoyaltyTokenId,
              ethers.utils.parseEther(testPrice)
            )
          ).wait();
          const event = receipt!.events!.find(
            (event) => event.event === "ERC721ListingAdd"
          );
          erc721ListingId = event!.args!.listingId;
          expect(event!.args!.seller).to.equal(gotchiOwnerAddress);
          expect(event!.args!.erc721TokenAddress).to.equal(
            erc721WithMultiRoyaltiesAddress
          );
          expect(event!.args!.erc721TokenId).to.equal(
            erc721MultiRoyaltyTokenId
          );
        });
      });
      describe("executeERC721Listing", async function () {
        it("Should success if all parameters are valid", async function () {
          const ghstBalanceBuyerBefore = await ghst.balanceOf(
            ghstHolderAddress
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
          const ghstBalanceRoyaltyBefore = await ghst.balanceOf(royaltyAddress);
          const ghstBalanceRoyalty2Before = await ghst.balanceOf(
            royaltyAddress2
          );

          const receipt = await (
            await erc721MarketWithBuyer.executeERC721Listing(erc721ListingId)
          ).wait();
          const event = receipt!.events!.find(
            (event) => event.event === "ERC721ExecutedListing"
          );
          expect(event!.args!.seller).to.equal(gotchiOwnerAddress);
          expect(event!.args!.buyer).to.equal(ghstHolderAddress);
          expect(event!.args!.erc721TokenAddress).to.equal(
            erc721WithMultiRoyaltiesAddress
          );
          expect(event!.args!.erc721TokenId).to.equal(
            erc721MultiRoyaltyTokenId
          );

          const ghstBalanceBuyerAfter = await ghst.balanceOf(ghstHolderAddress);
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
          const ghstBalanceRoyaltyAfter = await ghst.balanceOf(royaltyAddress);
          const ghstBalanceRoyalty2After = await ghst.balanceOf(
            royaltyAddress2
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
          expect(
            ghstBalanceRoyaltyAfter.sub(ghstBalanceRoyaltyBefore)
          ).to.equal(ethers.utils.parseEther(testPrice).mul(1).div(100)); // 1%
          expect(
            ghstBalanceRoyalty2After.sub(ghstBalanceRoyalty2Before)
          ).to.equal(ethers.utils.parseEther(testPrice).mul(3).div(100)); // 3%
          expect(ghstBalanceSellerAfter.sub(ghstBalanceSellerBefore)).to.equal(
            ethers.utils.parseEther(testPrice).mul(925).div(1000)
          ); // 92.5% (96.5% - royalty)

          const ownerAfter = await erc721MultiRoyalty.ownerOf(
            erc721MultiRoyaltyTokenId
          );
          expect(ownerAfter).to.equal(ghstHolderAddress);
        });
      });
    });
    describe("ERC721 listing with split", async function () {
      before(async function () {
        // rollback
        await ethers.provider.send("evm_revert", [snapshot]);
      });
      describe("addERC721ListingWithSplit", async function () {
        it("Should success if all parameters are valid", async function () {
          const receipt = await (
            await erc721MarketWithGotchiSeller.addERC721ListingWithSplit(
              erc721WithMultiRoyaltiesAddress,
              erc721MultiRoyaltyTokenId,
              ethers.utils.parseEther(testPrice),
              principalSplit,
              affiliate
            )
          ).wait();
          let event = receipt!.events!.find(
            (event) => event.event === "ERC721ListingAdd"
          );
          erc721ListingId = event!.args!.listingId;
          expect(event!.args!.seller).to.equal(gotchiOwnerAddress);
          expect(event!.args!.erc721TokenAddress).to.equal(
            erc721WithMultiRoyaltiesAddress
          );
          expect(event!.args!.erc721TokenId).to.equal(
            erc721MultiRoyaltyTokenId
          );

          event = receipt!.events!.find(
            (event) => event.event === "ERC721ListingSplit"
          );
          expect(event!.args!.principalSplit).to.deep.equal(principalSplit);
          expect(event!.args!.affiliate).to.equal(affiliate);
        });
      });
      describe("executeERC721ListingToRecipient", async function () {
        it("Should success if all parameters are valid", async function () {
          const ghstBalanceBuyerBefore = await ghst.balanceOf(
            ghstHolderAddress
          );
          const ghstBalanceSellerBefore = await ghst.balanceOf(
            gotchiOwnerAddress
          );
          const ghstBalanceAffiliateBefore = await ghst.balanceOf(affiliate);
          const ghstBalancePixelCraftBefore = await ghst.balanceOf(
            pixelcraftAddress
          );
          const ghstBalanceDaoBefore = await ghst.balanceOf(
            aavegotchiDAOAddress
          );
          const ghstBalancePlayerBefore = await ghst.balanceOf(
            playerRewardsAddress
          );
          const ghstBalanceRoyaltyBefore = await ghst.balanceOf(royaltyAddress);
          const ghstBalanceRoyalty2Before = await ghst.balanceOf(
            royaltyAddress2
          );

          const receipt = await (
            await erc721MarketWithBuyer.executeERC721ListingToRecipient(
              erc721ListingId,
              erc721WithMultiRoyaltiesAddress,
              ethers.utils.parseEther(testPrice),
              erc721MultiRoyaltyTokenId,
              recipient
            )
          ).wait();
          let event = receipt!.events!.find(
            (event) => event.event === "ERC721ExecutedListing"
          );
          expect(event!.args!.seller).to.equal(gotchiOwnerAddress);
          expect(event!.args!.buyer).to.equal(recipient);
          expect(event!.args!.erc721TokenAddress).to.equal(
            erc721WithMultiRoyaltiesAddress
          );
          expect(event!.args!.erc721TokenId).to.equal(
            erc721MultiRoyaltyTokenId
          );

          event = receipt!.events!.find(
            (event) => event.event === "ERC721ExecutedToRecipient"
          );
          expect(event!.args!.buyer).to.equal(ghstHolderAddress);
          expect(event!.args!.recipient).to.equal(recipient);

          const ghstBalanceBuyerAfter = await ghst.balanceOf(ghstHolderAddress);
          const ghstBalanceSellerAfter = await ghst.balanceOf(
            gotchiOwnerAddress
          );
          const ghstBalanceAffiliateAfter = await ghst.balanceOf(affiliate);
          const ghstBalancePixelCraftAfter = await ghst.balanceOf(
            pixelcraftAddress
          );
          const ghstBalanceDaoAfter = await ghst.balanceOf(
            aavegotchiDAOAddress
          );
          const ghstBalancePlayerAfter = await ghst.balanceOf(
            playerRewardsAddress
          );
          const ghstBalanceRoyaltyAfter = await ghst.balanceOf(royaltyAddress);
          const ghstBalanceRoyalty2After = await ghst.balanceOf(
            royaltyAddress2
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
          expect(
            ghstBalanceRoyaltyAfter.sub(ghstBalanceRoyaltyBefore)
          ).to.equal(ethers.utils.parseEther(testPrice).mul(1).div(100)); // 1%
          expect(
            ghstBalanceRoyalty2After.sub(ghstBalanceRoyalty2Before)
          ).to.equal(ethers.utils.parseEther(testPrice).mul(3).div(100)); // 3%
          const principalShare = ethers.utils
            .parseEther(testPrice)
            .mul(925)
            .div(1000); // 92.5% (96.5% - royalty)
          expect(ghstBalanceSellerAfter.sub(ghstBalanceSellerBefore)).to.equal(
            principalShare.mul(principalSplit[0]).div(10000)
          );
          expect(
            ghstBalanceAffiliateAfter.sub(ghstBalanceAffiliateBefore)
          ).to.equal(principalShare.mul(principalSplit[1]).div(10000));

          const ownerAfter = await erc721MultiRoyalty.ownerOf(
            erc721MultiRoyaltyTokenId
          );
          expect(ownerAfter).to.equal(recipient);
        });
      });
    });
  });
});
