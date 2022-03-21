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
        "function getGotchiLendingListingInfo(uint256 _listingId) external view",
        "function getLendingListingInfo(uint256 _listingId) external view",
        "function getGotchiLendingFromToken(uint256 _erc721TokenId) external view",
        "function isAavegotchiLent(uint256 _erc721TokenId) external view",
        "function addGotchiLending(uint256 _erc721TokenId, uint256 _initialCost, uint256 _period, uint256[3] calldata _revenueSplit, address _originalOwner, address _thirdParty, uint256 _whitelistId, address[] calldata _includes) external",
        "function cancelGotchiLendingByToken(uint256 _erc721TokenId) external",
        "function cancelGotchiLending(uint256 _listingId) external",
        "function agreeGotchiLending(uint256 _listingId, uint256 _erc721TokenId, uint256 _initialCost, uint256 _period, uint256[3] calldata _revenueSplit) external",
        "function claimGotchiLending(uint256 _tokenId, address[] calldata _revenueTokens) external",
        "function claimAndEndGotchiLending(uint256 _tokenId, address[] calldata _revenueTokens) external",
        "function getOwnerGotchiLendings(address _owner, bytes32 _status, uint256 _length) external view",
        "function getGotchiLendings(bytes32 _status, uint256 _length) external view",
      ],
      removeSelectors: [],
    },
    {
      facetName: "WhitelistFacet",
      addSelectors: [
        "function createWhitelist(string calldata _name, address[] calldata _whitelistAddresses) external",
        "function updateWhitelist(uint256 _whitelistId, address[] calldata _whitelistAddresses) external",
        "function getWhitelist(uint256 _whitelistId) external view",
        "function getWhitelists() external view",
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
