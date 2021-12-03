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
      facetName: "ERC1155MarketplaceFacet",
      addSelectors: [
        `function setERC1155Royalty(tuple(uint256 erc1155TypeId, address royaltyRecipient, uint64 royaltyPercentage)[] _royaltiesArgs) external`,
        `function getRoyaltiesInfo(uint256 _erc1155TypeId, uint256 _priceInWei)
        external
        view
        returns (
            address royaltyRecipient,
            uint64 royaltyPercentage,
            uint256 payout
        )`,
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

  console.log("Running remove experience upgrade!");

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
