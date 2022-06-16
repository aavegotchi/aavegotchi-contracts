import { run } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../tasks/deployUpgrade";
import { maticDiamondAddress } from "../helperFunctions";

export async function upgrade() {
  const diamondUpgrader = "0x35fe3df776474a7b24b3b1ec6e745a830fdad351";

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "AccessRightsFacet",
      addSelectors: [
        "function setAccessRight(uint32 _tokenId, uint256 _action, uint256 _access) external",
        "function setAccessRights(uint32[] memory _tokenId, uint256[] memory _action, uint256[] memory _access) external",
        "function getAccessRight(uint32 _tokenId, uint256 _action) external view returns (uint256)",
        "function getAccessRights(uint32[] memory _tokenIds, uint256[] memory _actions) external view returns (uint256[] memory)",
        "function canChannelOnLending(uint32 _tokenId) external view returns (bool)",
      ],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: maticDiamondAddress,
    facetsAndAddSelectors: joined,
    useLedger: true,
    useMultisig: true,
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
