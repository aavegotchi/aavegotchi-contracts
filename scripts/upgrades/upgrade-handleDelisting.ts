import { ethers, run } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../tasks/deployUpgrade";
import { ForgeDAOFacet__factory } from "../../typechain";
import { ForgeDAOFacetInterface } from "../../typechain/ForgeDAOFacet";
import { maticDiamondAddress, maticForgeDiamond } from "../helperFunctions";

export async function upgrade() {
  const diamondUpgrader = "0x35fe3df776474a7b24b3b1ec6e745a830fdad351";

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "ForgeTokenFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    // {
    //   facetName: "ForgeDAOFacet",
    //   addSelectors: [
    //     "function setAavegotchiDiamondAddress(address _address) external",
    //   ],
    //   removeSelectors: [],
    // },
  ];

  const iface = new ethers.utils.Interface(
    ForgeDAOFacet__factory.abi
  ) as ForgeDAOFacetInterface;
  const payload = iface.encodeFunctionData("setAavegotchiDiamondAddress", [
    maticDiamondAddress,
  ]);

  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: maticForgeDiamond,
    facetsAndAddSelectors: joined,
    useLedger: false,
    useMultisig: false,
    initAddress: maticForgeDiamond,
    initCalldata: payload,
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
