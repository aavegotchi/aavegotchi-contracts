import { ethers, run } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";

import { upgrade as upgradeForgeDiamond } from "../forge/upgrade-addFreezeFn";

import { maticForgeDiamond, diamondOwner } from "../../helperFunctions";

export async function addGetterFacet() {
  //add freeze fns
  //await upgradeForgeDiamond();

  console.log("Adding getter facet");

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName:
        "contracts/Aavegotchi/ForgeDiamond/facets/ForgeViewsFacet.sol:ForgeViewsFacet",
      addSelectors: [
        "function getAllForgeAlloyCost() public view returns (uint8[] memory rarityScoreModifiers, uint256[] memory alloyCosts)",
        "function getAllForgeEssenceCost() public view returns (uint8[] memory rarityScoreModifiers, uint256[] memory essenceCosts)",
        "function getAllForgeTimeCostInBlocks() public view returns (uint8[] memory rarityScoreModifiers, uint256[] memory timeCosts)",
        "function getAllForgeSkillPointsEarnedFromForge() public view returns (uint8[] memory rarityScoreModifiers, uint256[] memory skillPoints)",
        "function getSmeltingSkillPointReductionFactorBips() public view returns (uint256)",
        "function batchGetGotchiSmithingSkillPoints(uint256[] memory gotchiIds) public view returns (uint256[] memory skillPoints)",
        "function getAllGeodeWinChanceMultiTierBips() public view returns (uint8[] memory geodeRarities, uint8[] memory prizeRarities, uint256[] memory winChances)",
        "function getAllGeodeRarities() public view returns (uint256[] memory geodeRarities)",
      ],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  const owner = await diamondOwner(maticForgeDiamond, ethers);

  const args: DeployUpgradeTaskArgs = {
    diamondAddress: maticForgeDiamond,
    facetsAndAddSelectors: joined,
    useLedger: true,
    useMultisig: false,
    freshDeployment: false,
    diamondOwner: owner,
    initAddress: ethers.constants.AddressZero,
    initCalldata: "",
  };

  await run("deployUpgrade", args);

  console.log("Finished adding getter facet.");
}
if (require.main === module) {
  addGetterFacet()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
