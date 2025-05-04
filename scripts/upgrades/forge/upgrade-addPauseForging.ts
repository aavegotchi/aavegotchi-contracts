import { ethers, run } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";

import { maticDiamondUpgrader } from "../../helperFunctions";
import { ForgeDAOFacetInterface } from "../../../typechain/ForgeDAOFacet";
import { ForgeDAOFacet__factory } from "../../../typechain";

export async function addPauseForging() {
  const forgeDiamond = "0x4fDfc1B53Fd1D80d969C984ba7a8CE4c7bAaD442";

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "ForgeDAOFacet",
      addSelectors: [`function toggleForging(bool) external`],
      removeSelectors: [],
    },
    {
      facetName: "ForgeFacet",
      addSelectors: [],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  let iface: ForgeDAOFacetInterface = new ethers.utils.Interface(
    ForgeDAOFacet__factory.abi
  ) as ForgeDAOFacetInterface;

  const calldata = iface.encodeFunctionData("toggleForging", [true]);

  const args: DeployUpgradeTaskArgs = {
    diamondOwner: maticDiamondUpgrader,
    diamondAddress: forgeDiamond,
    facetsAndAddSelectors: joined,
    useLedger: true,
    useMultisig: false,
    freshDeployment: false,
    initAddress: forgeDiamond,
    initCalldata: calldata,
  };

  await run("deployUpgrade", args);
}

if (require.main === module) {
  addPauseForging()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
