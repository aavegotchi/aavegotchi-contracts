import { run } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../tasks/deployUpgrade";
import { maticDiamondAddress, maticDiamondUpgrader } from "../helperFunctions";

export async function upgrade() {
  const EquipWearablesIO =
    "tuple(uint256 tokenId,uint16[16] wearablesToEquip,uint256[] wearableSetsToEquip)";
  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet",
      addSelectors: [
        `function equipWearables(${EquipWearablesIO} memory _equipWearables) external`,
      ],
      removeSelectors: [
        "function equipWearables(uint256 _tokenId, uint16[16] calldata _wearablesToEquip)",
      ],
    },
    {
      facetName: "WearableSetsFacet",
      addSelectors: [
        "function getTokenWearableSets(uint256 _tokenId) external view returns (uint256[] memory wearableSetIds_)",
        "function addWearableSets(uint256 _tokenId, uint256[] memory _wearableSetIds) public",
      ],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: maticDiamondUpgrader,
    diamondAddress: maticDiamondAddress,
    facetsAndAddSelectors: joined,
    useLedger: true,
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
