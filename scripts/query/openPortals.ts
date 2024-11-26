import { ethers } from "hardhat";
import {
  AavegotchiFacet,
  AavegotchiGameFacet,
  VrfFacet,
  SvgFacet,
} from "../../typechain";

export async function openPortal(diamondAddress: string, tokenId: number) {
  const signer = await (await ethers.getSigners())[0];

  const diamond = (await ethers.getContractAt(
    "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
    diamondAddress,
    signer
  )) as AavegotchiFacet;

  const gameFacet = (await ethers.getContractAt(
    "contracts/Aavegotchi/facets/AavegotchiGameFacet.sol:AavegotchiGameFacet",
    diamondAddress,
    signer
  )) as AavegotchiGameFacet;

  const vrfFacet = (await ethers.getContractAt(
    "contracts/Aavegotchi/facets/VRFFacet.sol:VrfFacet",
    diamondAddress,
    signer
  )) as VrfFacet;

  const svgFacet = (await ethers.getContractAt(
    "contracts/Aavegotchi/facets/SvgFacet.sol:SvgFacet",
    diamondAddress,
    signer
  )) as SvgFacet;

  try {
    const aavegotchis = await diamond.getAavegotchi(tokenId);

    // console.log(aavegotchis);

    // const tx = await vrfFacet.openPortals([tokenId]);
    // await tx.wait();

    const portal = await gameFacet.portalAavegotchiTraits(tokenId);
    //
    console.log(portal);

    const portalSvgs = await svgFacet.portalAavegotchisSvg(tokenId);

    // const aavegotchiSvg = await svgFacet.getAavegotchiSvg(tokenId);

    // console.log(aavegotchiSvg);

    console.log(portalSvgs);
  } catch (error) {
    console.error("Error querying Aavegotchi contract:", error);
    throw error;
  }
}

// Example usage
async function main() {
  try {
    await openPortal("0xf81FFb9E2a72574d3C4Cf4E293D4Fec4A708F2B1", 1);
  } catch (error) {
    console.error("Failed to query Aavegotchis:", error);
  }
}

main();
