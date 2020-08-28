// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

library WearablesLib {

    struct OwnerAndIndex {
        address owner;
        uint32 index;
    }

    struct Storage {        
        // owner => aavegotchis
        mapping(address => mapping(uint => uint)) wearables;
        mapping(uint => OwnerAndIndex) owner;
        // owner => (operator => bool)
        mapping(address => mapping(address => bool)) operators;
        mapping(uint => address) approved;
        
        mapping(uint => bytes32) traits;
        uint totalSupply;
        
    }

    function getStorage() internal pure returns(Storage storage ds) {
        bytes32 position = keccak256("diamond.Aavegotchi.Wearables");
        assembly { ds.slot := position }
    }
}