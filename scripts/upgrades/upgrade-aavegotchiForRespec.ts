import { ethers, run } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../tasks/deployUpgrade";

import {
  maticDiamondAddress,
  maticDiamondUpgrader,
  maticForgeDiamond,
} from "../helperFunctions";

export async function upgradeAavegotchiForRepec() {
  console.log("Upgrading Aavegotchi facets for Respec potion.");

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName:
        "contracts/Aavegotchi/facets/DAOFacet.sol:DAOFacet",
      addSelectors: [
        "function setDaoDirectorTreasury(address treasuryAddr) external",
        "function getDaoDirectorTreasury() public view returns (address)"
      ],
      removeSelectors: [],
    },
    {
      facetName:
        "contracts/Aavegotchi/facets/AavegotchiGameFacet.sol:AavegotchiGameFacet",
      addSelectors: [
        "function resetSkillPoints(uint32 _tokenId) public",
        "function getGotchiBaseNumericTraits(uint32 _tokenId) public view returns (int16[6] memory numericTraits_)"
      ],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  const signerAddress = await (await ethers.getSigners())[0].getAddress();

  const args: DeployUpgradeTaskArgs = {
    // diamondUpgrader: maticDiamondUpgrader,
    diamondUpgrader: signerAddress,
    diamondAddress: maticDiamondAddress,
    facetsAndAddSelectors: joined,
    useLedger: true,
    useMultisig: false,
    freshDeployment: false,
    // initAddress: maticDiamondAddress,
    // initCalldata: calldata,
  };

  await run("deployUpgrade", args);

  console.log("Finished upgrading Aavegotchi facets for Forge.");
}

// if (require.main === module) {
//     upgradeAavegotchiForForge()
//         .then(() => process.exit(0))
//         .catch((error) => {
//             console.error(error);
//             process.exit(1);
//         });
// }
