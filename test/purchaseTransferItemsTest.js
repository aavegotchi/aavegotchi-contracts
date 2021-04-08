const { expect } = require('chai')

const { truffleAssert } = require('truffle-assertions')

describe('Shopping  ', () => {
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
    addr1

  before(async () => {
    maticGhstAddress = '0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7'
    aavegotchiDiamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d'

    const opsWallet = '0xd0F9F536AA6332a6fe3BFB3522D549FbB3a1b0AE'

    shopFacet = await ethers.getContractAt('contracts/Aavegotchi/facets/ShopFacet.sol:ShopFacet', aavegotchiDiamondAddress)

    // console.log('shop:', shopFacet)

    daoFacet = await ethers.getContractAt('contracts/Aavegotchi/facets/DAOFacet.sol:DAOFacet', aavegotchiDiamondAddress)
    libAavegotchi = await ethers.getContractAt('LibAavegotchi', aavegotchiDiamondAddress)

    // ghst contract
    ghstContract = await ethers.getContractAt('ERC20Token', maticGhstAddress);

    [addr0, addr1] = await ethers.getSigners()
    // owner = await (await ethers.getContractAt("OwnershipFacet", aavegotchiDiamondAddress)).owner();

    // First we need to send the Lil Pump wearables to the Diamond
    await hre.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [opsWallet]
    }
    )
    signer = await ethers.provider.getSigner(opsWallet)

    itemsTransferFacet = (await ethers.getContractAt('contracts/Aavegotchi/facets/ItemsTransferFacet.sol:ItemsTransferFacet', aavegotchiDiamondAddress)).connect(signer)

    const itemsFacet = await ethers.getContractAt('contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet', aavegotchiDiamondAddress)

    const id = '160'
    const quantity = '10'

    let ownerBalance = await itemsFacet.balanceOf(opsWallet, id)
    console.log('owner', ownerBalance)

    await itemsTransferFacet.safeTransferFrom(opsWallet, aavegotchiDiamondAddress, id, quantity, [])

    ownerBalance = await itemsFacet.balanceOf(opsWallet, id)
    console.log('owner', ownerBalance)
    const diamondBalance = await itemsFacet.balanceOf(aavegotchiDiamondAddress, id)
    console.log('diamond balance:', diamondBalance)

    await hre.network.provider.request({
      method: 'hardhat_stopImpersonatingAccount',
      params: [opsWallet]
    }
    )
  })

  it.only('Should purchase items with GHST', async () => {
    const ghstWhale = '0x41c63953aA3E69aF424CE6873C60BA13857b31bB'

    await hre.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [ghstWhale]
    }
    )

    buyer = await ethers.getSigner(ghstWhale)

    const connectedShopFacet = await shopFacet.connect(buyer)
    const connectedGhstContract = await ghstContract.connect(buyer)

    const balance = await connectedGhstContract.balanceOf(ghstWhale)
    console.log('balance:', balance.toString())

    await connectedShopFacet.purchaseTransferItemsWithGhst(ghstWhale, ['160'], ['1'])
  })

  /*
  it("Should NOT purchase items because item NOT permitted to be purchased with GHST", async () => {
    await expect(shopFacet.purchaseItemsWithGhst(buyer._address, ['1'], ['10'])).to.be.reverted;
  });

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
  */
})
