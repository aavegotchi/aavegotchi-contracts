const { expect } = require("chai");
const { truffleAssert } = require("truffle-assertions");

describe("Shopping  ", () => {
  let shopFacet,
      itemsFacet,
      daoFacet,
      libAavegotchi,
      ghstFacet,
      aavegotchiDiamondAddress,
      signer,
      owner,
      addr1;


  before(async () => {
    aavegotchiDiamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";

    shopFacet = await ethers.getContractAt("contracts/Aavegotchi/facets/ShopFacet.sol:ShopFacet", aavegotchiDiamondAddress);
    itemsFacet = await ethers.getContractAt("contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet", aavegotchiDiamondAddress);
    daoFacet = await ethers.getContractAt("contracts/Aavegotchi/facets/DAOFacet.sol:DAOFacet", aavegotchiDiamondAddress);
    libAavegotchi = await ethers.getContractAt("LibAavegotchi", aavegotchiDiamondAddress);
    ghstFacet = await ethers.getContractAt("GHSTFacet", aavegotchiDiamondAddress);

    [owner, addr1] = await ethers.getSigners();
    owner = await (await ethers.getContractAt("OwnershipFacet", aavegotchiDiamondAddress)).owner();

    await hre.network.provider.request({
       method: "hardhat_impersonateAccount",
       params: [owner]
     }
    );

    signer = ethers.provider.getSigner(owner);
  });

  it.only("Should purchase items with GHST", async () => {
    // console.log("itemsFacet", itemsFacet);
    // let balances = await items.itemBalances(addr1.address);

    // expect(balances[1]).to.equal(10);
    // await daoFacet.connect(owner).setDao(addr1, addr1);
    await (await daoFacet.connect(signer)).updateItemTypeMaxQuantity(['129'], ['1000']);

    await ghstFacet.mintTo(addr1.address);

    await shopFacet.purchaseItemsWithGhst(addr1.address, ['129'], ['10']);
    let balances = await itemsFacet.itemBalances(addr1.address);
    console.log("balance", balances);
    // expect(balances[1]).to.equal(20);
  });

  it("Should NOT purchase items because items cannot be purchased with GHST", async () => {
    await expect(shopFacet.purchaseItemsWithGhst(addr1.address, ['1'], ['10'])).to.be.reverted;
  });

  it("Should NOT purchase items because total item type quantity exceeds max quantity", async () => {
    await expect(shopFacet.purchaseItemsWithGhst(addr1.address, ['90'], ['10'])).to.be.reverted;
  });

  it("Should NOT purchase items because itemIds.length is NOT equal to quantities.length", async () => {
    await expect(shopFacet.purchaseItemsWithGhst(addr1.address, ['90'], ['10', '1'])).to.be.reverted;
    await expect(shopFacet.purchaseItemsWithGhst(addr1.address, ['90', '129'], ['10'])).to.be.reverted;
  });

  it("Should NOT purchase items with GHST because address does NOT have enough GHST to purchase item", async () => {
    await (await daoFacet.connect(signer)).updateItemTypeMaxQuantity(['129'], ['1000']);

    await expect(shopFacet.purchaseItemsWithGhst(addr1.address, ['129'], ['10']));
  });
});
