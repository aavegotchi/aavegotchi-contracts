import {
  ForgeDAOFacet,
  ForgeTokenFacet,
  ItemsFacet
} from "../../../../typechain";
import { ethers, network } from "hardhat";
import {
  diamondOwner,
  gasPrice,
  impersonate, maticDiamondAddress,
  maticForgeDiamond,
  mumbaiForgeDiamond
} from "../../../helperFunctions";

const isMumbai = false;
const forgeDiamondAddress = isMumbai ? mumbaiForgeDiamond : maticForgeDiamond;

let geodePrizeIds: any[] = []
let geodePrizeQuantities: any[] = []
let geodePrizeRarities: any[] = []

export async function fixGeodePrizes() {
  // const owner = await diamondOwner(forgeDiamondAddress, ethers);
  // console.log("owner:", owner);

  console.log("Starting fixGeodePrizes...");

  let forgeDaoFacet = (await ethers.getContractAt(
    "contracts/Aavegotchi/ForgeDiamond/facets/ForgeDAOFacet.sol:ForgeDAOFacet",
    forgeDiamondAddress,
    (
      await ethers.getSigners()
    )[0]
  )) as ForgeDAOFacet;

  let forgeTokenFacet = (await ethers.getContractAt(
    "contracts/Aavegotchi/ForgeDiamond/facets/ForgeTokenFacet.sol:ForgeTokenFacet",
    forgeDiamondAddress,
    (
      await ethers.getSigners()
    )[0]
  )) as ForgeTokenFacet;

  let itemsFacet = (await ethers.getContractAt(
    "contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet",
    maticDiamondAddress,
    (
      await ethers.getSigners()
    )[0]
  )) as ItemsFacet;

  if (network.name === "hardhat" || network.name === "localhost") {
    forgeDaoFacet = await impersonate(
      await diamondOwner(forgeDiamondAddress, ethers),
      forgeDaoFacet,
      ethers,
      network
    );
    forgeTokenFacet = await impersonate(
      await diamondOwner(forgeDiamondAddress, ethers),
      forgeTokenFacet,
      ethers,
      network
    );
    itemsFacet = await impersonate(
      await diamondOwner(maticDiamondAddress, ethers),
      itemsFacet,
      ethers,
      network
    );
  }

  let inventory = await forgeTokenFacet.balanceOfOwner(forgeDiamondAddress)

  // only schematics
  inventory = inventory.filter(i => Number(i.tokenId) < 1000000000)
  const schematicItemIds = inventory.map(i => Number(i.tokenId))
  const itemTypes = await itemsFacet.getItemTypes(schematicItemIds)

  for (let item of inventory){
    const itemType = itemTypes.filter(i => Number(item.tokenId) == Number(i.svgId))[0]

    geodePrizeIds.push(Number(itemType.svgId))
    geodePrizeQuantities.push(Number(item.balance))
    geodePrizeRarities.push(Number(itemType.rarityScoreModifier))
  }

  // console.log(geodePrizeIds)
  // console.log(geodePrizeQuantities)
  // console.log(geodePrizeRarities)


  await forgeDaoFacet.setMultiTierGeodePrizes(geodePrizeIds, geodePrizeQuantities, geodePrizeRarities, {
    gasPrice: gasPrice,
  });

  console.log("Finished fixGeodePrizes.");
}


fixGeodePrizes()