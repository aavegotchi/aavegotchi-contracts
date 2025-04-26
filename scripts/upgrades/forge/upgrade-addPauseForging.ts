import { run } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";

import { maticDiamondUpgrader } from "../../helperFunctions";

export async function addPauseForging() {
  const forgeDiamond = "0x4fDfc1B53Fd1D80d969C984ba7a8CE4c7bAaD442";

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "ForgeDAOFacet",
      addSelectors: [`function toggleForging() external`],
      removeSelectors: [],
    },
    {
      facetName: "ForgeFacet",
      addSelectors: [],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    diamondOwner: maticDiamondUpgrader,
    diamondAddress: forgeDiamond,
    facetsAndAddSelectors: joined,
    useLedger: true,
    useMultisig: false,
    freshDeployment: true,
  };

  await run("deployUpgrade", args);
}

if (require.main === module) {
  addPauseForging()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
