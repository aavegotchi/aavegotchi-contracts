import { run } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";

export async function upgradeRemoveMinStake() {
  const diamondOwner = "0xd38Df837a1EAd12ee16f8b8b7E5F58703f841668";
  const diamondAddress = "0x87C969d083189927049f8fF3747703FB9f7a8AEd";

  //first execute this on Sepolia

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "AavegotchiGameFacet",
      addSelectors: [
        "function claimAavegotchi(uint256 _tokenId, uint256 _option) external",
      ],
      removeSelectors: [
        "function claimAavegotchi(uint256 _tokenId, uint256 _option, uint256 _stakeAmount) external",
      ],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    diamondOwner: diamondOwner,
    diamondAddress: diamondAddress,
    facetsAndAddSelectors: joined,
    useLedger: false,
    useMultisig: false,
  };

  await run("deployUpgrade", args);
}

if (require.main === module) {
  upgradeRemoveMinStake()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
