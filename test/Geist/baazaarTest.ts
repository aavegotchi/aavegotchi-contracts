import { ethers } from "hardhat";

import {
  AavegotchiFacet,
  ERC721MarketplaceFacet,
  ERC1155MarketplaceFacet,
  ShopFacet,
  Diamond,
  MarketplaceGetterFacet,
  ItemsFacet,
  DAOFacet,
} from "../../typechain";

import { deployFullDiamond } from "../../scripts/deployFullDiamond";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber } from "ethers";

describe("Baazaar Test", function () {
  let aavegotchiDiamond: Diamond;
  let erc721MarketplaceFacet: ERC721MarketplaceFacet;
  let marketplaceGetterFacet: MarketplaceGetterFacet;
  let aavegotchiFacet: AavegotchiFacet;
  let erc1155MarketplaceFacet: ERC1155MarketplaceFacet;
  let itemsFacet: ItemsFacet;
  let shopFacet: ShopFacet;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let addr3: SignerWithAddress;
  let addr4: SignerWithAddress;
  let addr5: SignerWithAddress;
  let aavegotchiDiamondAddress: string;
  let listingPrice: BigNumber;

  let daoFacet: DAOFacet;

  let listingId: number;
  let erc1155TokenId = 60;
  let erc1155ListingId: number;

  before(async function () {
    this.timeout(200000);
    [owner, addr1, addr2, addr3, addr4, addr5] = await ethers.getSigners();

    // Deploy the full diamond
    const deployVars = await deployFullDiamond();
    aavegotchiDiamond = deployVars.aavegotchiDiamond;
    aavegotchiDiamondAddress = aavegotchiDiamond.address;
    // Get the marketplace facets
    erc721MarketplaceFacet = await ethers.getContractAt(
      "ERC721MarketplaceFacet",
      aavegotchiDiamondAddress
    );
    erc1155MarketplaceFacet = await ethers.getContractAt(
      "ERC1155MarketplaceFacet",
      aavegotchiDiamondAddress
    );

    shopFacet = await ethers.getContractAt(
      "ShopFacet",
      aavegotchiDiamondAddress
    );

    marketplaceGetterFacet = await ethers.getContractAt(
      "MarketplaceGetterFacet",
      aavegotchiDiamondAddress
    );

    //@ts-ignore
    aavegotchiFacet = await ethers.getContractAt(
      "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
      aavegotchiDiamondAddress
    );

    //@ts-ignore
    itemsFacet = await ethers.getContractAt(
      "contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet",
      aavegotchiDiamondAddress
    );
  });

  describe("ERC721 Marketplace", () => {
    it("should be able to purchase a portal from the ShopFacet", async () => {
      const tx = await shopFacet.mintPortals(owner.address, 1);
      await tx.wait();

      const balance = await aavegotchiFacet.balanceOf(owner.address);
      expect(balance).to.equal(1);
    });

    it("should be create to create an erc721 listing with no listing fee", async () => {
      listingPrice = ethers.utils.parseEther("1.0");

      const beforeEthBalance = await ethers.provider.getBalance(owner.address);

      const tx = await erc721MarketplaceFacet.addERC721Listing(
        aavegotchiDiamondAddress,
        0,
        listingPrice
      );
      const receipt = await tx.wait();
      listingId = receipt?.events?.find((x) => x.event === "ERC721ListingAdd")
        ?.args?.listingId;
      expect(listingId).to.not.equal(0);

      //no listing fee on Geist
      const afterEthBalance = await ethers.provider.getBalance(owner.address);
      expect(afterEthBalance).to.approximately(
        beforeEthBalance,
        ethers.utils.parseEther("0.001")
      );
    });

    it("should revert if not enough GHST is sent in value param", async () => {
      const buyerErc721MarketplaceFacet = await ethers.getContractAt(
        "ERC721MarketplaceFacet",
        aavegotchiDiamondAddress,
        addr1
      );

      await expect(
        buyerErc721MarketplaceFacet.executeERC721ListingToRecipient(
          listingId,
          aavegotchiDiamondAddress,
          listingPrice,
          0,
          addr1.address,
          {
            value: "0",
          }
        )
      ).to.be.revertedWith("ERC721MarketplaceFacet: Not enough GHST sent");
    });

    it("should be able to purchase an erc721 listing", async () => {
      const buyerErc721MarketplaceFacet = await ethers.getContractAt(
        "ERC721MarketplaceFacet",
        aavegotchiDiamondAddress,
        addr1
      );

      const ethBalanceBeforePurchase = await ethers.provider.getBalance(
        addr1.address
      );

      const tx =
        await buyerErc721MarketplaceFacet.executeERC721ListingToRecipient(
          listingId,
          aavegotchiDiamondAddress,
          listingPrice,
          0,
          addr1.address,
          {
            value: listingPrice,
          }
        );
      await tx.wait();

      const balance = await aavegotchiFacet.balanceOf(addr1.address);
      expect(balance).to.equal(1);

      //ghst balance of buyer should go down by 1
      const ethBalanceAfterPurchase = await ethers.provider.getBalance(
        addr1.address
      );
      expect(ethBalanceAfterPurchase).to.approximately(
        ethBalanceBeforePurchase.sub(listingPrice),
        ethers.utils.parseEther("0.001")
      );
    });

    it("should be able to cancel an erc721 listing", async () => {
      //purchase a portal
      const buyTx = await shopFacet.mintPortals(owner.address, 1);
      await buyTx.wait();

      const inventory = await aavegotchiFacet.tokenIdsOfOwner(owner.address);
      expect(inventory.length).to.equal(1);

      //list the portal
      const listingTx = await erc721MarketplaceFacet.addERC721Listing(
        aavegotchiDiamondAddress,
        inventory[0],
        listingPrice
      );
      const receipt = await listingTx.wait();

      listingId = receipt?.events?.find((x) => x.event === "ERC721ListingAdd")
        ?.args?.listingId;
      expect(listingId).to.not.equal(0);

      const cancelTx = await erc721MarketplaceFacet.cancelERC721Listings([
        listingId,
      ]);
      await cancelTx.wait();

      const listing = await marketplaceGetterFacet.getERC721Listing(listingId);
      expect(listing.cancelled).to.be.true;
    });
  });

  describe("ERC1155 Marketplace", () => {
    it("should not be able to buy an erc1155 item from ShopFacet with insufficient GHST", async () => {
      await expect(
        shopFacet.purchaseItemsWithGhst(owner.address, [erc1155TokenId], [1])
      ).to.be.revertedWith("ShopFacet: Insufficient GHST value");
    });

    it("should be able to buy an erc1155 item from ShopFacet", async () => {
      const price = ethers.utils.parseEther("5");

      const tx = await shopFacet.purchaseItemsWithGhst(
        owner.address,
        [erc1155TokenId],
        [1],
        {
          value: price,
        }
      );
      await tx.wait();

      const tokenBalance = await itemsFacet.balanceOf(
        owner.address,
        erc1155TokenId
      );
      expect(tokenBalance).to.equal(1);

      const balance = await itemsFacet.itemBalances(owner.address);
      expect(balance[0].balance).to.equal(1);
    });

    it("should be able to create an erc1155 listing", async () => {
      const price = ethers.utils.parseEther("5");

      const tx = await erc1155MarketplaceFacet.setERC1155Listing(
        aavegotchiDiamondAddress,
        erc1155TokenId,
        1,
        price
      );
      const receipt = await tx.wait();
      erc1155ListingId = receipt?.events?.find(
        (x) => x.event === "ERC1155ListingAdd"
      )?.args?.listingId;

      const listing = await marketplaceGetterFacet.getERC1155Listing(
        erc1155ListingId
      );

      expect(listing.priceInWei).to.equal(price);
    });

    it("should not be able to purchase an erc1155 listing with insufficient GHST", async () => {
      const listing = await marketplaceGetterFacet.getERC1155Listing(
        erc1155ListingId
      );

      const buyerErc1155MarketplaceFacet = await ethers.getContractAt(
        "ERC1155MarketplaceFacet",
        aavegotchiDiamondAddress,
        addr2
      );

      await expect(
        buyerErc1155MarketplaceFacet.executeERC1155ListingToRecipient(
          erc1155ListingId,
          aavegotchiDiamondAddress,
          erc1155TokenId,
          listing.quantity,
          listing.priceInWei,
          owner.address
        )
      ).to.be.revertedWith("ERC1155Marketplace: Insufficient GHST sent");
    });

    it("should be able to purchase an erc1155 listing", async () => {
      const listing = await marketplaceGetterFacet.getERC1155Listing(
        erc1155ListingId
      );

      const buyer = addr2;

      const beforeTokenBalance = await itemsFacet.balanceOf(
        buyer.address,
        erc1155TokenId
      );

      const buyerErc1155MarketplaceFacet = await ethers.getContractAt(
        "ERC1155MarketplaceFacet",
        aavegotchiDiamondAddress,
        addr2
      );

      const tx =
        await buyerErc1155MarketplaceFacet.executeERC1155ListingToRecipient(
          erc1155ListingId,
          aavegotchiDiamondAddress,
          erc1155TokenId,
          listing.quantity,
          listing.priceInWei,
          buyer.address,
          {
            value: listing.priceInWei,
          }
        );
      await tx.wait();

      const afterTokenBalance = await itemsFacet.balanceOf(
        buyer.address,
        erc1155TokenId
      );
      expect(afterTokenBalance).to.equal(beforeTokenBalance.add(1));
    });

    it("should be able to cancel an erc1155 listing", async () => {
      const price = ethers.utils.parseEther("5");

      //mint a new item
      let tx = await shopFacet.purchaseItemsWithGhst(
        owner.address,
        [erc1155TokenId],
        [1],
        {
          value: price,
        }
      );
      await tx.wait();

      tx = await erc1155MarketplaceFacet.setERC1155Listing(
        aavegotchiDiamondAddress,
        erc1155TokenId,
        1,
        price
      );

      const receipt = await tx.wait();

      erc1155ListingId = receipt?.events?.find(
        (x) => x.event === "ERC1155ListingAdd"
      )?.args?.listingId;

      // Get the initial listing
      const initialListing = await marketplaceGetterFacet.getERC1155Listing(
        erc1155ListingId
      );
      expect(initialListing.cancelled).to.be.false;

      // Cancel the listing
      tx = await erc1155MarketplaceFacet.cancelERC1155Listing(erc1155ListingId);
      await tx.wait();

      // Check that the listing is now cancelled
      const cancelledListing = await marketplaceGetterFacet.getERC1155Listing(
        erc1155ListingId
      );
      expect(cancelledListing.cancelled).to.be.true;

      // Attempt to purchase the cancelled listing
      const buyer = addr2;
      const buyerErc1155MarketplaceFacet = await ethers.getContractAt(
        "ERC1155MarketplaceFacet",
        aavegotchiDiamondAddress,
        addr2
      );

      await expect(
        buyerErc1155MarketplaceFacet.executeERC1155ListingToRecipient(
          erc1155ListingId,
          aavegotchiDiamondAddress,
          erc1155TokenId,
          cancelledListing.quantity,
          cancelledListing.priceInWei,
          buyer.address,
          {
            value: cancelledListing.priceInWei,
          }
        )
      ).to.be.revertedWith("ERC1155Marketplace: listing is cancelled");
    });
  });

  describe("ERC721 Offers", () => {
    //Should not be able to create an offer with insufficient GHST
    //Should be able to create an offer
    //Should be able to cancel an offer and get GHST back
    //Should be able to accept an offer and transfer the item and receive the GHST

    it("Should not be able to create an offer with low price", async function () {
      const buyer = addr2;
      const erc721BuyOrderFacet = await ethers.getContractAt(
        "ERC721BuyOrderFacet",
        aavegotchiDiamondAddress,
        buyer
      );

      const insufficientPrice = ethers.utils.parseEther("0.5"); // Less than 1 GHST

      await expect(
        erc721BuyOrderFacet.placeERC721BuyOrder(
          aavegotchiDiamondAddress,
          1, // tokenId
          insufficientPrice,
          0, // duration (0 for no expiry)
          [false, false, false], // validationOptions
          { value: insufficientPrice }
        )
      ).to.be.revertedWith("ERC721BuyOrder: price should be 1 GHST or larger");
    });

    it("Should not be able to create an offer with insufficient GHST", async function () {
      const buyer = addr2;
      const erc721BuyOrderFacet = await ethers.getContractAt(
        "ERC721BuyOrderFacet",
        aavegotchiDiamondAddress,
        buyer
      );

      const price = ethers.utils.parseEther("1");

      await expect(
        erc721BuyOrderFacet.placeERC721BuyOrder(
          aavegotchiDiamondAddress,
          1, // tokenId
          price,
          0, // duration (0 for no expiry)
          [false, false, false], // validationOptions
          { value: "0" }
        )
      ).to.be.revertedWith("ERC721BuyOrder: Not enough GHST!");
    });

    it("Should be able to create an offer", async function () {
      const buyer = addr2;
      const erc721BuyOrderFacet = await ethers.getContractAt(
        "ERC721BuyOrderFacet",
        aavegotchiDiamondAddress,
        buyer
      );

      const price = ethers.utils.parseEther("1");

      const tx = await erc721BuyOrderFacet.placeERC721BuyOrder(
        aavegotchiDiamondAddress,
        1, // tokenId
        price,
        0, // duration (0 for no expiry)
        [false, false, false], // validationOptions
        { value: price }
      );

      const receipt = await tx.wait();
      const event = receipt.events?.find(
        (x) => x.event === "ERC721BuyOrderAdded"
      );

      expect(event).to.not.be.undefined;
      expect(event?.args?.buyer).to.equal(buyer.address);
      expect(event?.args?.priceInWei).to.equal(price);
    });

    it("Should be able to cancel an offer and get GHST back", async function () {
      const buyer = addr2;
      const erc721BuyOrderFacet = await ethers.getContractAt(
        "ERC721BuyOrderFacet",
        aavegotchiDiamondAddress,
        buyer
      );

      const price = ethers.utils.parseEther("1");

      // Place buy order
      const tx = await erc721BuyOrderFacet.placeERC721BuyOrder(
        aavegotchiDiamondAddress,
        1, // tokenId
        price,
        0, // duration (0 for no expiry)
        [false, false, false], // validationOptions
        { value: price }
      );

      const receipt = await tx.wait();
      const buyOrderId = receipt.events?.find(
        (x) => x.event === "ERC721BuyOrderAdded"
      )?.args?.buyOrderId;

      // Cancel buy order
      const balanceBefore = await ethers.provider.getBalance(buyer.address);
      const cancelTx = await erc721BuyOrderFacet.cancelERC721BuyOrder(
        buyOrderId
      );
      await cancelTx.wait();

      const balanceAfter = await ethers.provider.getBalance(buyer.address);

      // Check that GHST was returned (minus gas costs)
      expect(balanceAfter.sub(balanceBefore)).to.be.closeTo(
        price,
        ethers.utils.parseEther("0.01")
      );
    });

    it("Should be able to accept an offer and transfer the item and receive the GHST", async function () {
      const seller = addr1;
      const buyer = addr2;
      const erc721BuyOrderFacet = await ethers.getContractAt(
        "ERC721BuyOrderFacet",
        aavegotchiDiamondAddress,
        buyer
      );

      let tx = await shopFacet.mintPortals(seller.address, 1);
      await tx.wait();
      let receipt = await tx.wait();

      let tokenId = receipt?.events?.find((x) => x.event === "MintPortals")
        ?.args?._tokenId;

      const price = ethers.utils.parseEther("1");

      // Place buy order
      tx = await erc721BuyOrderFacet.placeERC721BuyOrder(
        aavegotchiDiamondAddress,
        tokenId,
        price,
        0, // duration (0 for no expiry)
        [false, false, false], // validationOptions
        { value: price }
      );

      receipt = await tx.wait();
      const buyOrderId = receipt.events?.find(
        (x) => x.event === "ERC721BuyOrderAdded"
      )?.args?.buyOrderId;

      const owner = await aavegotchiFacet.ownerOf(tokenId);
      expect(owner).to.equal(seller.address);

      // Execute buy order
      const sellerErc721BuyOrderFacet = await ethers.getContractAt(
        "ERC721BuyOrderFacet",
        aavegotchiDiamondAddress,
        seller
      );

      const daoShare = price.div(100); //1%
      const pixelcraftShare = price.mul(2).div(100); //2%
      const playerRewardsShare = price.div(200); //0.5%
      const principal = price
        .sub(daoShare)
        .sub(pixelcraftShare)
        .sub(playerRewardsShare); //96.5%-royalty

      daoFacet = (await ethers.getContractAt(
        "DAOFacet",
        aavegotchiDiamondAddress
      )) as DAOFacet;

      await daoFacet.setDao(addr4.address, addr4.address);

      const daoBalanceBefore = await ethers.provider.getBalance(addr4.address);

      const sellerBalanceBefore = await aavegotchiFacet.balanceOf(
        seller.address
      );

      const buyerBalanceBefore = await aavegotchiFacet.balanceOf(buyer.address);

      const sellerEthBalanceBefore = await ethers.provider.getBalance(
        seller.address
      );

      const executeTx = await sellerErc721BuyOrderFacet.executeERC721BuyOrder(
        buyOrderId,
        aavegotchiDiamondAddress,
        tokenId,
        price
      );
      await executeTx.wait();

      const sellerBalanceAfter = await aavegotchiFacet.balanceOf(
        seller.address
      );

      const buyerBalanceAfter = await aavegotchiFacet.balanceOf(buyer.address);

      const daoBalanceAfter = await ethers.provider.getBalance(addr4.address);

      //check that GHST was sent to seller
      const sellerEthBalanceAfter = await ethers.provider.getBalance(
        seller.address
      );
      expect(sellerEthBalanceAfter.sub(sellerEthBalanceBefore)).to.be.closeTo(
        principal,
        ethers.utils.parseEther("0.01")
      );

      expect(daoBalanceAfter.sub(daoBalanceBefore)).to.equal(daoShare);

      // Check that NFT was received (minus gas costs)
      expect(sellerBalanceAfter).to.equal(sellerBalanceBefore.sub(1));
      expect(buyerBalanceAfter).to.equal(buyerBalanceBefore.add(1));
      // Check that the item was transferred
      const newOwner = await aavegotchiFacet.ownerOf(tokenId);
      expect(newOwner).to.equal(buyer.address);
    });
  });
  // Add more tests here for listing, buying, cancelling, etc.

  describe("Gotchi Lending", () => {
    //should be able to lend a gotchi
    //should be able to agree to a lending with upfront GHST
    //upfront GHST should be paid to the lender
    //should be able to claim revenue
    //should be able to cancel a listing
  });
});
