import { ethers, network } from "hardhat";
import { expect } from "chai";
import {ForgeDAOFacet, ForgeFacet, ForgeTokenFacet, WearablesFacet, CollateralFacet, DAOFacet, ItemsFacet,
    GotchiLendingFacet, LendingGetterAndSetterFacet, AavegotchiFacet, IERC20} from "../../typechain";
import { impersonate, maticDiamondAddress } from "../../scripts/helperFunctions";
import {JsonRpcSigner} from "@ethersproject/providers";
import {releaseForge} from "../../scripts/upgrades/forge/upgrade-forgeFinal";


// See contracts/Aavegotchi/ForgeDiamond/libraries/LibAppStorage.sol
// All non-schematic items (cores, alloy, essence, etc) IDs start at this offset number.
const WEARABLE_GAP_OFFSET = 1000000000;

// Forge asset token IDs
const ALLOY = WEARABLE_GAP_OFFSET + 0;
const ESSENCE = WEARABLE_GAP_OFFSET + 1;
const GEODE_COMMON = WEARABLE_GAP_OFFSET + 2;
const GEODE_UNCOMMON = WEARABLE_GAP_OFFSET + 3;
const GEODE_RARE = WEARABLE_GAP_OFFSET + 4;
const GEODE_LEGENDARY = WEARABLE_GAP_OFFSET + 5;
const GEODE_MYTHICAL = WEARABLE_GAP_OFFSET + 6;
const GEODE_GODLIKE = WEARABLE_GAP_OFFSET + 7;

const CORE_BODY_COMMON = WEARABLE_GAP_OFFSET + 8;
const CORE_BODY_UNCOMMON = WEARABLE_GAP_OFFSET + 9;
const CORE_BODY_RARE = WEARABLE_GAP_OFFSET + 10;
const CORE_BODY_LEGENDARY = WEARABLE_GAP_OFFSET + 11;
const CORE_BODY_MYTHICAL = WEARABLE_GAP_OFFSET + 12;
const CORE_BODY_GODLIKE = WEARABLE_GAP_OFFSET + 13;

const CORE_FACE_COMMON = WEARABLE_GAP_OFFSET + 14;
const CORE_FACE_UNCOMMON = WEARABLE_GAP_OFFSET + 15;
const CORE_FACE_RARE = WEARABLE_GAP_OFFSET + 16;
const CORE_FACE_LEGENDARY = WEARABLE_GAP_OFFSET + 17;
const CORE_FACE_MYTHICAL = WEARABLE_GAP_OFFSET + 18;
const CORE_FACE_GODLIKE = WEARABLE_GAP_OFFSET + 19;

const CORE_EYES_COMMON = WEARABLE_GAP_OFFSET + 20;
const CORE_EYES_UNCOMMON = WEARABLE_GAP_OFFSET + 21;
const CORE_EYES_RARE = WEARABLE_GAP_OFFSET + 22;
const CORE_EYES_LEGENDARY = WEARABLE_GAP_OFFSET + 23;
const CORE_EYES_MYTHICAL = WEARABLE_GAP_OFFSET + 24;
const CORE_EYES_GODLIKE = WEARABLE_GAP_OFFSET + 25;

const CORE_HEAD_COMMON = WEARABLE_GAP_OFFSET + 26;
const CORE_HEAD_UNCOMMON = WEARABLE_GAP_OFFSET + 27;
const CORE_HEAD_RARE = WEARABLE_GAP_OFFSET + 28;
const CORE_HEAD_LEGENDARY = WEARABLE_GAP_OFFSET + 29;
const CORE_HEAD_MYTHICAL = WEARABLE_GAP_OFFSET + 30;
const CORE_HEAD_GODLIKE = WEARABLE_GAP_OFFSET + 31;

const CORE_HANDS_COMMON = WEARABLE_GAP_OFFSET + 32;
const CORE_HANDS_UNCOMMON = WEARABLE_GAP_OFFSET + 33;
const CORE_HANDS_RARE = WEARABLE_GAP_OFFSET + 34;
const CORE_HANDS_LEGENDARY = WEARABLE_GAP_OFFSET + 35;
const CORE_HANDS_MYTHICAL = WEARABLE_GAP_OFFSET + 36;
const CORE_HANDS_GODLIKE = WEARABLE_GAP_OFFSET + 37;

