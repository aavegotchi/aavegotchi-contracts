import { run } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../tasks/deployUpgrade";
import {
  maticDiamondAddress,
  maticDiamondUpgrader,
  maticForgeDiamond,
  maticWearableDiamondAddress,
} from "../helperFunctions";
import { wearable } from "../svgHelperFunctions";

export async function upgrade() {
  const EquipWearablesIO =
    "tuple(uint256 tokenId,uint16[16] wearablesToEquip,uint256[] wearableSetsToEquip)";
  const Dimensions = "tuple(uint8 x,uint8 y,uint8 width,uint8 height)";
  const ItemIdIO = "tuple(uint256 itemId,uint256 balance)";
  const ItemType = `tuple(string name, string description,string author,int8[6] traitModifiers,bool[16] slotPositions,uint8[] allowedCollaterals,${Dimensions} dimensions, uint256 ghstPrice,uint256 maxQuantity,uint256 totalQuantity,uint32 svgId,uint8 rarityScoreModifier,bool canPurchaseWithGhst,uint16 minLevel,bool canBeTransferred,uint8 category,int16 kinshipBonus,uint32 experienceBonus)`;
  const ItemTypeIO = `tuple(uint256 balance,uint256 itemId,${ItemType} itemType)`;

  //functions moved from ItemsFacet to ItemsGetterFacet
  const selectorsToMove = [
    `function itemBalances(address _account) external view returns (${ItemIdIO}[] memory bals_) `,
    `function itemBalancesWithTypes(address _owner) external view returns (${ItemIdIO}[] memory output_)`,
    `function balanceOf(address _owner, uint256 _id) external view returns (uint256 bal_)`,
    `function balanceOfToken(address _tokenContract, uint256 _tokenId, uint256 _id) external view returns (uint256 value) `,
    `function itemBalancesOfToken(address _tokenContract, uint256 _tokenId) external view returns (${ItemIdIO}[] memory bals_) `,
    `function itemBalancesOfTokenWithTypes(address _tokenContract,uint256 _tokenId) external view returns (${ItemTypeIO}[] memory itemBalancesOfTokenWithTypes_)`,
    `function balanceOfBatch(address[] calldata _owners, uint256[] calldata _ids) external view returns (uint256[] memory bals)`,
    `function equippedWearables(uint256 _tokenId) external view returns (uint16[16] memory wearableIds_)`,
    `function getItemType(uint256 _itemId) public view returns (${ItemType} memory itemType_)`,
    `function getItemTypes(uint256[] calldata _itemIds) external view returns (${ItemType}[] memory itemTypes_)`,
    ` function uri(uint256 _id) external view returns (string memory) `,
  ];

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet",
      addSelectors: [
        `function equipWearables(${EquipWearablesIO} memory _equipWearables) external`,
      ],
      removeSelectors: [
        "function equipWearables(uint256 _tokenId, uint16[16] calldata _wearablesToEquip)",
        //push all selectors to remove here
        ...selectorsToMove,
      ],
    },
    {
      facetName: "WearableSetsFacet",
      addSelectors: [
        "function getTokenWearableSets(uint256 _tokenId) external view returns (uint256[] memory wearableSetIds_)",
        "function addWearableSets(uint256 _tokenId, uint256[] memory _wearableSetIds) public",
      ],
      removeSelectors: [],
    },
    {
      facetName: "ItemsGetterFacet",
      addSelectors: [...selectorsToMove],
      removeSelectors: [],
    },
  ];

  const facets2: FacetsAndAddSelectors[] = [
    //ForgeFacet refresh
    {
      facetName: "ForgeFacet",
      addSelectors: [],
      removeSelectors: [],
    },
  ];

  const facets3: FacetsAndAddSelectors[] = [
    //wearablesFacet refresh
    {
      facetName: "WearablesFacet",
      addSelectors: [
        //verified onchain that this function was never added onchain during initial deployment
        "function tokenURI(uint256 _tokenId) external pure returns (string memory)",
      ],
      removeSelectors: [],
    },
  ];

  const joined1 = convertFacetAndSelectorsToString(facets);
  const joined2 = convertFacetAndSelectorsToString(facets2);
  const joined3 = convertFacetAndSelectorsToString(facets3);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: maticDiamondUpgrader,
    diamondAddress: maticDiamondAddress,
    facetsAndAddSelectors: joined1,
    useLedger: true,
    useMultisig: false,
  };

  const args2: DeployUpgradeTaskArgs = {
    diamondUpgrader: maticDiamondUpgrader,
    diamondAddress: maticForgeDiamond,
    facetsAndAddSelectors: joined2,
    useLedger: true,
    useMultisig: false,
  };

  const args3: DeployUpgradeTaskArgs = {
    diamondUpgrader: maticDiamondUpgrader,
    diamondAddress: maticWearableDiamondAddress,
    facetsAndAddSelectors: joined3,
    useLedger: true,
    useMultisig: false,
  };

  await run("deployUpgrade", args);
  await run("deployUpgrade", args2);
  await run("deployUpgrade", args3);
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
