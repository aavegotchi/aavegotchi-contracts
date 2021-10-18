/* global describe it before ethers network */
/* eslint prefer-const: "off" */

//@ts-ignore
import { ethers, network } from "hardhat";
import chai from "chai";
import { upgrade } from "../scripts/upgrades/upgrade-erc721BuyOrderFacet";
import { impersonate } from "../scripts/helperFunctions";
import { AavegotchiFacet, ERC20Token, ERC721BuyOrderFacet, ERC721MarketplaceFacet, OwnershipFacet } from "../typechain";

const { expect } = chai;

describe("Testing ERC721 Buy Order", async function () {
  this.timeout(300000);

  const ghstAddress = "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7";
  const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
  const maticHolderAddress = "0x3507e4978e0eb83315d20df86ca0b976c0e40ccb";
  const ghstHolderAddress = "0xBC67F26c2b87e16e304218459D2BB60Dac5C80bC";
  const pixelcraftAddress = "0xD4151c984e6CF33E04FFAAF06c3374B2926Ecc64";
  const daoAddress = "0xb208f8BB431f580CC4b216826AFfB128cd1431aB";
  const lockedAavegotchiId = 13996;
  const unlockedAavegotchiId = 10000;
  const price = ethers.utils.parseUnits('100', 'ether');
  const mediumPrice = ethers.utils.parseUnits('105', 'ether');
  const highPrice = ethers.utils.parseUnits('110', 'ether');
  const highestPrice = ethers.utils.parseUnits('115', 'ether');
  const listPrice = ethers.utils.parseUnits('1', 'ether');
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

    ghstERC20 = (await ethers.getContractAt('ERC20Token', ghstAddress)) as ERC20Token;

    await network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [maticHolderAddress]
    });
    maticHolder = await ethers.getSigner(maticHolderAddress);

    await network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [ghstHolderAddress]
    });
    ghstHolder = await ethers.getSigner(ghstHolderAddress);

    // This is needed for impersonating owner of test aavegotchi
    aavegotchiOwnerAddress = await aavegotchiFacet.ownerOf(lockedAavegotchiId);
    await network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [aavegotchiOwnerAddress]
    });
    aavegotchiOwner = await ethers.getSigner(aavegotchiOwnerAddress);

    const contractOwnerAddress = await ownerFacet.owner();
    await network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [contractOwnerAddress]
    });
    contractOwner = await ethers.getSigner(contractOwnerAddress);

    erc721BuyOrderFacet = await impersonate(ghstHolderAddress, erc721BuyOrderFacet, ethers, network);
    erc721MarketplaceFacet = await impersonate(aavegotchiOwnerAddress, erc721MarketplaceFacet, ethers, network);
  });

  describe("Testing placeERC721BuyOrder", async function () {
    it("Should revert if place buy order to unlocked Aavegotchi", async function () {
      await expect(erc721BuyOrderFacet.placeERC721BuyOrder(diamondAddress, unlockedAavegotchiId, 1))
        .to.be.revertedWith("LibAppStorage: Only callable on locked Aavegotchis");
    });
    it("Should revert if price is lower than 1 GHST", async function () {
      await expect(erc721BuyOrderFacet.placeERC721BuyOrder(diamondAddress, lockedAavegotchiId, 0))
        .to.be.revertedWith("ERC721BuyOrder: price should be 1 GHST or larger");
    });
    it("Should revert if buyer have not enough GHST", async function () {
      await expect(erc721BuyOrderFacet.placeERC721BuyOrder(diamondAddress, lockedAavegotchiId, ethers.utils.parseUnits('1000000000', 'ether')))
        .to.be.revertedWith("ERC721BuyOrder: Not enough GHST!");
    });
    it("Should revert if owner try to buy", async function () {
      const minPrice = ethers.utils.parseUnits('1', 'ether')
      await (await ghstERC20.connect(ghstHolder)).transfer(aavegotchiOwnerAddress, minPrice)
      await expect((await erc721BuyOrderFacet.connect(aavegotchiOwner)).placeERC721BuyOrder(diamondAddress, lockedAavegotchiId, minPrice))
        .to.be.revertedWith("ERC721BuyOrder: Owner can't be buyer");
    });
    describe("If there's no buy order", async function () {
      it("Should succeed", async function () {
        const oldBalance = await ghstERC20.balanceOf(ghstHolderAddress);
        const receipt = await (await erc721BuyOrderFacet.placeERC721BuyOrder(diamondAddress, lockedAavegotchiId, price)).wait();
        const event = receipt!.events!.find(event => event.event === 'ERC721BuyOrderAdd');
        firstBuyOrderId = event!.args!.buyOrderId;
        expect(event!.args!.buyer).to.equal(ghstHolderAddress);
        const newBalance = await ghstERC20.balanceOf(ghstHolderAddress);
        expect(newBalance.add(price)).to.equal(oldBalance);
      });
    });
    describe("If there's already buy order", async function () {
      it("Should revert if price is equal or lower than already exist buy order", async function () {
        await expect(erc721BuyOrderFacet.placeERC721BuyOrder(diamondAddress, lockedAavegotchiId, price))
          .to.be.revertedWith("ERC721BuyOrder: Higher price buy order already exist");
      });
      it("Should succeed if price is greater than price of exist buy order", async function () {
        const oldBalance = await ghstERC20.balanceOf(ghstHolderAddress);
        const receipt = await (await erc721BuyOrderFacet.placeERC721BuyOrder(diamondAddress, lockedAavegotchiId, mediumPrice)).wait();
        const event = receipt!.events!.find(event => event.event === 'ERC721BuyOrderAdd');
        secondBuyOrderId = event!.args!.buyOrderId;
        expect(event!.args!.buyer).to.equal(ghstHolderAddress);
        const newBalance = await ghstERC20.balanceOf(ghstHolderAddress);
        expect(newBalance.add(mediumPrice).sub(price)).to.equal(oldBalance);
      });
    });
  });

  describe("Testing getERC721BuyOrder", async function () {
    it("Should revert when try to get buy order with wrong id", async function () {
      await expect(erc721BuyOrderFacet.getERC721BuyOrder(secondBuyOrderId.add(1)))
        .to.be.revertedWith("ERC721BuyOrder: ERC721 buyOrder does not exist");
    });
    it("Should fetch buy order data with correct buy order id", async function () {
      const buyOrder = await erc721BuyOrderFacet.getERC721BuyOrder(firstBuyOrderId);
      expect(buyOrder.buyOrderId).to.equal(firstBuyOrderId);
      expect(buyOrder.erc721TokenId).to.equal(lockedAavegotchiId);
    });
  });

  describe("Testing getERC721BuyOrderByTokenId", async function () {
    it("Should revert when try to get buy order with wrong aavegotchi id", async function () {
      await expect(erc721BuyOrderFacet.getERC721BuyOrderByTokenId(unlockedAavegotchiId))
        .to.be.revertedWith("ERC721BuyOrder: buyOrder doesn't exist");
    });
    it("Should fetch buy order data with correct aavegotchi id", async function () {
      const buyOrder = await erc721BuyOrderFacet.getERC721BuyOrderByTokenId(lockedAavegotchiId);
      expect(buyOrder.buyOrderId).to.equal(secondBuyOrderId);
      expect(buyOrder.erc721TokenId).to.equal(lockedAavegotchiId);
    });
  });

  describe("Testing cancelERC721BuyOrder", async function () {
    it("Should revert when try to cancel buy order with wrong id", async function () {
      await expect(erc721BuyOrderFacet.cancelERC721BuyOrder(secondBuyOrderId.add(1)))
        .to.be.revertedWith("ERC721BuyOrder: ERC721 buyOrder does not exist");
    });
    it("Should revert when try to cancel buy order with wrong account", async function () {
      await expect((await erc721BuyOrderFacet.connect(maticHolder)).cancelERC721BuyOrder(firstBuyOrderId))
        .to.be.revertedWith("ERC721BuyOrder: Only aavegotchi owner or buyer can call this function");
    });
    it("Should revert when try to cancel canceled buy order", async function () {
      await expect(erc721BuyOrderFacet.cancelERC721BuyOrder(firstBuyOrderId))
        .to.be.revertedWith("ERC721BuyOrder: Already processed");
    });
    it("Should succeed if cancel valid buy order", async function () {
      const oldBalance = await ghstERC20.balanceOf(ghstHolderAddress);
      await (await erc721BuyOrderFacet.cancelERC721BuyOrder(secondBuyOrderId)).wait();
      const newBalance = await ghstERC20.balanceOf(ghstHolderAddress);
      expect(newBalance.sub(mediumPrice)).to.equal(oldBalance);
    });
  });

  describe("Testing cancelERC721BuyOrderByToken", async function () {
    before(async function () {
      await (await erc721BuyOrderFacet.placeERC721BuyOrder(diamondAddress, lockedAavegotchiId, highPrice)).wait();
    });
    it("Should revert when try to cancel buy order with wrong aavegotchi id", async function () {
      await expect(erc721BuyOrderFacet.cancelERC721BuyOrderByToken(unlockedAavegotchiId))
        .to.be.revertedWith("LibAppStorage: Only aavegotchi owner can call this function");
    });
    it("Should revert when try to cancel buy order with wrong account", async function () {
      await expect((await erc721BuyOrderFacet.connect(maticHolder)).cancelERC721BuyOrderByToken(lockedAavegotchiId))
        .to.be.revertedWith("LibAppStorage: Only aavegotchi owner can call this function");
    });
    it("Should succeed if cancel buy order with valid aavegotchi id", async function () {
      const oldBalance = await ghstERC20.balanceOf(ghstHolderAddress);
      await (await (erc721BuyOrderFacet.connect(aavegotchiOwner)).cancelERC721BuyOrderByToken(lockedAavegotchiId)).wait();
      const newBalance = await ghstERC20.balanceOf(ghstHolderAddress);
      expect(newBalance.sub(highPrice)).to.equal(oldBalance);
    });
    it("Should revert when try to place buy order in 10 minutes from batch canceled", async function () {
      await expect(erc721BuyOrderFacet.placeERC721BuyOrder(diamondAddress, lockedAavegotchiId, highestPrice))
        .to.be.revertedWith("ERC721BuyOrder: Buy order locked for this Aavegotchi");
    });
    it("Should succeed when place buy order after 10 minutes from batch canceled", async function () {
      ethers.provider.send('evm_increaseTime', [601]);
      ethers.provider.send('evm_mine', []);

      const oldBalance = await ghstERC20.balanceOf(ghstHolderAddress);
      const receipt = await (await erc721BuyOrderFacet.placeERC721BuyOrder(diamondAddress, lockedAavegotchiId, highestPrice)).wait();
      const event = receipt!.events!.find(event => event.event === 'ERC721BuyOrderAdd');
      fourthBuyOrderId = event!.args!.buyOrderId;
      expect(event!.args!.buyer).to.equal(ghstHolderAddress);
      const newBalance = await ghstERC20.balanceOf(ghstHolderAddress);
      expect(newBalance.add(highestPrice)).to.equal(oldBalance);
    });
  });

  describe("Testing executeERC721BuyOrder", async function () {
    it("Should revert when try to execute buy order with wrong buy order id", async function () {
      await expect(erc721BuyOrderFacet.executeERC721BuyOrder(fourthBuyOrderId.add(10)))
        .to.be.revertedWith("ERC721BuyOrder: ERC721 buyOrder does not exist");
    });
    it("Should revert when try to execute buy order with wrong account", async function () {
      await expect((await erc721BuyOrderFacet.connect(maticHolder)).executeERC721BuyOrder(fourthBuyOrderId))
        .to.be.revertedWith("ERC721BuyOrder: Only aavegotchi owner can call this function");
    });
    it("Should revert when try to execute canceled buy order", async function () {
      await expect((await erc721BuyOrderFacet.connect(aavegotchiOwner)).executeERC721BuyOrder(firstBuyOrderId))
        .to.be.revertedWith("ERC721BuyOrder: Already processed");
    });
    it("Should succeed when execute buy order with valid data", async function () {
      const buyerOldBalance = await ghstERC20.balanceOf(ghstHolderAddress);
      const sellerOldBalance = await ghstERC20.balanceOf(aavegotchiOwnerAddress);
      const daoOldBalance = await ghstERC20.balanceOf(daoAddress);
      const pixelcraftOldBalance = await ghstERC20.balanceOf(pixelcraftAddress);
      const diamondOldBalance = await ghstERC20.balanceOf(diamondAddress);

      const receipt = await (await (await erc721BuyOrderFacet.connect(aavegotchiOwner)).executeERC721BuyOrder(fourthBuyOrderId)).wait();
      const event = receipt!.events!.find(event => event.event === 'ERC721BuyOrderExecuted');
      expect(event!.args!.buyer).to.equal(ghstHolderAddress);

      const buyerNewBalance = await ghstERC20.balanceOf(ghstHolderAddress);
      const sellerNewBalance = await ghstERC20.balanceOf(aavegotchiOwnerAddress);
      const daoNewBalance = await ghstERC20.balanceOf(daoAddress);
      const pixelcraftNewBalance = await ghstERC20.balanceOf(pixelcraftAddress);
      const diamondNewBalance = await ghstERC20.balanceOf(diamondAddress);
      // Check ghst balance changes
      expect(buyerOldBalance).to.equal(buyerNewBalance);
      expect(sellerNewBalance.sub(sellerOldBalance)).to.equal(highestPrice.mul(965).div(1000)); // 96.5%
      expect(daoNewBalance.sub(daoOldBalance)).to.equal(highestPrice.div(100)); // 1%
      expect(pixelcraftNewBalance.sub(pixelcraftOldBalance)).to.equal(highestPrice.div(50)); // 2%
      expect(diamondOldBalance.sub(diamondNewBalance)).to.equal(highestPrice);

      // Check aavegotchi owner
      const newAavegotchiOwnerAddress = await aavegotchiFacet.ownerOf(lockedAavegotchiId);
      expect(newAavegotchiOwnerAddress).to.equal(ghstHolderAddress);

      // Check buy order status
      const buyOrder = await erc721BuyOrderFacet.getERC721BuyOrder(fourthBuyOrderId);
      expect(buyOrder.buyOrderId).to.equal(fourthBuyOrderId);
      expect(buyOrder.timePurchased.gt(0)).to.equal(true);
    });
  });
  describe("Testing ERC721MarketplaceFacet", async function () {
    before(async function () {
      await (await aavegotchiFacet.connect(ghstHolder)).approve(aavegotchiOwnerAddress, lockedAavegotchiId);
      await (await (await aavegotchiFacet.connect(aavegotchiOwner))["safeTransferFrom(address,address,uint256)"](ghstHolderAddress, aavegotchiOwnerAddress, lockedAavegotchiId)).wait();
    });
    it("Buy order should be canceled when cancelERC721Listing", async function () {
      let receipt = await (await erc721MarketplaceFacet.addERC721Listing(erc721MarketplaceFacet.address, lockedAavegotchiId, listPrice)).wait();
      let event = receipt!.events!.find(event => event.event === 'ERC721ListingAdd');
      const listingId = event!.args!.listingId;

      receipt = await (await erc721BuyOrderFacet.placeERC721BuyOrder(diamondAddress, lockedAavegotchiId, highestPrice)).wait();
      event = receipt!.events!.find(event => event.event === 'ERC721BuyOrderAdd');
      const buyOrderId = event!.args!.buyOrderId;

      await (await erc721MarketplaceFacet.cancelERC721Listing(listingId)).wait();

      const buyOrder = await erc721BuyOrderFacet.getERC721BuyOrder(buyOrderId);
      expect(buyOrder.buyOrderId).to.equal(buyOrderId);
      expect(buyOrder.cancelled).to.equal(true);
    });
    it("Buy order should be canceled when cancelERC721Listings", async function () {
      let receipt = await (await erc721MarketplaceFacet.addERC721Listing(erc721MarketplaceFacet.address, lockedAavegotchiId, listPrice)).wait();
      let event = receipt!.events!.find(event => event.event === 'ERC721ListingAdd');
      const listingId = event!.args!.listingId;

      receipt = await (await erc721BuyOrderFacet.placeERC721BuyOrder(diamondAddress, lockedAavegotchiId, highestPrice)).wait();
      event = receipt!.events!.find(event => event.event === 'ERC721BuyOrderAdd');
      const buyOrderId = event!.args!.buyOrderId;

      await (await (await erc721MarketplaceFacet.connect(contractOwner)).cancelERC721Listings([listingId])).wait();

      const buyOrder = await erc721BuyOrderFacet.getERC721BuyOrder(buyOrderId);
      expect(buyOrder.buyOrderId).to.equal(buyOrderId);
      expect(buyOrder.cancelled).to.equal(true);
    });
    it("Buy order should be canceled when executeERC721Listing", async function () {
      let receipt = await (await erc721MarketplaceFacet.addERC721Listing(erc721MarketplaceFacet.address, lockedAavegotchiId, listPrice)).wait();
      let event = receipt!.events!.find(event => event.event === 'ERC721ListingAdd');
      const listingId = event!.args!.listingId;

      receipt = await (await erc721BuyOrderFacet.placeERC721BuyOrder(diamondAddress, lockedAavegotchiId, highestPrice)).wait();
      event = receipt!.events!.find(event => event.event === 'ERC721BuyOrderAdd');
      const buyOrderId = event!.args!.buyOrderId;

      await (await (await erc721MarketplaceFacet.connect(ghstHolder)).executeERC721Listing(listingId)).wait();

      const buyOrder = await erc721BuyOrderFacet.getERC721BuyOrder(buyOrderId);
      expect(buyOrder.buyOrderId).to.equal(buyOrderId);
      expect(buyOrder.cancelled).to.equal(true);
    });
  });
});
