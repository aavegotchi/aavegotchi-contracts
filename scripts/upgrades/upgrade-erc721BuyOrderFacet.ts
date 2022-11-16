import { ethers, run } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../tasks/deployUpgrade";
import { maticDiamondAddress } from "../helperFunctions";

export async function upgrade() {
  const diamondUpgrader = "0x35fe3df776474a7b24b3b1ec6e745a830fdad351";

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "ERC721BuyOrderFacet",
      addSelectors: [
        "function getERC721BuyOrder(uint256 _buyOrderId) external view",
        "function getERC721BuyOrderIdsByTokenId(address _erc721TokenAddress, uint256 _erc721TokenId) external view",
        "function getERC721BuyOrdersByTokenId(address _erc721TokenAddress, uint256 _erc721TokenId) external view",
        "function placeERC721BuyOrder(address _erc721TokenAddress, uint256 _erc721TokenId, uint256 _priceInWei, bool[] calldata _validationOptions) external",
        "function executeERC721BuyOrder(uint256 _buyOrderId) external",
        "function cancelERC721BuyOrder(uint256 _buyOrderId) external",
      ],
      removeSelectors: [],
    },
    {
      facetName: "ERC721MarketplaceFacet",
      addSelectors: [],
      removeSelectors: [
        "function getERC721Category(address _erc721TokenAddress, uint256 _erc721TokenId) public view",
        "function getAavegotchiListing(uint256 _listingId) external view",
        "function getERC721Listing(uint256 _listingId) external view",
        "function getERC721ListingFromToken(address _erc721TokenAddress, uint256 _erc721TokenId, address _owner) external view",
        "function getOwnerERC721Listings(address _owner, uint256 _category, string memory _sort, uint256 _length) external view",
        "function getOwnerAavegotchiListings(address _owner, uint256 _category, string memory _sort, uint256 _length) external view",
        "function getERC721Listings(uint256 _category, string memory _sort, uint256 _length) external view",
        "function getAavegotchiListings(uint256 _category, string memory _sort, uint256 _length) external view",
      ],
    },
    {
      facetName: "ERC721MarketplaceGetterFacet",
      addSelectors: [
        "function getAavegotchiListing(uint256 _listingId) external view",
        "function getERC721Listing(uint256 _listingId) external view",
        "function getERC721ListingFromToken(address _erc721TokenAddress, uint256 _erc721TokenId, address _owner) external view",
        "function getOwnerERC721Listings(address _owner, uint256 _category, string memory _sort, uint256 _length) external view",
        "function getOwnerAavegotchiListings(address _owner, uint256 _category, string memory _sort, uint256 _length) external view",
        "function getERC721Listings(uint256 _category, string memory _sort, uint256 _length) external view",
        "function getAavegotchiListings(uint256 _category, string memory _sort, uint256 _length) external view",
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
    useMultisig: true,
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
