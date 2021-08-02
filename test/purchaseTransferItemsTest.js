const { expect } = require('chai')

const truffleAssert = require('truffle-assertions')

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

     itemsFacet = await ethers.getContractAt('contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet', aavegotchiDiamondAddress)

    const id = '160'
    const quantity = '10'

    let ownerBalance = await itemsFacet.balanceOf(opsWallet, id)
    console.log('owner', ownerBalance)

   // await itemsTransferFacet.safeTransferFrom(opsWallet, aavegotchiDiamondAddress, id, quantity, [])

    ownerBalance = await itemsFacet.balanceOf(opsWallet, id)
    console.log('owner', ownerBalance.toString())
    const diamondBalance = await itemsFacet.balanceOf(aavegotchiDiamondAddress, id)
    console.log('diamond balance:', diamondBalance.toString())

    await hre.network.provider.request({
      method: 'hardhat_stopImpersonatingAccount',
      params: [opsWallet]
    }
    )
  })

  it('Should purchase items with GHST', async () => {
    const ghstWhale = '0x41c63953aA3E69aF424CE6873C60BA13857b31bB'

    await hre.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [ghstWhale]
    }
    )

    buyer = await ethers.getSigner(ghstWhale)

    let connectedShopFacet = await shopFacet.connect(buyer)
    const connectedGhstContract = await ghstContract.connect(buyer)

    let beforeBalance = await connectedGhstContract.balanceOf(ghstWhale)
    console.log('before balance:', beforeBalance.toString())

    const itemType = await itemsFacet.getItemType("160")

    const beforeBuyingBalance =  await itemsFacet.balanceOf(ghstWhale,"160")

    //Can only buy one
    await truffleAssert.reverts(connectedShopFacet.purchaseTransferItemsWithGhst(ghstWhale, ['160'], ['2']),"ShopFacet: Can only purchase 1 of an item per transaction")
    await connectedShopFacet.purchaseTransferItemsWithGhst(ghstWhale, ['160'], ['1'])

    //Check that NFT balance has increased
    const afterBuyingBalance = await itemsFacet.balanceOf(ghstWhale,"160")
    expect(afterBuyingBalance).to.equal(Number(beforeBuyingBalance.toString())+1)

    //Check that GHST balance has decreased
    let afterBalance = await connectedGhstContract.balanceOf(ghstWhale)
    let ghstPrice = itemType.ghstPrice
    console.log('after balance:', afterBalance.toString())
    expect(afterBalance).to.equal((beforeBalance).sub(ghstPrice))


      //Switch to buyer with smaller balance
      const smallFish = "0xC3c2e1Cf099Bc6e1fA94ce358562BCbD5cc59FE5"
      await hre.network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [smallFish]
      })
      buyer = await ethers.getSigner(smallFish)
       connectedShopFacet = await shopFacet.connect(buyer)
      await truffleAssert.reverts(connectedShopFacet.purchaseTransferItemsWithGhst(smallFish, ['160'], ['1']),"ShopFacet: Not enough GHST!")

  })


})
