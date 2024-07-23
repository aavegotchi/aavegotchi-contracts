import { ethers, run } from "hardhat";
import {
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
  convertFacetAndSelectorsToString,
} from "../../tasks/deployUpgrade";


const aavegotchiDiamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
const owner = "0x01F010a5e001fe9d6940758EA5e8c777885E351e";

export async function upgradeRolesRegistryBaazarDelist() {
  
  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "contracts/Aavegotchi/facets/ItemsRolesRegistryFacet.sol:ItemsRolesRegistryFacet",
      addSelectors: [],
      removeSelectors: [],
    }
  ];

  //@ts-ignore
  const joined = convertFacetAndSelectorsToString(facets);
  const args: DeployUpgradeTaskArgs = {
    diamondOwner: owner,
    diamondAddress: aavegotchiDiamondAddress,
    facetsAndAddSelectors: joined,
    useLedger: false,
    useMultisig: false,
    freshDeployment: false,
  };

  await run("deployUpgrade", args);
}
