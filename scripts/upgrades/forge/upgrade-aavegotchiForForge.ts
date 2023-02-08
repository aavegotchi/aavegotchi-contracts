import { ethers, run } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";

import {
  maticDiamondAddress,
  maticDiamondUpgrader,
} from "../../helperFunctions";
import { DAOFacetInterface } from "../../../typechain/DAOFacet";
import { DAOFacet__factory } from "../../../typechain";

export async function upgradeAavegotchiForForge(forgeAddress: string) {
  console.log("Upgrading Aavegotchi facets for Forge.");

  const dimensionTuple = "tuple(uint8 x, uint8 y, uint8 width, uint8 height)";
  const itemTypeTuple = `tuple(string name, string description, string author, int8[6] traitModifiers, bool[16] slotPositions, uint8[] allowedCollaterals, ${dimensionTuple} dimensions, uint256 ghstPrice, uint256 maxQuantity, uint256 totalQuantity, uint32 svgId, uint8 rarityScoreModifier, bool canPurchaseWithGhst, uint16 minLevel, bool canBeTransferred, uint8 category, int16 kinshipBonus, uint32 experienceBonus)`;

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName:
        "contracts/Aavegotchi/facets/AavegotchiGameFacet.sol:AavegotchiGameFacet",
      addSelectors: [
        "function isAavegotchiLocked(uint256 _tokenId) external view returns (bool isLocked)",
      ],
      removeSelectors: [],
    },
    {
      facetName:
        "contracts/Aavegotchi/facets/CollateralFacet.sol:CollateralFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    {
      facetName: "contracts/Aavegotchi/facets/DAOFacet.sol:DAOFacet",
      addSelectors: [
        "function setForge(address _newForge) external",
        `function updateItemTypes(uint256[] memory _indices, ${itemTypeTuple}[] memory _itemTypes) external`,
      ],
      removeSelectors: [],
    },
    {
      facetName:
        "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    {
      facetName: "ERC1155MarketplaceFacet",
      addSelectors: [],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  let iface: DAOFacetInterface = new ethers.utils.Interface(
    DAOFacet__factory.abi
  ) as DAOFacetInterface;

  const calldata = iface.encodeFunctionData("setForge", [forgeAddress]);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: maticDiamondUpgrader,
    diamondAddress: maticDiamondAddress,
    facetsAndAddSelectors: joined,
    useLedger: true,
    useMultisig: false,
    freshDeployment: false,
    initAddress: maticDiamondAddress,
    initCalldata: calldata,
  };

  await run("deployUpgrade", args);

  console.log("Finished upgrading Aavegotchi facets for Forge.");
}

// if (require.main === module) {
//     upgradeAavegotchiForForge()
//         .then(() => process.exit(0))
//         .catch((error) => {
//             console.error(error);
//             process.exit(1);
//         });
// }
