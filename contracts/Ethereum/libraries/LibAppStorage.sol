// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

struct Aavegotchi {
    address owner;
}

struct AppStorage {
    mapping(uint256 => bool) itemTypeExists;
    uint256[] itemTypes;
    mapping(address => mapping(uint256 => uint256)) items;
    string itemsBaseUri;
    mapping(address => uint256) aavegotchiBalance;
    mapping(uint256 => Aavegotchi) aavegotchis;
    mapping(address => mapping(address => bool)) operators;
    mapping(uint256 => address) approved;    
    address rootChainManager;
    uint32[] tokenIds;
    mapping(uint256 => uint256) tokenIdIndexes;
}
