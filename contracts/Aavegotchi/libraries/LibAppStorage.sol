// SPDX-License-Identifier: MIT
pragma solidity 0.7.4;
import "../../shared/libraries/LibERC20.sol";
import "../../shared/libraries/LibDiamond.sol";
import "hardhat/console.sol";

struct Aavegotchi {
    // This 256 bit value is broken up into 16 16-bit slots for storing wearableIds
    // See helper function that converts this value into a uint16[16] memory equipedWearables
    uint256 equippedWearables; //The currently equipped wearables of the Aavegotchi
    string name;
    uint256 randomNumber;
    // [Experience, Rarity Score, Kinship, Eye Color, Eye Shape, Brain Size, Spookiness, Aggressiveness, Energy]
    uint256 temporaryTraitBoosts;
    uint40 lastTemporaryBoost;
    uint256 numericTraits; // Sixteen 16 bit ints.  [Eye Color, Eye Shape, Brain Size, Spookiness, Aggressiveness, Energy]
    address owner;
    uint32 batchId;
    uint16 hauntId;
    uint8 status; // 0 == portal, 1 = open portal, 2 = Aavegotchi
    uint32 experience; //How much XP this Aavegotchi has accrued. Begins at 0.
    address collateralType;
    uint88 minimumStake; //The minimum amount of collateral that must be staked. Set upon creation.
    uint16 usedSkillPoints; //The number of skill points this aavegotchi has already used
    uint40 claimTime; //The block timestamp when this Aavegotchi was claimed
    uint40 lastInteracted; //The last time this Aavegotchi was interacted with
    uint16 interactionCount; //How many times the owner of this Aavegotchi has interacted with it. Gets reset when the Aavegotchi is transferred to a new owner.
    address escrow; //The escrow address this Aavegotchi manages.
    uint256 unlockTime;
}

struct ItemType {
    // treated as int8s array
    // [Experience, Rarity Score, Kinship, Eye Color, Eye Shape, Brain Size, Spookiness, Aggressiveness, Energy]
    uint256 traitModifiers; //[WEARABLE ONLY] How much the wearable modifies each trait. Should not be more than +-5 total
    // this is an array of uint indexes into the collateralTypes array

    uint8[] allowedCollaterals; //[WEARABLE ONLY] The collaterals this wearable can be equipped to. An empty array is "any"
    string name; //The name of the item
    uint96 ghstPrice; //How much GHST this item costs
    uint32 svgId; //The svgId of the item
    uint32 maxQuantity; //Total number that can be minted of this item.
    uint8 rarityScoreModifier; //Number from 1-50.
    uint8 setId; //The id of the set. Zero is no set
    // Each bit is a slot position. 1 is true, 0 is false
    uint16 slotPositions; //[WEARABLE ONLY] The slots that this wearable can be added to.
    bool canPurchaseWithGhst;
    uint32 totalQuantity; //The total quantity of this item minted so far
    uint8 minLevel; //The minimum Aavegotchi level required to use this item. Default is 1.
    bool canBeTransferred;
    uint8 category; // 0 is wearable, 1 is badge, 2 is consumable
    int8 kinshipBonus; //[CONSUMABLE ONLY] How much this consumable boosts (or reduces) kinship score
    uint32 experienceBonus; //[CONSUMABLE ONLY]
}

struct WearableSet {
    string name;
    uint256 wearableIds; // The tokenIdS of each piece of the set
    uint256 traitsBonuses;
}

struct Haunt {
    uint24 hauntMaxSize; //The max size of the Haunt
    uint96 portalPrice;
    bytes3 bodyColor;
    uint24 totalCount;
}

struct SvgLayer {
    address svgLayersContract;
    uint16 offset;
    uint16 size;
}

struct AavegotchiCollateralTypeInfo {
    // treated as an arary of int8
    uint256 modifiers; //Trait modifiers for each collateral. Can be 2, 1, -1, or -2
    bytes3 primaryColor;
    bytes3 secondaryColor;
    bytes3 cheekColor;
    uint8 svgId;
    uint8 eyeShapeSvgId;
    uint16 conversionRate; //Current conversionRate for the price of this collateral in relation to 1 USD. Can be updated by the DAO
    bool delisted;
}

