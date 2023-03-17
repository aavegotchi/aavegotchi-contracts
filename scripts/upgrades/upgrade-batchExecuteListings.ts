import { ethers, run } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../tasks/deployUpgrade";
import { maticDiamondAddress } from "../helperFunctions";

export async function upgradeBatchExecuteListings() {
  const diamondUpgrader = "0x35fe3df776474a7b24b3b1ec6e745a830fdad351";
  const executeERC721ListingParamsTuple =
    "tuple(uint256 listingId, address contractAddress, uint256 priceInWei, uint256 tokenId, address recipient)";
  const executeERC1155ListingParamsTuple =
    "tuple(uint256 listingId, address contractAddress, uint256 itemId, uint256 quantity, uint256 priceInWei, address recipient)";

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "ERC721MarketplaceFacet",
      addSelectors: [
        `function batchExecuteERC721Listing(${executeERC721ListingParamsTuple}[] calldata listings) external`,
      ],
      removeSelectors: [],
    },
    {
      facetName: "ERC1155MarketplaceFacet",
      addSelectors: [
        `function batchExecuteERC1155Listing(${executeERC1155ListingParamsTuple}[] calldata listings) external`,
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
    useMultisig: false,
  };

  await run("deployUpgrade", args);
}

if (require.main === module) {
  upgradeBatchExecuteListings()
    .then(() => process.exit(0))
    // .then(() => console.log('upgrade completed') /* process.exit(0) */)
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
