import { ethers } from "hardhat";
import { AavegotchiFacet, AavegotchiGameFacet } from "../../typechain";

async function queryAavegotchiAtBlock() {
  const signer = await (await ethers.getSigners())[0];

  const diamond = (await ethers.getContractAt(
    "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
    "0x87C969d083189927049f8fF3747703FB9f7a8AEd",
    signer
  )) as AavegotchiFacet;

  const gameFacet = (await ethers.getContractAt(
    "contracts/Aavegotchi/facets/AavegotchiGameFacet.sol:AavegotchiGameFacet",
    "0x87C969d083189927049f8fF3747703FB9f7a8AEd",
    signer
  )) as AavegotchiGameFacet;

  try {
    const aavegotchis = await diamond.getAavegotchi(514);

    const portal = await gameFacet.portalAavegotchiTraits(514);

    console.log(portal);

    console.log(aavegotchis);
  } catch (error) {
    console.error("Error querying Aavegotchi contract:", error);
    throw error;
  }
}

// Example usage
async function main() {
  const BLOCK_NUMBER = 4610;

  try {
    await queryAavegotchiAtBlock();
  } catch (error) {
    console.error("Failed to query Aavegotchis:", error);
  }
}

main();
