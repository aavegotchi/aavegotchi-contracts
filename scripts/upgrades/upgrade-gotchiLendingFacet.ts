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
      facetName: "GotchiLendingFacet",
      addSelectors: [
        "function emergencyChangeRevenueTokens(uint32[] calldata _listingIds, address[] calldata _revenueTokens) external",
        "function allowRevenueTokens(address[] tokens) external",
        "function disallowRevenueTokens(address[] tokens) external",
        "function revenueTokenAllowed(address token) external view",
        "function getGotchiLendingListingInfo(uint32 _listingId) external view",
        "function getLendingListingInfo(uint32 _listingId) external view",
        "function getGotchiLendingFromToken(uint32 _erc721TokenId) external view",
        "function isAavegotchiLent(uint32 _erc721TokenId) external view",
        "function addGotchiLending(uint32 _erc721TokenId, uint96 _initialCost, uint32 _period, uint8[3] calldata _revenueSplit, address _originalOwner, address _thirdParty, uint32 _whitelistId, address[] calldata _revenueTokens) external",
        "function cancelGotchiLendingByToken(uint32 _erc721TokenId) external",
        "function cancelGotchiLending(uint32 _listingId) external",
        "function agreeGotchiLending(uint32 _listingId, uint32 _erc721TokenId, uint96 _initialCost, uint32 _period, uint8[3] calldata _revenueSplit) external",
        "function claimGotchiLending(uint32 _tokenId) external",
        "function claimAndEndGotchiLending(uint32 _tokenId) external",
        "function getOwnerGotchiLendings(address _owner, bytes32 _status, uint256 _length) external view",
        "function getGotchiLendings(bytes32 _status, uint256 _length) external view",
        "function getGotchiLendingIdByToken(uint32 _erc721TokenId) external view",
      ],
      removeSelectors: [],
    },
    {
      facetName: "WhitelistFacet",
      addSelectors: [
        "function createWhitelist(string calldata _name, address[] calldata _whitelistAddresses) external",
        "function updateWhitelist(uint32 _whitelistId, address[] calldata _whitelistAddresses) external",
        "function getWhitelist(uint32 _whitelistId) external view",
        "function getWhitelists() external view",
        "function isWhitelisted(uint32 _whitelistId, address _whitelistAddress) external view",
        "function getWhitelistsLength() external view",
        "function removeAddressesFromWhitelist(uint32 _whitelistId, address[] calldata _whitelistAddresses) external",
        "function transferOwnershipOfWhitelist(uint32 _whitelistId, address _whitelistOwner) external",
        "function whitelistOwner(uint32 _whitelistId) external view",
      ],
      removeSelectors: [],
    },
    {
      facetName: "ERC721MarketplaceFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    {
      facetName: "AavegotchiGameFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    {
      facetName:
        "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    {
      facetName: "contracts/Aavegotchi/facets/BridgeFacet.sol:BridgeFacet",
      addSelectors: [],
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
