// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import "../../shared/interfaces/IERC20.sol";
import "./LibAppStorage.sol";

uint256 constant EQUIPPED_WEARABLE_SLOTS = 16;
uint256 constant NUMERIC_TRAITS_NUM = 6;

struct AavegotchiCollateralTypeIO {
    address collateralType;
    AavegotchiCollateralTypeInfo collateralTypeInfo;
}

struct AavegotchiInfo {
    uint256 tokenId;
    string name;
    address owner;
    uint256 randomNumber;
    uint256 status;
    int256[NUMERIC_TRAITS_NUM] numericTraits;
    int256[NUMERIC_TRAITS_NUM] modifiedNumericTraits;
    uint256[EQUIPPED_WEARABLE_SLOTS] equippedWearables;
    address collateral;
    address escrow;
    uint256 stakedAmount;
    uint256 minimumStake;
    //New
    uint256 kinship; //The kinship value of this Aavegotchi. Default is 50.
    uint256 lastInteracted;
    uint256 experience; //How much XP this Aavegotchi has accrued. Begins at 0.
    uint256 toNextLevel;
    uint256 usedSkillPoints; //number of skill points used
    uint256 level; //the current aavegotchi level
    uint256 hauntId;
    uint256 baseRarityScore;
    uint256 modifiedRarityScore;
    bool locked;
}

