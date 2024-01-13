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
    {
      facetName:
        "contracts/Aavegotchi/libraries/LibAavegotchi.sol:LibAavegotchi",
      addSelectors: [],
      removeSelectors: [],
    },
    // redeploy all facets that use LibAavegotchi
    {
      facetName:
        "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    {
      facetName:
        "contracts/Aavegotchi/facets/BridgeFacet.sol:BridgeFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    {
      facetName:
        "contracts/Aavegotchi/facets/CollateralFacet.sol:CollateralFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    {
      facetName:
        "contracts/Aavegotchi/facets/ERC721BuyOrderFacet.sol:ERC721BuyOrderFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    {
      facetName:
        "contracts/Aavegotchi/facets/ERC721MarketplaceFacet.sol:ERC721MarketplaceFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    {
      facetName:
        "contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    {
      facetName:
        "contracts/Aavegotchi/facets/LendingGetterAndSetterFacet.sol:LendingGetterAndSetterFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    {
      facetName:
        "contracts/Aavegotchi/facets/MarketplaceGetterFacet.sol:MarketplaceGetterFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    {
      facetName:
        "contracts/Aavegotchi/facets/ShopFacet.sol:ShopFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    {
      facetName:
        "contracts/Aavegotchi/facets/SvgFacet.sol:SvgFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    {
      facetName:
        "contracts/Aavegotchi/facets/SvgViewsFacet.sol:SvgViewsFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    {
      facetName:
        "contracts/Aavegotchi/facets/VRFFacet.sol:VrfFacet",
      addSelectors: [],
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
