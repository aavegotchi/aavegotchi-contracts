import { ethers, run } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../tasks/deployUpgrade";
import { aavegotchiDiamondAddressMatic } from "../../helpers/constants";

export async function upgrade() {
  const diamondUpgrader = "0x35fe3df776474a7b24b3b1ec6e745a830fdad351";

  const addGotchiListing =
    "(uint32 tokenId,uint96 initialCost,uint32 period,uint8[3] revenueSplit,address originalOwner,address thirdParty,uint32 whitelistId,address[] revenueTokens, uint256 permissions)";
  const addGotchiListingOld =
    "(uint32 tokenId,uint96 initialCost,uint32 period,uint8[3] revenueSplit,address originalOwner,address thirdParty,uint32 whitelistId,address[] revenueTokens)";
  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "GotchiLendingFacet",
      addSelectors: [
        `function addGotchiListing(${addGotchiListing} memory p) external`,
        `function addGotchiLending(uint32 _erc721TokenId,uint96 _initialCost,uint32 _period,uint8[3] calldata _revenueSplit,address _originalOwner,address _thirdParty,uint32 _whitelistId,address[] calldata _revenueTokens, uint256 permissions) external`,
        `function batchAddGotchiListing(${addGotchiListing}[] memory listings) external`,
      ],
      removeSelectors: [
        `function addGotchiListing(${addGotchiListingOld} memory p) external`,
        `function addGotchiLending(uint32 _erc721TokenId,uint96 _initialCost,uint32 _period,uint8[3] calldata _revenueSplit,address _originalOwner,address _thirdParty,uint32 _whitelistId,address[] calldata _revenueTokens) external`,
        `function batchAddGotchiListing(${addGotchiListingOld}[] memory listings) external`,
      ],
    },
    {
      facetName: "AavegotchiGameFacet",
      addSelectors: [
        "function reduceKinshipViaChanneling(uint32 _gotchiId) external",
      ],
      removeSelectors: ["function realmInteract(uint256 _tokenId) external "],
    },
    {
      facetName: "LendingGetterAndSetterFacet",
      addSelectors: [
        `function getLendingPermissionBitmap(uint32 _listingId) external view returns (uint256)`,
        `function getAllLendingPermissions(uint32 _listingId) external view returns (uint8[32] memory permissions_)`,
        `function getLendingPermissionModifier(uint32 _listingId, uint8 _permissionIndex) public view returns (uint8)`,
        `function lendingPermissionSetToNone(uint32 _listingId) public view returns (bool) `,
      ],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);
  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: aavegotchiDiamondAddressMatic,
    facetsAndAddSelectors: joined,
    useLedger: false,
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
