import { ethers, run } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../tasks/deployUpgrade";
import { gasPrice, maticDiamondAddress } from "../helperFunctions";

export async function upgrade() {
  const diamondUpgrader = "0x35fe3df776474a7b24b3b1ec6e745a830fdad351";

  const InitBorrowLimit = await ethers.getContractFactory("InitBorrowLimit");
  const initBorrowLimit = await InitBorrowLimit.deploy({ gasPrice: gasPrice });
  await initBorrowLimit.deployed();
  const payload = initBorrowLimit.interface.encodeFunctionData("init");

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "GotchiLendingFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    {
      facetName: "LendingGetterAndSetterFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    {
      facetName: "WhitelistFacet",
      addSelectors: [],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: maticDiamondAddress,
    facetsAndAddSelectors: joined,
    useLedger: true,
    useMultisig: true,
    initAddress: initBorrowLimit.address,
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
