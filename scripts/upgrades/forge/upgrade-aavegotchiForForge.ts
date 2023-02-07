import { ethers, run } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";

import {
  maticDiamondAddress,
  maticDiamondUpgrader,
} from "../../helperFunctions";
import { DAOFacetInterface } from "../../../typechain/DAOFacet";
import { DAOFacet__factory } from "../../../typechain";

export async function upgradeAavegotchiForForge(forgeAddress: string) {
  console.log("Upgrading Aavegotchi facets for Forge.");

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName:
        "contracts/Aavegotchi/facets/AavegotchiGameFacet.sol:AavegotchiGameFacet",
      addSelectors: [
        "function isAavegotchiLocked(uint256 _tokenId) external view returns (bool isLocked)",
      ],
      removeSelectors: [],
    },
    {
      facetName:
        "contracts/Aavegotchi/facets/CollateralFacet.sol:CollateralFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    {
      facetName: "contracts/Aavegotchi/facets/DAOFacet.sol:DAOFacet",
      addSelectors: ["function setForge(address _newForge) external"],
      removeSelectors: [],
    },
    {
      facetName:
        "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    {
      facetName: "ERC1155MarketplaceFacet",
      addSelectors: [],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  let iface: DAOFacetInterface = new ethers.utils.Interface(
    DAOFacet__factory.abi
  ) as DAOFacetInterface;

  const calldata = iface.encodeFunctionData("setForge", [forgeAddress]);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: maticDiamondUpgrader,
    diamondAddress: maticDiamondAddress,
    facetsAndAddSelectors: joined,
    useLedger: true,
    useMultisig: false,
    freshDeployment: false,
    initAddress: maticDiamondAddress,
    initCalldata: calldata,
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
