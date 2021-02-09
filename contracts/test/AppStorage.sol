// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

struct AppStorage {
    mapping(address => mapping(address => bool)) approved;
    mapping(address => uint256) balances;
    mapping(uint256 => uint256) wearableVouchers;
    // enables us to add additional map slots here
    bytes32[1000] emptyMapSlots;
    address contractOwner;
    address ghstContract;
    string name;
}
