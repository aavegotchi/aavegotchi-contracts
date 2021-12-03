import { ethers, run } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../tasks/deployUpgrade";
import {
  ERC721MarketplaceFacet,
  ERC721MarketplaceFacet__factory,
} from "../../typechain";
import { ERC721MarketplaceFacetInterface } from "../../typechain/ERC721MarketplaceFacet";
import {
  maticDiamondAddress,
  maticRealmDiamondAddress,
} from "../helperFunctions";

export async function upgrade() {
  const diamondUpgrader = "0x35fe3df776474a7b24b3b1ec6e745a830fdad351";

  const category = "(address erc721TokenAddress, uint256 category)";

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "ERC721MarketplaceFacet",
      addSelectors: [
        `function setERC721Categories(${category}[] calldata _categories) external`,
      ],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  let iface: ERC721MarketplaceFacetInterface = new ethers.utils.Interface(
    ERC721MarketplaceFacet__factory.abi
  ) as ERC721MarketplaceFacetInterface;

  const categories = [
    {
      erc721TokenAddress: maticRealmDiamondAddress,
      category: 4,
    },
  ];

  const calldata = iface.encodeFunctionData("setERC721Categories", [
    categories,
  ]);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: maticDiamondAddress,
    facetsAndAddSelectors: joined,
    useLedger: true,
    useMultisig: true,
    initAddress: maticDiamondAddress,
    initCalldata: calldata,
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
