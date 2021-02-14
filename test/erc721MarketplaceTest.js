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
    global.erc721MarketplaceFacet = deployVars.erc721MarketplaceFacet
  })
  it('Should mint 10,000,000 GHST tokens', async function () {
    await global.ghstTokenContract.mint()
    const balance = await global.ghstTokenContract.balanceOf(global.account)
    const oneMillion = ethers.utils.parseEther('10000000')
    expect(balance).to.equal(oneMillion)
  })
  it('Should purchase portals using GHST', async function () {
    let balance = await global.ghstTokenContract.balanceOf(global.account)
    await global.ghstTokenContract.approve(global.aavegotchiDiamond.address, balance)

    const tx = await global.shopFacet.buyPortals(global.account, ethers.utils.parseEther('5000'))
    await tx.wait()

    global.erc721MarketplaceFacet.addERC721Listing(global.erc721MarketplaceFacet.address, 5, ethers.utils.parseEther('1'))
    global.erc721MarketplaceFacet.addERC721Listing(global.erc721MarketplaceFacet.address, 6, ethers.utils.parseEther('1'))
    global.erc721MarketplaceFacet.addERC721Listing(global.erc721MarketplaceFacet.address, 7, ethers.utils.parseEther('1'))

    balance = await global.aavegotchiFacet.balanceOf(global.account)
    console.log('Number of portals:', balance)

    let listings = await global.erc721MarketplaceFacet.getERC721Listings(0, 'listed', 20)
    console.log(listings)

    await global.erc721MarketplaceFacet.cancelERC721Listing(listings[1].listingId)

    listings = await global.erc721MarketplaceFacet.getERC721Listings(0, 'listed', 20)
    console.log(listings)
    console.log('get owner listings')
    console.log()
    listings = await global.erc721MarketplaceFacet.getOwnerERC721Listings(global.account, 0, 'listed', 20)
    console.log(listings)
  })
})
