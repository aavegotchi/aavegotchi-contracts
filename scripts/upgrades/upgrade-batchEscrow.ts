import { run } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../tasks/deployUpgrade";

import { maticDiamondAddress, maticDiamondUpgrader } from "../helperFunctions";

export async function upgradeBatchEscrow() {
  console.log("Upgrading Aavegotchi facets for batch escrow.");

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "contracts/Aavegotchi/facets/EscrowFacet.sol:EscrowFacet",
      addSelectors: [
        "function batchTransferEscrow(uint256[] calldata _tokenIds,address[] calldata _erc20Contracts,address[] calldata _recipients,uint256[] calldata _transferAmounts) external",
      ],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    diamondOwner: maticDiamondUpgrader,
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
  upgradeBatchEscrow()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
