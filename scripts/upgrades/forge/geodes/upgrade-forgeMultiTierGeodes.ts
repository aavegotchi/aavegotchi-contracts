import { ethers, run } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../../tasks/deployUpgrade";

import {
  maticForgeDiamond,
  mumbaiForgeDiamond,
} from "../../../helperFunctions";

const isMumbai = false;

export async function upgradeForgeMultiTierGeodes() {
  console.log("Upgrading Forge facets for Multi Tier Geodes.");

  const multiTierGeodeChanceIO =
    "tuple(tuple(uint256 common,uint256 uncommon,uint256 rare,uint256 legendary,uint256 mythical,uint256 godlike) common, tuple(uint256 common,uint256 uncommon,uint256 rare,uint256 legendary,uint256 mythical,uint256 godlike) uncommon, tuple(uint256 common,uint256 uncommon,uint256 rare,uint256 legendary,uint256 mythical,uint256 godlike) rare, tuple(uint256 common,uint256 uncommon,uint256 rare,uint256 legendary,uint256 mythical,uint256 godlike) legendary, tuple(uint256 common,uint256 uncommon,uint256 rare,uint256 legendary,uint256 mythical,uint256 godlike) mythical, tuple(uint256 common,uint256 uncommon,uint256 rare,uint256 legendary,uint256 mythical,uint256 godlike) godlike)"


  const facets: FacetsAndAddSelectors[] = [
    {
      facetName:
        "contracts/Aavegotchi/ForgeDiamond/facets/ForgeDAOFacet.sol:ForgeDAOFacet",
      addSelectors: [
        `function setGeodeMultiTierWinChanceBips(${multiTierGeodeChanceIO} calldata chances) external`,
        "function setMultiTierGeodePrizes(uint256[] calldata ids, uint256[] calldata quantities, uint8[] calldata rarities) external"
      ],
      removeSelectors: [
        // "function setGeodePrizes(uint256[] calldata ids, uint256[] calldata quantities) external"
      ],
    },
    {
      facetName:
        "contracts/Aavegotchi/ForgeDiamond/facets/ForgeVRFFacet.sol:ForgeVRFFacet",
      addSelectors: [
        "function numTotalPrizesLeftByRarity() public view",
        "function getAvailablePrizesForRarity(uint8 rsm) public view",
        "function getCurrentPrizeProbabilityForGeode(uint8 geodeRsm) public view",
        "function getWinRanges(uint256[6] memory winChanceByRarity) public view returns (uint256[] memory)"

      ],
      removeSelectors: [],
    },
    {
      facetName:
        "contracts/Aavegotchi/ForgeDiamond/facets/ForgeFacet.sol:ForgeFacet",
      addSelectors: [
        "function getRsmIndex(uint8 rsm) public pure"
      ],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  const signerAddress = await (await ethers.getSigners())[0].getAddress();

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: signerAddress,
    diamondAddress: isMumbai ? mumbaiForgeDiamond : maticForgeDiamond,
    facetsAndAddSelectors: joined,
    useLedger: false,
    useMultisig: false,
    freshDeployment: false,
  };

  await run("deployUpgrade", args);

  console.log("Finished upgrading Forge facets for Multi Tier Geodes.");
}

// if (require.main === module) {
//     upgradeAavegotchiForForge()
//         .then(() => process.exit(0))
//         .catch((error) => {
//             console.error(error);
//             process.exit(1);
//         });
// }
