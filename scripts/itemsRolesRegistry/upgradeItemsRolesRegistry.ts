import { ethers, run } from "hardhat";
import {
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
  convertFacetAndSelectorsToString,
} from "../../tasks/deployUpgrade";

const aavegotchiDiamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
const diamondUpgrader = "0x35fe3df776474a7b24b3b1ec6e745a830fdad351";

export async function upgradeItemsRolesRegistryFacet() {
  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "contracts/Aavegotchi/facets/ItemsRolesRegistryFacet.sol:ItemsRolesRegistryFacet",
      addSelectors: [
        "function UNIQUE_ROLE() external view returns (bytes32)",
        "function MAX_EXPIRATION_DATE() external view returns (uint256)",
      ],
      removeSelectors: [],
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
    diamondUpgrader: diamondUpgrader,
    diamondAddress: aavegotchiDiamondAddress,
    facetsAndAddSelectors: joined,
    useLedger: false,
    useMultisig: false,
    freshDeployment: false,
  };

  await run("deployUpgrade", args);
}