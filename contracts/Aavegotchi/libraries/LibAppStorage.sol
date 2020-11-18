// SPDX-License-Identifier: MIT
pragma solidity 0.7.4;

/*
Numeric traits by possition in the array:
energy
aggressiveeness
spookiness
brainSize
eyeShape
eyeColor
*/

struct Aavegotchi {
    //There are 11 available slots. Maybe we should add a few more, just in case?
    // This 256 bit value is broken up into 16 16-bit slots for storing wearableIds
    // See helper function that converts this value into a uint16[16] memory equipedWearables
    uint256 equippedWearables; //The currently equipped wearables of the Aavegotchi
    string name;
    uint256 randomNumber;
    // each byte is used as an individual trait
    // see trait helper functions below
    // uint256 numericTraits;
    address owner;
    uint32 ownerEnumerationIndex;
    // track status of aavegotchi
    // 0 == portal, 1 = open portal, 2 = Aavegotchi
    uint8 status;
    uint16 experience; //How much XP this Aavegotchi has accrued. Begins at 0.
    address collateralType;
    uint88 minimumStake; //The minimum amount of collateral that must be staked. Set upon creation.
    //New traits
    uint16 level; //The level of this Aavegotchi begins at 1.
    uint40 claimTime; //The block timestamp when this Aavegotchi was claimed
    uint40 lastInteracted; //The last time this Aavegotchi was interacted with
    int16 interactionCount; //How many times the owner of this Aavegotchi has interacted with it. Gets reset when the Aavegotchi is transferred to a new owner.
    uint16 streak; //The streak bonus
    address escrow;
    uint32 batchId;
}

struct WearableType {
    int8[6] traitModifiers; //How much the wearable modifies each trait. Should not be more than +-5 total
    uint32 maxQuantity; //Total number that can be minted of this wearable. Can calculate the rarity level from this number.
    uint8 rarityScoreModifier; //Number from 1-50.
    uint8 setId; //The id of the set. Zero is no set
    uint8[] slots; //The slots that this wearable can be added to.
    uint256 svgId; //The svgId of the wearable
    uint256 totalQuantity; //The total quantity of this wearable minted so far

    //A hand wearable can be equipped in left hand, right hand, both hands
    //So its allowedSlots are 4,5, and 7.

    //A hoodie would be equipped to Slot 8 because it takes up Hands + Body.

    //Slots
    //0 Head
    //1 Face
    //2 Eyes
    //3 Body / Feet
    //4 Hand (left)
    //5 Hand (right)
    //6 Pet

    //Combination slots
    //7 Hands (both)
    //8 Head + Body
    //9 Head + Face
    //10 Face + Eyes
}

struct WearableSet {
    uint8[] pieces; //The tokenIdS of each piece of the set
    uint8 fullSetBonus; //How much equipping a full set increases the Aavegotchi's rarity score
}

struct SvgLayer {
    address svgLayersContract;
    uint16 offset;
    uint16 size;
}

struct AavegotchiCollateralTypeInfo {
    bytes3 primaryColor;
    bytes3 secondaryColor;
    bytes3 cheekColor;
    uint8 svgId;
    uint8 eyeShapeSvgId;
    int8[6] modifiers; //Trait modifiers for each collateral. Can be 2, 1, -1, or -2
    uint16 conversionRate; //Current conversionRate for the price of this collateral in relation to 1 USD. Can be updated by the DAO
}

struct AppStorage {
    address[] collateralTypes;
    mapping(address => AavegotchiCollateralTypeInfo) collateralTypeInfo;
    mapping(address => uint256) collateralTypeIndexes;
    // Svgtype => SvgLayer[]
    mapping(bytes32 => SvgLayer[]) svgLayers;
    // SvgLayer[] aavegotchiLayersSvg;
    // SvgLayer[] wearablesSvg;
    // SvgLayer[] itemsSvg;
    // contractAddress => nftId  => id => balance
    mapping(address => mapping(uint256 => mapping(uint256 => uint256))) nftBalances;
    // owner => (id => balance)

    //Maybe should begin at 1, so we can use 0 in the equippedWearables array?   Use it for what?
    uint16 wearableSlotsLength;
    WearableType[] wearableTypes;
    WearableSet[] wearableSets;
    // owner => (wearableId => quantity)
    mapping(address => mapping(uint256 => uint256)) wearables;
    // owner => aavegotchiOwnerEnumeration
    mapping(address => uint32[]) aavegotchiOwnerEnumeration;
    mapping(uint256 => Aavegotchi) aavegotchis;
    // owner => (operator => bool)
    mapping(address => mapping(address => bool)) operators;
    mapping(uint256 => address) approved;
    mapping(string => bool) aavegotchiNamesUsed;
    bytes32[1000] emptySlots;
    // owner of the contract
    uint32 totalSupply;
    address ghstContract;
    address dao;
}

library LibAppStorage {
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

    //Can we update this with a diamond upgrade?
    uint8 internal constant WEARABLE_SLOTS_TOTAL = 11;

    function diamondStorage() internal pure returns (AppStorage storage ds) {
        assembly {
            ds.slot := 0
        }
    }

    function storeNumericTraits(uint8[6] memory _numericTraits) internal {}
}
