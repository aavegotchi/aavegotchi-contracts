import {ForgeDAOFacet} from "../../../typechain";
import {ethers} from "hardhat";


const daoAddr = "0x6fb7e0AAFBa16396Ad6c1046027717bcA25F821f"; // DTF multisig
const GLTR = "0x3801C3B3B5c98F88a9c9005966AA96aa440B9Afc"

const alloyCosts = {
    common: 100,
    uncommon: 300,
    rare: 1300,
    legendary: 5300,
    mythical: 25000,
    godlike: 130000,
}
const essenceCost = {
    common: 1,
    uncommon: 5,
    rare: 10,
    legendary: 50,
    mythical: 250,
    godlike: 1000,
}
const timeCost = {
    common: 32922,
    uncommon: 98765,
    rare: 296296,
    legendary: 888889,
    mythical: 2666667,
    godlike: 8000000,
}
const skillPts = {
    common: 4,
    uncommon: 12,
    rare: 52,
    legendary: 212,
    mythical: 1000,
    godlike: 5200,
}

export async function setForgeProperties(forgeDiamondAddress: string){
    console.log("Starting setForgeProperties...")

    let forgeDaoFacet = (await ethers.getContractAt(
        "contracts/Aavegotchi/ForgeDiamond/facets/ForgeDAOFacet.sol:ForgeDAOFacet",
        forgeDiamondAddress
    )) as ForgeDAOFacet;


    await forgeDaoFacet.setGltrAddress(GLTR);
    await forgeDaoFacet.setAavegotchiDaoAddress(daoAddr);
    await forgeDaoFacet.setAlloyDaoFeeInBips(500);
    await forgeDaoFacet.setAlloyBurnFeeInBips(500);

    await forgeDaoFacet.setForgeAlloyCost(alloyCosts);
    await forgeDaoFacet.setForgeEssenceCost(essenceCost);
    await forgeDaoFacet.setForgeTimeCostInBlocks(timeCost);
    await forgeDaoFacet.setSkillPointsEarnedFromForge(skillPts);
    await forgeDaoFacet.setSmeltingSkillPointReductionFactorBips(5000);


    console.log("Finished setForgeProperties.")
}