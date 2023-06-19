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

const isMumbai = false;
const forgeDiamondAddress = isMumbai ? mumbaiForgeDiamond : maticForgeDiamond;

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

  // https://docs.chain.link/vrf/v1/supported-networks

  const keyHash = isMumbai
    ? "0x6e75b569a01ef56d18cab6a8e71e6600d6ce853834d4a5748b720d06f878b3a4"
    : "0xf86195cf7690c55907b2b611ebb7343a6f649bff128701cc542f0569e2c549da";

  const vrfCoordinator = isMumbai
    ? "0x8C7382F9D8f56b33781fE506E897a4F1e2d17255"
    : "0x3d2341ADb2D31f1c5530cDC622016af293177AE0";

  const link = isMumbai
    ? "0x326C977E6efc84E512bB9C30f76E30c160eD06FB"
    : "0xb0897686c545045aFc77CF20eC7A532E3120E0F1";

  await forgeVrfFacet.changeVrf(
    "100000000000000",
    keyHash,
    vrfCoordinator,
    link,
    { gasPrice: gasPrice }
  );

  await forgeDaoFacet.setGeodeWinChanceBips(winChance, { gasPrice: gasPrice });
  await forgeDaoFacet.setGeodePrizes(geodePrizeIds, geodePrizeQuantities, {
    gasPrice: gasPrice,
  });

  // mint schematics
  await forgeFacet.adminMintBatch(
    forgeDiamondAddress,
    geodePrizeIds,
    geodePrizeQuantities,
    { gasPrice: gasPrice }
  );

  console.log("Finished setForgeGeodeProperties.");
}
