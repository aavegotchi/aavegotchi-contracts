import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../../tasks/deployUpgrade";
import { ethers, run } from "hardhat";
import {
  maticForgeDiamond,
  mumbaiForgeDiamond,
} from "../../../helperFunctions";

export async function releaseZeroGeodesFix() {
  console.log("Upgrading Forge for zero geode fix.");

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName:
        "contracts/Aavegotchi/ForgeDiamond/facets/ForgeVRFFacet.sol:ForgeVRFFacet",
      addSelectors: [
        // "function fixZeroGeodes(address user) external"
      ],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  const signerAddress = await (await ethers.getSigners())[0].getAddress();

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: signerAddress,
    diamondAddress: maticForgeDiamond,
    facetsAndAddSelectors: joined,
    useLedger: false,
    useMultisig: false,
    freshDeployment: false,
  };

  await run("deployUpgrade", args);

  console.log("Finished upgrading Forge for zero geode fix.");
}

if (require.main === module) {
  releaseZeroGeodesFix()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
