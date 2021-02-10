/* global describe it before ethers */
const { expect } = require('chai')
const truffleAssert = require('truffle-assertions')

const { deployProject } = require('../scripts/deploy.js')

describe('Deploying Contracts, SVG and Minting Items', async function () {
  before(async function () {
    this.timeout(100000)
    const deployVars = await deployProject('deployTest')
    global.set = true
    global.account = deployVars.account
    global.aavegotchiDiamond = deployVars.aavegotchiDiamond
    global.aavegotchiFacet = deployVars.aavegotchiFacet
    global.itemsFacet = deployVars.itemsFacet
    global.itemsTransferFacet = deployVars.itemsTransferFacet
    global.collateralFacet = deployVars.collateralFacet
    global.shopFacet = deployVars.shopFacet
    global.daoFacet = deployVars.daoFacet
    global.ghstTokenContract = deployVars.ghstTokenContract
    global.vrfFacet = deployVars.vrfFacet
    global.svgFacet = deployVars.svgFacet
    global.linkAddress = deployVars.linkAddress
    global.linkContract = deployVars.linkContract
    global.vouchersContract = deployVars.vouchersContract
    global.diamondLoupeFacet = deployVars.diamondLoupeFacet
    global.metaTransactionsFacet = deployVars.metaTransactionsFacet
    global.erc1155MarketplaceFacet = deployVars.erc1155MarketplaceFacet
  })
  it('Should mint 10,000,000 GHST tokens', async function () {
    await global.ghstTokenContract.mint()
    const balance = await global.ghstTokenContract.balanceOf(global.account)
    const oneMillion = ethers.utils.parseEther('10000000')
    expect(balance).to.equal(oneMillion)
  })
  it('Should purchase items using GHST', async function () {
    const balance = await ghstTokenContract.balanceOf(account)
    await ghstTokenContract.approve(aavegotchiDiamond.address, balance)

    let balances = await global.itemsFacet.itemBalances(account)
    // Start at 1 because 0 is always empty
    expect(balances[114]).to.equal(0)

    // Hawaiian Shirt and SantaHat
    await global.shopFacet.purchaseItemsWithGhst(account, ['114', '115', '116', '126', '127', '128', '129'], ['10', '10', '10', '100', '10', '10', '10'])
    balances = await global.itemsFacet.itemBalances(account)

    console.log('balances:', balances[129].toString())
    expect(balances[129]).to.equal(10)
  })
})

describe('Marketplace functionality', async function () {
  it('Should list an item', async function () {
    const address = global.aavegotchiDiamond.address
    console.log('address:', address)
    await global.erc1155MarketplaceFacet.setERC1155Listing(address, '114', 10, ethers.utils.parseEther('10'))
    const listings = await global.erc1155MarketplaceFacet.getERC1155Listings('0', 'listed', '100')
    expect(listings.length).to.equal(1)
    expect(listings[0].quantity).to.equal(10)
    console.log('listings:', listings[0])
  })

  it('Should execute an order to buy and reduce quantity by 1', async function () {
    // transfer GHST to bob
    const accounts = await ethers.getSigners()
    const bobSigner = await accounts[1]
    const bobAddress = bobSigner.getAddress()
    await global.ghstTokenContract.transferFrom(account, bobAddress, ethers.utils.parseEther('100000'))

    let listings = await global.erc1155MarketplaceFacet.getERC1155Listings('0', 'listed', '100')

    const bobGhst = global.ghstTokenContract.connect(bobSigner)
    await bobGhst.approve(aavegotchiDiamond.address, ethers.utils.parseEther('100000000000'))

    const bobMarket = global.erc1155MarketplaceFacet.connect(bobSigner)
    await bobMarket.executeERC1155Listing(listings[0].listingId, '1')

    listings = await global.erc1155MarketplaceFacet.getERC1155Listings('0', 'listed', '100')

    // Listing quantity is reduced by 1
    expect(listings[0].quantity).to.equal(9)

    // Buyer receives 1 NFT
    const nftBalance = await global.itemsFacet.balanceOf(bobAddress, 114)
    expect(nftBalance).to.equal(1)
  })

  it('Should modify the listing quantity', async function () {
    const address = global.aavegotchiDiamond.address
    await global.erc1155MarketplaceFacet.setERC1155Listing(address, '114', 5, ethers.utils.parseEther('10'))

    const listings = await global.erc1155MarketplaceFacet.getERC1155Listings('0', 'listed', '100')
    expect(listings[0].quantity).to.equal(5)

    console.log('listings:', listings)
  })

  it('Should modify the listing price', async function () {
    const address = global.aavegotchiDiamond.address
    await global.erc1155MarketplaceFacet.setERC1155Listing(address, '114', 5, ethers.utils.parseEther('100'))

    const listings = await global.erc1155MarketplaceFacet.getERC1155Listings('0', 'listed', '100')
    expect(listings[0].priceInWei).to.equal(ethers.utils.parseEther('100'))

    console.log('listings:', listings)
  })
})

describe('Fees', async function () {
  it('Can update listing fee', async function () {

  })

  it('Listing fee is burned', async function () {

  })

  it('Pixelcraft receives ')
})
