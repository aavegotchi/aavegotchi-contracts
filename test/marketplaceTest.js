/* global describe it before ethers */
const { expect } = require('chai')
const truffleAssert = require('truffle-assertions')

const { deployProject } = require('../scripts/deploy.js')

describe('Deploying Contracts, SVG and Minting Items', async function () {
    before(async function () {
        const deployVars = await deployProject('deployTest')
        global.set = true
        global.account = deployVars.account
        global.aavegotchiDiamond = deployVars.aavegotchiDiamond
        global.aavegotchiFacet = deployVars.aavegotchiFacet
        global.itemsFacet = deployVars.itemsFacet
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
        global.marketplaceFacet = deployVars.marketplaceFacet
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
        await global.marketplaceFacet.setERC1155Listing(address, "129", 10, ethers.utils.parseEther("10"))
        const listings = await global.marketplaceFacet.getERC1155Listings("0", "listed", "100")
        console.log('listings:', listings)
    })
})
