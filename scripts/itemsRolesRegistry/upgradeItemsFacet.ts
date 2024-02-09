import {
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
  convertFacetAndSelectorsToString,
} from "../../tasks/deployUpgrade";
import { run } from "hardhat";

const aavegotchiDiamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
const diamondUpgrader = "0x35fe3df776474a7b24b3b1ec6e745a830fdad351";

export async function upgradeItemsFacet() {
  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet",
      addSelectors: [
        "function equipDelegatedWearables(uint256 _tokenId,uint16[16] calldata _wearablesToEquip,uint256[16] calldata _commitmentIds) external",
      ],
      removeSelectors: [],
    },
    {
      facetName: "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
      addSelectors: [],
      removeSelectors: [],
    }, 
    {
      facetName: 'contracts/Aavegotchi/facets/ERC721MarketplaceFacet.sol:ERC721MarketplaceFacet',
      addSelectors: [],
      removeSelectors: [],
    }
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: aavegotchiDiamondAddress,
    facetsAndAddSelectors: joined,
    useLedger: false,
    useMultisig: false,
    freshDeployment: false,
  };

  await run("deployUpgrade", args);
}


async function main() {
  await upgradeItemsFacet()
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

exports.deployProject = main