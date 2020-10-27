// SPDX-License-Identifier: MIT
pragma solidity 0.7.4;

library LibWearables {
    struct OwnerAndIndex {
        address owner;
        uint32 index;
    }

    struct Storage {
        // owner => aavegotchis
        mapping(address => mapping(uint256 => uint256)) wearables;
        mapping(uint256 => OwnerAndIndex) owner;
        // owner => (operator => bool)
        mapping(address => mapping(address => bool)) operators;
        mapping(uint256 => address) approved;
        mapping(uint256 => bytes32) traits;
        uint256 totalSupply;
    }

    function getStorage() internal pure returns (Storage storage ds) {
        bytes32 position = keccak256("diamond.Aavegotchi.Wearables");
        assembly {
            ds.slot := position
        }
    }
}
