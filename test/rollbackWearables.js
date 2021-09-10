/* global describe it before ethers */
const { expect } = require("chai");
const {
  upgradeItemsRollback
} = require("../scripts/upgrades/upgrade-itemsRollback");

const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";

describe("Rolling back wearables", async function() {
  this.timeout(300000);

  before(async function() {
    await upgradeItemsRollback("deployTest");
  });

  describe("Checking the result of rolling back 0xed3BBbe2e3eacE311a94b059508Bbdda9149AB23", function() {
    it("Wearable 1172 balance of diamond should be zero", async function() {
      const itemsFacet = await ethers.getContractAt("contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet", diamondAddress);
      const bals = await itemsFacet.itemBalancesOfToken(diamondAddress, 1172);
      expect(bals.length).to.equal(0);
    });
  });

  describe("Checking the result of rolling back 0x69aC8b337794dAD862C691b00ccc3a89F1F3293d", function() {
    it("Check wearable 57 ~ 59", async function() {
      const userAddress = "0x69aC8b337794dAD862C691b00ccc3a89F1F3293d";
      const aavegotchiWearables = await (await ethers.getContractAt("contracts/shared/interfaces/IERC1155.sol:IERC1155", diamondAddress));
      for (const tokenId of [57, 58, 59]) {
        let bal = await aavegotchiWearables.balanceOf(diamondAddress, tokenId);
        expect(bal).to.equal(0);
        bal = await aavegotchiWearables.balanceOf(userAddress, tokenId);
        expect(bal).to.equal(1);
      }
    });
  });
});
