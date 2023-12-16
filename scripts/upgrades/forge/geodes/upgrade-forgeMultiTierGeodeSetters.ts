import {
  ForgeDAOFacet,
  ForgeVRFFacet,
  ForgeFacet,
} from "../../../../typechain";
import { ethers, network } from "hardhat";
import {
  diamondOwner,
  gasPrice,
  impersonate,
  maticForgeDiamond,
  mumbaiForgeDiamond,
} from "../../../helperFunctions";
import { LedgerSigner } from "@anders-t/ethers-ledger";

const isMumbai = false;
const forgeDiamondAddress = isMumbai ? mumbaiForgeDiamond : maticForgeDiamond;

const winChance = {
  common: {
    common: 2200,
    uncommon: 600,
    rare: 0,
    legendary: 0,
    mythical: 0,
    godlike: 0,
  },
  uncommon: {
    common: 2200,
    uncommon: 1500,
    rare: 400,
    legendary: 0,
    mythical: 0,
    godlike: 0,
  },
  rare: {
    common: 1100,
    uncommon: 2500,
    rare: 1700,
    legendary: 400,
    mythical: 0,
    godlike: 0,
  },
  legendary: {
    common: 500,
    uncommon: 1500,
    rare: 3000,
    legendary: 1800,
    mythical: 300,
    godlike: 0,
  },
  mythical: {
    common: 0,
    uncommon: 800,
    rare: 1800,
    legendary: 3800,
    mythical: 2000,
    godlike: 200,
  },
  godlike: {
    common: 0,
    uncommon: 0,
    rare: 0,
    legendary: 1700,
    mythical: 5400,
    godlike: 2900,
  },
};

const geodePrizeIds = [
  370, 371, 372, 373, 374, 375, 376, 377, 378, 379, 380, 381, 382, 383, 384,
  385, 386, 387,
];
const geodePrizeQuantities = [
  100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100,
  100, 100, 100,
];
const geodePrizeRarities = [
  1, 1, 1, 2, 5, 1, 5, 2, 5, 5, 10, 10, 10, 10, 20, 50, 50, 50,
];

export async function setForgeMultiTierGeodeProperties() {
  // const owner = await diamondOwner(forgeDiamondAddress, ethers);
  // console.log("owner:", owner);

  const signer = new LedgerSigner(ethers.provider, "m/44'/60'/1'/0/0");

  console.log("Starting setForgeMultiTierGeodeProperties...");

  let forgeDaoFacet = (await ethers.getContractAt(
    "contracts/Aavegotchi/ForgeDiamond/facets/ForgeDAOFacet.sol:ForgeDAOFacet",
    forgeDiamondAddress,
    signer
  )) as ForgeDAOFacet;

  let forgeVrfFacet = (await ethers.getContractAt(
    "contracts/Aavegotchi/ForgeDiamond/facets/ForgeVRFFacet.sol:ForgeVRFFacet",
    forgeDiamondAddress,
    signer
  )) as ForgeVRFFacet;

  let forgeFacet = (await ethers.getContractAt(
    "contracts/Aavegotchi/ForgeDiamond/facets/ForgeFacet.sol:ForgeFacet",
    forgeDiamondAddress,
    signer
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

  // await forgeDaoFacet.setGeodeMultiTierWinChanceBips(winChance, {
  //   gasPrice: gasPrice,
  // });
  await forgeDaoFacet.setMultiTierGeodePrizes(
    geodePrizeIds,
    geodePrizeQuantities,
    geodePrizeRarities,
    {
      gasPrice: gasPrice,
    }
  );

  console.log("Finished setForgeGeodeProperties.");
}
