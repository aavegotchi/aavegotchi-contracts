import { ethers, run } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../../tasks/deployUpgrade";

import {
  maticForgeDiamond,
  mumbaiForgeDiamond,
} from "../../../helperFunctions";

const isMumbai = true;

export async function upgradeGeodesRemoveLinkTest() {
  console.log("Upgrading Forge facets for Geodes chainlink test removal.");

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName:
        "contracts/Aavegotchi/ForgeDiamond/facets/ForgeVRFFacet.sol:ForgeVRFFacet",
      addSelectors: [],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  const signerAddress = await (await ethers.getSigners())[0].getAddress();

  const args: DeployUpgradeTaskArgs = {
    // diamondUpgrader: maticDiamondUpgrader,
    diamondUpgrader: signerAddress,
    diamondAddress: isMumbai ? mumbaiForgeDiamond : maticForgeDiamond,
    facetsAndAddSelectors: joined,
    useLedger: false,
    useMultisig: false,
    freshDeployment: false,
    // initAddress: maticDiamondAddress,
    // initCalldata: calldata,
  };

  await run("deployUpgrade", args);

  console.log("Finished upgrading Forge facets for Geodes.");
}

if (require.main === module) {
  upgradeGeodesRemoveLinkTest()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
