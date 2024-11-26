import { ethers } from "hardhat";
import {
  AavegotchiFacet,
  AavegotchiGameFacet,
  SvgFacet,
} from "../../typechain";
import { loadDeploymentConfig } from "../deployFullDiamond";

async function queryAavegotchiAtBlock() {
  const signer = await (await ethers.getSigners())[0];

  const diamondAddress = "0xc0c35042E7CA8c6C851CC485079724eC81237Fe5";
  const tokenId = 0;

  const svgFacet = (await ethers.getContractAt(
    "contracts/Aavegotchi/facets/SvgFacet.sol:SvgFacet",
    diamondAddress,
    signer
  )) as SvgFacet;

  const config = loadDeploymentConfig(84532);

  const svgs = config.svgsUploaded;

  const keys = Object.keys(svgs);

  for (const key of keys) {
    console.log("key:", key);
    const svgValues = svgs[key];

    for (const range of Object.keys(svgValues)) {
      const begin = range.split("_")[0];
      const end = range.split("_")[1];

      for (let i = parseInt(begin); i < parseInt(end); i++) {
        try {
          const bytes32Key = ethers.utils.formatBytes32String(key);

          const svg = await svgFacet.getSvg(bytes32Key, i);
          console.log("Svg found:", key, i);
        } catch (error) {
          console.log("Error getting SVG:", key, i);
        }
      }
    }
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
