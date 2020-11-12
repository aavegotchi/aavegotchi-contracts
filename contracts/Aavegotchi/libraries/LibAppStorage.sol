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
    string name;
    uint8[6] numericTraits;
    uint256 randomNumber;
    bytes32[1000] emptySlots;
    address owner;
    uint32 ownerEnumerationIndex;
    // track status of aavegotchi
    // 0 == portal, 1 = open portal, 2 = Aavegotchi
    uint8 status;
    address collateralType;
    uint128 stakedAmount;
    uint256 minimumStake; //The minimum amount of collateral that must be staked. Set upon creation.
    //New traits
    uint256 experience; //How much XP this Aavegotchi has accrued. Begins at 0.
    uint256 level; //The level of this Aavegotchi begins at 1.
    uint256 claimTime; //The block timestamp when this Aavegotchi was claimed
    uint256 lastInteracted; //The last time this Aavegotchi was interacted with
    int256 interactionCount; //How many times the owner of this Aavegotchi has interacted with it. Gets reset when the Aavegotchi is transferred to a new owner.
    uint256 streak; //The streak bonus
}

struct WearableType {
    int8[6] traitModifiers; //How much the wearable modifies each trait. Should not be more than +-2 total
    uint32 maxQuantity; //Total number that can be minted of this wearable. Can calculate the rarity level from this number.
    uint8 rarityScoreModifier; //Number from 1-50.
    uint8 setId; //The id of the set. Zero is no set
    uint8[] slots; //The allowed slots that this wearable can be added to.
    uint256 svgId; //The svgId of the wearable

    //Allowed Slots
    //0 Head
    //1 Face
    //2 Eyes
    //3 Body / Feet
    //4 Hand (left)
    //5 Hand (right)
    //6 Hands (both)
    //7 Pet
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
    WearableType[] wearableTypes;
    WearableSet[] wearableSets;
    mapping(address => mapping(uint256 => uint256)) wearables;
    // owner => aavegotchiOwnerEnumeration
    mapping(address => uint256[]) aavegotchiOwnerEnumeration;
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

    function diamondStorage() internal pure returns (AppStorage storage ds) {
        assembly {
            ds.slot := 0
        }
    }

    function addWearableTypes(AppStorage storage s, WearableType[] memory _wearableTypes) internal {}
}