const CORE_PET_COMMON = WEARABLE_GAP_OFFSET + 38;
const CORE_PET_UNCOMMON = WEARABLE_GAP_OFFSET + 39;
const CORE_PET_RARE = WEARABLE_GAP_OFFSET + 40;
const CORE_PET_LEGENDARY = WEARABLE_GAP_OFFSET + 41;
const CORE_PET_MYTHICAL = WEARABLE_GAP_OFFSET + 42;
const CORE_PET_GODLIKE = WEARABLE_GAP_OFFSET + 43;


describe("Testing Forge", async function () {
    let signer: JsonRpcSigner, signer2: JsonRpcSigner;
    let testUser = "0x60c4ae0EE854a20eA7796a9678090767679B30FC";
    let rentalTestUser = "0x3E9c2Ee838072b370567efC2DF27602d776B341c";
    let felonOwner = "0x60eD33735C9C29ec2c26B8eC734e36D5B6fa1EAB"
    let daoAddr = "0x6fb7e0AAFBa16396Ad6c1046027717bcA25F821f"; // DTF multisig
    let WEARABLE_DIAMOND = "0x58de9AaBCaeEC0f69883C94318810ad79Cc6a44f"
    let GLTR = "0x3801C3B3B5c98F88a9c9005966AA96aa440B9Afc"

    let forgeDiamondAddress: string;
    let forgeFacet: ForgeFacet;
    let forgeDaoFacet: ForgeDAOFacet;
    let forgeTokenFacet: ForgeTokenFacet;
    // let forgeVrfFacet: ForgeVRFFacet;
    let aavegotchiFacet: AavegotchiFacet;
    let wearablesFacet: WearablesFacet;
    let collateralFacet: CollateralFacet;
    let itemsFacet: ItemsFacet;
    let aavegotchiDaoFacet: DAOFacet;
    let lendingFacet: GotchiLendingFacet;
    let lendingGetSetFacet: LendingGetterAndSetterFacet;
    let gltrContract: IERC20;



    before(async function (){
        forgeDiamondAddress = await releaseForge();

        forgeFacet = (await ethers.getContractAt(
            "contracts/Aavegotchi/ForgeDiamond/facets/ForgeFacet.sol:ForgeFacet",
            forgeDiamondAddress
        )) as ForgeFacet;
        forgeDaoFacet = (await ethers.getContractAt(
            "contracts/Aavegotchi/ForgeDiamond/facets/ForgeDAOFacet.sol:ForgeDAOFacet",
            forgeDiamondAddress
        )) as ForgeDAOFacet;
        forgeTokenFacet = (await ethers.getContractAt(
            "contracts/Aavegotchi/ForgeDiamond/facets/ForgeTokenFacet.sol:ForgeTokenFacet",
            forgeDiamondAddress
        )) as ForgeTokenFacet;
        // forgeVrfFacet = (await ethers.getContractAt(
        //     "contracts/Aavegotchi/ForgeDiamond/facets/ForgeVRFFacet.sol:ForgeVRFFacet",
        //     forgeDiamondAddress
        // )) as ForgeVRFFacet;
        aavegotchiFacet = (await ethers.getContractAt(
            "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
            maticDiamondAddress
        )) as AavegotchiFacet;
        wearablesFacet = (await ethers.getContractAt(
            "contracts/Aavegotchi/WearableDiamond/facets/WearablesFacet.sol:WearablesFacet",
            WEARABLE_DIAMOND
        )) as WearablesFacet;
        collateralFacet = (await ethers.getContractAt(
            "contracts/Aavegotchi/facets/CollateralFacet.sol:CollateralFacet",
            maticDiamondAddress
        )) as CollateralFacet;
        itemsFacet = (await ethers.getContractAt(
            "contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet",
            maticDiamondAddress
        )) as ItemsFacet;
        aavegotchiDaoFacet = (await ethers.getContractAt(
            "contracts/Aavegotchi/facets/DAOFacet.sol:DAOFacet",
            maticDiamondAddress
        )) as DAOFacet;
        lendingFacet = (await ethers.getContractAt(
            "contracts/Aavegotchi/facets/GotchiLendingFacet.sol:GotchiLendingFacet",
            maticDiamondAddress
        )) as GotchiLendingFacet;
        lendingGetSetFacet = (await ethers.getContractAt(
            "contracts/Aavegotchi/facets/LendingGetterAndSetterFacet.sol:LendingGetterAndSetterFacet",
            maticDiamondAddress
        )) as LendingGetterAndSetterFacet;
        gltrContract = (await ethers.getContractAt(
            "contracts/shared/interfaces/IERC20.sol:IERC20",
            GLTR
        )) as IERC20;

        // let aavegotchiOwner = "0x585E06CA576D0565a035301819FD2cfD7104c1E8"
        // let impOwner: DAOFacet = await impersonate(aavegotchiOwner, aavegotchiDaoFacet, ethers, network)
        // await impOwner.setForge(forgeDiamondAddress);


        // approve for test user
        let imp: WearablesFacet = await impersonate(testUser, wearablesFacet, ethers, network)
        await imp.setApprovalForAll(forgeDiamondAddress, true);

        let impTestGltr: IERC20 = await impersonate(testUser, gltrContract, ethers, network)
        await impTestGltr.approve(forgeDiamondAddress, "9999999999999999999999999999");
    })



    describe("smelt forge flow", async function (){
        it('should smelt an item, mint correct forge items, and provide smithing skill', async function () {
            // let items = [10, 119, 146] // leg Link White Hat, leg Baby Bottle, common Imp mustache
            let items = [157, 244, 205] // uncommon Goatee, rare V-Neck, common Mug
            let gotchis = [7735, 7735, 7735]

            // console.log("initial balances")
            // console.log(await wearablesFacet.balanceOf(testUser, items[0]))
            // console.log(await wearablesFacet.balanceOf(testUser, items[1]))
            // console.log(await wearablesFacet.balanceOf(testUser, items[2]))


            let imp = await impersonate(testUser, forgeFacet, ethers, network)

            await expect(imp.smeltWearables(items, gotchis))
                .to.emit(forgeFacet, "ItemSmelted").withArgs(items[0], gotchis[0])
                .to.emit(forgeFacet, "ItemSmelted").withArgs(items[1], gotchis[1])
                .to.emit(forgeFacet, "ItemSmelted").withArgs(items[2], gotchis[2]);

            // Check correct balances deducted and sent to Forge Diamond
            expect(await wearablesFacet.balanceOf(testUser, items[0])).to.be.equal(15)
            expect(await wearablesFacet.balanceOf(testUser, items[1])).to.be.equal(1)
            expect(await wearablesFacet.balanceOf(testUser, items[2])).to.be.equal(10)

            expect(await wearablesFacet.balanceOf(forgeDiamondAddress, items[0])).to.be.equal(1)
            expect(await wearablesFacet.balanceOf(forgeDiamondAddress, items[1])).to.be.equal(1)
            expect(await wearablesFacet.balanceOf(forgeDiamondAddress, items[2])).to.be.equal(1)

            // Check correct new balances of all items
            expect(await forgeTokenFacet.balanceOf(testUser, ALLOY)).to.be.equal(1530) // 90 + 270 + 1170
            expect(await forgeTokenFacet.balanceOf(daoAddr, ALLOY)).to.be.equal(85) // 5 + 15 + 65

            // schematics
            expect(await forgeTokenFacet.balanceOf(testUser, items[0])).to.be.equal(1)
            expect(await forgeTokenFacet.balanceOf(testUser, items[1])).to.be.equal(1)
            expect(await forgeTokenFacet.balanceOf(testUser, items[2])).to.be.equal(1)

            // cores
            expect(await forgeTokenFacet.balanceOf(testUser, CORE_FACE_UNCOMMON)).to.be.equal(1)
            expect(await forgeTokenFacet.balanceOf(testUser, CORE_BODY_RARE)).to.be.equal(1)
            expect(await forgeTokenFacet.balanceOf(testUser, CORE_HANDS_COMMON)).to.be.equal(1)

            // geodes
            expect(await forgeTokenFacet.balanceOf(testUser, GEODE_UNCOMMON)).to.be.equal(1)
            expect(await forgeTokenFacet.balanceOf(testUser, GEODE_RARE)).to.be.equal(1)
            expect(await forgeTokenFacet.balanceOf(testUser, GEODE_COMMON)).to.be.equal(1)

            // smithing skill + level
            expect(await forgeFacet.getAavegotchiSmithingSkillPts(gotchis[0])).to.be.equal(34)
            // expect(await forgeFacet.getAavegotchiSmithingSkillPts(gotchis[1])).to.be.equal(106)
            expect(await forgeFacet.getAavegotchiSmithingLevel(gotchis[0])).to.be.equal(2)
            expect(await forgeFacet.getSmithingLevelMultiplierBips(gotchis[0])).to.be.equal(9700);

            // smelt again for next level, forge to get items back, and recheck balances
            await imp.smeltWearables([157], [gotchis[0]])

            expect(await forgeTokenFacet.balanceOf(testUser, CORE_FACE_UNCOMMON)).to.be.equal(2)
            expect(await forgeTokenFacet.balanceOf(testUser, 157)).to.be.equal(2)
            expect(await wearablesFacet.balanceOf(testUser, 157)).to.be.equal(14)

            await imp.forgeWearables([157], [gotchis[0]], [await forgeFacet.forgeTime(gotchis[0], 2)]);
            await imp.forgeWearables([157], [gotchis[0]], [await forgeFacet.forgeTime(gotchis[0], 2)])

            expect(await forgeFacet.getAavegotchiSmithingSkillPts(gotchis[0])).to.be.equal(64)
            expect(await forgeFacet.getAavegotchiSmithingLevel(gotchis[0])).to.be.equal(3)
            expect(await forgeFacet.getSmithingLevelMultiplierBips(gotchis[0])).to.be.equal(9410);

            expect(await forgeTokenFacet.balanceOf(testUser, CORE_FACE_UNCOMMON)).to.be.equal(0)
            expect(await forgeTokenFacet.balanceOf(testUser, 157)).to.be.equal(0)
            expect(await wearablesFacet.balanceOf(testUser, 157)).to.be.equal(16)
        });

        it('should test essence and forge queue', async function () {
            // impersonate Felon owner, smelt a godlike (Link Cube) so the contract is holding one to forge

            // get nekkid
            let impItems = await impersonate(felonOwner, itemsFacet, ethers, network)
            await impItems.equipWearables(19095, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])

            // console.log(await wearablesFacet.balanceOf(felonOwner, 17))
            expect(await wearablesFacet.balanceOf(felonOwner, 17)).to.be.equal(1)

            let impWearzFelon = await impersonate(felonOwner, wearablesFacet, ethers, network)
            await impWearzFelon.setApprovalForAll(forgeDiamondAddress, true);

            let impForgeFelon = await impersonate(felonOwner, forgeFacet, ethers, network)

            await impForgeFelon.smeltWearables([17], [19095])

            // top off the missing alloy
            await forgeFacet.adminMint(felonOwner, ALLOY, 13000);

            await expect(impForgeFelon.forgeWearables([17], [19095], [0])).to.be.revertedWith("ForgeFacet: not enough Essence")

            // obtain essence to test essence burn (sac DIFFERENT gotchi)
            let impCollFelon: CollateralFacet = await impersonate(felonOwner, collateralFacet, ethers, network)
            await impCollFelon.decreaseAndDestroy(7001, 2270)
            expect(await forgeTokenFacet.balanceOf(felonOwner, ESSENCE)).to.be.equal(1000)

            await impForgeFelon.forgeWearables([17], [19095], [0])
            expect(await forgeTokenFacet.balanceOf(felonOwner, ESSENCE)).to.be.equal(0)
            expect(await wearablesFacet.balanceOf(felonOwner, 17)).to.be.equal(0)

            await expect(impForgeFelon.forgeWearables([17], [19095], [0])).to.be.revertedWith("ForgeFacet: Aavegotchi already forging")

            // check queue
            // console.log(ethers.utils.formatEther((await gltrContract.balanceOf(felonOwner)).toString()));
            await expect(impForgeFelon.claimForgeQueueItems([19095])).to.be.revertedWith("ForgeFacet: Forge item not ready")

            // skip 8,000,000 (0x7A1200) required blocks for godlike queue
            await network.provider.send("hardhat_mine", ["0x7A1200"])

            await expect(impForgeFelon.claimForgeQueueItems([19095]))
                .to.emit(impForgeFelon, "ForgeQueueClaimed").withArgs("17", "19095")

            expect(await wearablesFacet.balanceOf(felonOwner, 17)).to.be.equal(1)
            expect(await wearablesFacet.balanceOf(forgeDiamondAddress, 17)).to.be.equal(0)
        });

        it('should use gltr to speed up actions', async function () {
            let impForgeFelon: ForgeFacet = await impersonate(felonOwner, forgeFacet, ethers, network)

            // console.log(ethers.utils.formatEther((await gltrContract.balanceOf(testUser)).toString()));
            // console.log(ethers.utils.formatEther((await gltrContract.balanceOf(felonOwner)).toString()));

            let impFelonWears: WearablesFacet = await impersonate(felonOwner, wearablesFacet, ethers, network)
            await impFelonWears.setApprovalForAll(forgeDiamondAddress, true);

            // get materials and skill
            await impForgeFelon.smeltWearables([78], [11866])
            await forgeFacet.adminMint(felonOwner, ALLOY, 30);

            // test gltr
            let impTestGltr: IERC20 = await impersonate(testUser, gltrContract, ethers, network)
            await impTestGltr.transfer(felonOwner, ethers.utils.parseEther("200000"))

            // console.log(ethers.utils.formatEther((await gltrContract.balanceOf(felonOwner)).toString()));

            let impFelonGltr: IERC20 = await impersonate(felonOwner, gltrContract, ethers, network)
            await impFelonGltr.approve(forgeDiamondAddress, "9999999999999999999999999999");

            // full amount gltr needed = 98765, test with slightly less and move forward blocks to claim
            await impForgeFelon.forgeWearables([78], [11866], [98760]);

            // let queue = await impForgeFelon.getAavegotchiQueueItem(11866)
            // console.log(queue)

            // gotchi can only be forging one thing at a time
            await expect(impForgeFelon.forgeWearables([78], [11866], [0]))
                .to.be.revertedWith("ForgeFacet: Aavegotchi already forging")

            // skip remaining blocks to claim
            await network.provider.send("hardhat_mine", ["0x4"])

            expect(await wearablesFacet.balanceOf(felonOwner, 78)).to.be.equal(1)
            expect(await wearablesFacet.balanceOf(forgeDiamondAddress, 78)).to.be.equal(1)

            await expect(impForgeFelon.claimForgeQueueItems([11866]))
                .to.emit(impForgeFelon, "ForgeQueueClaimed").withArgs("78", "11866")

            expect(await wearablesFacet.balanceOf(felonOwner, 78)).to.be.equal(2)
            expect(await wearablesFacet.balanceOf(forgeDiamondAddress, 78)).to.be.equal(0)


            // get materials and skill again
            await impForgeFelon.smeltWearables([78], [11866])
            await forgeFacet.adminMint(felonOwner, ALLOY, 30);

            expect(await wearablesFacet.balanceOf(felonOwner, 78)).to.be.equal(1)
            // test with full amount gltr needed (98765)

            let forgeTime = await forgeFacet.forgeTime(11866, 2)

            await impForgeFelon.forgeWearables([78], [11866], [forgeTime]);
            expect(await wearablesFacet.balanceOf(felonOwner, 78)).to.be.equal(2)

        });

        it('should manage queue', async function () {
            let impFelonWears: WearablesFacet = await impersonate(felonOwner, wearablesFacet, ethers, network)
            await impFelonWears.setApprovalForAll(forgeDiamondAddress, true);

            let impForgeFelon: ForgeFacet = await impersonate(felonOwner, forgeFacet, ethers, network)
            let impForgeTest: ForgeFacet = await impersonate(testUser, forgeFacet, ethers, network)

            // get materials for two users
            expect(await wearablesFacet.balanceOf(felonOwner, 78)).to.be.equal(2)
            await impForgeFelon.smeltWearables([78, 78], [11866, 11866])
            await forgeFacet.adminMint(felonOwner, ALLOY, 60);

            expect(await wearablesFacet.balanceOf(testUser, 157)).to.be.equal(16)
            await impForgeTest.smeltWearables([157, 157], [7735, 7735])
            await forgeFacet.adminMint(testUser, ALLOY, 60);

            expect(await wearablesFacet.balanceOf(felonOwner, 78)).to.be.equal(0)
            expect(await wearablesFacet.balanceOf(testUser, 157)).to.be.equal(14)

            await impForgeFelon.forgeWearables([78, 78], [11866, 826], [0, 0]);
            await impForgeTest.forgeWearables([157], [7735], [0]);

            let forgeQueue = await impForgeFelon.getForgeQueue();
            console.log(forgeQueue);
            expect(forgeQueue.length).to.be.equal(5)
            expect(forgeQueue.includes(f => f.claimed)).to.be.false

            // skip remaining blocks to claim
            await network.provider.send("hardhat_mine", ["0x181CC"])

            await impForgeFelon.claimForgeQueueItems([11866])
            await impForgeTest.claimForgeQueueItems([7735])
            expect(await wearablesFacet.balanceOf(felonOwner, 78)).to.be.equal(1)
            expect(await wearablesFacet.balanceOf(testUser, 157)).to.be.equal(15)

            console.log("-----------")
            forgeQueue = await impForgeFelon.getForgeQueue();
            console.log(forgeQueue);

            expect(forgeQueue.filter(f => f.gotchiId == "11866")[0].claimed).to.be.true
        });

        it('should speed up queue', async function () {
            let impForgeTest: ForgeFacet = await impersonate(testUser, forgeFacet, ethers, network)

            // get materials
            await impForgeTest.smeltWearables([157, 157], [7735, 7735])
            await forgeFacet.adminMint(testUser, ALLOY, 60);
            // add to queue
            await impForgeTest.forgeWearables([157], [7735], [0]);

            await expect(impForgeTest.claimForgeQueueItems([7735])).to.be.revertedWith("ForgeFacet: Forge item not ready")

      // expecting 90171 due to gotchi's smith level
      await expect(impForgeTest.reduceQueueTime([7735], [98765]))
        .to.emit(forgeFacet, "QueueTimeReduced")
        .withArgs(7735, 90171);
      await expect(impForgeTest.claimForgeQueueItems([7735]))
        .to.emit(forgeFacet, "ForgeQueueClaimed")
        .withArgs(157, 7735);
    });
  });

    describe("transfer tests", async function (){
        it('should revert transfer when forging', async function () {
            let impTestForge = await impersonate(testUser, forgeFacet, ethers, network)
            let impTestAavegotchi: AavegotchiFacet = await impersonate(testUser, aavegotchiFacet, ethers, network)

            await impTestForge.smeltWearables([157], [7735])
            await forgeFacet.adminMint(testUser, ALLOY, 30);
            await impTestForge.forgeWearables([157], [7735], [0]);

            // attemp transfer to random address, expect revert
            await expect(impTestAavegotchi["safeTransferFrom(address,address,uint256)"](testUser, rentalTestUser, 7735))
                .to.be.revertedWith("I'M BUSY FORGING DON'T BOTHER ME")

            await network.provider.send("hardhat_mine", ["0x181CD"])
            await impTestForge.claimForgeQueueItems([7735])
        });

        it('should transfer correctly as before when not in rental', async function () {
            let impTestAavegotchi: AavegotchiFacet = await impersonate(testUser, aavegotchiFacet, ethers, network)
            let impRenterAavegotchi: AavegotchiFacet = await impersonate(rentalTestUser, aavegotchiFacet, ethers, network)

            expect(await impTestAavegotchi["safeTransferFrom(address,address,uint256)"](testUser, rentalTestUser, 7735)).to.be.ok
            expect(await impTestAavegotchi.ownerOf(7735)).to.be.equal(rentalTestUser)

            expect(await impRenterAavegotchi["safeTransferFrom(address,address,uint256)"](rentalTestUser, testUser, 7735)).to.be.ok
            expect(await impTestAavegotchi.ownerOf(7735)).to.be.equal(testUser)
        });
    })

    describe("revert tests", async function (){

        it('should revert forge', async function () {
            let imp: ForgeFacet = await impersonate(testUser, forgeFacet, ethers, network)

            // forge godlike
            await expect(imp.forgeWearables([113], [7735], [0])).to.be.revertedWith("ForgeFacet: not enough Alloy")

            await forgeFacet.adminMint(testUser, ALLOY, 130000);
            await expect(imp.forgeWearables([113], [7735], [0])).to.be.revertedWith("ForgeFacet: missing required Core")

            await forgeFacet.adminMint(testUser, CORE_HANDS_GODLIKE, 1);
            await expect(imp.forgeWearables([113], [7735], [0])).to.be.revertedWith("ForgeFacet: forge item not in stock")

        })

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
            await expect(imp.smeltWearables([127], [7735])).to.be.revertedWith("ForgeFacet: Only wearables can be smelted")
        })


        it('should revert for rental gotchi', async function () {
            let lending = {
                tokenId: 7735,
                initialCost: 0,
                period: 0,
                revenueSplit: [100, 0, 0],
                originalOwner: testUser,
                thirdParty: "",
                whitelistId: 0,
                revenueTokens: [],
            }
            let impRenterLending: GotchiLendingFacet = await impersonate(rentalTestUser, lendingFacet, ethers, network);
            let impTestLending: GotchiLendingFacet = await impersonate(testUser, lendingFacet, ethers, network);

            let impTestForge: ForgeFacet = await impersonate(testUser, forgeFacet, ethers, network)
            let impRenterForge: ForgeFacet = await impersonate(rentalTestUser, forgeFacet, ethers, network)

            // start a forge
            await impTestForge.smeltWearables([157], [7735], )
            await forgeFacet.adminMint(testUser, ALLOY, 30);
            await impTestForge.forgeWearables([157], [7735], [0])

            // create and agree rental
            await impTestLending.addGotchiLending(
                7735, 0, 1, [100, 0, 0], testUser, "0x0000000000000000000000000000000000000000", 0, []
            );
            let listing = await lendingGetSetFacet.getGotchiLendingFromToken(7735);
            await impRenterLending.agreeGotchiLending(listing.listingId, 7735, 0, 1, [100, 0, 0]);

            // should revert claim for both original owner and renter
            await expect(impTestForge.claimForgeQueueItems([7735])).to.be.revertedWith("ForgeFacet: Aavegotchi is lent out")
            await expect(impRenterForge.claimForgeQueueItems([7735])).to.be.revertedWith("ForgeFacet: Aavegotchi is lent out")

            await network.provider.send("hardhat_mine", ["0x10"])
            await impTestLending.claimAndEndGotchiLending(7735);
        });
    })

    describe("token tests", async function () {
        it('should adminMint and return total supply', async function () {
            let ids = [ALLOY, ESSENCE, CORE_BODY_COMMON, ALLOY]
            let amts = [5, 10, 15, 10]
            let supplies = [5, 10, 15, 15]

            for (let i = 0; i < ids.length; i++) {
                let currTotal = await forgeTokenFacet.totalSupply(ids[i]);

                await forgeFacet.adminMint(forgeDiamondAddress, ids[i], amts[i]);

                expect(await forgeTokenFacet.totalSupply(ids[i])).to.be.equal(amts[i] + Number(currTotal));
            }
        });

        it('should return all user balances', async function () {
            let impTestForge: ForgeFacet = await impersonate(testUser, forgeFacet, ethers, network)
            await impTestForge.smeltWearables([157], [7735])
            let bals = await forgeTokenFacet.balanceOfOwner(testUser)

            console.log(bals)
        });
    })
});