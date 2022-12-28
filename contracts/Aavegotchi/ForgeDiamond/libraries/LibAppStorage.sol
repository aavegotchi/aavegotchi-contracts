pragma solidity 0.8.1;

import {ForgeLibDiamond} from "./ForgeLibDiamond.sol";
import {LibMeta} from "../../../shared/libraries/LibMeta.sol";

////////
//////// DO NOT CHANGE THIS OFFSET OR BELOW IDS
////////

// @dev this offset exists so that schematic IDs can exactly mirror Aavegotchi wearable IDs.
// All non-schematic items (cores, alloy, essence, etc) IDs start at this offset number.
uint256 constant WEARABLE_GAP_OFFSET = 1000000000;

// Forge asset token IDs
uint256 constant ALLOY = WEARABLE_GAP_OFFSET + 0;
uint256 constant ESSENCE = WEARABLE_GAP_OFFSET + 1;
uint256 constant CORE_COMMON = WEARABLE_GAP_OFFSET + 2;
uint256 constant CORE_UNCOMMON = WEARABLE_GAP_OFFSET + 3;
uint256 constant CORE_RARE = WEARABLE_GAP_OFFSET + 4;
uint256 constant CORE_LEGENDARY = WEARABLE_GAP_OFFSET + 5;
uint256 constant CORE_MYTHICAL = WEARABLE_GAP_OFFSET + 6;
uint256 constant CORE_GODLIKE = WEARABLE_GAP_OFFSET + 7;

//////////
//////////
//////////


// Rarity Score Modifiers
uint8 constant COMMON_RSM = 1;
uint8 constant UNCOMMON_RSM = 2;
uint8 constant RARE_RSM = 5;
uint8 constant LEGENDARY_RSM = 10;
uint8 constant MYTHICAL_RSM = 20;
uint8 constant GODLIKE_RSM = 50;

uint256 constant PET_SLOT_INDEX = 6;

struct ForgeQueueItem {
    // removed so that no filtering is ever done using this (else issue on gotchi transfer if it has a queue item.
    // Forge item can only be claimed using an owned gotchi.
//    address owner;
    uint256 itemId;
    uint256 gotchiId;
    bool claimed;
    uint40 readyBlock;
    uint256 id;
}

struct RarityValueIO {
    uint256 common;
    uint256 uncommon;
    uint256 rare;
    uint256 legendary;
    uint256 mythical;
    uint256 godlike;
}

struct GotchiForging {
    bool isForging;
    uint256 forgeQueueId;
}


struct AppStorage {
    address AAVEGOTCHI_DAO;
    address GLTR;
    address FORGE_DIAMOND;

    uint256 alloyDaoFeeInBips;
    uint256 alloyBurnFeeInBips;

    uint256 forgeQueueId;
    ForgeQueueItem[] forgeQueue;
    // Since a gotchi can only forge one item at a time, a mapping can be used for the "queue"
//    mapping(uint256 => ForgeQueueItem) forgeQueue;
    mapping(address => uint256[]) userForgeQueue;
    mapping(uint256 => GotchiForging) gotchiForging;

    // keep track of which items are in forging queue to avoid supply issues before items are claimed.
    mapping(uint256 => uint256) itemForging;

    // Map rarity score modifier (which denotes item rarity) to Alloy cost for forging.
    mapping(uint8 => uint256) forgeAlloyCost;
    // Map rarity score modifier (which denotes item rarity) to Essence cost for forging.
    mapping(uint8 => uint256) forgeEssenceCost;
    // Map rarity score modifier (which denotes item rarity) to time required (in blocks) to forge.
    mapping(uint8 => uint256) forgeTimeCostInBlocks;
    // Map rarity score modifier (which denotes item rarity) to number of skill points earned for successful forging.
    mapping(uint8 => uint256) skillPointsEarnedFromForge;
    // Reduction factor for skillPointsEarnedFromForge for smelting.
    uint256 smeltingSkillPointReductionFactorBips;

    //gotchi token ID to points map
    mapping(uint256 => uint256) gotchiSmithingSkillPoints;

    mapping(uint256 => uint256) maxSupplyByToken;


}

contract Modifiers {
    AppStorage internal s;

    modifier onlyDaoOrOwner() {
        address sender = LibMeta.msgSender();
        require(sender == s.AAVEGOTCHI_DAO || sender == ForgeLibDiamond.contractOwner(), "LibAppStorage: No access");
        _;
    }
}