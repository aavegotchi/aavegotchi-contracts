const { expect } = require("chai");
const { ethers } = require("hardhat");
const truffleAssert = require("truffle-assertions");
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

        //In the future if would be nice if the response's were inversed (to match the method name)
        it("should return false when name is not used", async () => {

            const AavegotchiGameFacet = config.aavegotchiGameFacet

            const name = 'Test Name'

            const isAvailable = await AavegotchiGameFacet.aavegotchiNameAvailable(name)

            expect(isAvailable).to.equal(false)
    
        })

        //In the future if would be nice if the response's were inversed (to match the method name)
        it("should return true when name is not used", async () => {

            const AavegotchiGameFacet = config.aavegotchiGameFacet

            const name = 'Test Name'

            await AavegotchiGameFacet.setAavegotchiName(tokenIds[0],name)

            const isAvailable = await AavegotchiGameFacet.aavegotchiNameAvailable(name)

            expect(isAvailable).to.equal(true)
    
        })
    })

    describe("currentHaunt", () => {

        it('should return the current haunt', async () => {
            const AavegotchiGameFacet = config.aavegotchiGameFacet

            const expectedHauntId = 1
            
            const portalPrice = 100.0
            const bodyColor = '0x000000'
            const totalCount = 1

            const expectedHaunt = [
                { _hex: '0x2710', _isBigNumber: true },
                ethers.utils.parseEther(`${portalPrice}`),
                bodyColor,
                totalCount
                
            ]

            const haunt = await AavegotchiGameFacet.currentHaunt()

            expect(haunt.length).to.equal(2)
            expect(haunt[0]).to.equal(expectedHauntId)
            expect(haunt[1][0]).to.equal(expectedHaunt[0])
            expect(haunt[1][1]).to.equal(expectedHaunt[1])
            expect(haunt[1][2]).to.equal(expectedHaunt[2])
            expect(haunt[1][3]).to.equal(expectedHaunt[3])

        })

    })

    describe("revenueShares", () => {

        it('should return revenue shares', async () => {

            const AavegotchiGameFacet = config.aavegotchiGameFacet

            const expected = [
                config.burnAddress,
                config.daoTreasury,
                config.rarityFarming,
                config.pixelCraft
            ]

            const res = await AavegotchiGameFacet.revenueShares()

            expect(res).deep.equal(expected)
        })

    })

    describe("portalAavegotchiTraits", () => {


    })

    describe("ghstAddress", () => {
        it('should return ghost address', async () => {
            const AavegotchiGameFacet = config.aavegotchiGameFacet

            const address = await AavegotchiGameFacet.ghstAddress()
            
            expect(address).to.equal(config.ghstTokenContract.address)
        })
    })

    describe("getNumericTraits", () => {

        it('should return numericTraits for a give tokenId', async () => {
            const AavegotchiGameFacet = config.aavegotchiGameFacet

            const res = await AavegotchiGameFacet.getNumericTraits(tokenIds[0])

            const aavegotchi = await AavegotchiFacet.getAavegotchi(tokenIds[0])

            expect(res).deep.equal(aavegotchi.numericTraits)
        })

    })

    describe("availableSkillPoints", () => {


    })

    describe("aavegotchiLevel", () => {
        it('should return aavegotchiLevel for a given tokenId', async () => {
            const AavegotchiGameFacet = config.aavegotchiGameFacet

            const aavegotchi = await AavegotchiFacet.getAavegotchi(tokenIds[0])

            const res = await AavegotchiGameFacet.aavegotchiLevel(aavegotchi.experience)

            expect(res).to.equal(1)
        })
    })

    describe("xpUntilNextLevel", () => {

        it('should return xpUntilNextLevel for a given tokenId', async () => {
            const AavegotchiGameFacet = config.aavegotchiGameFacet

            const aavegotchi = await AavegotchiFacet.getAavegotchi(tokenIds[0])

            const res = await AavegotchiGameFacet.xpUntilNextLevel(aavegotchi.experience)
            
            expect(res._isBigNumber).to.equal(true)
        })

    })

    describe("rarityMultiplier", () => {

        it('should return rarityMultiplier for a given tokenId', async () => {
            const AavegotchiGameFacet = config.aavegotchiGameFacet

            const aavegotchi = await AavegotchiFacet.getAavegotchi(tokenIds[0])

            const res = await AavegotchiGameFacet.rarityMultiplier(aavegotchi.numericTraits)
            
            expect(res._isBigNumber).to.equal(true)
        })

    })

    describe("baseRarityScore", () => {

        it('should return baseRarityScore for a given tokenId', async () => {
            const AavegotchiGameFacet = config.aavegotchiGameFacet

            const aavegotchi = await AavegotchiFacet.getAavegotchi(tokenIds[0])

            const res = await AavegotchiGameFacet.baseRarityScore(aavegotchi.numericTraits)
            
            expect(res._isBigNumber).to.equal(true)
        })

    })

    describe("modifiedTraitsAndRarityScore", () => {

        it('should return modifiedTraits and rarity score for a given tokenId', async () => {
            const AavegotchiGameFacet = config.aavegotchiGameFacet

            const aavegotchi = await AavegotchiFacet.getAavegotchi(tokenIds[0])

            const res = await AavegotchiGameFacet.modifiedTraitsAndRarityScore(tokenIds[0])
            
            expect(res.length).to.equal(2)
            expect(res[0].length).to.equal(6) //array of traits
            expect(res[1]._isBigNumber).to.equal(true) //rarity score
        })

    })

    describe("kinship", () => {

        it('should return kinship for a given tokenId', async () => {
            const AavegotchiGameFacet = config.aavegotchiGameFacet

            const aavegotchi = await AavegotchiFacet.getAavegotchi(tokenIds[0])

            const res = await AavegotchiGameFacet.kinship(tokenIds[0])
            
            expect(res).to.equal(aavegotchi.kinship)
        })


    })

    describe("claimAavegotchi", () => {

        it ('should revert if portal is not open', async () => {

            const AavegotchiGameFacet = config.aavegotchiGameFacet

            // create new aavegotchi
            tokenIds = (await _mintAavegotchi(config))

            const expected = "Portal not open"
            await truffleAssert.reverts(AavegotchiGameFacet.claimAavegotchi(tokenIds[0], 0, 100), expected);

        })

        it ('should revert if option is greater than num of ghosts', async () => {

            const AavegotchiGameFacet = config.aavegotchiGameFacet

            // create new aavegotchi
            tokenIds = (await _mintAavegotchi(config))

            const tokenId = tokenIds[1]
            
            //open portal
            const VrfFacet = config.vrfTestFacet
            await VrfFacet.t_openPortals([tokenId])

            const ghosts = await AavegotchiGameFacet.portalAavegotchiTraits(tokenId)
            const option = 1
            const stakedAmount = ghosts[option].minimumStake
            
            const expected = "Only 10 aavegotchi options available"
            await truffleAssert.reverts(AavegotchiGameFacet.claimAavegotchi(tokenId, ghosts.length, stakedAmount), expected);

        })

        it ('should revert if stake amount is less than minimum stake amount', async () => {

            const AavegotchiGameFacet = config.aavegotchiGameFacet

            // create new aavegotchi
            tokenIds = (await _mintAavegotchi(config))

            const tokenId = tokenIds[1]
            
            //open portal
            const VrfFacet = config.vrfTestFacet
            await VrfFacet.t_openPortals([tokenId])

            const ghosts = await AavegotchiGameFacet.portalAavegotchiTraits(tokenId)
            const option = 1
            const stakedAmount = ghosts[option].minimumStake
            
            const expected = "_stakeAmount less than minimum stake"
            await truffleAssert.reverts(AavegotchiGameFacet.claimAavegotchi(tokenId, option, 0), expected);

        })

        //TODO this actually throws an error
        //`Contract with a Signer cannot override from (operation="overrides.from", code=UNSUPPORTED_OPERATION, version=contracts/5.0.7)`
        it ('should revert if caller is not owner', async () => {

            // const AavegotchiGameFacet = config.aavegotchiGameFacet

            // // create new aavegotchi
            // tokenIds = (await _mintAavegotchi(config))

            // const tokenId = tokenIds[1]
            
            // //open portal
            // const VrfFacet = config.vrfTestFacet
            // await VrfFacet.t_openPortals([tokenId])

            // const ghosts = await AavegotchiGameFacet.portalAavegotchiTraits(tokenId)
            // const option = 1
            // const stakedAmount = ghosts[option].minimumStake

            // const GHST = config.ghstTokenContract
            // await GHST.approve(config.aavegotchiDiamond.address, ghosts[option].minimumStake, {from: config.dao})

            // const balanceBefore = await GHST.balanceOf(config.account)
         
            // const expected = `Contract with a Signer cannot override from (operation="overrides.from", code=UNSUPPORTED_OPERATION, version=contracts/5.0.7)`
            // await truffleAssert.reverts(AavegotchiGameFacet.claimAavegotchi(tokenId, option, stakedAmount), expected);

        })

        //TODO once gotchis can be locked
        it ('should revert if aavegotchi is locked', async () => {

        })


        it ('should associate portal ghost with token id', async () => {

            const AavegotchiGameFacet = config.aavegotchiGameFacet

            // create new aavegotchi
            tokenIds = (await _mintAavegotchi(config))

            const tokenId = tokenIds[1]
            
            //open portal
            const VrfFacet = config.vrfTestFacet
            await VrfFacet.t_openPortals([tokenId])

            const ghosts = await AavegotchiGameFacet.portalAavegotchiTraits(tokenId)
            const option = 1
            const stakedAmount = ghosts[option].minimumStake

            const GHST = config.ghstTokenContract
            await GHST.approve(config.aavegotchiDiamond.address, ghosts[option].minimumStake)

            const balanceBefore = await GHST.balanceOf(config.account)
         
            await AavegotchiGameFacet.claimAavegotchi(tokenId, option, stakedAmount)

            const balanceAfter = await GHST.balanceOf(config.account)

            const claimed = ghosts[option]

            const aavegotchi = await AavegotchiFacet.getAavegotchi(tokenId)

            expect(aavegotchi.randomNumber).to.equal(claimed.randomNumber)
            expect(aavegotchi.numericTraits).deep.equal(claimed.numericTraits)
            expect(aavegotchi.collateral).to.equal(claimed.collateralType)
            expect(aavegotchi.minimumStake).to.equal(claimed.minimumStake)
            expect(aavegotchi.lastInteracted._isBigNumber).to.equal(true) // should porbably verify this is blockstamp -12 hrs
            //expect(aavegotchi.interactionCount).to.equal(50) this isnt exposed
            //expect(aavegotchi.claimTime._isBigNumber).to.equal(true) // this isnt exposed. should probably verify this is current block timestamp
            expect(aavegotchi.status).to.equal(3)
            expect(aavegotchi.escsrow !== "0x0000000000000000000000000000000000000000").to.equal(true)
            expect(aavegotchi.owner).to.equal(config.account)
            expect(aavegotchi.hauntId._hex).to.equal('0x01')

            expect(ethers.utils.formatEther(`${balanceBefore}`) - ethers.utils.formatEther(`${balanceAfter}`)).to.equal(ethers.utils.formatEther(`${stakedAmount}`) - 0)
        })


    })
    
    describe("setAavegotchiName", () => {

        it("should revert if aavegotchi is not claimed", async () => {

            const AavegotchiGameFacet = config.aavegotchiGameFacet

            const name = 'Test Name'

            await AavegotchiGameFacet.setAavegotchiName(tokenIds[0], name)

            // create new aavegotchi
            tokenIds = (await _mintAavegotchi(config))
            // await _openPortal(config, tokenIds[1])
            
            const expected = "Must claim Aavegotchi before setting name"
            await truffleAssert.reverts(AavegotchiGameFacet.setAavegotchiName(tokenIds[1], name), expected);
    
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

        it("should remove previous name from list when name changes", async () => {

            const AavegotchiGameFacet = config.aavegotchiGameFacet

            const name = 'Test Name'

            const newName = 'Test Name 2'

            await AavegotchiGameFacet.setAavegotchiName(tokenIds[0], name)

            let isAvailabe = await  AavegotchiGameFacet.aavegotchiNameAvailable(name)

            expect(isAvailabe).to.equal(true)

            await AavegotchiGameFacet.setAavegotchiName(tokenIds[0], newName)

            isAvailabe = await AavegotchiGameFacet.aavegotchiNameAvailable(name)

            expect(isAvailabe).to.equal(false)
        })

        it("should set aavegotchi name when when name is not taken", async () => {

            
            const AavegotchiGameFacet = config.aavegotchiGameFacet
            const AavegotchiFacet = config.aavegotchiFacet

            const name = 'Test Name'

            await AavegotchiGameFacet.setAavegotchiName(tokenIds[0], name)

            const aavegotchi = await AavegotchiFacet.getAavegotchi(tokenIds[0])
      
            expect(aavegotchi.name).to.equal(name)
        })

    })

    describe("interact", () => {

    })

    describe("spendSkillPoints", () => {

    })
})