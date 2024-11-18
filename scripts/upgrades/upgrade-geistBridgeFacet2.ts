import { ethers, run } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../tasks/deployUpgrade";
import { maticDiamondAddress, maticDiamondUpgrader } from "../helperFunctions";

export async function upgrade() {
  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "PolygonXGeistBridgeFacet",
      addSelectors: [
        "function getGotchiBridge() external view returns (address)",
        "function getItemBridge() external view returns (address)",
      ],
      removeSelectors: [],
    },
  ];

  const baseSepoliaDiamondAddress =
    "0x87C969d083189927049f8fF3747703FB9f7a8AEd";
  const diamondOwner = "0xd38Df837a1EAd12ee16f8b8b7E5F58703f841668";

  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    // diamondOwner: maticDiamondUpgrader,
    // diamondAddress: maticDiamondAddress,
    diamondOwner: diamondOwner,
    diamondAddress: baseSepoliaDiamondAddress,
    facetsAndAddSelectors: joined,
    useLedger: false,
    useMultisig: false,
    initAddress: ethers.constants.AddressZero,
    initCalldata: "0x",
  };

  await run("deployUpgrade", args);

  const gotchiBridge = await ethers.getContractAt(
    "PolygonXGeistBridgeFacet",
    baseSepoliaDiamondAddress
  );
  const itemBridge = await ethers.getContractAt(
    "PolygonXGeistBridgeFacet",
    baseSepoliaDiamondAddress
  );

  console.log("Gotchi Bridge:", await gotchiBridge.getGotchiBridge());
  console.log("Item Bridge:", await itemBridge.getItemBridge());
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
