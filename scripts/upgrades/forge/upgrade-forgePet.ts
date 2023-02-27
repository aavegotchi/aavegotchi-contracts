import { run, ethers, network } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";

import { maticDiamondUpgrader, maticForgeDiamond } from "../../helperFunctions";
import { ForgeFacet__factory } from "../../../typechain";
import { ForgeFacetInterface } from "../../../typechain/ForgeFacet";

export async function upgradeForgeDiamondForPet() {
  console.log("Deploying forge pet fix");

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "ForgeFacet",
      addSelectors: [
        "function fixInvalidTokenIds(address[] calldata owners) external",
      ],
      removeSelectors: [],
    },
  ];

  const user1 = "0x478fa4C971a077038B4Fc5C172c3Af5552224ccc";
  // const user2 = "0x7D9fb540504D8F277099472b89113485F712c546";
  const user3 = "0x221fb400C8E70472F95ad3dF5456A57a21b54Bf3";
  const user4 = "0x4177a5c0E2369F6830A4c3825aFc8fB3Dd47790D";
  // const user5 = "0x7D9fb540504D8F277099472b89113485F712c546"; //duplicate

  const users = [user1, user3, user4];

  const iface = new ethers.utils.Interface(
    ForgeFacet__factory.abi
  ) as ForgeFacetInterface;
  const payload = iface.encodeFunctionData("fixInvalidTokenIds", [users]);

  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: maticDiamondUpgrader,
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
  upgradeForgeDiamondForPet()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
