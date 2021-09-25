/* global describe it before ethers */
const { expect } = require("chai");
const {
  upgradeItemsRollback,
} = require("../scripts/upgrades/upgrade-itemsRollback");

const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
const itemManager = "0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119";

describe("Rolling back wearables", async function () {
  this.timeout(300000);

  let itemsTransferFacet;
  before(async function () {
    await upgradeItemsRollback("deployTest");

    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [itemManager],
    });
    const signer = await ethers.provider.getSigner(itemManager);

    itemsTransferFacet = await (
      await ethers.getContractAt("ItemsTransferFacet", diamondAddress)
    ).connect(signer);

    let tx = await itemsTransferFacet.extractItemsFromSacrificedGotchi(
      itemManager,
      1172,
      [143, 197, 235, 236],
      [2, 1, 5, 10]
    );
    await tx.wait();
    tx = await itemsTransferFacet.extractItemsFromDiamond(
      itemManager,
      [57, 58, 59],
      [1, 1, 1]
    );
    await tx.wait();
  });

  describe("Checking the result of rolling back 0xed3BBbe2e3eacE311a94b059508Bbdda9149AB23", function () {
    it("Wearable 1172 balance of diamond should be zero", async function () {
      const itemsFacet = await ethers.getContractAt(
        "contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet",
        diamondAddress
      );
      let bals = await itemsFacet.itemBalancesOfToken(diamondAddress, 1172);
      expect(bals.length).to.equal(0);

      bals = await itemsFacet.itemBalances(itemManager);

      /* bals.forEach((bal) => {
        console.log("bal:", bal.itemId.toString(), bal.balance.toString());
      });
      */
    });
  });

  describe("Checking the result of rolling back 0x69aC8b337794dAD862C691b00ccc3a89F1F3293d", function () {
    it("Check wearable 57 ~ 59", async function () {
      const aavegotchiWearables = await await ethers.getContractAt(
        "contracts/shared/interfaces/IERC1155.sol:IERC1155",
        diamondAddress
      );
      for (const tokenId of [57, 58, 59]) {
        let bal = await aavegotchiWearables.balanceOf(diamondAddress, tokenId);
        expect(bal).to.equal(0);
        bal = await aavegotchiWearables.balanceOf(itemManager, tokenId);
        expect(bal).to.equal(1);
      }
    });
  });

  describe("Permissions", function () {
    it("Cannot remove wearables from non-sacrificed aavegotchis", async function () {
      await expect(
        itemsTransferFacet.extractItemsFromSacrificedGotchi(
          itemManager,
          7938,
          [211],
          [1]
        )
      ).to.be.revertedWith("Aavegotchi has not been sacrificed");
    });
  });
});
