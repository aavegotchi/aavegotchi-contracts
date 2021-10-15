/* global describe it before ethers network */
/* eslint prefer-const: "off" */

//@ts-ignore
import { ethers, network } from "hardhat";
import chai from "chai";
import { upgrade } from "../scripts/upgrades/upgrade-erc721BuyOrderFacet";
import { impersonate } from "../scripts/helperFunctions";
import { AavegotchiFacet, ERC721BuyOrderFacet } from "../typechain";
import { ERC20Token } from "../typechain";

const { expect } = chai;

describe("Testing ERC721 Buy Order", async function () {
  this.timeout(300000);

  const ghstAddress = "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7";
  const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
  const maticHolderAddress = "0x3507e4978e0eb83315d20df86ca0b976c0e40ccb";
  const ghstHolder = "0xBC67F26c2b87e16e304218459D2BB60Dac5C80bC";
  const lockedAavegotchiId = 23501;
  const unlockedAavegotchiId = 10000;
  const price = ethers.utils.parseUnits('100', 'ether');
  const mediumPrice = ethers.utils.parseUnits('105', 'ether');
  const highPrice = ethers.utils.parseUnits('110', 'ether');
  const highestPrice = ethers.utils.parseUnits('115', 'ether');
  let erc721BuyOrderFacet: ERC721BuyOrderFacet;
  let ghstERC20: ERC20Token;
  let aavegotchiOwner: any;
  let maticHolder: any;
  let firstBuyOrderId: any;
  let secondBuyOrderId: any;

  before(async function () {
    await upgrade();

    erc721BuyOrderFacet = (await ethers.getContractAt(
      "ERC721BuyOrderFacet",
      diamondAddress
    )) as ERC721BuyOrderFacet;
    const aavegotchiFacet = (await ethers.getContractAt(
      "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
      diamondAddress
    )) as AavegotchiFacet;

    ghstERC20 = (await ethers.getContractAt('ERC20Token', ghstAddress)) as ERC20Token;

    // This account is needed for ETH for pixelcraft account
    await network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [maticHolderAddress]
    });
    maticHolder = await ethers.getSigner(maticHolderAddress);

    // This is needed for impersonating owner of test aavegotchi
    const ownerAddress = await aavegotchiFacet.ownerOf(lockedAavegotchiId);
    await network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [ownerAddress]
    });
    aavegotchiOwner = await ethers.getSigner(ownerAddress);
  });

  describe("Testing placeERC721BuyOrder", async function () {
    it("Should revert if place buy order to unlocked Aavegotchi", async function () {
      erc721BuyOrderFacet = await impersonate(ghstHolder, erc721BuyOrderFacet, ethers, network);
      await expect(erc721BuyOrderFacet.placeERC721BuyOrder(diamondAddress, unlockedAavegotchiId, 1))
        .to.be.revertedWith("LibAppStorage: Only callable on locked Aavegotchis");
    });
    it("Should revert if price is lower than 1 GHST", async function () {
      await expect(erc721BuyOrderFacet.placeERC721BuyOrder(diamondAddress, lockedAavegotchiId, 0))
        .to.be.revertedWith("ERC721BuyOrderFacet: price should be 1 GHST or larger");
    });
    it("Should revert if buyer have not enough GHST", async function () {
      await expect(erc721BuyOrderFacet.placeERC721BuyOrder(diamondAddress, lockedAavegotchiId, ethers.utils.parseUnits('1000000000', 'ether')))
        .to.be.revertedWith("ERC721BuyOrderFacet: Not enough GHST!");
    });
    describe("If there's no buy order", async function () {
      it("Should succeed", async function () {
        const oldBalance = await ghstERC20.balanceOf(ghstHolder);
        const receipt = await (await erc721BuyOrderFacet.placeERC721BuyOrder(diamondAddress, lockedAavegotchiId, price)).wait();
        const event = receipt!.events!.find(event => event.event === 'ERC721BuyOrderAdd');
        firstBuyOrderId = event!.args!.buyOrderId;
        expect(event!.args!.buyer).to.equal(ghstHolder);
        const newBalance = await ghstERC20.balanceOf(ghstHolder);
        expect(newBalance.add(price)).to.equal(oldBalance);
      });
    });
    describe("If there's already buy order", async function () {
      it("Should revert if price is equal or lower than already exist buy order", async function () {
        await expect(erc721BuyOrderFacet.placeERC721BuyOrder(diamondAddress, lockedAavegotchiId, price))
          .to.be.revertedWith("ERC721BuyOrderFacet: Higher price buy order already exist");
      });
      it("Should succeed if price is greater than price of exist buy order", async function () {
        const oldBalance = await ghstERC20.balanceOf(ghstHolder);
        const receipt = await (await erc721BuyOrderFacet.placeERC721BuyOrder(diamondAddress, lockedAavegotchiId, mediumPrice)).wait();
        const event = receipt!.events!.find(event => event.event === 'ERC721BuyOrderAdd');
        secondBuyOrderId = event!.args!.buyOrderId;
        expect(event!.args!.buyer).to.equal(ghstHolder);
        const newBalance = await ghstERC20.balanceOf(ghstHolder);
        expect(newBalance.add(mediumPrice).sub(price)).to.equal(oldBalance);
      });
    });
  });

  describe("Testing getERC721BuyOrder", async function () {
    it("Should revert when try to get buy order with wrong id", async function () {
      await expect(erc721BuyOrderFacet.getERC721BuyOrder(secondBuyOrderId.add(1)))
        .to.be.revertedWith("ERC721BuyOrderFacet: ERC721 buyOrder does not exist");
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
        .to.be.revertedWith("ERC721BuyOrderFacet: buyOrder doesn't exist");
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
        .to.be.revertedWith("ERC721BuyOrderFacet: ERC721 buyOrder does not exist");
    });
    it("Should revert when try to cancel buy order with wrong account", async function () {
      await expect((await erc721BuyOrderFacet.connect(maticHolder)).cancelERC721BuyOrder(firstBuyOrderId))
        .to.be.revertedWith("ERC721BuyOrderFacet: Only aavegotchi owner or buyer can call this function");
    });
    it("Should revert when try to cancel canceled buy order", async function () {
      await expect(erc721BuyOrderFacet.cancelERC721BuyOrder(firstBuyOrderId))
        .to.be.revertedWith("LibBuyOrder: Already processed");
    });
    it("Should succeed if cancel valid buy order", async function () {
      const oldBalance = await ghstERC20.balanceOf(ghstHolder);
      await (await erc721BuyOrderFacet.cancelERC721BuyOrder(secondBuyOrderId)).wait();
      const newBalance = await ghstERC20.balanceOf(ghstHolder);
      expect(newBalance.sub(mediumPrice)).to.equal(oldBalance);
    });
  });

  describe("Testing cancelERC721BuyOrderByToken", async function () {
    before(async function () {
      const receipt = await (await erc721BuyOrderFacet.placeERC721BuyOrder(diamondAddress, lockedAavegotchiId, highPrice)).wait();
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
      const oldBalance = await ghstERC20.balanceOf(ghstHolder);
      await (await (erc721BuyOrderFacet.connect(aavegotchiOwner)).cancelERC721BuyOrderByToken(lockedAavegotchiId)).wait();
      const newBalance = await ghstERC20.balanceOf(ghstHolder);
      expect(newBalance.sub(highPrice)).to.equal(oldBalance);
    });
    it("Should revert when try to place buy order in 10 minutes from batch canceled", async function () {
      await expect(erc721BuyOrderFacet.placeERC721BuyOrder(diamondAddress, lockedAavegotchiId, highestPrice))
        .to.be.revertedWith("ERC721BuyOrderFacet: Buy order locked for this Aavegotchi");
    });
    it("Should revert when try to place buy order in 10 minutes from batch canceled", async function () {
      ethers.provider.send('evm_increaseTime', [601]);
      ethers.provider.send('evm_mine', []);

      const oldBalance = await ghstERC20.balanceOf(ghstHolder);
      const receipt = await (await erc721BuyOrderFacet.placeERC721BuyOrder(diamondAddress, lockedAavegotchiId, highestPrice)).wait();
      const event = receipt!.events!.find(event => event.event === 'ERC721BuyOrderAdd');
      expect(event!.args!.buyer).to.equal(ghstHolder);
      const newBalance = await ghstERC20.balanceOf(ghstHolder);
      expect(newBalance.add(highestPrice)).to.equal(oldBalance);
    });
  });
});
