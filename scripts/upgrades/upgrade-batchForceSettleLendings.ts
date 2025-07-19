import { ethers, run } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../tasks/deployUpgrade";
import { diamondOwner, maticDiamondAddress } from "../helperFunctions";
import { diamondUpgrader } from "../../test/ItemsRolesRegistryFacet/helpers";

export async function upgrade() {
  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "GotchiLendingFacet",
      addSelectors: [
        "function batchForceEndGotchiLending(uint32[] calldata _listingIds) external",
      ],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    diamondOwner: await diamondOwner(maticDiamondAddress, ethers),
    diamondAddress: maticDiamondAddress,
    facetsAndAddSelectors: joined,
    useLedger: false,
    useMultisig: false,
  };

  await run("deployUpgrade", args);
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
