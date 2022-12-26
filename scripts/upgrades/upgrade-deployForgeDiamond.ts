import { run, ethers } from "hardhat";
import {
    convertFacetAndSelectorsToString,
    DeployUpgradeTaskArgs,
    FacetsAndAddSelectors,
} from "../../tasks/deployUpgrade";
import { ForgeDiamond__factory } from "../../typechain/factories/ForgeDiamond__factory";

import { gasPrice } from "../helperFunctions";

//these already deployed facets(in the aavegotchi diamond) are added to the forgeDiamond directly
const aavegotchiCutFacet = "0x4f908Fa47F10bc2254dae7c74d8B797C1749A8a6";
const aavegotchiLoupeFacet = "0x58f64b56B1e15D8C932c51287d814EDaa8d6feb9";
const aavegotchiOwnerShipFacet = "0xAE7DF9f59FEc446903c64f21a76d039Bc81712ef";

async function deployAndUpgradeForgeDiamond() {
    console.log("Deploying forge diamond");

    const Diamond = (await ethers.getContractFactory(
        "ForgeDiamond"
    )) as ForgeDiamond__factory;

    const signerAddress = await (await ethers.getSigners())[0].getAddress();

    const diamond = await Diamond.deploy(
        signerAddress,
        aavegotchiCutFacet,
        aavegotchiLoupeFacet,
        aavegotchiOwnerShipFacet,
        { gasPrice: gasPrice }
    );
    await diamond.deployed();
    console.log("Forge Diamond deployed to:", diamond.address);

    //upgrade with custom facets
    console.log("-------------------------");
    console.log("executing upgrade");

    const facets: FacetsAndAddSelectors[] = [
        {
            facetName: "ForgeFacet",
            addSelectors: [
                "function getAavegotchiSmithingLevel(uint256 gotchiId) public view returns (uint256)",
                "function getSmithingLevelMultiplierBips(uint256 gotchiId) public returns (uint256)",
                "function coreTokenIdFromRsm(uint8 rarityScoreModifier) public pure returns (uint256 tokenId)",
                "function smeltAlloyMintAmount (uint8 rarityScoreModifier) public view returns (uint256 alloy)",
                "function smeltWearables(uint256[] calldata _itemIds, uint256[] calldata _gotchiIds) external",
                "function claimForgeQueueItems(uint256[] calldata gotchiIds) external",
                "function getAavegotchiQueueItem(uint256 gotchiId) external view returns (tuple(uint256 itemId,uint256 gotchiId,bool claimed,uint40 readyBlock,uint256 id) memory)",
                // "function getForgeQueueOfOwner(address _owner) external returns (ForgeQueueItem[] memory output)",
                "function getForgeQueueOfOwner(address _owner) external view returns (tuple(uint256 itemId,uint256 gotchiId,bool claimed,uint40 readyBlock,uint256 id)[] memory output)",
                "function forgeWearables(uint256[] calldata _itemIds, uint256[] calldata _gotchiIds, uint40[] calldata _gltr) external",
                "function availableToForge(uint256 itemId) public view returns(bool available)",
                "function mintEssence(address owner, uint256 gotchiId) external",
                "function adminMint(address account, uint256 id, uint256 amount) external",
                "function pause() public",
                "function unpause() public",
                "function name() external pure returns (string memory)",
                "function symbol() external pure returns (string memory)",
                // "function supportsInterface(bytes4 interfaceId) public view returns (bool)",
                "function uri(uint256 tokenId) public view returns (string memory)",
                "function onERC1155Received(address,address,uint256,uint256,bytes memory) external returns (bytes4)",
                "function onERC1155BatchReceived(address,address,uint256[] memory,uint256[] memory,bytes memory) external returns (bytes4)"
            ],
            removeSelectors: [],
        },

        {
            facetName: "ForgeDAOFacet",
            addSelectors: [
                "function setAavegotchiDaoAddress(address daoAddress) external",
                "function setGltrAddress(address gltr) external",
                "function setForgeDiamondAddress(address diamond) external",
                "function getAlloyDaoFeeInBips() external view returns (uint256)",
                "function setAlloyDaoFeeInBips(uint256 alloyDaoFeeInBips) external",
                "function getAlloyBurnFeeInBips() external view returns (uint256)",
                "function setAlloyBurnFeeInBips(uint256 alloyBurnFeeInBips) external",
                "function setForgeAlloyCost (tuple(uint256 common,uint256 uncommon,uint256 rare,uint256 legendary,uint256 mythical,uint256 godlike) calldata costs) external",
                "function setForgeEssenceCost (tuple(uint256 common,uint256 uncommon,uint256 rare,uint256 legendary,uint256 mythical,uint256 godlike) calldata costs) external",
                "function setForgeTimeCostInBlocks (tuple(uint256 common,uint256 uncommon,uint256 rare,uint256 legendary,uint256 mythical,uint256 godlike) calldata costs) external",
                "function setSkillPointsEarnedFromForge (tuple(uint256 common,uint256 uncommon,uint256 rare,uint256 legendary,uint256 mythical,uint256 godlike) calldata points) external",
                "function setSmeltingSkillPointReductionFactorBips(uint256 bips) external",
                "function setMaxSupplyPerToken(uint256[] calldata tokenIDs, uint256[] calldata supplyAmts) external"
            ],
            removeSelectors: [],
        },
    ];

    const joined = convertFacetAndSelectorsToString(facets);

    const args: DeployUpgradeTaskArgs = {
        diamondUpgrader: signerAddress,
        diamondAddress: diamond.address,
        facetsAndAddSelectors: joined,
        useLedger: false,
        useMultisig: false,
        freshDeployment: true,
    };

    await run("deployUpgrade", args);
}

if (require.main === module) {
    deployAndUpgradeForgeDiamond()
        .then(() => process.exit(0))
        // .then(() => console.log('upgrade completed') /* process.exit(0) */)
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}
