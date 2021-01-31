/* global describe it before ethers */
const { expect } = require('chai')
const truffleAssert = require('truffle-assertions')

const { deployProject } = require('../scripts/deploy.js')
const { itemTypes } = require('../scripts/itemTypes.js')

describe('Deploying Contracts, SVG and Minting Aavegotchis', async function () {
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
    })
    it('Should mint 10,000,000 GHST tokens', async function () {
        await global.ghstTokenContract.mint()
        const balance = await global.ghstTokenContract.balanceOf(global.account)
        const oneMillion = ethers.utils.parseEther('10000000')
        expect(balance).to.equal(oneMillion)
    })
})

describe('Buying Portals, VRF', function () {
    it('Portal should cost 100 GHST', async function () {
        const balance = await ghstTokenContract.balanceOf(account)
        await ghstTokenContract.approve(aavegotchiDiamond.address, balance)
        const buyAmount = (50 * Math.pow(10, 18)).toFixed() // 1 portal
        await truffleAssert.reverts(shopFacet.buyPortals(account, buyAmount), 'ShopFacet: Not enough GHST to buy portal')
    })

    it('Should purchase portal', async function () {
        const balance = await ghstTokenContract.balanceOf(account)
        await ghstTokenContract.approve(aavegotchiDiamond.address, balance)
        const buyAmount = ethers.utils.parseEther('500') // 1 portals
        const tx = await global.shopFacet.buyPortals(account, buyAmount)
        const receipt = await tx.wait()

        const myPortals = await global.aavegotchiFacet.allAavegotchisOfOwner(account)
        expect(myPortals.length).to.equal(5)
    })
})

describe('Opening Portals', async function () {
    it('Should open the portal', async function () {
        let myPortals = await global.aavegotchiFacet.allAavegotchisOfOwner(account)
        expect(myPortals[0].status).to.equal(0)
        //  const portalId = myPortals[0].tokenId
        await global.aavegotchiFacet.openPortals(['0', '1', '2', '3'])

        const randomness = ethers.utils.keccak256(new Date().getMilliseconds())

        await global.vrfFacet.rawFulfillRandomness(ethers.constants.HashZero, randomness)

        myPortals = await global.aavegotchiFacet.allAavegotchisOfOwner(account)
        expect(myPortals[0].status).to.equal(2)
    })

    it('Should contain 10 random ghosts in the portal', async function () {
        const myPortals = await global.aavegotchiFacet.allAavegotchisOfOwner(account)
        const ghosts = await global.aavegotchiFacet.portalAavegotchiTraits(myPortals[0].tokenId)
        // console.log(JSON.stringify(ghosts, null, 4))
        ghosts.forEach(async (ghost) => {
            const rarityScore = await global.aavegotchiFacet.baseRarityScore(ghost.numericTraitsUint)
            expect(Number(rarityScore)).to.greaterThan(298)
            expect(Number(rarityScore)).to.lessThan(602)
        })
        expect(ghosts.length).to.equal(10)
    })

    /*
    it('Should show SVGs', async function () {
      const myPortals = await global.aavegotchiFacet.allAavegotchisOfOwner(account)
      const tokenId = myPortals[0].tokenId
      const svgs = await global.svgFacet.portalAavegotchisSvg(tokenId)
      console.log('svgs:', svgs[0])
      expect(svgs.length).to.equal(10)
    })
    */

    it('Can only set name on claimed Aavegotchi', async function () {
        await truffleAssert.reverts(aavegotchiFacet.setAavegotchiName('1', 'Portal'), 'AavegotchiFacet: Must choose Aavegotchi before setting name')
    })

    it('Should claim an Aavegotchi', async function () {
        const myPortals = await global.aavegotchiFacet.allAavegotchisOfOwner(account)
        //  console.log('my portals:', myPortals)
        const tokenId = myPortals[0].tokenId
        const ghosts = await global.aavegotchiFacet.portalAavegotchiTraits(tokenId)
        const selectedGhost = ghosts[4]
        const minStake = selectedGhost.minimumStake
        await global.aavegotchiFacet.claimAavegotchi(tokenId, 4, minStake)
        const kinship = await global.aavegotchiFacet.kinship(tokenId)

        const aavegotchi = await global.aavegotchiFacet.getAavegotchi(tokenId)

        const collateral = aavegotchi.collateral
        expect(selectedGhost.collateralType).to.equal(collateral)
        expect(aavegotchi.status).to.equal(3)
        expect(aavegotchi.hauntId).to.equal(0)
        expect(aavegotchi.stakedAmount).to.equal(minStake)
        expect(kinship).to.equal(50)
    })
})