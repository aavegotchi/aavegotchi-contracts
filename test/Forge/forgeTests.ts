import { ethers, network } from "hardhat";
import { expect } from "chai";
import {ForgeDAOFacet, ForgeFacet, WearablesFacet} from "../../typechain";
import { deployAndUpgradeForgeDiamond } from "../../scripts/upgrades/upgrade-deployAndUpgradeForgeDiamond";
import { impersonate, maticDiamondAddress } from "../../scripts/helperFunctions";
import {JsonRpcSigner} from "@ethersproject/providers";
import {upgradeAavegotchiForForge} from "../../scripts/upgrades/upgrade-aavegotchiForForge";

// See contracts/Aavegotchi/ForgeDiamond/libraries/LibAppStorage.sol
// All non-schematic items (cores, alloy, essence, etc) IDs start at this offset number.
const WEARABLE_GAP_OFFSET = 1000000000;

// Forge asset token IDs
const ALLOY = WEARABLE_GAP_OFFSET + 0;
const ESSENCE = WEARABLE_GAP_OFFSET + 1;
const CORE_COMMON = WEARABLE_GAP_OFFSET + 2;
const CORE_UNCOMMON = WEARABLE_GAP_OFFSET + 3;
const CORE_RARE = WEARABLE_GAP_OFFSET + 4;
const CORE_LEGENDARY = WEARABLE_GAP_OFFSET + 5;
const CORE_MYTHICAL = WEARABLE_GAP_OFFSET + 6;
const CORE_GODLIKE = WEARABLE_GAP_OFFSET + 7;


