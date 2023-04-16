pragma solidity 0.8.1;

import {ForgeLibDiamond} from "./ForgeLibDiamond.sol";
import {LibMeta} from "../../../shared/libraries/LibMeta.sol";
import {ILink} from "../../interfaces/ILink.sol";

////////
//////// DO NOT CHANGE THIS OFFSET OR BELOW IDS
////////

// @dev this offset exists so that schematic IDs can exactly mirror Aavegotchi wearable IDs.
// All non-schematic items (cores, alloy, essence, etc) IDs start at this offset number.
uint256 constant WEARABLE_GAP_OFFSET = 1_000_000_000;

// Forge asset token IDs
uint256 constant ALLOY = WEARABLE_GAP_OFFSET + 0;
uint256 constant ESSENCE = WEARABLE_GAP_OFFSET + 1;

uint256 constant GEODE_COMMON = WEARABLE_GAP_OFFSET + 2;
uint256 constant GEODE_UNCOMMON = WEARABLE_GAP_OFFSET + 3;
uint256 constant GEODE_RARE = WEARABLE_GAP_OFFSET + 4;
uint256 constant GEODE_LEGENDARY = WEARABLE_GAP_OFFSET + 5;
uint256 constant GEODE_MYTHICAL = WEARABLE_GAP_OFFSET + 6;
uint256 constant GEODE_GODLIKE = WEARABLE_GAP_OFFSET + 7;

uint256 constant CORE_BODY_COMMON = WEARABLE_GAP_OFFSET + 8;
uint256 constant CORE_BODY_UNCOMMON = WEARABLE_GAP_OFFSET + 9;
uint256 constant CORE_BODY_RARE = WEARABLE_GAP_OFFSET + 10;
uint256 constant CORE_BODY_LEGENDARY = WEARABLE_GAP_OFFSET + 11;
uint256 constant CORE_BODY_MYTHICAL = WEARABLE_GAP_OFFSET + 12;
uint256 constant CORE_BODY_GODLIKE = WEARABLE_GAP_OFFSET + 13;

uint256 constant CORE_FACE_COMMON = WEARABLE_GAP_OFFSET + 14;
uint256 constant CORE_FACE_UNCOMMON = WEARABLE_GAP_OFFSET + 15;
uint256 constant CORE_FACE_RARE = WEARABLE_GAP_OFFSET + 16;
uint256 constant CORE_FACE_LEGENDARY = WEARABLE_GAP_OFFSET + 17;
uint256 constant CORE_FACE_MYTHICAL = WEARABLE_GAP_OFFSET + 18;
uint256 constant CORE_FACE_GODLIKE = WEARABLE_GAP_OFFSET + 19;

uint256 constant CORE_EYES_COMMON = WEARABLE_GAP_OFFSET + 20;
uint256 constant CORE_EYES_UNCOMMON = WEARABLE_GAP_OFFSET + 21;
uint256 constant CORE_EYES_RARE = WEARABLE_GAP_OFFSET + 22;
uint256 constant CORE_EYES_LEGENDARY = WEARABLE_GAP_OFFSET + 23;
uint256 constant CORE_EYES_MYTHICAL = WEARABLE_GAP_OFFSET + 24;
uint256 constant CORE_EYES_GODLIKE = WEARABLE_GAP_OFFSET + 25;

uint256 constant CORE_HEAD_COMMON = WEARABLE_GAP_OFFSET + 26;
uint256 constant CORE_HEAD_UNCOMMON = WEARABLE_GAP_OFFSET + 27;
uint256 constant CORE_HEAD_RARE = WEARABLE_GAP_OFFSET + 28;
uint256 constant CORE_HEAD_LEGENDARY = WEARABLE_GAP_OFFSET + 29;
uint256 constant CORE_HEAD_MYTHICAL = WEARABLE_GAP_OFFSET + 30;
uint256 constant CORE_HEAD_GODLIKE = WEARABLE_GAP_OFFSET + 31;

