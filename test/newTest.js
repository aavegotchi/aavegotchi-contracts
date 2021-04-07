const { expect } = require("chai");

describe("Shopping  ", () => {
  let shopFacet, itemsFacet, owner, addr1;


  before(async () => {
    shopFacet = await ethers.getContractFactory("contracts/Aavegotchi/facets/ShopFacet.sol:ShopFacet");
    shop = await shopFacet.deploy();

    itemsFacet = await ethers.getContractFactory("contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet");
    items = await itemsFacet.deploy();

    [owner, addr1] = await ethers.getSigners();
  });

  it.only("Should purchase items with Ghost", async () => {
    // console.log("itemsFacet", itemsFacet);
    let balances = await items.itemBalances(addr1.address);
    console.log("balance", balances);
    // expect(balances[1]).to.equal(10);
    //
    // await shopFacet.purchaseItemsWithGhst(addr1.address, ['1'], ['10']);
    // balances = await itemsFacet.itemBalances(addr1.address);
    // expect(balances[1]).to.equal(20);
  });
});
