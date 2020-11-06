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
}

struct Wearable {
   int8[6] traitModifiers; //How much the wearable modifies each trait. Should not be more than +-2 total
   uint8 maxQuantity; //Total number that can be minted of this wearable. Can calculate the rarity level from this number.
   uint8 rarityScoreModifier; //Number from 1-50. 
   uint8 setId; 
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
    int8[6] modifiers;  //Trait modifiers for each collateral. Can be 2, 1, -1, or -2
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

    struct AavegotchiCollateralTypeInput {
        address collateralType;
        bytes3 primaryColor;
        bytes3 secondaryColor;
        bytes3 cheekColor;
        uint8 svgId;
        uint8 eyeShapeSvgId;
        int8[6] modifiers;
        uint16 conversionRate;
    }

    function addCollateralTypes(AppStorage storage s, AavegotchiCollateralTypeInput[] memory _collateralTypes) internal {
        for (uint256 i; i < _collateralTypes.length; i++) {
            address collateralType = _collateralTypes[i].collateralType;
            s.collateralTypes.push(collateralType);
            s.collateralTypeIndexes[collateralType] = s.collateralTypes.length;
            s.collateralTypeInfo[collateralType].primaryColor = _collateralTypes[i].primaryColor;
            s.collateralTypeInfo[collateralType].secondaryColor = _collateralTypes[i].secondaryColor;
            s.collateralTypeInfo[collateralType].cheekColor = _collateralTypes[i].cheekColor;
            s.collateralTypeInfo[collateralType].svgId = _collateralTypes[i].svgId;
            s.collateralTypeInfo[collateralType].eyeShapeSvgId = _collateralTypes[i].eyeShapeSvgId;
            s.collateralTypeInfo[collateralType].modifiers = _collateralTypes[i].modifiers;
            s.collateralTypeInfo[collateralType].conversionRate = _collateralTypes[i].conversionRate;
        }
    }
}
