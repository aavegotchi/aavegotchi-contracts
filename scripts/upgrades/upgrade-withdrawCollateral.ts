import { ethers, run } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../tasks/deployUpgrade";
import { maticDiamondAddress, maticDiamondUpgrader } from "../helperFunctions";

export async function upgradeWithdrawCollateral() {
  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "PolygonXGeistBridgeFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    {
      facetName: "CollateralFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    {
      facetName: "EscrowFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    {
      facetName: "PolygonXGeistBridgeFacet",
      addSelectors: [],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  // let iface = new ethers.utils.Interface(PolygonXGeistBridgeFacet__factory.abi);
  // const payload = iface.encodeFunctionData("setBridges", [
  //   bridgeConfig[137].GOTCHI.Vault,
  //   bridgeConfig[137].GOTCHI_ITEM.Vault,
  // ]);

  const args: DeployUpgradeTaskArgs = {
    diamondOwner: maticDiamondUpgrader,
    diamondAddress: maticDiamondAddress,
    // diamondOwner: '0xd38Df837a1EAd12ee16f8b8b7E5F58703f841668',
    // diamondAddress: '0x87C969d083189927049f8fF3747703FB9f7a8AEd', // base-sepolia
    facetsAndAddSelectors: joined,
    useLedger: true,
    useMultisig: false,
    initAddress: ethers.constants.AddressZero,
    initCalldata: "0x",
  };

  await run("deployUpgrade", args);
}

if (require.main === module) {
  upgradeWithdrawCollateral()
    .then(() => process.exit(0))
    // .then(() => console.log('upgrade completed') /* process.exit(0) */)
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
