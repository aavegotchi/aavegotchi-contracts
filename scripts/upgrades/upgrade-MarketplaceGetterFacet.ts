import { run } from "hardhat";
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
      facetName: "ERC721MarketplaceFacet",
      addSelectors: [],
      removeSelectors: [
        `function getAavegotchiListing(uint256 _listingId) external`,
        `function getERC721Listing(uint256 _listingId) external`,
        `function getERC721ListingFromToken(address _erc721TokenAddress, uint256 _erc721TokenId, address _owner) external`,
        `function getOwnerERC721Listings(address _owner, uint256 _category, string memory _sort, uint256 _length) external`,
        `function getOwnerAavegotchiListings(address _owner, uint256 _category, string memory _sort, uint256 _length) external`,
        `function getERC721Listings(uint256 _category, string memory _sort, uint256 _length) external`,
        `function getAavegotchiListings(uint256 _category, string memory _sort, uint256 _length) external`,
      ],
    },
    {
      facetName: "ERC1155MarketplaceFacet",
      addSelectors: [],
      removeSelectors: [
        `function getListingFeeInWei() external`,
        `function getERC1155Listing(uint256 _listingId) external`,
        `function getERC1155ListingFromToken(address _erc1155TokenAddress, uint256 _erc1155TypeId, address _owner) external`,
        `function getOwnerERC1155Listings(address _owner, uint256 _category, string memory _sort, uint256 _length) external`,
        `function getERC1155Listings(uint256 _category, string memory _sort, uint256 _length) external`,
      ],
    },
    {
      facetName: "MarketplaceGetterFacet",
      addSelectors: [
        `function getAavegotchiListing(uint256 _listingId) external`,
        `function getERC721Listing(uint256 _listingId) external`,
        `function getERC721ListingFromToken(address _erc721TokenAddress, uint256 _erc721TokenId, address _owner) external`,
        `function getOwnerERC721Listings(address _owner, uint256 _category, string memory _sort, uint256 _length) external`,
        `function getOwnerAavegotchiListings(address _owner, uint256 _category, string memory _sort, uint256 _length) external`,
        `function getERC721Listings(uint256 _category, string memory _sort, uint256 _length) external`,
        `function getAavegotchiListings(uint256 _category, string memory _sort, uint256 _length) external`,
        `function getListingFeeInWei() external`,
        `function getERC1155Listing(uint256 _listingId) external`,
        `function getERC1155ListingFromToken(address _erc1155TokenAddress, uint256 _erc1155TypeId, address _owner) external`,
        `function getOwnerERC1155Listings(address _owner, uint256 _category, string memory _sort, uint256 _length) external`,
        `function getERC1155Listings(uint256 _category, string memory _sort, uint256 _length) external`,
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
