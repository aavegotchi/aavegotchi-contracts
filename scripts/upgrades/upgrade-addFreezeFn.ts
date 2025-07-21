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
    // {
    //   facetName: "AavegotchiGameFacet",
    //   addSelectors: [],
    //   removeSelectors: [],
    // },
    {
      facetName: "contracts/Aavegotchi/facets/BridgeFacet.sol:BridgeFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    // {
    //   facetName: "CollateralFacet",
    //   addSelectors: [],
    //   removeSelectors: [],
    // },

    // {
    //   facetName: "DAOFacet",
    //   addSelectors: ["function toggleDiamondPaused(bool _paused) external"],
    //   removeSelectors: [],
    // },
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
    // {
    //   facetName: "ERC1155BuyOrderFacet",
    //   addSelectors: [],
    //   removeSelectors: [],
    // },
    // {
    //   facetName: "ERC1155MarketplaceFacet",
    //   addSelectors: [],
    //   removeSelectors: [],
    // },
    // {
    //   facetName: "contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet",
    //   addSelectors: [],
    //   removeSelectors: [
    //     "function useConsumables(uint256 _tokenId, uint256[] calldata _itemIds, uint256[] calldata _quantities) external",
    //   ],
    // },
    // {
    //   facetName: "ItemsExtensibleFacet",
    //   addSelectors: [
    //     "function useConsumables(uint256 _tokenId, uint256[] calldata _itemIds, uint256[] calldata _quantities) external",
    //   ],
    //   removeSelectors: [],
    // },
    // {
    //   facetName: "EscrowFacet",
    //   addSelectors: [],
    //   removeSelectors: [],
    // },
    {
      facetName: "GotchiLendingFacet",
      addSelectors: [
        // "function batchForceEndGotchiLending(uint32[] calldata _listingIds) external",
      ],
      removeSelectors: [],
    },

    {
      facetName: "ItemsRolesRegistryFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    // {
    //   facetName: "ItemsTransferFacet",
    //   addSelectors: [],
    //   removeSelectors: [],
    // },
    {
      facetName: "LendingGetterAndSetterFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    // {
    //   facetName: "MerkleDropFacet",
    //   addSelectors: [],
    //   removeSelectors: [],
    // },
    // {
    //   facetName: "MetaTransactionsFacet",
    //   addSelectors: [],
    //   removeSelectors: [],
    // },
    // {
    //   facetName: "ShopFacet",
    //   addSelectors: [],
    //   removeSelectors: [],
    // },
    // {
    //   facetName: "VrfFacet",
    //   addSelectors: [],
    //   removeSelectors: [],
    // },

    // {
    //   facetName: "WearablesConfigFacet",
    //   addSelectors: [],
    //   removeSelectors: [],
    // },
    // {
    //   facetName: "WhitelistFacet",
    //   addSelectors: [],
    //   removeSelectors: [],
    // },

    // {
    //   facetName: "PolygonXGeistBridgeFacet",
    //   addSelectors: [],
    //   removeSelectors: [
    //     "function bridgeGotchi(address _receiver, uint256 _tokenId, uint256 _msgGasLimit, address _connector) external payable",
    //     "function getMinFees(address connector_, uint256 msgGasLimit_, uint256 payloadSize_) external view returns (uint256)",
    //     "function getGotchiBridge() external view returns (address)",
    //     "function getItemBridge() external view returns (address)",
    //     "function setMetadata(uint _tokenId, bytes memory _metadata) external",
    //     "function setBridges(address _gotchiBridge, address _itemBridge) external",
    //   ],
    // },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    diamondOwner: maticDiamondUpgrader,
    diamondAddress: maticDiamondAddress,
    facetsAndAddSelectors: joined,
    useLedger: true,
    useMultisig: false,
    initAddress: ethers.constants.AddressZero,
    initCalldata: "0x",
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
