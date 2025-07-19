import { ethers, run } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../tasks/deployUpgrade";
import { maticDiamondAddress, maticDiamondUpgrader } from "../helperFunctions";
import { diamondUpgrader } from "../../test/ItemsRolesRegistryFacet/helpers";
import { DAOFacetInterface } from "../../typechain/DAOFacet";
import { DAOFacet__factory } from "../../typechain";

export async function upgrade() {
  const facets: FacetsAndAddSelectors[] = [
    {
      facetName:
        "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    {
      facetName: "AavegotchiGameFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    {
      facetName: "contracts/Aavegotchi/facets/BridgeFacet.sol:BridgeFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    {
      facetName: "CollateralFacet",
      addSelectors: [],
      removeSelectors: [],
    },

    {
      facetName: "DAOFacet",
      addSelectors: ["function toggleDiamondPaused() external"],
      removeSelectors: [],
    },
    {
      facetName: "ERC721BuyOrderFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    {
      facetName: "ERC721MarketplaceFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    {
      facetName: "ERC1155BuyOrderFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    {
      facetName: "ERC1155MarketplaceFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    {
      facetName: "contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet",
      addSelectors: [],
      removeSelectors: [
        "function useConsumables(uint256 _tokenId, uint256[] calldata _itemIds, uint256[] calldata _quantities) external",
      ],
    },
    {
      facetName: "ItemsExtensibleFacet",
      addSelectors: [
        "function useConsumables(uint256 _tokenId, uint256[] calldata _itemIds, uint256[] calldata _quantities) external",
      ],
      removeSelectors: [],
    },
    // {
    //   facetName:
    //     "EscrowFacet",
    //   addSelectors: [],
    //   removeSelectors: [],
    // },
    {
      facetName: "GotchiLendingFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    {
      facetName: "GotchiLendingFacet",
      addSelectors: [],
      removeSelectors: [],
    },

    {
      facetName: "ItemsRolesRegistryFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    {
      facetName: "ItemsTransferFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    {
      facetName: "LendingGetterAndSetterFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    {
      facetName: "MerkleDropFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    {
      facetName: "MetaTransactionsFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    {
      facetName: "ShopFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    {
      facetName: "VrfFacet",
      addSelectors: [],
      removeSelectors: [],
    },

    {
      facetName: "WearablesConfigFacet",
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

  //set the wearable diamond address
  let iface: DAOFacetInterface = new ethers.utils.Interface(
    DAOFacet__factory.abi
  ) as DAOFacetInterface;

  const calldata = iface.encodeFunctionData("toggleDiamondPaused", []);

  const args: DeployUpgradeTaskArgs = {
    diamondOwner: maticDiamondUpgrader,
    diamondAddress: maticDiamondAddress,
    facetsAndAddSelectors: joined,
    useLedger: true,
    useMultisig: false,
    initAddress: maticDiamondAddress,
    initCalldata: calldata,
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
