// SPDX-License-Identifier: MIT
pragma solidity 0.7.3;

/*
Numeric traits by possition in the array:
energy
aggressiveeness
spookiness
ethereality
brainSize
eyeShape
eyeColor
*/

struct Aavegotchi {
    string name;
    uint8[] numericTraits;
    uint256 randomNumber;
    bytes32[1000] emptySlots;
    address owner;
    uint32 ownerEnumerationIndex;
    // track status of aavegotchi
    // 0 == portal, 1 = open portal, 2 = Aavegotchi
    uint8 status;
    address collateralType;
    uint128 stakedAmount;
}

struct SVGLayer {
    address svgLayersContract;
    uint16 offset;
    uint16 size;
}

struct AavegotchiCollateralTypeInfo {
    bytes3 primaryColor;
    bytes3 secondaryColor;
    bytes3 cheekColor;
    uint8 svgId;
}

struct AppStorage {
    address[] collateralTypes;
    mapping(address => AavegotchiCollateralTypeInfo) collateralTypeInfo;
    mapping(address => uint256) collateralTypeIndexes;
    SVGLayer[] aavegotchiLayersSVG;
    SVGLayer[] wearablesSVG;
    SVGLayer[] itemsSVG;
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
    address contractOwner;
    uint32 totalSupply;
    address ghstContract;
}

library LibAppStorage {
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
    }

    function addCollateralTypes(AppStorage storage s, AavegotchiCollateralTypeInput[] memory _collateralTypes) internal {
        for (uint256 i; i < _collateralTypes.length; i++) {
            address collateralType = _collateralTypes[i].collateralType;
            s.collateralTypes.push(collateralType);
            s.collateralTypeInfo[collateralType].primaryColor = _collateralTypes[i].primaryColor;
            s.collateralTypeInfo[collateralType].secondaryColor = _collateralTypes[i].secondaryColor;
            s.collateralTypeInfo[collateralType].cheekColor = _collateralTypes[i].cheekColor;
            s.collateralTypeInfo[collateralType].svgId = _collateralTypes[i].svgId;
        }
    }
}
