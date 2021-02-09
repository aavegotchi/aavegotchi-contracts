// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;
import "../../shared/libraries/LibERC20.sol";
import "../../shared/libraries/LibDiamond.sol";

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
    uint32 totalSupply;
    address rootChainManager;
}
