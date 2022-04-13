/* global describe it before ethers network */
/* eslint prefer-const: "off" */

//@ts-ignore
import { ethers, network } from "hardhat";
import chai from "chai";
import { upgrade } from "../scripts/upgrades/upgrade-erc721BuyOrderFacet";
import { impersonate } from "../scripts/helperFunctions";
import {
  AavegotchiFacet,
  ERC20Token,
  ERC721BuyOrderFacet,
  ERC721MarketplaceFacet,
  OwnershipFacet,
} from "../typechain";

const { expect } = chai;

describe("Testing ERC721 Buy Order", async function () {
  this.timeout(30000000);

  const ghstAddress = "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7";
  const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
  const maticHolderAddress = "0xd70250731A72C33BFB93016E3D1F0CA160dF7e42";
  const ghstHolderAddress = "0xb4473cfEeDC9a0E94612c6ce883677b63f830DB8";
  const ghstHolder2Address = "0x45fdb9d9Ff3105392bf5F1A3828F9523314117A7";
  const pixelcraftAddress = "0xD4151c984e6CF33E04FFAAF06c3374B2926Ecc64";
  const daoAddress = "0xb208f8BB431f580CC4b216826AFfB128cd1431aB";
  const lockedAavegotchiId = 12867; // listed in Baazaar, used for buy orders
  const unlockedAavegotchiId = 10000; // not listed in Baazaar, no buy orders also
  const lockedOpenPortalId = 18268; // listed in Baazaar
  const lockedClosedPortalId = 11000; // listed in Baazaar
  const price = ethers.utils.parseUnits("100", "ether");
  const mediumPrice = ethers.utils.parseUnits("105", "ether");
  const highestPrice = ethers.utils.parseUnits("115", "ether");
  const listPrice = ethers.utils.parseUnits("1", "ether");
  let erc721BuyOrderFacet: ERC721BuyOrderFacet;
  let aavegotchiFacet: AavegotchiFacet;
  let erc721MarketplaceFacet: ERC721MarketplaceFacet;
  let ghstERC20: ERC20Token;
  let contractOwner: any;
  let aavegotchiOwnerAddress: any;
  let aavegotchiOwner: any;
  let maticHolder: any;
  let ghstHolder: any;
  let firstBuyOrderId: any;
  let secondBuyOrderId: any;
  let thirdBuyOrderId: any;
  let fourthBuyOrderId: any;

  before(async function () {
    await upgrade();

    erc721BuyOrderFacet = (await ethers.getContractAt(
      "ERC721BuyOrderFacet",
      diamondAddress
    )) as ERC721BuyOrderFacet;
    aavegotchiFacet = (await ethers.getContractAt(
      "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
      diamondAddress
    )) as AavegotchiFacet;
    erc721MarketplaceFacet = (await ethers.getContractAt(
      "ERC721MarketplaceFacet",
      diamondAddress
    )) as ERC721MarketplaceFacet;
    const ownerFacet = (await ethers.getContractAt(
      "OwnershipFacet",
      diamondAddress
    )) as OwnershipFacet;

    ghstERC20 = (await ethers.getContractAt(
      "ERC20Token",
      ghstAddress
    )) as ERC20Token;

    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [maticHolderAddress],
    });
    maticHolder = await ethers.getSigner(maticHolderAddress);

    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [ghstHolderAddress],
    });
    ghstHolder = await ethers.getSigner(ghstHolderAddress);

    // This is needed for impersonating owner of test aavegotchi
    aavegotchiOwnerAddress = await aavegotchiFacet.ownerOf(lockedAavegotchiId);
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [aavegotchiOwnerAddress],
    });
    aavegotchiOwner = await ethers.getSigner(aavegotchiOwnerAddress);

    const contractOwnerAddress = await ownerFacet.owner();
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [contractOwnerAddress],
    });
    contractOwner = await ethers.getSigner(contractOwnerAddress);

    erc721BuyOrderFacet = await impersonate(
      ghstHolderAddress,
      erc721BuyOrderFacet,
      ethers,
      network
    );
    erc721MarketplaceFacet = await impersonate(
      ghstHolderAddress,
      erc721MarketplaceFacet,
      ethers,
      network
    );
  });

  describe("Testing placeERC721BuyOrder", async function () {
    it("Should revert if place buy order to unlocked Aavegotchi", async function () {
      await expect(
        erc721BuyOrderFacet.placeERC721BuyOrder(
          diamondAddress,
          unlockedAavegotchiId,
          1
        )
      ).to.be.revertedWith(
        "LibAppStorage: Only callable on locked Aavegotchis"
      );
    });
    it("Should revert if price is lower than 1 GHST", async function () {
      await expect(
        erc721BuyOrderFacet.placeERC721BuyOrder(
          diamondAddress,
          lockedAavegotchiId,
          0
        )
      ).to.be.revertedWith("ERC721BuyOrder: price should be 1 GHST or larger");
    });
    it("Should revert if buyer have not enough GHST", async function () {
      await expect(
        erc721BuyOrderFacet.placeERC721BuyOrder(
          diamondAddress,
          lockedAavegotchiId,
          ethers.utils.parseUnits("1000000000", "ether")
        )
      ).to.be.revertedWith("ERC721BuyOrder: Not enough GHST!");
    });
    it("Should revert if owner try to buy", async function () {
      const minPrice = ethers.utils.parseUnits("1", "ether");
      await (
        await ghstERC20.connect(ghstHolder)
      ).transfer(aavegotchiOwnerAddress, minPrice);
      await expect(
        (
          await erc721BuyOrderFacet.connect(aavegotchiOwner)
        ).placeERC721BuyOrder(diamondAddress, lockedAavegotchiId, minPrice)
      ).to.be.revertedWith("ERC721BuyOrder: Owner can't be buyer");
    });
    describe("If there's no buy order", async function () {
      it("Should succeed", async function () {
        const oldBalance = await ghstERC20.balanceOf(ghstHolderAddress);
        await (
          await ghstERC20.connect(ghstHolder)
        ).approve(diamondAddress, price);
        const receipt = await (
          await erc721BuyOrderFacet.placeERC721BuyOrder(
            diamondAddress,
            lockedAavegotchiId,
            price
          )
        ).wait();
        const event = receipt!.events!.find(
          (e: any) => e.event === "ERC721BuyOrderAdd"
        );
        firstBuyOrderId = event!.args!.buyOrderId;
        expect(event!.args!.buyer).to.equal(ghstHolderAddress);
        const newBalance = await ghstERC20.balanceOf(ghstHolderAddress);
        expect(newBalance.add(price)).to.equal(oldBalance);
      });
    });
    describe("If there's already buy order from same buyer", async function () {
      it("Should succeed", async function () {
        const oldBalance = await ghstERC20.balanceOf(ghstHolderAddress);
        await (
          await ghstERC20.connect(ghstHolder)
        ).approve(diamondAddress, mediumPrice);
        const receipt = await (
          await erc721BuyOrderFacet.placeERC721BuyOrder(
            diamondAddress,
            lockedAavegotchiId,
            mediumPrice
          )
        ).wait();
        const event = receipt!.events!.find(
          (e: any) => e.event === "ERC721BuyOrderAdd"
        );
        secondBuyOrderId = event!.args!.buyOrderId;
        expect(event!.args!.buyer).to.equal(ghstHolderAddress);
        const newBalance = await ghstERC20.balanceOf(ghstHolderAddress);
        expect(newBalance.add(mediumPrice).sub(price)).to.equal(oldBalance);
      });
    });
    describe("If there's already buy order from other buyer", async function () {
      it("Should succeed", async function () {
        const ghstERC20WithHolder2 = await impersonate(
          ghstHolder2Address,
          ghstERC20,
          ethers,
          network
        );
        const erc721BuyOrderFacetWithHolder2 = await impersonate(
          ghstHolder2Address,
          erc721BuyOrderFacet,
          ethers,
          network
        );
        const oldBalance = await ghstERC20WithHolder2.balanceOf(
          ghstHolder2Address
        );
        await ghstERC20WithHolder2.approve(diamondAddress, mediumPrice);
        const receipt = await (
          await erc721BuyOrderFacetWithHolder2.placeERC721BuyOrder(
            diamondAddress,
            lockedAavegotchiId,
            mediumPrice
          )
        ).wait();
        const event = receipt!.events!.find(
          (e: any) => e.event === "ERC721BuyOrderAdd"
        );
        thirdBuyOrderId = event!.args!.buyOrderId;
        expect(event!.args!.buyer).to.equal(ghstHolder2Address);
        const newBalance = await ghstERC20.balanceOf(ghstHolder2Address);
        expect(newBalance.add(mediumPrice)).to.equal(oldBalance);
      });
    });
  });

  describe("Testing getERC721BuyOrder", async function () {
    it("Should revert when try to get buy order with wrong id", async function () {
      await expect(
        erc721BuyOrderFacet.getERC721BuyOrder(thirdBuyOrderId.add(1))
      ).to.be.revertedWith("ERC721BuyOrder: ERC721 buyOrder does not exist");
    });
    it("Should fetch buy order data with correct buy order id for all status (both cancelled and not)", async function () {
      let buyOrder = await erc721BuyOrderFacet.getERC721BuyOrder(
        firstBuyOrderId
      );
      expect(buyOrder.buyOrderId).to.equal(firstBuyOrderId);
      expect(buyOrder.erc721TokenId).to.equal(lockedAavegotchiId);
      expect(buyOrder.cancelled).to.equal(true);
      buyOrder = await erc721BuyOrderFacet.getERC721BuyOrder(secondBuyOrderId);
      expect(buyOrder.buyOrderId).to.equal(secondBuyOrderId);
      expect(buyOrder.erc721TokenId).to.equal(lockedAavegotchiId);
      expect(buyOrder.cancelled).to.equal(false);
      buyOrder = await erc721BuyOrderFacet.getERC721BuyOrder(thirdBuyOrderId);
      expect(buyOrder.buyOrderId).to.equal(thirdBuyOrderId);
      expect(buyOrder.erc721TokenId).to.equal(lockedAavegotchiId);
      expect(buyOrder.cancelled).to.equal(false);
    });
  });

  describe("Testing getERC721BuyOrderIdsByTokenId", async function () {
    it("Should return empty array with wrong aavegotchi id", async function () {
      const buyOrderIds =
        await erc721BuyOrderFacet.getERC721BuyOrderIdsByTokenId(
          unlockedAavegotchiId
        );
      expect(buyOrderIds.length).to.equal(0);
    });
    it("Should fetch active(not cancelled) buy order ids with correct aavegotchi id", async function () {
      const buyOrderIds =
        await erc721BuyOrderFacet.getERC721BuyOrderIdsByTokenId(
          lockedAavegotchiId
        );
      expect(buyOrderIds.length).to.equal(2);
      expect(buyOrderIds[0]).to.equal(secondBuyOrderId);
      expect(buyOrderIds[1]).to.equal(thirdBuyOrderId);
    });
  });

  describe("Testing getERC721BuyOrdersByTokenId", async function () {
    it("Should return empty array with wrong aavegotchi id", async function () {
      const buyOrders = await erc721BuyOrderFacet.getERC721BuyOrdersByTokenId(
        unlockedAavegotchiId
      );
      expect(buyOrders.length).to.equal(0);
    });
    it("Should fetch active(not cancelled) buy orders data with correct aavegotchi id", async function () {
      const buyOrders = await erc721BuyOrderFacet.getERC721BuyOrdersByTokenId(
        lockedAavegotchiId
      );
      expect(buyOrders.length).to.equal(2);
      expect(buyOrders[0].buyOrderId).to.equal(secondBuyOrderId);
      expect(buyOrders[0].erc721TokenId).to.equal(lockedAavegotchiId);
      expect(buyOrders[0].cancelled).to.equal(false);
      expect(buyOrders[1].buyOrderId).to.equal(thirdBuyOrderId);
      expect(buyOrders[1].erc721TokenId).to.equal(lockedAavegotchiId);
      expect(buyOrders[1].cancelled).to.equal(false);
    });
  });

  describe("Testing cancelERC721BuyOrder", async function () {
    it("Should revert when try to cancel buy order with wrong id", async function () {
      await expect(
        erc721BuyOrderFacet.cancelERC721BuyOrder(thirdBuyOrderId.add(1))
      ).to.be.revertedWith("ERC721BuyOrder: ERC721 buyOrder does not exist");
    });
    it("Should revert when try to cancel buy order with wrong account", async function () {
      await expect(
        (
          await erc721BuyOrderFacet.connect(maticHolder)
        ).cancelERC721BuyOrder(firstBuyOrderId)
      ).to.be.revertedWith(
        "ERC721BuyOrder: Only aavegotchi owner or buyer can call this function"
      );
    });
    it("Should revert when try to cancel canceled buy order", async function () {
      await expect(
        erc721BuyOrderFacet.cancelERC721BuyOrder(firstBuyOrderId)
      ).to.be.revertedWith("ERC721BuyOrder: Already processed");
    });
    it("Should succeed if cancel valid buy order", async function () {
      const oldBalance = await ghstERC20.balanceOf(ghstHolderAddress);
      await (
        await erc721BuyOrderFacet.cancelERC721BuyOrder(secondBuyOrderId)
      ).wait();
      const newBalance = await ghstERC20.balanceOf(ghstHolderAddress);
      expect(newBalance.sub(mediumPrice)).to.equal(oldBalance);
    });
  });

  describe("Testing executeERC721BuyOrder", async function () {
    let listingId: any;
    before(async function () {
      await (
        await ghstERC20.connect(ghstHolder)
      ).approve(diamondAddress, highestPrice);
      const receipt = await (
        await erc721BuyOrderFacet.placeERC721BuyOrder(
          diamondAddress,
          lockedAavegotchiId,
          highestPrice
        )
      ).wait();
      const event = receipt!.events!.find(
        (e: any) => e.event === "ERC721BuyOrderAdd"
      );
      fourthBuyOrderId = event!.args!.buyOrderId;

      const listing = await erc721MarketplaceFacet.getERC721ListingFromToken(
        diamondAddress,
        lockedAavegotchiId,
        aavegotchiOwnerAddress
      );
      listingId = listing.listingId;
    });
    it("Should revert when try to execute buy order with wrong buy order id", async function () {
      await expect(
        erc721BuyOrderFacet.executeERC721BuyOrder(fourthBuyOrderId.add(10))
      ).to.be.revertedWith("ERC721BuyOrder: ERC721 buyOrder does not exist");
    });
    it("Should revert when try to execute buy order with wrong account", async function () {
      await expect(
        (
          await erc721BuyOrderFacet.connect(maticHolder)
        ).executeERC721BuyOrder(fourthBuyOrderId)
      ).to.be.revertedWith(
        "ERC721BuyOrder: Only aavegotchi owner can call this function"
      );
    });
    it("Should revert when try to execute canceled buy order", async function () {
      await expect(
        (
          await erc721BuyOrderFacet.connect(aavegotchiOwner)
        ).executeERC721BuyOrder(firstBuyOrderId)
      ).to.be.revertedWith("ERC721BuyOrder: Already processed");
    });
    it("Should succeed when execute buy order with valid data", async function () {
      const buyerOldBalance = await ghstERC20.balanceOf(ghstHolderAddress);
      const sellerOldBalance = await ghstERC20.balanceOf(
        aavegotchiOwnerAddress
      );
      const daoOldBalance = await ghstERC20.balanceOf(daoAddress);
      const pixelcraftOldBalance = await ghstERC20.balanceOf(pixelcraftAddress);
      const diamondOldBalance = await ghstERC20.balanceOf(diamondAddress);

      const receipt = await (
        await (
          await erc721BuyOrderFacet.connect(aavegotchiOwner)
        ).executeERC721BuyOrder(fourthBuyOrderId)
      ).wait();
      const event = receipt!.events!.find(
        (e: any) => e.event === "ERC721BuyOrderExecuted"
      );
      expect(event!.args!.buyer).to.equal(ghstHolderAddress);

      const buyerNewBalance = await ghstERC20.balanceOf(ghstHolderAddress);
      const sellerNewBalance = await ghstERC20.balanceOf(
        aavegotchiOwnerAddress
      );
      const daoNewBalance = await ghstERC20.balanceOf(daoAddress);
      const pixelcraftNewBalance = await ghstERC20.balanceOf(pixelcraftAddress);
      const diamondNewBalance = await ghstERC20.balanceOf(diamondAddress);
      // Check ghst balance changes
      expect(buyerOldBalance).to.equal(buyerNewBalance);
      expect(sellerNewBalance.sub(sellerOldBalance)).to.equal(
        highestPrice.mul(965).div(1000)
      ); // 96.5%
      expect(daoNewBalance.sub(daoOldBalance)).to.equal(highestPrice.div(100)); // 1%
      expect(pixelcraftNewBalance.sub(pixelcraftOldBalance)).to.equal(
        highestPrice.div(50)
      ); // 2%
      expect(diamondOldBalance.sub(diamondNewBalance)).to.equal(highestPrice);

      // Check aavegotchi owner
      const newAavegotchiOwnerAddress = await aavegotchiFacet.ownerOf(
        lockedAavegotchiId
      );
      expect(newAavegotchiOwnerAddress).to.equal(ghstHolderAddress);

      // Check buy order status
      const buyOrder = await erc721BuyOrderFacet.getERC721BuyOrder(
        fourthBuyOrderId
      );
      expect(buyOrder.buyOrderId).to.equal(fourthBuyOrderId);
      expect(buyOrder.timePurchased.gt(0)).to.equal(true);
    });
    it("Listing should be cancelled after buy order executed", async function () {
      const listing = await erc721MarketplaceFacet.getERC721Listing(listingId);
      expect(listing.cancelled).to.equal(true);
    });
  });

  describe("Testing ERC721MarketplaceFacet", async function () {
    it("Buy order of buyer should be canceled when executeERC721Listing", async function () {
      await (
        await ghstERC20.connect(ghstHolder)
      ).approve(diamondAddress, listPrice);
      let receipt = await (
        await erc721MarketplaceFacet.addERC721Listing(
          erc721MarketplaceFacet.address,
          lockedAavegotchiId,
          listPrice
        )
      ).wait();
      let event = receipt!.events!.find(
        (e: any) => e.event === "ERC721ListingAdd"
      );
      const listingId = event!.args!.listingId;

      let buyOrder = await erc721BuyOrderFacet.getERC721BuyOrder(
        thirdBuyOrderId
      );
      expect(buyOrder.buyOrderId).to.equal(thirdBuyOrderId);
      expect(buyOrder.cancelled).to.equal(false);

      const erc721MarketplaceFacetWithHolder2 = await impersonate(
        ghstHolder2Address,
        erc721MarketplaceFacet,
        ethers,
        network
      );
      const ghstERC20WithHolder2 = await impersonate(
        ghstHolder2Address,
        ghstERC20,
        ethers,
        network
      );

      await ghstERC20WithHolder2.approve(diamondAddress, highestPrice);
      await (
        await erc721MarketplaceFacetWithHolder2.executeERC721Listing(listingId)
      ).wait();

      buyOrder = await erc721BuyOrderFacet.getERC721BuyOrder(thirdBuyOrderId);
      expect(buyOrder.buyOrderId).to.equal(thirdBuyOrderId);
      expect(buyOrder.cancelled).to.equal(true);
    });
  });

  describe("Testing buy order for portal", async function () {
    it("Should succeed for open portal", async function () {
      const oldBalance = await ghstERC20.balanceOf(ghstHolderAddress);
      await (
        await ghstERC20.connect(ghstHolder)
      ).approve(diamondAddress, price);
      const receipt = await (
        await erc721BuyOrderFacet.placeERC721BuyOrder(
          diamondAddress,
          lockedOpenPortalId,
          price
        )
      ).wait();
      const event = receipt!.events!.find(
        (e: any) => e.event === "ERC721BuyOrderAdd"
      );
      expect(event!.args!.buyer).to.equal(ghstHolderAddress);
      const newBalance = await ghstERC20.balanceOf(ghstHolderAddress);
      expect(newBalance.add(price)).to.equal(oldBalance);
    });
    it("Should succeed for closed portal", async function () {
      const oldBalance = await ghstERC20.balanceOf(ghstHolderAddress);
      await (
        await ghstERC20.connect(ghstHolder)
      ).approve(diamondAddress, price);
      const receipt = await (
        await erc721BuyOrderFacet.placeERC721BuyOrder(
          diamondAddress,
          lockedClosedPortalId,
          price
        )
      ).wait();
      const event = receipt!.events!.find(
        (e: any) => e.event === "ERC721BuyOrderAdd"
      );
      expect(event!.args!.buyer).to.equal(ghstHolderAddress);
      const newBalance = await ghstERC20.balanceOf(ghstHolderAddress);
      expect(newBalance.add(price)).to.equal(oldBalance);
    });
  });
});