uint256 constant CORE_HANDS_COMMON = WEARABLE_GAP_OFFSET + 32;
uint256 constant CORE_HANDS_UNCOMMON = WEARABLE_GAP_OFFSET + 33;
uint256 constant CORE_HANDS_RARE = WEARABLE_GAP_OFFSET + 34;
uint256 constant CORE_HANDS_LEGENDARY = WEARABLE_GAP_OFFSET + 35;
uint256 constant CORE_HANDS_MYTHICAL = WEARABLE_GAP_OFFSET + 36;
uint256 constant CORE_HANDS_GODLIKE = WEARABLE_GAP_OFFSET + 37;

uint256 constant CORE_PET_COMMON = WEARABLE_GAP_OFFSET + 38;
uint256 constant CORE_PET_UNCOMMON = WEARABLE_GAP_OFFSET + 39;
uint256 constant CORE_PET_RARE = WEARABLE_GAP_OFFSET + 40;
uint256 constant CORE_PET_LEGENDARY = WEARABLE_GAP_OFFSET + 41;
uint256 constant CORE_PET_MYTHICAL = WEARABLE_GAP_OFFSET + 42;
uint256 constant CORE_PET_GODLIKE = WEARABLE_GAP_OFFSET + 43;

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
    uint256 id;
    uint40 readyBlock;
    bool claimed;
}

struct RarityValueIO {
    uint256 common;
    uint256 uncommon;
    uint256 rare;
    uint256 legendary;
    uint256 mythical;
    uint256 godlike;
}

struct ItemBalancesIO {
    uint256 tokenId;
    uint256 balance;
}

struct GotchiForging {
    uint256 forgeQueueId;
    bool isForging;
}

enum VrfStatus {
    PENDING,
    READY_TO_CLAIM,
    CLAIMED
}

struct VrfRequestInfo {
    address user;
    bytes32 requestId;
    VrfStatus status;
    uint256 randomNumber;
    uint256[] geodeTokenIds;
    uint256[] amountPerToken;
}

struct AppStorage {
    ////// ERC1155
    // Mapping from token ID to account balances
    mapping(uint256 => mapping(address => uint256)) _balances;
    mapping(address => uint256[]) ownerItems;
    mapping(address => mapping(uint256 => uint256)) ownerItemBalances;
    // indexes are stored 1 higher so that 0 means no items in items array
    mapping(address => mapping(uint256 => uint256)) ownerItemIndexes;
    // Mapping from account to operator approvals
    mapping(address => mapping(address => bool)) _operatorApprovals;
    mapping(uint256 => uint256) _totalSupply;
    string _baseUri;
    //////

    bool contractPaused;
    address aavegotchiDAO;
    address gltr;
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
    // Map rarity score modifier (which denotes item rarity) to percent chance (in bips) to win a prize.
    mapping(uint8 => uint256) geodeWinChanceBips;
    // Reduction factor for skillPointsEarnedFromForge for smelting.
    uint256 smeltingSkillPointReductionFactorBips;
    //gotchi token ID to points map
    mapping(uint256 => uint256) gotchiSmithingSkillPoints;
    mapping(uint256 => uint256) maxSupplyByToken;
    address aavegotchiDiamond;
    mapping(uint256 => uint256) geodePrizeQuantities;
    mapping(bytes32 => uint256) vrfNonces;
    mapping(bytes32 => VrfRequestInfo) vrfRequestIdToVrfRequestInfo;
    mapping(address => bytes32[]) vrfUserToRequestIds;
    mapping(address => bool) userVrfPending;
    uint256[] geodePrizeTokenIds;
    ILink link;
    address vrfCoordinator;
    bytes32 keyHash;
    uint144 vrfFee;
}

library LibAppStorage {
    function diamondStorage() internal pure returns (AppStorage storage ds) {
        assembly {
            ds.slot := 0
        }
    }
}

contract Modifiers {
    AppStorage internal s;

    modifier onlyDaoOrOwner() {
        address sender = LibMeta.msgSender();
        require(sender == s.aavegotchiDAO || sender == ForgeLibDiamond.contractOwner(), "LibAppStorage: No access");
        _;
    }

    modifier whenNotPaused() {
        require(!s.contractPaused, "LibAppStorage: Contract paused");
        _;
    }
}
