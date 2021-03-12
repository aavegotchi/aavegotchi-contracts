const { expect } = require("chai");
const { ethers } = require("hardhat");
const truffleAssert = require("truffle-assertions");
const {deployContract, getDeployedContract} = require("../utils/deployUtils");
const {setup} = require("../utils/setup");


describe("ShopFacet", () => {

   
    
    describe("buyPortals", async () => {

        let config;
        let Contract;
        beforeEach(async () => {
            config = await setup()
            Contract = config.shopFacet
        })

        it('should buy 1 portals', async () => {
            const _ghst = 100
            const GHST = config.ghstTokenContract
            await GHST.approve(Contract.address, ethers.utils.parseEther(`${_ghst}`))
            await Contract.buyPortals(config.account, ethers.utils.parseEther(`${_ghst}`))
        })
    })

})