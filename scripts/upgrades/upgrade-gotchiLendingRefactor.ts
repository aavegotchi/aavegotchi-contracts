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
        "function addGotchiListing((uint32 tokenId, uint96 initialCost, uint32 period, uint8[3] revenueSplit, address originalOwner, address thirdParty, uint32 whitelistId, address[] revenueTokens) memory p) external",
        "function extendGotchiLending(uint32 _tokenId, uint32 extension) external",
        "function claimAndEndAndRelistGotchiLending(uint32 _tokenId) external",
        "function batchAddGotchiListing((uint32 tokenId, uint96 initialCost, uint32 period, uint8[3] revenueSplit, address originalOwner, address thirdParty, uint32 whitelistId, address[] revenueTokens)[] memory listings) external",
        "function batchCancelGotchiLending(uint32[] calldata _listingIds) external",
        "function batchCancelGotchiLendingByToken(uint32[] calldata _erc721TokenIds) external",
        "function batchClaimGotchiLending(uint32[] calldata _tokenIds) external",
        "function batchClaimAndEndGotchiLending(uint32[] calldata _tokenIds) external",
        "function batchClaimAndEndAndRelistGotchiLending(uint32[] calldata _tokenIds) external",
        "function batchExtendGotchiLending((uint32 tokenId, uint32 extension)[] calldata _batchRenewParams) external",
      ],
      removeSelectors: [
        "function emergencyChangeRevenueTokens(uint32[] calldata _listingIds, address[] calldata _revenueTokens) external",
        "function allowRevenueTokens(address[] tokens) external",
        "function disallowRevenueTokens(address[] tokens) external",
        "function revenueTokenAllowed(address token) external view",
        "function getGotchiLendingListingInfo(uint32 _listingId) external view",
        "function getLendingListingInfo(uint32 _listingId) external view",
        "function getGotchiLendingFromToken(uint32 _erc721TokenId) external view",
        "function getGotchiLendingIdByToken(uint32 _erc721TokenId) external view",
        "function getOwnerGotchiLendings(address _lender,bytes32 _status,uint256 _length) external view",
        "function getGotchiLendings(bytes32 _status, uint256 _length) external view",
        "function isAavegotchiLent(uint32 _erc721TokenId) external view",
      ],
    },
    {
      facetName: "LendingGetterAndSetterFacet",
      addSelectors: [
        "function allowRevenueTokens(address[] tokens) external",
        "function disallowRevenueTokens(address[] tokens) external",
        "function setLendingOperator(address _lendingOperator,uint32 _tokenId,bool _isLendingOperator) external",
        "function batchSetLendingOperator(address _lendingOperator, (uint32 _tokenId, bool _isLendingOperator)[] calldata _inputs) external",
        "function getGotchiLendingListingInfo(uint32 _listingId) external view",
        "function getLendingListingInfo(uint32 _listingId) external view",
        "function getGotchiLendingFromToken(uint32 _erc721TokenId) external view",
        "function getGotchiLendingIdByToken(uint32 _erc721TokenId) external view",
        "function getOwnerGotchiLendings(address _lender,bytes32 _status,uint256 _length) external view",
        "function getOwnerGotchiLendingsLength(address _lender, bytes32 _status) external view",
        "function getGotchiLendings(bytes32 _status, uint256 _length) external view",
        "function isAavegotchiLent(uint32 _erc721TokenId) external view",
        "function revenueTokenAllowed(address token) external view",
        "function getTokenBalancesInEscrow(uint32 _tokenId, address[] calldata _revenueTokens) external view",
        "function isLendingOperator(address _lender, address _lendingOperator, uint32 _tokenId) external view",
        "function getGotchiLendingsLength() external view",
        "function isAavegotchiListed(uint32 _tokenId) external view",
        // "function isBorrowing(address _borrower) external view",
        // "function getBorrowerTokenId(address _borrower) external view",
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
