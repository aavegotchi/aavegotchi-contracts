import { ForgeDAOFacet, OwnershipFacet } from "../../../typechain";
import { ethers, network } from "hardhat";
import { sendToTenderly } from "../../libraries/tenderly";
import { diamondOwner, impersonate } from "../../helperFunctions";

const daoAddr = "0x6fb7e0AAFBa16396Ad6c1046027717bcA25F821f"; // DTF multisig
const GLTR = "0x3801C3B3B5c98F88a9c9005966AA96aa440B9Afc";

const alloyCosts = {
  common: 100,
  uncommon: 300,
  rare: 1300,
  legendary: 5300,
  mythical: 25000,
  godlike: 130000,
};
const essenceCost = {
  common: 1,
  uncommon: 5,
  rare: 10,
  legendary: 50,
  mythical: 250,
  godlike: 1000,
};
const timeCost = {
  common: 32922,
  uncommon: 98765,
  rare: 296296,
  legendary: 888889,
  mythical: 2666667,
  godlike: 8000000,
};
const skillPts = {
  common: 4,
  uncommon: 12,
  rare: 52,
  legendary: 212,
  mythical: 1000,
  godlike: 5200,
};

export async function setForgeProperties(forgeDiamondAddress: string) {
  // const owner = await diamondOwner(forgeDiamondAddress, ethers);
  // console.log("owner:", owner);

  console.log("Starting setForgeProperties...");

  let forgeDaoFacet = (await ethers.getContractAt(
    "contracts/Aavegotchi/ForgeDiamond/facets/ForgeDAOFacet.sol:ForgeDAOFacet",
    forgeDiamondAddress,
    (
      await ethers.getSigners()
    )[0]
  )) as ForgeDAOFacet;

  // if (network.name === "hardhat") {
  //   forgeDaoFacet = await impersonate(
  //     await diamondOwner(forgeDiamondAddress, ethers),
  //     forgeDaoFacet,
  //     ethers,
  //     network
  //   );
  // }

  //
  // if (network.name === "tenderly") {
  //   const owner = await (
  //     (await ethers.getContractAt(
  //       "OwnershipFacet",
  //       forgeDiamondAddress
  //     )) as OwnershipFacet
  //   ).owner();
  //
  //   await sendToTenderly(
  //     forgeDiamondAddress,
  //     owner,
  //     await forgeDaoFacet.populateTransaction.setGltrAddress(GLTR)
  //   );
  //   await sendToTenderly(
  //     forgeDiamondAddress,
  //     owner,
  //     await forgeDaoFacet.populateTransaction.setAavegotchiDaoAddress(daoAddr)
  //   );
  //   await sendToTenderly(
  //     forgeDiamondAddress,
  //     owner,
  //     await forgeDaoFacet.populateTransaction.setAlloyDaoFeeInBips(500)
  //   );
  //   await sendToTenderly(
  //     forgeDiamondAddress,
  //     owner,
  //     await forgeDaoFacet.populateTransaction.setAlloyBurnFeeInBips(500)
  //   );
  //
  //   await sendToTenderly(
  //     forgeDiamondAddress,
  //     owner,
  //     await forgeDaoFacet.populateTransaction.setForgeAlloyCost(alloyCosts)
  //   );
  //   await sendToTenderly(
  //     forgeDiamondAddress,
  //     owner,
  //     await forgeDaoFacet.populateTransaction.setForgeEssenceCost(essenceCost)
  //   );
  //   await sendToTenderly(
  //     forgeDiamondAddress,
  //     owner,
  //     await forgeDaoFacet.populateTransaction.setForgeTimeCostInBlocks(timeCost)
  //   );
  //   await sendToTenderly(
  //     forgeDiamondAddress,
  //     owner,
  //     await forgeDaoFacet.populateTransaction.setSkillPointsEarnedFromForge(
  //       skillPts
  //     )
  //   );
  //   await sendToTenderly(
  //     forgeDiamondAddress,
  //     owner,
  //     await forgeDaoFacet.populateTransaction.setSmeltingSkillPointReductionFactorBips(
  //       5000
  //     )
  //   );
  // } else {
  //   if (network.name === "hardhat") {
  //     const owner = await (
  //       (await ethers.getContractAt(
  //         "OwnershipFacet",
  //         forgeDiamondAddress
  //       )) as OwnershipFacet
  //     ).owner();
  //     forgeDaoFacet = await impersonate(owner, forgeDaoFacet, ethers, network);
  //   }
  let tx = await forgeDaoFacet.setGltrAddress(GLTR);
  console.log("tx:", tx.hash);
  await tx.wait();
  tx = await forgeDaoFacet.setAavegotchiDaoAddress(daoAddr);
  console.log("tx:", tx.hash);
  await tx.wait();
  tx = await forgeDaoFacet.setAlloyDaoFeeInBips(500);
  console.log("tx:", tx.hash);
  await tx.wait();
  tx = await forgeDaoFacet.setAlloyBurnFeeInBips(500);
  console.log("tx:", tx.hash);
  await tx.wait();
  tx = await forgeDaoFacet.setForgeAlloyCost(alloyCosts);
  console.log("tx:", tx.hash);
  await tx.wait();
  tx = await forgeDaoFacet.setForgeEssenceCost(essenceCost);
  console.log("tx:", tx.hash);
  await tx.wait();
  tx = await forgeDaoFacet.setForgeTimeCostInBlocks(timeCost);
  console.log("tx:", tx.hash);
  await tx.wait();
  tx = await forgeDaoFacet.setSkillPointsEarnedFromForge(skillPts);
  console.log("tx:", tx.hash);
  await tx.wait();
  tx = await forgeDaoFacet.setSmeltingSkillPointReductionFactorBips(5000);
  console.log("tx:", tx.hash);
  await tx.wait();
  // }

  console.log("Finished setForgeProperties.");
}
