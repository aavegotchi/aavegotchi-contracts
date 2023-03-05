import { run } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../tasks/deployUpgrade";

import { maticDiamondAddress } from "../helperFunctions";

export async function upgrade() {
  const diamondUpgrader = "0x35fe3df776474a7b24b3b1ec6e745a830fdad351";
  const XPMerkleDrops = "tuple(bytes32 root,uint256 xpAmount)";
  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "MerkleDropFacet",
      addSelectors: [
        `function createXPDrop(bytes32 _propId, bytes32 _merkleRoot, uint256 _xpAmount)`,
        `function claimXPDrop(bytes32 _propId, address _claimer, uint256[] calldata _gotchiIds, bytes32[] calldata _proof) external`,
        `function isClaimed(bytes32 _propId, address _claimer) public view returns (bool claimed_)`,
        `function viewXPDrop(bytes32 _propId) public view returns (${XPMerkleDrops} memory) `,
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