struct AppStorage {
    mapping(address => AavegotchiCollateralTypeInfo) collateralTypeInfo;
    mapping(address => uint256) collateralTypeIndexes;
    mapping(bytes32 => SvgLayer[]) svgLayers;
    mapping(address => mapping(uint256 => mapping(uint256 => uint256))) nftBalances;
    mapping(address => uint256) aavegotchiBalance;
    ItemType[] itemTypes;
    WearableSet[] wearableSets;
    mapping(uint256 => Haunt) haunts;
    mapping(address => mapping(uint256 => uint256)) items;
    mapping(uint256 => Aavegotchi) aavegotchis;
    mapping(address => mapping(address => bool)) operators;
    mapping(uint256 => address) approved;
    mapping(string => bool) aavegotchiNamesUsed;
    bytes32[1000] emptySlots;
    uint32 totalSupply;
    uint16 currentHauntId;
    //Addresses
    address[] collateralTypes;
    address ghstContract;
    address gameManager;
    address dao;
    address pixelCraft;
    address rarityFarming;
}

library LibAppStorage {
    uint256 internal constant NUMERIC_TRAITS_NUM = 6;

    uint8 internal constant STATUS_CLOSED_PORTAL = 0;
    uint8 internal constant STATUS_OPEN_PORTAL = 1;
    uint8 internal constant STATUS_AAVEGOTCHI = 2;

    uint8 internal constant WEARABLE_SLOT_HEAD = 0;
    uint8 internal constant WEARABLE_SLOT_FACE = 1;
    uint8 internal constant WEARABLE_SLOT_EYES = 2;
    uint8 internal constant WEARABLE_SLOT_BODY = 3;
    uint8 internal constant WEARABLE_SLOT_HAND_LEFT = 4;
    uint8 internal constant WEARABLE_SLOT_HAND_RIGHT = 5;
    uint8 internal constant WEARABLE_SLOT_HANDS_BOTH = 6;
    uint8 internal constant WEARABLE_SLOT_PET = 7;

    uint256 internal constant ITEM_CATEGORY_WEARABLE = 0;
    uint256 internal constant ITEM_CATEGORY_BADGE = 1;
    uint256 internal constant ITEM_CATEGORY_CONSUMABLE = 2;

    uint8 internal constant WEARABLE_SLOTS_TOTAL = 11;

    event AavegotchiInteract(uint256 indexed _tokenId, uint256 kinship);

    modifier onlyAavegotchiOwner(uint256 _tokenId) {
        require(msg.sender == diamondStorage().aavegotchis[_tokenId].owner, "AavegotchiFacet: Only aavegotchi owner can increase stake");
        _;
    }

    function diamondStorage() internal pure returns (AppStorage storage ds) {
        assembly {
            ds.slot := 0
        }
    }

    function purchase(uint256 _ghst) internal {
        AppStorage storage s = diamondStorage();
        //33% to burn address
        uint256 burnShare = (_ghst * 33) / 100;

        //17% to Pixelcraft wallet
        uint256 companyShare = (_ghst * 17) / 100;

        //40% to rarity farming rewards
        uint256 rarityFarmShare = (_ghst * 2) / 5;

        //10% to DAO
        uint256 daoShare = (_ghst - burnShare - companyShare - rarityFarmShare);

        // Using 0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF as burn address.
        // GHST token contract does not allow transferring to address(0) address: https://etherscan.io/address/0x3F382DbD960E3a9bbCeaE22651E88158d2791550#code
        LibERC20.transferFrom(s.ghstContract, msg.sender, address(0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF), burnShare);
        LibERC20.transferFrom(s.ghstContract, msg.sender, s.pixelCraft, companyShare);
        LibERC20.transferFrom(s.ghstContract, msg.sender, s.rarityFarming, rarityFarmShare);
        LibERC20.transferFrom(s.ghstContract, msg.sender, s.dao, daoShare);
    }

    struct LevelInfo {
        uint8 levelBoost;
        uint16 levelAmount;
        uint32 low;
        uint32 high;
    }

    function aavegotchiLevel(uint32 _experience) internal pure returns (uint256 level_) {
        //To do (Dan): Confirm final experience numbers

        if (_experience <= 100) return 1;

        //Levels 1-10 require 100 XP each
        else if (_experience > 100 && _experience <= 999)
            level_ = _experience / 100;

        //Levels 11 - 20 require 150 XP each
        else if (_experience >= 1000 && _experience <= 2999) 
          level_ = calculateLevel(10, 150, 1000, _experience);
        
        //Levels 21 - 40 require 200 XP each
        else if (_experience >= 3000 && _experience <= 7999) 
             level_ = calculateLevel(20, 200, 3000, _experience);
       
        //Levels 41 - 60 require 300 XP each
        else if (_experience >= 8000 && _experience <= 17999)
            level_ = calculateLevel(40, 300, 8000, _experience);

        //Levels 61 - 80 require 500 XP each
        else if (_experience >= 18000 && _experience <= 39999) 
              level_ = calculateLevel(60, 500, 18000, _experience);
         
        //Levels 81 - 90 require 750 XP each
        else if (_experience >= 40000 && _experience <= 67499) 
              level_ = calculateLevel(80, 750, 40000, _experience);
         
        //Levels 91 - 99 require 1000 XP each
        else if (_experience >= 67500 && _experience <= 97999) 
             level_ = calculateLevel(90, 1000, 67500, _experience);
        
        else level_ = 98;

        //Add on 1 for the initial level
        level_ += 1;

        // return level;
    }

    function calculateLevel(uint16 _initial, uint16 _perLevel, uint32 _lowRange, uint32 _experience) internal pure returns(uint32 level_) {
            level_ = _initial;
            uint32 difference = _experience - _lowRange;
            uint32 additionalLevel = difference / _perLevel;
            level_ += additionalLevel;
    }

    function uintToSixteenBitArray(uint256 _data) internal pure returns (uint256[] memory array_) {
        uint256 length = 16;
        array_ = new uint256[](length);
        for (uint256 i; i < length; i++) {
            uint256 item = uint16(_data >> (16 * i));
            if (item == 0) {
                length = i;
                break;
            }
            array_[i] = item;
        }
        assembly {
            mstore(array_, length)
        }
    }

    function interact(uint256 _tokenId) internal {
        AppStorage storage s = diamondStorage();
        //To test (Dan): Only allow 2 interactions per day
        uint256 lastInteracted = s.aavegotchis[_tokenId].lastInteracted;
        // 43200 seconds is 12 hours
        // if interacted less than 12 hours ago
        if (block.timestamp < lastInteracted + 43200) {
            return;
        }

        uint256 interactionCount = s.aavegotchis[_tokenId].interactionCount;
        uint256 interval = block.timestamp - lastInteracted;
        uint256 daysSinceInteraction = interval / 86400;
        uint256 kinship;
        if (interactionCount > daysSinceInteraction) {
            kinship = interactionCount - daysSinceInteraction;
        }

        uint256 hateBonus;

        if (kinship < 40) {
            hateBonus = 2;
        }
        kinship += 1 + hateBonus;
        s.aavegotchis[_tokenId].interactionCount = uint16(kinship);

        s.aavegotchis[_tokenId].lastInteracted = uint40(block.timestamp);
        emit AavegotchiInteract(_tokenId, kinship);
    }
}

contract LibAppStorageModifiers {
    AppStorage internal s;
    modifier onlyAavegotchiOwner(uint256 _tokenId) {
        require(msg.sender == s.aavegotchis[_tokenId].owner, "AavegotchiFacet: Only aavegotchi owner can increase stake");
        _;
    }
    modifier onlyUnlocked(uint256 _tokenId) {
        require(s.aavegotchis[_tokenId].unlockTime < block.timestamp, "Only callable on unlocked Aavegotchis");
        _;
    }
    modifier onlyLocked(uint256 _tokenId) {
        require(s.aavegotchis[_tokenId].unlockTime > block.timestamp, "Only callable on unlocked Aavegotchis");
        _;
    }
    modifier onlyDao {
        require(msg.sender == s.dao || msg.sender == address(this), "Only DAO can call this function");
        _;
    }

    modifier onlyDaoOrOwner {
        require(
            msg.sender == s.dao || msg.sender == LibDiamond.contractOwner() || msg.sender == address(this),
            "AavegotchiFacet: Do not have access"
        );
        _;
    }
}
