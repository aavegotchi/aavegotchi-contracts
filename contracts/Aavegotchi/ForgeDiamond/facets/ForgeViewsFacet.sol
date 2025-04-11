// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import "../libraries/LibAppStorage.sol";

contract ForgeViewsFacet is Modifiers {
    //all ongoing forges must be settled manually since block numbers differ on both chains
    //we will not carry over ForgeQueueItems from the old chain since block numbers differ on both chains

    function getRarityScoreModifiers() private pure returns (uint8[6] memory) {
        return [uint8(COMMON_RSM), UNCOMMON_RSM, RARE_RSM, LEGENDARY_RSM, MYTHICAL_RSM, GODLIKE_RSM];
    }

    function getAllForgeAlloyCost() public view returns (uint8[6] memory rarityScoreModifiers, uint256[] memory alloyCosts) {
        rarityScoreModifiers = getRarityScoreModifiers();
        alloyCosts = new uint256[](6);

        //loop through all rarity score modifiers
        for (uint8 i; i < 6; i++) {
            alloyCosts[i] = s.forgeAlloyCost[rarityScoreModifiers[i]];
        }
    }

    function getAllForgeEssenceCost() public view returns (uint8[6] memory rarityScoreModifiers, uint256[] memory essenceCosts) {
        rarityScoreModifiers = getRarityScoreModifiers();
        essenceCosts = new uint256[](6);

        for (uint8 i; i < 6; i++) {
            essenceCosts[i] = s.forgeEssenceCost[rarityScoreModifiers[i]];
        }
    }

    function getAllForgeTimeCostInBlocks() public view returns (uint8[6] memory rarityScoreModifiers, uint256[] memory timeCosts) {
        rarityScoreModifiers = getRarityScoreModifiers();
        timeCosts = new uint256[](6);

        for (uint8 i; i < 6; i++) {
            timeCosts[i] = s.forgeTimeCostInBlocks[rarityScoreModifiers[i]];
        }
    }

    function getAllForgeSkillPointsEarnedFromForge() public view returns (uint8[6] memory rarityScoreModifiers, uint256[] memory skillPoints) {
        rarityScoreModifiers = getRarityScoreModifiers();
        skillPoints = new uint256[](6);

        for (uint8 i; i < 6; i++) {
            skillPoints[i] = s.skillPointsEarnedFromForge[rarityScoreModifiers[i]];
        }
    }

    function getSmeltingSkillPointReductionFactorBips() public view returns (uint256) {
        return s.smeltingSkillPointReductionFactorBips;
    }

    function batchGetGotchiSmithingSkillPoints(uint256[] memory gotchiIds) public view returns (uint256[] memory skillPoints) {
        skillPoints = new uint256[](gotchiIds.length);
        for (uint256 i; i < gotchiIds.length; i++) {
            skillPoints[i] = s.gotchiSmithingSkillPoints[gotchiIds[i]];
        }
    }

    function getAllGeodeWinChanceMultiTierBips()
        public
        view
        returns (uint8[] memory geodeRarities, uint8[] memory prizeRarities, uint256[] memory winChances)
    {
        uint8[6] memory rarityScoreModifiers = getRarityScoreModifiers();

        geodeRarities = new uint8[](36);
        prizeRarities = new uint8[](36);
        winChances = new uint256[](36);

        uint8 count = 0;
        // Iterate in the same order as setGeodeMultiTierWinChanceBips
        // First all prize rarities for geode rarity 0, then all prize rarities for geode rarity 1, etc.
        for (uint8 i = 0; i < 6; i++) {
            for (uint8 j = 0; j < 6; j++) {
                geodeRarities[count] = rarityScoreModifiers[i];
                prizeRarities[count] = rarityScoreModifiers[j];
                winChances[count] = s.geodeWinChanceMultiTierBips[rarityScoreModifiers[i]][rarityScoreModifiers[j]];
                count++;
            }
        }
    }

    function getAllGeodeRarities() public view returns (uint256[] memory geodeRarities) {
        // Fix the array size to match the number of elements
        uint256 geodePrizeTokenIdsLength = s.geodePrizeTokenIds.length;
        geodeRarities = new uint256[](geodePrizeTokenIdsLength);
        for (uint256 i; i < geodePrizeTokenIdsLength; i++) {
            geodeRarities[i] = s.geodePrizeRarities[s.geodePrizeTokenIds[i]];
        }
    }
}
