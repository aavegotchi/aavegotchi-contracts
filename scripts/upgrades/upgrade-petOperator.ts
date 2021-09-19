import { run, ethers } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../tasks/deployUpgrade";
import { getSelector, maticDiamondAddress } from "../helperFunctions";

async function upgrade() {
  const diamondUpgrader = "0x35fe3df776474a7b24b3b1ec6e745a830fdad351";
  const facets: FacetsAndAddSelectors[] = [
    {
      facetName:
        "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
      addSelectors: [
        getSelector(
          "function isPetOperatorForAll(address _owner, address _operator) external view returns (bool approved_)",
          ethers
        ),
        getSelector(
          "function setPetOperatorForAll(address _operator, bool _approved) external",
          ethers
        ),
      ],
    },
  ];
  const joined = convertFacetAndSelectorsToString(facets);

  const removeSelectors: string[] = [];

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: maticDiamondAddress,
    facetsAndAddSelectors: joined,
    removeSelectors: JSON.stringify(removeSelectors),
    useLedger: true,
    useMultisig: true,
  };

  await run("deployUpgrade", args);
}

upgrade()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

exports.upgrade = upgrade;
