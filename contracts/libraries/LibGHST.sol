// SPDX-License-Identifier: MIT
pragma solidity 0.7.1;
pragma experimental ABIEncoderV2;

library LibGHST {
    bytes32 constant GHST_STORAGE_POSITION = keccak256("aavegotchi.ghst");

    struct Storage {
        // owner => (spender => amount)
        mapping(address => mapping(address => uint)) allowances;
        mapping(address => uint) balances;
        uint40 totalSupply;
        address aavegotchiDiamond;

    }

    function diamondStorage() internal pure returns (Storage storage ds) {
        bytes32 position = GHST_STORAGE_POSITION;
        assembly {
            ds.slot := position
        }
    }
}