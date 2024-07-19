import { run } from "hardhat";
import {
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
  convertFacetAndSelectorsToString,
} from "../../tasks/deployUpgrade";

const aavegotchiDiamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
const diamondUpgrader = "0x35fe3df776474a7b24b3b1ec6e745a830fdad351";

export async function upgradeRolesRegistryBaazarDelist() {
  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "contracts/Aavegotchi/facets/ItemsRolesRegistryFacet.sol:ItemsRolesRegistryFacet",
      addSelectors: [
        "function _transferFrom(address _from, address _to, address _tokenAddress, uint256 _tokenId, uint256 _tokenAmount) internal",
      ],
      removeSelectors: [
        "function _transferFrom(address _from, address _to, address _tokenAddress, uint256 _tokenId, uint256 _tokenAmount) internal",
      ],
    },
    {
      facetName: "contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet",
      addSelectors: [],
      removeSelectors: [],
    }
  ];

  //@ts-ignore
  const joined = convertFacetAndSelectorsToString(facets);
  const args: DeployUpgradeTaskArgs = {
    diamondOwner: diamondUpgrader,
    diamondAddress: aavegotchiDiamondAddress,
    facetsAndAddSelectors: joined,
    useLedger: false,
    useMultisig: false,
    freshDeployment: false,
  };

  await run("deployUpgrade", args);
}
