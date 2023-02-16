import { run, ethers, network } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";
import { ForgeDiamond__factory } from "../../../typechain/factories/ForgeDiamond__factory";

import { gasPrice, maticDiamondUpgrader } from "../../helperFunctions";

//these already deployed facets(in the aavegotchi diamond) are added to the forgeDiamond directly
const aavegotchiCutFacet = "0x4f908Fa47F10bc2254dae7c74d8B797C1749A8a6";
const aavegotchiLoupeFacet = "0x58f64b56B1e15D8C932c51287d814EDaa8d6feb9";
const aavegotchiOwnerShipFacet = "0xAE7DF9f59FEc446903c64f21a76d039Bc81712ef";

export async function deployAndUpgradeForgeDiamond() {
  const forgeDiamond = "0x4fDfc1B53Fd1D80d969C984ba7a8CE4c7bAaD442";

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "ForgeFacet",
      addSelectors: [
        `function adminMintBatch(address to, uint256[] memory ids, uint256[] memory amounts) external`,
      ],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: maticDiamondUpgrader,
    diamondAddress: forgeDiamond,
    facetsAndAddSelectors: joined,
    useLedger: false,
    useMultisig: false,
    freshDeployment: true,
  };

  await run("deployUpgrade", args);
}

if (require.main === module) {
  deployAndUpgradeForgeDiamond()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
