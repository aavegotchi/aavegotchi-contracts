import { ethers, network, run } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../../tasks/deployUpgrade";

import {
  maticForgeDiamond,
  mumbaiForgeDiamond,
  diamondOwner,
  impersonate,
} from "../../../helperFunctions";
import { ForgeDAOFacet } from "../../../../typechain";

const isMumbai = false;

export async function upgradeForgeGeodeFix() {
  console.log("Upgrading Forge facets for Geodes.");

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName:
        "contracts/Aavegotchi/ForgeDiamond/facets/ForgeDAOFacet.sol:ForgeDAOFacet",
      addSelectors: ["function tempFixQuantity() external"],
      removeSelectors: [],
    },

    {
      facetName:
        "contracts/Aavegotchi/ForgeDiamond/facets/ForgeVRFFacet.sol:ForgeVRFFacet",
      addSelectors: [],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  const owner = await diamondOwner(maticForgeDiamond, ethers);
  const args: DeployUpgradeTaskArgs = {
    diamondAddress: isMumbai ? mumbaiForgeDiamond : maticForgeDiamond,
    facetsAndAddSelectors: joined,
    useLedger: false,
    useMultisig: false,
    freshDeployment: false,
    diamondOwner: owner,
  };

  await run("deployUpgrade", args);

  console.log("Fixing array ");

  let forgeDaoFacet = (await ethers.getContractAt(
    "contracts/Aavegotchi/ForgeDiamond/facets/ForgeDAOFacet.sol:ForgeDAOFacet",
    maticForgeDiamond
  )) as ForgeDAOFacet;

  forgeDaoFacet = await impersonate(owner, forgeDaoFacet, ethers, network);

  await forgeDaoFacet.tempFixQuantity();

  console.log("Finished Fixing and resetting.");
}

if (require.main === module) {
  upgradeForgeGeodeFix()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
