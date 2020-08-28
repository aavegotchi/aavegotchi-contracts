// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

import "../SVGStorage.sol";

library ALib {
    uint16 constant AAVEGOTCHI_TOKEN_TYPE = 1;

    struct OwnerAndIndex {
        address owner;
        uint32 index;
    }

    struct Storage {
        mapping(address => mapping(uint => uint)) wearables;
        // owner => aavegotchis
        mapping(address => uint[]) aavegotchis;
        mapping(uint => OwnerAndIndex) owner;
        // owner => (operator => bool)
        mapping(address => mapping(address => bool)) operators;
        mapping(uint => address) approved;
        
        mapping(uint => bytes32) traits;
        uint totalSupply;

        SVGStorage svgStorage;
    }

    function getStorage() internal pure returns(Storage storage ds) {
        bytes32 position = keccak256("diamond.Aavegotchi");
        assembly { ds.slot := position }
    }

    event Transfer(address indexed _from, address indexed _to, uint256 indexed _tokenId);
    event Approval(address indexed _owner, address indexed _approved, uint256 indexed _tokenId);

    function transferFromInternal(address _from, address _to, uint256 _tokenId) internal {
        require(_to != address(0), "ER721: Can't transfer to 0 address");
        ALib.Storage storage ags = ALib.getStorage();                
        address owner = ags.owner[_tokenId].owner;
        uint index = ags.owner[_tokenId].index;
        require(owner != address(0), "ALib: Invalid tokenId or can't be transferred");
        require(msg.sender == owner 
            || ags.operators[owner][msg.sender] 
            || ags.approved[_tokenId] == msg.sender, "ALib: Not owner or approved to transfer");        
        require(_from == owner, "ALib: _from is not owner, transfer failed");        
        ags.owner[_tokenId] = ALib.OwnerAndIndex({
            owner: _to, index: uint32(ags.aavegotchis[_to].length)
        });
        ags.aavegotchis[_to].push(_tokenId);        

        uint lastIndex = ags.aavegotchis[_from].length - 1;
        if(index != lastIndex) {
            uint lastTokenId = ags.aavegotchis[_from][lastIndex];
            ags.aavegotchis[_from][index] = lastTokenId;
            ags.owner[lastTokenId].index = uint32(index);
        }
        ags.aavegotchis[_from].pop();
        if(ags.approved[_tokenId] != address(0)) {
            delete ags.approved[_tokenId];
            emit Approval(owner, address(0), _tokenId);
        }
        emit Transfer(_from, _to, _tokenId);
    }
}