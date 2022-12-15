pragma solidity 0.8.1;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import "../libraries/LibAppStorage.sol";

// TODO: add core, alloy, schematic minting funcs and setters for max supply.

contract ForgeDAOFacet is Modifiers, Ownable {

    event SetForgeAlloyCost(RarityValueIO newCosts);
    event SetForgeEssenceCost(RarityValueIO newCosts);
    event SetForgeTimeCostInBlocks(RarityValueIO newCosts);
    event SetSkillPointsEarnedFromForge(RarityValueIO newPoints);
    event SetSmeltingSkillPointReductionFactorBips(uint256 oldBips, uint256 newBips);

    event ChangedAlloyDaoFee(uint256 alloyDaoFeeInWei);
    event ChangedAlloyBurnFee(uint256 alloyBurnFeeInWei);


    function setAavegotchiDaoAddress (address daoAddress) external onlyOwner {
        s.AAVEGOTCHI_DAO = daoAddress;
    }
    function setGltrAddress (address gltr) external onlyOwner {
        s.GLTR = gltr;
    }
    function setForgeDiamondAddress (address diamond) external onlyOwner {
        s.FORGE_DIAMOND = diamond;
    }

    function getAlloyDaoFeeInBips() external view returns (uint256) {
        return s.alloyDaoFeeInBips;
    }
    function setAlloyDaoFeeInBips(uint256 alloyDaoFeeInBips) external onlyOwner {
        s.alloyDaoFeeInBips = alloyDaoFeeInBips;
    }
    function getAlloyBurnFeeInBips() external view returns (uint256) {
        return s.alloyBurnFeeInBips;
    }
    function setAlloyBurnFeeInBips(uint256 alloyBurnFeeInBips) external onlyOwner {
        s.alloyBurnFeeInBips = alloyBurnFeeInBips;
    }


    // @notice Allow DAO to update forging Alloy cost
    // @param costs RarityValueIO struct of costs.
    // @dev We convert RarityValueIO keys into a mapping that is referencable by equivalent rarity score modifier,
    //      since this is what ForgeFacet functions have from itemTypes.
    function setForgeAlloyCost (RarityValueIO calldata costs) external onlyOwner {
        s.forgeAlloyCost[COMMON_RSM] = costs.common;
        s.forgeAlloyCost[UNCOMMON_RSM] = costs.uncommon;
        s.forgeAlloyCost[RARE_RSM] = costs.rare;
        s.forgeAlloyCost[LEGENDARY_RSM] = costs.legendary;
        s.forgeAlloyCost[MYTHICAL_RSM] = costs.mythical;
        s.forgeAlloyCost[GODLIKE_RSM] = costs.godlike;

        emit SetForgeAlloyCost(costs);
    }

    // @notice Allow DAO to update forging Essence cost
    // @param costs RarityValueIO struct of costs
    // @dev We convert RarityValueIO keys into a mapping that is referencable by equivalent rarity score modifier,
    //      since this is what ForgeFacet functions have from itemTypes.
    function setForgeEssenceCost (RarityValueIO calldata costs) external onlyOwner {
        s.forgeEssenceCost[COMMON_RSM] = costs.common;
        s.forgeEssenceCost[UNCOMMON_RSM] = costs.uncommon;
        s.forgeEssenceCost[RARE_RSM] = costs.rare;
        s.forgeEssenceCost[LEGENDARY_RSM] = costs.legendary;
        s.forgeEssenceCost[MYTHICAL_RSM] = costs.mythical;
        s.forgeEssenceCost[GODLIKE_RSM] = costs.godlike;

        emit SetForgeEssenceCost(costs);
    }

    // @notice Allow DAO to update forging time cost (in blocks)
    // @param costs RarityValueIO struct of block amounts
    // @dev We convert RarityValueIO keys into a mapping that is referencable by equivalent rarity score modifier,
    //      since this is what ForgeFacet functions have from itemTypes.
    function setForgeTimeCostInBlocks (RarityValueIO calldata costs) external onlyOwner {
        s.forgeTimeCostInBlocks[COMMON_RSM] = costs.common;
        s.forgeTimeCostInBlocks[UNCOMMON_RSM] = costs.uncommon;
        s.forgeTimeCostInBlocks[RARE_RSM] = costs.rare;
        s.forgeTimeCostInBlocks[LEGENDARY_RSM] = costs.legendary;
        s.forgeTimeCostInBlocks[MYTHICAL_RSM] = costs.mythical;
        s.forgeTimeCostInBlocks[GODLIKE_RSM] = costs.godlike;

        emit SetForgeTimeCostInBlocks(costs);
    }

    // @notice Allow DAO to update skill points gained from forging
    // @param points RarityValueIO struct of points
    function setSkillPointsEarnedFromForge (RarityValueIO calldata points) external onlyOwner {
        s.skillPointsEarnedFromForge[COMMON_RSM] = points.common;
        s.skillPointsEarnedFromForge[UNCOMMON_RSM] = points.uncommon;
        s.skillPointsEarnedFromForge[RARE_RSM] = points.rare;
        s.skillPointsEarnedFromForge[LEGENDARY_RSM] = points.legendary;
        s.skillPointsEarnedFromForge[MYTHICAL_RSM] = points.mythical;
        s.skillPointsEarnedFromForge[GODLIKE_RSM] = points.godlike;

        emit SetSkillPointsEarnedFromForge(points);
    }

    // @notice Allow DAO to update skill points gained from smelting.
    // @param bips Factor to reduce skillPointsEarnedFromForge by, denoted in bips.
    //              For ex, if half of forging points is earned from smelting, bips = 5000.
    function setSmeltingSkillPointReductionFactorBips (uint256 bips) external onlyOwner {
        uint256 oldBips  = s.smeltingSkillPointReductionFactorBips;
        s.smeltingSkillPointReductionFactorBips = bips;

        emit SetSmeltingSkillPointReductionFactorBips(oldBips, s.smeltingSkillPointReductionFactorBips);
    }



}
