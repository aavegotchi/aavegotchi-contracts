import { ethers, run } from "hardhat";
import {
    convertFacetAndSelectorsToString,
    DeployUpgradeTaskArgs,
    FacetsAndAddSelectors,
} from "../../tasks/deployUpgrade";

import { maticDiamondAddress, maticDiamondUpgrader } from "../helperFunctions";

export async function upgradeAavegotchiForForge() {
    console.log("Upgrading Aavegotchi facets for Forge.");

    const signerAddress = await (await ethers.getSigners())[0].getAddress();

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
            facetName:
                "contracts/Aavegotchi/facets/DAOFacet.sol:DAOFacet",
            addSelectors: [
                "function setForge(address _newForge) external",
            ],
            removeSelectors: [],
        },
        {
            facetName:
                "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
            addSelectors: [],
            removeSelectors: [],
        }
    ];

    const joined = convertFacetAndSelectorsToString(facets);

    const args: DeployUpgradeTaskArgs = {
        diamondUpgrader: signerAddress,
        diamondAddress: maticDiamondAddress,
        facetsAndAddSelectors: joined,
        useLedger: false,
        useMultisig: false,
        freshDeployment: false
    };

    await run("deployUpgrade", args);

    console.log("Finished upgrading Aavegotchi facets for Forge.");
}

if (require.main === module) {
    upgradeAavegotchiForForge()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}
