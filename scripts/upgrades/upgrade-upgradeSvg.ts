import { ethers, run } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../tasks/deployUpgrade";
import { maticDiamondAddress } from "../helperFunctions";

export async function upgrade() {
  const diamondOwner = "0xd38Df837a1EAd12ee16f8b8b7E5F58703f841668";

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "SvgFacet",
      addSelectors: [],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);
  const diamondAddress = "0xc0c35042E7CA8c6C851CC485079724eC81237Fe5";

  const args: DeployUpgradeTaskArgs = {
    diamondOwner: diamondOwner,
    diamondAddress: diamondAddress,
    facetsAndAddSelectors: joined,
    useLedger: false,
    useMultisig: false,
  };

  await run("deployUpgrade", args);

  const svgFacet = await ethers.getContractAt(
    "contracts/Aavegotchi/facets/SvgFacet.sol:SvgFacet",
    diamondAddress
  );

  const tokenId = 1;

  const aavegotchi = await svgFacet.getAavegotchiSvg(tokenId);

  console.log(aavegotchi);
}

if (require.main === module) {
  upgrade()
    .then(() => process.exit(0))
    // .then(() => console.log('upgrade completed') /* process.exit(0) */)
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
