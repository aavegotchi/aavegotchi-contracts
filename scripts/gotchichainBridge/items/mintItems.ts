/* global ethers hre */

import { ethers } from "hardhat";

const aavegotchDiamondAddressMumbai = process.env.AAVEGOTCHI_DIAMOND_ADDRESS_MUMBAI as string
const ghstDiamondAddressMumbai = process.env.GHST_DIAMOND_ADDRESS_MUMBAI as string

export default async function main(to: string, tokenId: string | number, tokenAmount: string | number) {
  const shopFacetPolygonSide = await ethers.getContractAt("ShopFacet", aavegotchDiamondAddressMumbai)
  const itemsFacetPolygonSide = await ethers.getContractAt("contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet", aavegotchDiamondAddressMumbai)
  const ghstTokenPolygonSide = await ethers.getContractAt("ERC20MintableBurnable", ghstDiamondAddressMumbai)

  const itemPrice = (itemsFacetPolygonSide.getItemType(tokenId)).ghstPrice

  let tx = await ghstTokenPolygonSide.mint(to, itemPrice)
  await tx.wait()
  
  tx = await ghstTokenPolygonSide.approve(shopFacetPolygonSide.address, itemPrice)
  await tx.wait()

  tx = await shopFacetPolygonSide.purchaseItemsWithGhst(to, [tokenId], [tokenAmount])
  await tx.wait()

  console.log(`Purchased item ${tokenAmount} tokens of token with ID ${tokenId}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  main("to", "tokenId", "tokenAmount")
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

exports.deployProject = main;
