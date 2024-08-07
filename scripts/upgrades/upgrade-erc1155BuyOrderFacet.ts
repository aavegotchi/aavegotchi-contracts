import { ethers, run } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../tasks/deployUpgrade";
import { maticDiamondAddress, maticDiamondUpgrader } from "../helperFunctions";
import { AMOY_DIAMON_OWNER, AMOY_DIAMOND } from "../../helpers/constants";

export async function upgrade() {
  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "ERC1155BuyOrderFacet",
      addSelectors: [
        "function placeERC1155BuyOrder(address _erc1155TokenAddress, uint256 _erc1155TokenId, uint256 _priceInWei, uint256 _quantity, uint256 _duration) external",
        "function executeERC1155BuyOrder(uint256 _buyOrderId, address _erc1155TokenAddress, uint256 _erc1155TokenId, uint256 _priceInWei, uint256 _quantity) external",
        "function cancelERC1155BuyOrder(uint256 _buyOrderId) external",
      ],
      removeSelectors: [],
    },
    {
      facetName:
        "contracts/Aavegotchi/facets/ERC1155MarketplaceFacet.sol:ERC1155MarketplaceFacet",
      addSelectors: [],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    diamondOwner: AMOY_DIAMON_OWNER,
    diamondAddress: AMOY_DIAMOND,
    facetsAndAddSelectors: joined,
    useLedger: false,
    useMultisig: false,
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
