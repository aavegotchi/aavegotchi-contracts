// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

struct AppStorage {
    // owner => (spender => amount)
    mapping(address => mapping(address => uint256)) allowances;
    mapping(address => uint256) balances;
    address[] approvedContracts;
    mapping(address => uint256) approvedContractIndexes;
    bytes32[1000] emptyMapSlots;
    address contractOwner;
    uint96 totalSupply;

    // address aavegotchiDiamond;
}
