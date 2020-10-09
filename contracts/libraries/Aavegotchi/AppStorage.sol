// SPDX-License-Identifier: MIT
pragma solidity 0.7.1;

// uint16 constant AAVEGOTCHI_TOKEN_TYPE = 1;

struct Traits {
    uint8 energy;
    uint8 aggressiveeness;
    uint8 spookiness;
    uint8 ethereality;
    uint8 brainSize;
    uint8 eyeShape;
    uint8 eyeColor;
    address collateral;
    uint40 empty1;
    uint256 empty2;
    uint256 empty3;
    uint256 empty4;
    uint256 empty5;
    uint256 empty6;
}

struct Aavegotchi {
    string name;
    uint256 randomNumber;
    address owner;
    uint32 ownerEnumerationIndex;
    // track status of aavegotchi
    // 0 == portal, 1 = open portal, 2 = Aavegotchi
    uint8 status;
    Traits traits;
}

struct SVGLayer {
    address svgLayersContract;
    uint16 offset;
    uint16 size;
}

struct AppStorage {
    address[] collaterals;
    mapping(address => uint256) collateralIndexes;
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
    bytes32[1000] emptyMapSlots;
    // owner of the contract
    address contractOwner;
    uint32 totalSupply;
    address ghstContract;
}
