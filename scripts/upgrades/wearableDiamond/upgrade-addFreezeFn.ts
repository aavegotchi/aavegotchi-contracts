import { run } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";

import {
  maticDiamondUpgrader,
  maticWearableDiamondAddress,
} from "../../helperFunctions";

const itemBridgingParams = `tuple(address receiver, uint256 tokenId, uint256 amount, uint256 msgGasLimit)`;
export async function upgrade() {
  const facets: FacetsAndAddSelectors[] = [
    {
      facetName:
        "contracts/Aavegotchi/WearableDiamond/facets/WearablesFacet.sol:WearablesFacet",
      addSelectors: ["function toggleDiamondPaused(bool _paused) external"],
      removeSelectors: [
        "function bridgeItem(address _receiver, uint256 _tokenId, uint256 _amount, uint256 _msgGasLimit, address _connector) external",
        "function setItemGeistBridge(address _itemBridge) external",
        // "function getItemGeistBridge() external view returns (address)",
        // `function bridgeItems(${itemBridgingParams}[] calldata bridgingParams, address _connector) external payable`,
      ],
    },
  ];
  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    diamondOwner: maticDiamondUpgrader,
    diamondAddress: maticWearableDiamondAddress,
    facetsAndAddSelectors: joined,
    useLedger: true,
    useMultisig: false,
  };

  await run("deployUpgrade", args);
}

if (require.main === module) {
  upgrade()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
