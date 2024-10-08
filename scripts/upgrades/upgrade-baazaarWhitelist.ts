import { ethers, run } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../tasks/deployUpgrade";
import { maticDiamondAddress } from "../helperFunctions";

export async function upgradeBaazaarWhitelist() {
  const diamondUpgrader = "0x35fe3df776474a7b24b3b1ec6e745a830fdad351";

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "ERC721MarketplaceFacet",
      addSelectors: [
        `function addERC721ListingWithWhitelist(address _erc721TokenAddress, uint256 _erc721TokenId, uint256 _priceInWei, uint16[2] memory _principalSplit, address _affiliate, uint32 _whitelistId) external`,
      ],
      removeSelectors: [],
    },
    {
      facetName: "ERC1155MarketplaceFacet",
      addSelectors: [
        `function setERC1155ListingWithWhitelist(address _erc1155TokenAddress, uint256 _erc1155TypeId, uint256 _quantity,uint256 _priceInWei,uint16[2] memory _principalSplit,address _affiliate, uint32 _whitelistId) external`,
      ],
      removeSelectors: [],
    },
    {
      facetName: "MarketplaceGetterFacet",
      addSelectors: [],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    diamondOwner: diamondUpgrader,
    diamondAddress: maticDiamondAddress,
    facetsAndAddSelectors: joined,
    useLedger: true,
    useMultisig: false,
  };

  await run("deployUpgrade", args);
}

if (require.main === module) {
  upgradeBaazaarWhitelist()
    .then(() => process.exit(0))
    // .then(() => console.log('upgrade completed') /* process.exit(0) */)
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
