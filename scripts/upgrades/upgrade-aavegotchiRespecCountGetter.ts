import { run } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../tasks/deployUpgrade";

import { maticDiamondAddress, maticDiamondUpgrader } from "../helperFunctions";

export async function upgradeAavegotchiRepecCountGetter() {
  console.log("Upgrading Aavegotchi facets for Respec count getter.");

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName:
        "contracts/Aavegotchi/facets/AavegotchiGameFacet.sol:AavegotchiGameFacet",
      addSelectors: [
        "function respecCount(uint32 _tokenId) external view returns (uint256 respecCount_)",
      ],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    // diamondUpgrader: maticDiamondUpgrader,
    diamondUpgrader: maticDiamondUpgrader,
    diamondAddress: maticDiamondAddress,
    facetsAndAddSelectors: joined,
    useLedger: true,
    useMultisig: false,
    freshDeployment: false,
    // initAddress: maticDiamondAddress,
    // initCalldata: calldata,
  };

  await run("deployUpgrade", args);

  console.log("Finished upgrading Aavegotchi facets.");
}

if (require.main === module) {
  upgradeAavegotchiRepecCountGetter()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
