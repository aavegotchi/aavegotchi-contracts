import { ethers, run } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../tasks/deployUpgrade";
import { AavegotchiGameFacet__factory } from "../../typechain";
import { maticDiamondAddress } from "../helperFunctions";

export async function upgrade() {
  const diamondUpgrader = "0x35fe3df776474a7b24b3b1ec6e745a830fdad351";

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "AavegotchiGameFacet",
      addSelectors: [
        "function setRealmAddress(address _realm) external",
        "function realmInteract(uint256 _tokenId) external",
      ],
      removeSelectors: [],
    },
  ];
  let iface = new ethers.utils.Interface(AavegotchiGameFacet__factory.abi);
  const joined = convertFacetAndSelectorsToString(facets);
  const payload = iface.encodeFunctionData("setRealmAddress", [
    "0x1d0360bac7299c86ec8e99d0c1c9a95fefaf2a11",
  ]);
  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: maticDiamondAddress,
    facetsAndAddSelectors: joined,
    useLedger: true,
    useMultisig: true,
    initAddress: maticDiamondAddress,
    initCalldata: payload,
  };

  console.log("Adding realmInteract function!");

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
