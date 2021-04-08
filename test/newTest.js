const { expect } = require("chai");
const { truffleAssert } = require("truffle-assertions");

describe("Shopping  ", () => {
  let shopFacet,
      itemsFacet,
      daoFacet,
      libAavegotchi,
      ghstContract,
      maticGhstAddress,
      aavegotchiDiamondAddress,
      signer,
      buyer,
      owner,
      addr0,
      addr1;


  before(async () => {

    maticGhstAddress = "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7";
    aavegotchiDiamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";

    

    shopFacet = await ethers.getContractAt("contracts/Aavegotchi/facets/ShopFacet.sol:ShopFacet", aavegotchiDiamondAddress);
    itemsFacet = await ethers.getContractAt("contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet", aavegotchiDiamondAddress);
    daoFacet = await ethers.getContractAt("contracts/Aavegotchi/facets/DAOFacet.sol:DAOFacet", aavegotchiDiamondAddress);
    libAavegotchi = await ethers.getContractAt("LibAavegotchi", aavegotchiDiamondAddress);

    //ghst contract
     ghstContract = await ethers.getContractAt("GHSTFacet",maticGhstAddress);

    [addr0, addr1] = await ethers.getSigners();
    owner = await (await ethers.getContractAt("OwnershipFacet", aavegotchiDiamondAddress)).owner();

    await hre.network.provider.request({
       method: "hardhat_impersonateAccount",
       params: [owner]
     }
    );

    signer = await ethers.provider.getSigner(owner);

    await (await daoFacet.connect(signer)).updateItemTypeMaxQuantity(['129'], ['1000']);

    await hre.network.provider.request({
       method: "hardhat_stopImpersonatingAccount",
       params: [owner]
     }
    );

  });


  it.only("Should purchase items with GHST", async () => {

    let ghstWhale = "0x41c63953aA3E69aF424CE6873C60BA13857b31bB"

    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [ghstWhale]}
    );

    buyer = await ethers.getSigner(ghstWhale);

    console.log('buyer:',buyer.address)

    const item = await itemsFacet.getItemType('129')
   
    const connectedShopFacet = await shopFacet.connect(buyer)
    const connectedGhstContract = await ghstContract.connect(buyer)


    

    //first approve the funds to be transferred
    await connectedGhstContract.approve(aavegotchiDiamondAddress,ethers.utils.parseEther("10000000000"))

    const allowance = await connectedGhstContract.allowance(buyer.address, aavegotchiDiamondAddress)
    const balance = await connectedGhstContract.balanceOf(ghstWhale)
    console.log('balance:',balance.toString())

    console.log('allowance:',allowance.toString())

     await connectedShopFacet.purchaseItemsWithGhst(ghstWhale, ['129'], ['1']);
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
