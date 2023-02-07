import { ethers, run } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../tasks/deployUpgrade";
import { maticDiamondAddress } from "../helperFunctions";

export async function upgradeEditItemTypes() {
  const diamondUpgrader = "0x35fe3df776474a7b24b3b1ec6e745a830fdad351";
  const dimensionTuple = "tuple(uint8 x, uint8 y, uint8 width, uint8 height)";
  const itemTypeTuple = `tuple(string name, string description, string author, int8[6] traitModifiers, bool[16] slotPositions, uint8[] allowedCollaterals, ${dimensionTuple} dimensions, uint256 ghstPrice, uint256 maxQuantity, uint256 totalQuantity, uint32 svgId, uint8 rarityScoreModifier, bool canPurchaseWithGhst, uint16 minLevel, bool canBeTransferred, uint8 category, int16 kinshipBonus, uint32 experienceBonus)`;

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "DAOFacet",
      addSelectors: [
        `function updateItemTypes(uint256[] memory _indices, ${itemTypeTuple}[] memory _itemTypes) external`,
      ],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: maticDiamondAddress,
    facetsAndAddSelectors: joined,
    useLedger: true,
    useMultisig: false,
  };

  await run("deployUpgrade", args);
}

if (require.main === module) {
  upgradeEditItemTypes()
    .then(() => process.exit(0))
    // .then(() => console.log('upgrade completed') /* process.exit(0) */)
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
