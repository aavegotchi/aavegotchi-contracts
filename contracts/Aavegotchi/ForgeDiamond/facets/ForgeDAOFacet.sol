// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import "../libraries/LibAppStorage.sol";

contract ForgeDAOFacet is Modifiers {
    event SetAavegotchiDaoAddress(address newAddress);
    event SetGltrAddress(address newAddress);
    event SetAlloyDaoFee(uint256 bips);
    event SetAlloyBurnFee(uint256 bips);
    event SetForgeAlloyCost(RarityValueIO newCosts);
    event SetForgeEssenceCost(RarityValueIO newCosts);
    event SetForgeTimeCostInBlocks(RarityValueIO newCosts);
    event SetSkillPointsEarnedFromForge(RarityValueIO newPoints);
    event SetGeodeWinChance(RarityValueIO newChances);
    event SetGeodePrizes(uint256[] ids, uint256[] quantities);
    event SetSmeltingSkillPointReductionFactorBips(uint256 oldBips, uint256 newBips);
    event SetMaxSupplyPerToken(uint256[] tokenIds, uint256[] supplyPerTokenId);
    event SetAavegotchiDiamondAddress(address _address);

    event ContractPaused();
    event ContractUnpaused();

    //SETTERS

    function setAavegotchiDaoAddress(address daoAddress) external onlyDaoOrOwner {
        s.aavegotchiDAO = daoAddress;
        emit SetAavegotchiDaoAddress(daoAddress);
    }

    function setGltrAddress(address gltr) external onlyDaoOrOwner {
        s.gltr = gltr;
        emit SetGltrAddress(gltr);
    }

    function setAlloyDaoFeeInBips(uint256 alloyDaoFeeInBips) external onlyDaoOrOwner {
        s.alloyDaoFeeInBips = alloyDaoFeeInBips;
        emit SetAlloyDaoFee(alloyDaoFeeInBips);
    }

    function setAlloyBurnFeeInBips(uint256 alloyBurnFeeInBips) external onlyDaoOrOwner {
        s.alloyBurnFeeInBips = alloyBurnFeeInBips;
        emit SetAlloyBurnFee(alloyBurnFeeInBips);
    }

    function setAavegotchiDiamondAddress(address _address) external onlyDaoOrOwner {
        s.aavegotchiDiamond = _address;
    }

    // @notice Allow DAO to update forging Alloy cost
    // @param costs RarityValueIO struct of costs.
    // @dev We convert RarityValueIO keys into a mapping that is referencable by equivalent rarity score modifier,
    //      since this is what ForgeFacet functions have from itemTypes.
    function setForgeAlloyCost(RarityValueIO calldata costs) external onlyDaoOrOwner {
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
    function setForgeEssenceCost(RarityValueIO calldata costs) external onlyDaoOrOwner {
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
    function setForgeTimeCostInBlocks(RarityValueIO calldata costs) external onlyDaoOrOwner {
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
    function setSkillPointsEarnedFromForge(RarityValueIO calldata points) external onlyDaoOrOwner {
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
    //             For ex, if half of forging points is earned from smelting, bips = 5000.
    function setSmeltingSkillPointReductionFactorBips(uint256 bips) external onlyDaoOrOwner {
        uint256 oldBips = s.smeltingSkillPointReductionFactorBips;
        s.smeltingSkillPointReductionFactorBips = bips;

        emit SetSmeltingSkillPointReductionFactorBips(oldBips, s.smeltingSkillPointReductionFactorBips);
    }

    function pauseContract() external onlyDaoOrOwner {
        s.contractPaused = true;
        emit ContractPaused();
    }

    function unpauseContract() external onlyDaoOrOwner {
        s.contractPaused = false;
        emit ContractUnpaused();
    }

    //GETTERS

    function getAlloyDaoFeeInBips() external view returns (uint256) {
        return s.alloyDaoFeeInBips;
    }

    function getAlloyBurnFeeInBips() external view returns (uint256) {
        return s.alloyBurnFeeInBips;
    }

    // @notice Allow DAO to update percent chance to win from a Geode.
    // @param points RarityValueIO struct of points
    function setGeodeWinChanceBips(RarityValueIO calldata chances) external onlyDaoOrOwner {
        s.geodeWinChanceBips[COMMON_RSM] = chances.common;
        s.geodeWinChanceBips[UNCOMMON_RSM] = chances.uncommon;
        s.geodeWinChanceBips[RARE_RSM] = chances.rare;
        s.geodeWinChanceBips[LEGENDARY_RSM] = chances.legendary;
        s.geodeWinChanceBips[MYTHICAL_RSM] = chances.mythical;
        s.geodeWinChanceBips[GODLIKE_RSM] = chances.godlike;

        emit SetGeodeWinChance(chances);
    }

    // @notice Allow DAO to set which prizes can be won from a Geode.
    // @param ids Token IDs of the available prizes
    // @param quantities Initial amounts of each prize available
    function setGeodePrizes(uint256[] calldata ids, uint256[] calldata quantities) external onlyDaoOrOwner {
        require(ids.length == quantities.length, "ForgeDAOFacet: mismatched arrays");

        for (uint256 i; i < s.geodePrizeTokenIds.length; i++) {
            delete s.geodePrizeQuantities[s.geodePrizeTokenIds[i]];
        }
        delete s.geodePrizeTokenIds;
        for (uint256 i; i < ids.length; i++) {
            if (s.geodePrizeQuantities[ids[i]] == 0) {
                // this ID is deleted from the array in the geode opening function when last item is won.
                s.geodePrizeTokenIds.push(ids[i]);
            }
            s.geodePrizeQuantities[ids[i]] = quantities[i];
        }

        emit SetGeodePrizes(ids, quantities);
    }

    function getGeodePrizesRemaining() external view returns (uint256[] memory, uint256[] memory) {
        uint256[] memory quantities = new uint256[](s.geodePrizeTokenIds.length);
        for (uint256 i; i < s.geodePrizeTokenIds.length; i++) {
            quantities[i] = s.geodePrizeQuantities[s.geodePrizeTokenIds[i]];
        }
        return (s.geodePrizeTokenIds, quantities);
    }

    // @dev Max supply is not practical to keep track of for each forge token. The contract logic should take care of this.
    // @notice Allow DAO to set max supply per Forge asset token.
    //    function setMaxSupplyPerToken(uint256[] calldata tokenIDs, uint256[] calldata supplyAmts) external onlyDaoOrOwner {
    //        require(tokenIDs.length == supplyAmts.length, "ForgeDaoFacet: Mismatched arrays.");
    //
    //        for (uint256 i; i < tokenIDs.length; i++){
    //            s.maxSupplyByToken[tokenIDs[i]] = supplyAmts[i];
    //        }
    //        emit SetMaxSupplyPerToken(tokenIDs, supplyAmts);
    //    }
}
