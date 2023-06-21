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

const isMumbai = false;

export async function upgradeForgeGeodes() {
  console.log("Upgrading Forge facets for Geodes.");

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName:
        "contracts/Aavegotchi/ForgeDiamond/facets/ForgeDAOFacet.sol:ForgeDAOFacet",
      addSelectors: [
        "function setGeodeWinChanceBips(tuple(uint256 common,uint256 uncommon,uint256 rare,uint256 legendary,uint256 mythical,uint256 godlike) calldata chances) external",
        "function setGeodePrizes(uint256[] calldata ids, uint256[] calldata quantities) external",
        "function getGeodePrizesRemaining() external view returns (uint256[] memory, uint256[] memory)",
      ],
      removeSelectors: [],
    },
    {
      facetName:
        "contracts/Aavegotchi/ForgeDiamond/facets/ForgeFacet.sol:ForgeFacet",
      addSelectors: [
        "function geodeRsmFromTokenId(uint256 tokenId) public pure returns (uint8 rarityScoreModifier)",
        "function burn(address account, uint256 id, uint256 amount) external",
      ],
      removeSelectors: [],
    },
    {
      facetName:
        "contracts/Aavegotchi/ForgeDiamond/facets/ForgeTokenFacet.sol:ForgeTokenFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    {
      facetName:
        "contracts/Aavegotchi/ForgeDiamond/facets/ForgeVRFFacet.sol:ForgeVRFFacet",
      addSelectors: [
        "function linkBalance() external view returns (uint256 linkBalance_)",
        "function vrfCoordinator() external view returns (address)",
        "function link() external view returns (address)",
        "function keyHash() external view returns (bytes32)",
        "function getMaxVrf() external pure returns (uint256)",
        "function areGeodePrizesAvailable() public view returns (bool)",
        "function numTotalPrizesLeft() public view returns (uint256)",
        "function openGeodes(uint256[] calldata _geodeTokenIds, uint256[] calldata _amountPerToken) external",
        "function rawFulfillRandomness(bytes32 _requestId, uint256 _randomNumber) external",
        "function getRequestInfo(address user) external view returns (tuple(address,bytes32,VrfStatus,uint256,uint256[],uint256[]) memory)",
        "function getRequestInfoByRequestId(bytes32 requestId) external view returns (tuple(address,bytes32,VrfStatus,uint256,uint256[],uint256[]) memory)",
        "function claimWinnings() external",
        "function changeVrf(uint256 _newFee, bytes32 _keyHash, address _vrfCoordinator, address _link) external",
        "function removeLinkTokens(address _to, uint256 _value) external",
      ],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  const signerAddress = await (await ethers.getSigners())[0].getAddress();

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: signerAddress,
    diamondAddress: isMumbai ? mumbaiForgeDiamond : maticForgeDiamond,
    facetsAndAddSelectors: joined,
    useLedger: false,
    useMultisig: false,
    freshDeployment: false,
  };

  await run("deployUpgrade", args);

  console.log("Finished upgrading Forge facets for Geodes.");
}

// if (require.main === module) {
//     upgradeAavegotchiForForge()
//         .then(() => process.exit(0))
//         .catch((error) => {
//             console.error(error);
//             process.exit(1);
//         });
// }
