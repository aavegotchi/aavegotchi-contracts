import { ethers, run } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../tasks/deployUpgrade";
import { maticDiamondAddress } from "../helperFunctions";
import { GotchiLendingFacet__factory } from "../../typechain";
import { GotchiLendingFacetInterface } from "../../typechain/GotchiLendingFacet";

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
      ],
      removeSelectors: [],
    },
    {
      facetName: "WhitelistFacet",
      addSelectors: [
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
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  const iface = new ethers.utils.Interface(
    GotchiLendingFacet__factory.abi
  ) as GotchiLendingFacetInterface;
  const payload = iface.encodeFunctionData("allowRevenueTokens", [
    [
      "0x403E967b044d4Be25170310157cB1A4Bf10bdD0f", // FUD
      "0x44A6e0BE76e1D9620A7F76588e4509fE4fa8E8C8", // FOMO
      "0x6a3E7C3c6EF65Ee26975b12293cA1AAD7e1dAeD2", // ALPHA
      "0x42E5E06EF5b90Fe15F853F59299Fc96259209c5C", // KEK
      "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7", // GHST
      "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270", // WMATIC
    ],
  ]);
  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: maticDiamondAddress,
    facetsAndAddSelectors: joined,
    useLedger: true,
    useMultisig: true,
    initAddress: maticDiamondAddress,
    initCalldata: payload,
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
