const { expect } = require("chai");
const { truffleAssert } = require("truffle-assertions");

describe("Shopping  ", () => {
  let shopFacet,
      itemsFacet,
      daoFacet,
      libAavegotchi,
      aavegotchiDiamondAddress,
      signer,
      buyer,
      owner,
      addr0,
      addr1;


  before(async () => {
    aavegotchiDiamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";

    shopFacet = await ethers.getContractAt("contracts/Aavegotchi/facets/ShopFacet.sol:ShopFacet", aavegotchiDiamondAddress);
    itemsFacet = await ethers.getContractAt("contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet", aavegotchiDiamondAddress);
    daoFacet = await ethers.getContractAt("contracts/Aavegotchi/facets/DAOFacet.sol:DAOFacet", aavegotchiDiamondAddress);
    libAavegotchi = await ethers.getContractAt("LibAavegotchi", aavegotchiDiamondAddress);

    [addr0, addr1] = await ethers.getSigners();
    owner = await (await ethers.getContractAt("OwnershipFacet", aavegotchiDiamondAddress)).owner();

    await hre.network.provider.request({
       method: "hardhat_impersonateAccount",
       params: [owner]
     }
    );
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: ["0x096c5ccb33cfc5732bcd1f3195c13dbefc4c82f4"]}
    );

    signer = await ethers.provider.getSigner(owner);
    buyer = await ethers.provider.getSigner("0x096c5ccb33cfc5732bcd1f3195c13dbefc4c82f4");

  });


  it.only("Should purchase items with GHST", async () => {

    // console.log("itemsFacet", itemsFacet);
    // let balances = await itemsFacet.itemBalances(addr1.address);

    console.log("buyer", buyer._address);

    // expect(balances[1]).to.equal(10);
    // await daoFacet.connect(owner).setDao(addr1, addr1);
    await (await daoFacet.connect(signer)).updateItemTypeMaxQuantity(['129'], ['1000']);

    await shopFacet.connect(buyer._address).purchaseItemsWithGhst(buyer._address, ['129'], ['1'], { gasLimit: 8000000 });
    // let balances = await itemsFacet.itemBalances(addr1.address);
    // console.log("balance", balances);
    // expect(balances[1]).to.equal(20);
  });

  it("Should NOT purchase items because item NOT permitted to be purchased with GHST", async () => {
    await expect(shopFacet.purchaseItemsWithGhst(buyer._address, ['1'], ['10'])).to.be.reverted;
  });

  // it.only("Should NOT purchase items because items can NOT transferred to 0 address", async () => {
  //   console.log("Address 0", addr0.address);
  //
  //   await (await daoFacet.connect(signer)).updateItemTypeMaxQuantity(['129'], ['1000']);
  //
  //   await shopFacet.purchaseItemsWithGhst(addr0.address, ['129'], ['10']);
  // });

  it("Should NOT purchase items because total item type quantity exceeds max quantity", async () => {
    await expect(shopFacet.purchaseItemsWithGhst(buyer._address, ['90'], ['10'])).to.be.reverted;
  });

  it("Should NOT purchase items because itemIds.length is NOT equal to quantities.length", async () => {
    await expect(shopFacet.purchaseItemsWithGhst(buyer._address, ['90'], ['10', '1'])).to.be.reverted;
    await expect(shopFacet.purchaseItemsWithGhst(buyer._address, ['90', '129'], ['10'])).to.be.reverted;
  });

  it("Should NOT purchase items with GHST because address does NOT have enough GHST to purchase item", async () => {
    await (await daoFacet.connect(signer)).updateItemTypeMaxQuantity(['129'], ['1000']);

    await expect(shopFacet.purchaseItemsWithGhst(addr1.address, ['129'], ['10']));
  });
});