library LibAavegotchi {
    uint8 constant STATUS_CLOSED_PORTAL = 0;
    uint8 constant STATUS_VRF_PENDING = 1;
    uint8 constant STATUS_OPEN_PORTAL = 2;
    uint8 constant STATUS_AAVEGOTCHI = 3;

    event AavegotchiInteract(uint256 indexed _tokenId, uint256 kinship);

    function getAavegotchi(uint256 _tokenId) internal view returns (AavegotchiInfo memory aavegotchiInfo_) {
        AppStorage storage s = LibAppStorage.diamondStorage();
        aavegotchiInfo_.tokenId = _tokenId;
        aavegotchiInfo_.owner = s.aavegotchis[_tokenId].owner;
        aavegotchiInfo_.randomNumber = s.aavegotchis[_tokenId].randomNumber;
        aavegotchiInfo_.status = s.aavegotchis[_tokenId].status;
        aavegotchiInfo_.hauntId = s.aavegotchis[_tokenId].hauntId;
        if (aavegotchiInfo_.status == STATUS_AAVEGOTCHI) {
            aavegotchiInfo_.name = s.aavegotchis[_tokenId].name;
            uint256 l_equippedWearables = s.aavegotchis[_tokenId].equippedWearables;
            for (uint16 i; i < EQUIPPED_WEARABLE_SLOTS; i++) {
                aavegotchiInfo_.equippedWearables[i] = uint16(l_equippedWearables >> (i * 16));
            }
            aavegotchiInfo_.collateral = s.aavegotchis[_tokenId].collateralType;
            aavegotchiInfo_.escrow = s.aavegotchis[_tokenId].escrow;
            aavegotchiInfo_.stakedAmount = IERC20(aavegotchiInfo_.collateral).balanceOf(aavegotchiInfo_.escrow);
            aavegotchiInfo_.minimumStake = s.aavegotchis[_tokenId].minimumStake;
            aavegotchiInfo_.kinship = kinship(_tokenId);
            aavegotchiInfo_.lastInteracted = s.aavegotchis[_tokenId].lastInteracted;
            aavegotchiInfo_.experience = s.aavegotchis[_tokenId].experience;
            aavegotchiInfo_.toNextLevel = xpUntilNextLevel(s.aavegotchis[_tokenId].experience);
            aavegotchiInfo_.level = aavegotchiLevel(s.aavegotchis[_tokenId].experience);
            aavegotchiInfo_.usedSkillPoints = s.aavegotchis[_tokenId].usedSkillPoints;
            uint256 numericTraits = s.aavegotchis[_tokenId].numericTraits;
            for (uint256 i; i < NUMERIC_TRAITS_NUM; i++) {
                aavegotchiInfo_.numericTraits[i] = int16(int256(numericTraits >> (i * 16)));
            }
            aavegotchiInfo_.baseRarityScore = baseRarityScore(numericTraits);
            (aavegotchiInfo_.modifiedNumericTraits, aavegotchiInfo_.modifiedRarityScore) = modifiedTraitsAndRarityScore(_tokenId);
            aavegotchiInfo_.locked = s.aavegotchis[_tokenId].locked;
        }
    }

    //Only valid for claimed Aavegotchis
    function modifiedTraitsAndRarityScore(uint256 _tokenId)
        internal
        view
        returns (int256[NUMERIC_TRAITS_NUM] memory numericTraits_, uint256 rarityScore_)
    {
        AppStorage storage s = LibAppStorage.diamondStorage();
        require(s.aavegotchis[_tokenId].status == STATUS_AAVEGOTCHI, "AavegotchiFacet: Must be claimed");
        Aavegotchi storage aavegotchi = s.aavegotchis[_tokenId];
        uint256 equippedWearables = aavegotchi.equippedWearables;
        uint256 numericTraitsUint = getNumericTraits(_tokenId);
        uint256 wearableBonus;
        for (uint256 slot; slot < EQUIPPED_WEARABLE_SLOTS; slot++) {
            uint256 wearableId = uint16(equippedWearables >> (16 * slot));
            if (wearableId == 0) {
                continue;
            }
            ItemType storage itemType = s.itemTypes[wearableId];
            //Add on trait modifiers
            uint256 traitModifiers = itemType.traitModifiers;
            uint256 newNumericTraits;
            for (uint256 j; j < NUMERIC_TRAITS_NUM; j++) {
                int256 number = int16(int256(numericTraitsUint >> (j * 16)));
                int256 traitModifier = int8(int256(traitModifiers >> (j * 8)));
                number += traitModifier;
                // clear bits first then assign
                newNumericTraits |= (uint256(number) & 0xffff) << (j * 16);
            }

            numericTraitsUint = newNumericTraits;
            wearableBonus += itemType.rarityScoreModifier;
        }
        uint256 baseRarity = baseRarityScore(numericTraitsUint);
        rarityScore_ = baseRarity + wearableBonus;
        for (uint256 i; i < NUMERIC_TRAITS_NUM; i++) {
            int256 number = int16(int256(numericTraitsUint >> (i * 16)));
            numericTraits_[i] = number;
        }
    }

    function getNumericTraits(uint256 _tokenId) internal view returns (uint256 numericTraits_) {
        AppStorage storage s = LibAppStorage.diamondStorage();
        //Check if trait boosts from consumables are still valid
        int256 boostDecay = int256((block.timestamp - s.aavegotchis[_tokenId].lastTemporaryBoost) / 24 hours);
        uint256 temporaryTraitBoosts = s.aavegotchis[_tokenId].temporaryTraitBoosts;
        uint256 numericTraits = s.aavegotchis[_tokenId].numericTraits;
        for (uint256 i; i < NUMERIC_TRAITS_NUM; i++) {
            int256 number = int16(int256(numericTraits >> (i * 16)));
            int256 boost = int8(int256(temporaryTraitBoosts >> (i * 8)));

            if (boost > 0 && boost > boostDecay) {
                number += boost - boostDecay;
            } else if ((boost * -1) > boostDecay) {
                number += boost + boostDecay;
            }
            numericTraits_ |= uint256(number & 0xffff) << (i * 16);
        }
    }

    function kinship(uint256 _tokenId) internal view returns (uint256 score_) {
        AppStorage storage s = LibAppStorage.diamondStorage();
        Aavegotchi storage aavegotchi = s.aavegotchis[_tokenId];
        uint256 lastInteracted = aavegotchi.lastInteracted;
        uint256 interactionCount = aavegotchi.interactionCount;
        uint256 interval = block.timestamp - lastInteracted;

        uint256 daysSinceInteraction = interval / 24 hours;

        if (interactionCount > daysSinceInteraction) {
            score_ = interactionCount - daysSinceInteraction;
        }
    }

    function xpUntilNextLevel(uint32 _experience) internal pure returns (uint256 requiredXp_) {
        uint256 currentLevel = aavegotchiLevel(_experience);
        requiredXp_ = (((currentLevel)**2) * 50) - _experience;
    }

    function aavegotchiLevel(uint32 _experience) internal pure returns (uint256 level_) {
        if (_experience > 490050) {
            return 99;
        }

        level_ = (LibAppStorage.sqrt(2 * _experience) / 10);
        return level_ + 1;
    }

    function interact(uint256 _tokenId) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();
        uint256 lastInteracted = s.aavegotchis[_tokenId].lastInteracted;
        // if interacted less than 12 hours ago
        if (block.timestamp < lastInteracted + 12 hours) {
            return;
        }

        uint256 interactionCount = s.aavegotchis[_tokenId].interactionCount;
        uint256 interval = block.timestamp - lastInteracted;
        uint256 daysSinceInteraction = interval / 86400;
        uint256 l_kinship;
        if (interactionCount > daysSinceInteraction) {
            l_kinship = interactionCount - daysSinceInteraction;
        }

        uint256 hateBonus;

        if (l_kinship < 40) {
            hateBonus = 2;
        }
        l_kinship += 1 + hateBonus;
        s.aavegotchis[_tokenId].interactionCount = uint16(l_kinship);

        s.aavegotchis[_tokenId].lastInteracted = uint40(block.timestamp);
        emit AavegotchiInteract(_tokenId, l_kinship);
    }

    //Calculates the base rarity score, including collateral modifier
    function baseRarityScore(uint256 _numericTraits) internal pure returns (uint256 _rarityScore) {
        for (uint256 i; i < NUMERIC_TRAITS_NUM; i++) {
            int256 number = int16(int256(_numericTraits >> (i * 16)));
            if (number >= 50) {
                _rarityScore += uint256(number) + 1;
            } else {
                _rarityScore += uint256(int256(100) - number);
            }
        }
    }
}
