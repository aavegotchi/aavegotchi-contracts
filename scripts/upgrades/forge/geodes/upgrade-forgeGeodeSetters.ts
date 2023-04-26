import {
  ForgeDAOFacet,
  ForgeVRFFacet,
  OwnershipFacet,
  ForgeFacet,
} from "../../../../typechain";
import { ethers, network } from "hardhat";
import { sendToTenderly } from "../../libraries/tenderly";
import {
  diamondOwner,
  impersonate,
  maticForgeDiamond,
} from "../../../helperFunctions";

const daoAddr = "0x6fb7e0AAFBa16396Ad6c1046027717bcA25F821f"; // DTF multisig
const GLTR = "0x3801C3B3B5c98F88a9c9005966AA96aa440B9Afc";
const forgeDiamondAddress = maticForgeDiamond;

const winChance = {
  common: 79,
  uncommon: 235,
  rare: 982,
  legendary: 3439,
  mythical: 8630,
  godlike: 10000,
};
const geodePrizeIds = [358, 359, 360, 361];
const geodePrizeQuantities = [100, 100, 100, 100];

export async function setForgeGeodeProperties() {
  // const owner = await diamondOwner(forgeDiamondAddress, ethers);
  // console.log("owner:", owner);

  console.log("Starting setForgeGeodeProperties...");

  let forgeDaoFacet = (await ethers.getContractAt(
    "contracts/Aavegotchi/ForgeDiamond/facets/ForgeDAOFacet.sol:ForgeDAOFacet",
    forgeDiamondAddress,
    (
      await ethers.getSigners()
    )[0]
  )) as ForgeDAOFacet;

  let forgeVrfFacet = (await ethers.getContractAt(
    "contracts/Aavegotchi/ForgeDiamond/facets/ForgeVRFFacet.sol:ForgeVRFFacet",
    forgeDiamondAddress,
    (
      await ethers.getSigners()
    )[0]
  )) as ForgeVRFFacet;

  let forgeFacet = (await ethers.getContractAt(
    "contracts/Aavegotchi/ForgeDiamond/facets/ForgeFacet.sol:ForgeFacet",
    forgeDiamondAddress,
    (
      await ethers.getSigners()
    )[0]
  )) as ForgeFacet;

  if (network.name === "hardhat" || network.name === "localhost") {
    forgeDaoFacet = await impersonate(
      await diamondOwner(forgeDiamondAddress, ethers),
      forgeDaoFacet,
      ethers,
      network
    );
    forgeVrfFacet = await impersonate(
      await diamondOwner(forgeDiamondAddress, ethers),
      forgeVrfFacet,
      ethers,
      network
    );
    forgeFacet = await impersonate(
      await diamondOwner(forgeDiamondAddress, ethers),
      forgeFacet,
      ethers,
      network
    );
  }

  await forgeVrfFacet.changeVrf(
    "100000000000000",
    "0xf86195cf7690c55907b2b611ebb7343a6f649bff128701cc542f0569e2c549da",
    "0x3d2341ADb2D31f1c5530cDC622016af293177AE0",
    "0xb0897686c545045aFc77CF20eC7A532E3120E0F1"
  );

  await forgeDaoFacet.setGeodeWinChanceBips(winChance);
  await forgeDaoFacet.setGeodePrizes(geodePrizeIds, geodePrizeQuantities);

  // mint schematics
  await forgeFacet.adminMintBatch(
    maticForgeDiamond,
    geodePrizeIds,
    geodePrizeQuantities
  );

  console.log("Finished setForgeGeodeProperties.");
}
