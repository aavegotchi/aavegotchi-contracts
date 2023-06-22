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
      facetName: "ERC1155BuyOrderFacet",
      addSelectors: [
        "function getERC1155BuyOrder(uint256 _buyOrderId) external view",
        "function getERC1155BuyOrderIdsByTokenId(address _erc1155TokenAddress, uint256 _erc1155TokenId) external view",
        "function getERC1155BuyOrdersByTokenId(address _erc1155TokenAddress, uint256 _erc1155TokenId) external view",
        "function placeERC1155BuyOrder(address _erc1155TokenAddress, uint256 _erc1155TokenId, uint256 _priceInWei, uint256 _quantity, uint256 _duration) external",
        "function executeERC1155BuyOrder(uint256 _buyOrderId, address _erc1155TokenAddress, uint256 _erc1155TokenId, uint256 _priceInWei, uint256 _quantity) external",
        "function cancelERC1155BuyOrder(uint256 _buyOrderId) external",
      ],
      removeSelectors: [],
    },
    {
      facetName: "ERC1155MarketplaceFacet",
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
