const { expect } = require("chai");
const { ethers, config } = require("hardhat");
const truffleAssert = require("truffle-assertions");
const {deployContract, getDeployedContract} = require("../utils/deployUtils");
const {setup} = require("../utils/setup");

const _mintAavegotchi = async (config) => {

        const ShopFacet = config.shopFacet
        const _ghst = 100
        const GHST = config.ghstTokenContract
        await GHST.approve(ShopFacet.address, ethers.utils.parseEther(`${_ghst}`))
        await ShopFacet.buyPortals(config.account, ethers.utils.parseEther(`${_ghst}`))

        AavegotchiFacet = config.aavegotchiFacet
        const tokenIds = await AavegotchiFacet.tokenIdsOfOwner(config.account)

        return tokenIds
    
}

const _openPortal = async (config, tokenId) => {

    const VrfFacet = config.vrfTestFacet
    await VrfFacet.t_openPortals([tokenId])

    const AavegotchiGameFacet = config.aavegotchiGameFacet
    const ghosts = await AavegotchiGameFacet.portalAavegotchiTraits(tokenId)
    const ghostIndex = 0;

    const GHST = config.ghstTokenContract
    await GHST.approve(config.aavegotchiDiamond.address, ghosts[ghostIndex].minimumStake)
    await AavegotchiGameFacet.claimAavegotchi(tokenId, ghostIndex, ghosts[ghostIndex].minimumStake)
}

describe("AavegotchiGameFacet", async () => {
    let config;
    let tokenIds;
    
    beforeEach(async () => {
        config = await setup()
        tokenIds = (await _mintAavegotchi(config))
        await _openPortal(config, tokenIds[0])
    })
   
    
    describe("aavegotchiNameAvailable", () => {
    })

    describe("currentHaunt", () => {

    })

    describe("revenueShares", () => {

    })

    describe("portalAavegotchiTraits", () => {

    })

    describe("ghstAddress", () => {

    })

    describe("getNumericTraits", () => {

    })

    describe("availableSkillPoints", () => {

    })

    describe("aavegotchiLevel", () => {

    })

    describe("xpUntilNextLevel", () => {

    })

    describe("rarityMultiplier", () => {

    })

    describe("baseRarityScore", () => {

    })

    describe("modifiedTraitsAndRarityScore", () => {

    })

    describe("kinship", () => {

    })

    describe("claimAavegotchi", () => {

    })
    
    describe("setAavegotchiName", () => {

        
        it("should set aavegotchi name when when name is not taken", async () => {

            
            const AavegotchiGameFacet = config.aavegotchiGameFacet
            const AavegotchiFacet = config.aavegotchiFacet

            const name = 'Test Name'

            await AavegotchiGameFacet.setAavegotchiName(tokenIds[0], name)

            const aavegotchi = await AavegotchiFacet.getAavegotchi(tokenIds[0])
      
            expect(aavegotchi.name).to.equal(name)

        })

        it("should revert if aavegotchi name is already taken", async () => {

            const AavegotchiGameFacet = config.aavegotchiGameFacet

            const name = 'Test Name'

            await AavegotchiGameFacet.setAavegotchiName(tokenIds[0], name)

            // create new aavegotchi
            tokenIds = (await _mintAavegotchi(config))
            await _openPortal(config, tokenIds[1])
            
            const expected = "Aavegotchi name used already"
            await truffleAssert.reverts(AavegotchiGameFacet.setAavegotchiName(tokenIds[1], name), expected);
      

        })

    })

    describe("interact", () => {

    })

    describe("spendSkillPoints", () => {

    })
})