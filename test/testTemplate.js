/* global describe it before ethers */
const { expect } = require('chai')
const truffleAssert = require('truffle-assertions')

//This is a simple version of the deploy script without any of the Wearable Sets or SVGs. If you need to do SVG tests, you'll need to use /scripts/deploy.js instead of /deplyLight.js!

const { deployProject } = require('../scripts/deployLight.js')

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

    console.log('balances:',balances)
    // Start at 1 because 0 is always empty
    expect(balances.length).to.equal(0)

    // Hawaiian Shirt and SantaHat
    await global.shopFacet.purchaseItemsWithGhst(account, ['114', '115', '116', '126', '127', '128', '129'], ['10', '10', '10', '100', '10', '10', '10'])
    balances = await global.itemsFacet.itemBalances(account)

    console.log('balances:',balances)

    const item114 = balances.find((item) => {
      return item.itemId.toString() === "114"
    })

    expect(item114.balance).to.equal(10)
   // console.log('balances:', balances[129].toString())
   // expect(balances[129]).to.equal(10)
  })
})