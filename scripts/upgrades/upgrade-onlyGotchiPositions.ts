import { network, run } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../tasks/deployUpgrade";

import {
  maticDiamondAddress,
  mumbaiOwner,
  mumbiaAavegotchiDiamond,
} from "../helperFunctions";

export async function upgrade() {
  const diamondUpgrader = "0x35fe3df776474a7b24b3b1ec6e745a830fdad351";
  const XPMerkleDrops = "tuple(bytes32 root,uint256 xpAmount)";
  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "MerkleDropFacet",
      addSelectors: [
        `function claimXPDrop(bytes32 _propId, address _claimer,  uint256[] calldata _gotchiId,  bytes32[] calldata _proof,  uint256[] calldata _onlyGotchis, uint256[] calldata _onlyGotchisPositions ) external `,
        `function batchGotchiClaimXPDrop( bytes32 _propId,  address[] calldata _claimers, uint256[][] calldata _gotchiIds, bytes32[][] calldata _proofs, uint256[][] calldata _onlyGotchis,uint256[][] calldata _onlyGotchisPositions) external`,
        `function batchDropClaimXPDrop( bytes32[] calldata _propIds, address[] calldata _claimers, uint256[][] calldata _gotchiIds, bytes32[][] calldata _proofs, uint256[][] calldata _onlyGotchis,uint256[][] calldata _onlyGotchisPositions ) external`,
      ],
      removeSelectors: [
        `function claimXPDrop(bytes32 _propId, address _claimer,  uint256[] calldata _gotchiId,  bytes32[] calldata _proof,  uint256[] calldata _onlyGotchis ) external `,
        `function batchGotchiClaimXPDrop( bytes32 _propId,  address[] calldata _claimers, uint256[][] calldata _gotchiIds, bytes32[][] calldata _proofs, uint256[][] calldata _onlyGotchis) external`,
        `function batchDropClaimXPDrop( bytes32[] calldata _propIds, address[] calldata _claimers, uint256[][] calldata _gotchiIds, bytes32[][] calldata _proofs, uint256[][] calldata _onlyGotchis ) external`,
      ],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: mumbaiOwner,
    diamondAddress: maticDiamondAddress,
    facetsAndAddSelectors: joined,
    useLedger: true,
    useMultisig: false,
  };

  if (network.name === "mumbai") {
    args.diamondUpgrader = mumbaiOwner;
    args.diamondAddress = mumbiaAavegotchiDiamond;
  }

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