describe("Testing Forge", async function () {
    let signer: JsonRpcSigner, signer2: JsonRpcSigner;
    let testUser = "0x60c4ae0EE854a20eA7796a9678090767679B30FC";
    let daoAddr = "0x6fb7e0AAFBa16396Ad6c1046027717bcA25F821f"; // DTF multisig
    let WEARABLE_DIAMOND = "0x58de9AaBCaeEC0f69883C94318810ad79Cc6a44f"

    let forgeDiamondAddress: string;
    let forgeFacet: ForgeFacet;
    let forgeDaoFacet: ForgeDAOFacet;
    let wearablesFacet: WearablesFacet;



    before(async function (){
        forgeDiamondAddress = await deployAndUpgradeForgeDiamond();
        await upgradeAavegotchiForForge();

        // signer = await ethers.provider.getSigner(forgeDiamondAddress);
        // signer2 = await ethers.provider.getSigner(testAdd);

        forgeFacet = (await ethers.getContractAt(
            "contracts/Aavegotchi/ForgeDiamond/facets/ForgeFacet.sol:ForgeFacet",
            forgeDiamondAddress
        )) as ForgeFacet;
        forgeDaoFacet = (await ethers.getContractAt(
            "contracts/Aavegotchi/ForgeDiamond/facets/ForgeDAOFacet.sol:ForgeDAOFacet",
            forgeDiamondAddress
        )) as ForgeDAOFacet;
        wearablesFacet = (await ethers.getContractAt(
            "contracts/Aavegotchi/WearableDiamond/facets/WearablesFacet.sol:WearablesFacet",
            WEARABLE_DIAMOND
        )) as WearablesFacet;

        // prep storage - TODO: put into script
        await forgeDaoFacet.setForgeDiamondAddress(forgeDiamondAddress);
        await forgeDaoFacet.setAavegotchiDaoAddress(daoAddr);
        await forgeDaoFacet.setAlloyDaoFeeInBips(500);
        await forgeDaoFacet.setAlloyBurnFeeInBips(500);

        let alloyCosts = {
            common: 100,
            uncommon: 300,
            rare: 1300,
            legendary: 5300,
            mythical: 25000,
            godlike: 130000,
        }
        let skillPts = {
            common: 4,
            uncommon: 12,
            rare: 52,
            legendary: 212,
            mythical: 1000,
            godlike: 5200,
        }
        await forgeDaoFacet.setForgeAlloyCost(alloyCosts);
        await forgeDaoFacet.setSkillPointsEarnedFromForge(skillPts);
        await forgeDaoFacet.setSmeltingSkillPointReductionFactorBips(5000);


        // approve for test user
        let imp: WearablesFacet = await impersonate(testUser, wearablesFacet, ethers, network)
        await imp.setApprovalForAll(forgeDiamondAddress, true);

    })

    it('should adminMint and return total supply', async function () {
        let ids = [ALLOY, ESSENCE, CORE_COMMON, ALLOY]
        let amts = [5, 10, 15, 10]
        let supplies = [5, 10, 15, 15]

        for (let i = 0; i < ids.length; i++) {
            await forgeFacet.adminMint(forgeDiamondAddress, ids[i], amts[i]);
            expect(await forgeFacet.totalSupply(ids[i])).to.be.equal(supplies[i]);
        }
    });

    it('should reject adminMint', async function () {
        let imp: ForgeFacet = await impersonate(testUser, forgeFacet, ethers, network)
        await expect(imp.adminMint(forgeDiamondAddress, 0, 10)).to.be.revertedWith("LibAppStorage: No access");
    });

    it('should revert smelt correctly', async function () {
        let imp = await impersonate(testUser, forgeFacet, ethers, network)

        // issue with testing locked; not owner if in rental as well, even if called by original owner.
        // await expect(imp.smeltWearables([157], [2270])).to.be.revertedWith("ForgeFacet: Aavegotchi is locked")
        await expect(imp.smeltWearables([157], [1])).to.be.revertedWith("ForgeFacet: Not Aavegotchi owner")
        await expect(imp.smeltWearables([145], [7735])).to.be.revertedWith("ForgeFacet: smelt item not owned")
    });



    it('should smelt an item, mint correct forge items, and provide smithing skill', async function () {
        // let items = [10, 119, 146] // leg Link White Hat, leg Baby Bottle, common Imp mustache
        let items = [157, 244, 205] // uncommon Goatee, rare V-Neck, common Mug
        let gotchis = [7735, 7735, 7735]

        console.log("initial balances")
        console.log(await wearablesFacet.balanceOf(testUser, items[0]))
        console.log(await wearablesFacet.balanceOf(testUser, items[1]))
        console.log(await wearablesFacet.balanceOf(testUser, items[2]))


        let imp = await impersonate(testUser, forgeFacet, ethers, network)

        await expect(imp.smeltWearables(items, gotchis))
            .to.emit(forgeFacet, "ItemSmelted").withArgs(items[0], gotchis[0])
            .to.emit(forgeFacet, "ItemSmelted").withArgs(items[1], gotchis[1])
            .to.emit(forgeFacet, "ItemSmelted").withArgs(items[2], gotchis[2]);


        // Check correct new balances of all items
        expect(await forgeFacet.balanceOf(testUser, ALLOY)).to.be.equal(1530) // 90 + 270 + 1170
        expect(await forgeFacet.balanceOf(daoAddr, ALLOY)).to.be.equal(85) // 5 + 15 + 65

        // schematics
        expect(await forgeFacet.balanceOf(testUser, items[0])).to.be.equal(1)
        expect(await forgeFacet.balanceOf(testUser, items[1])).to.be.equal(1)
        expect(await forgeFacet.balanceOf(testUser, items[2])).to.be.equal(1)

        // Check correct balances deducted and sent to Forge Diamond
        expect(await wearablesFacet.balanceOf(testUser, items[0])).to.be.equal(16)
        expect(await wearablesFacet.balanceOf(testUser, items[1])).to.be.equal(1)
        expect(await wearablesFacet.balanceOf(testUser, items[2])).to.be.equal(10)

        expect(await wearablesFacet.balanceOf(forgeDiamondAddress, items[0])).to.be.equal(1)
        expect(await wearablesFacet.balanceOf(forgeDiamondAddress, items[1])).to.be.equal(1)
        expect(await wearablesFacet.balanceOf(forgeDiamondAddress, items[2])).to.be.equal(1)

        // cores
        expect(await forgeFacet.balanceOf(testUser, CORE_UNCOMMON)).to.be.equal(1)
        expect(await forgeFacet.balanceOf(testUser, CORE_RARE)).to.be.equal(1)
        expect(await forgeFacet.balanceOf(testUser, CORE_COMMON)).to.be.equal(1)

        // smithing skill + level
        expect(await forgeFacet.getAavegotchiSmithingSkillPts(gotchis[0])).to.be.equal(34)
        // expect(await forgeFacet.getAavegotchiSmithingSkillPts(gotchis[1])).to.be.equal(106)
        expect(await forgeFacet.getAavegotchiSmithingLevel(gotchis[0])).to.be.equal(2)
        expect(await forgeFacet.getSmithingLevelMultiplierBips(gotchis[0])).to.be.equal(9700);

        // smelt again for next level and recheck balances
        await imp.smeltWearables([157], [7735])

        expect(await forgeFacet.getAavegotchiSmithingSkillPts(gotchis[0])).to.be.equal(40)
        expect(await forgeFacet.getAavegotchiSmithingLevel(gotchis[0])).to.be.equal(3)
        expect(await forgeFacet.getSmithingLevelMultiplierBips(gotchis[0])).to.be.equal(9410);

        expect(await forgeFacet.balanceOf(testUser, CORE_UNCOMMON)).to.be.equal(2)
        expect(await forgeFacet.balanceOf(testUser, 157)).to.be.equal(2)
        expect(await wearablesFacet.balanceOf(testUser, items[0])).to.be.equal(15)
    });


});