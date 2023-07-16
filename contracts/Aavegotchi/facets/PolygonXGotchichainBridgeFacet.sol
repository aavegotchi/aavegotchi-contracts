// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {Aavegotchi} from "../libraries/LibAppStorage.sol";
import {Modifiers} from "../libraries/LibAppStorage.sol";
import {LibItems} from "../libraries/LibItems.sol";

contract PolygonXGotchichainBridgeFacet is Modifiers {

    function setAavegotchiMetadata(uint _id, Aavegotchi memory _aavegotchi) external onlyLayerZeroBridge {
        s.aavegotchis[_id] = _aavegotchi;
        for (uint i; i < _aavegotchi.equippedWearables.length; i++) {
            if (_aavegotchi.equippedWearables[i] != 0) {
                uint wearableId = _aavegotchi.equippedWearables[i];
                LibItems.addToParent(address(this), _id, wearableId, 1);
            }
        }
    }

    function mintWithId(address _toAddress, uint _tokenId) external onlyLayerZeroBridge() {
        s.aavegotchis[_tokenId].owner = _toAddress;
        s.tokenIds.push(uint32(_tokenId));
        s.ownerTokenIdIndexes[_toAddress][_tokenId] = s.ownerTokenIds[_toAddress].length;
        s.ownerTokenIds[_toAddress].push(uint32(_tokenId));
    }
    
    function removeItemsFromOwner(address _owner, uint256[] calldata _tokenIds, uint256[] calldata _tokenAmounts) external onlyLayerZeroBridge() {
        for (uint256 i; i < _tokenIds.length; i++) {
            uint256 tokenId = _tokenIds[i];
            uint256 tokenAmount = _tokenAmounts[i];
            LibItems.removeFromOwner(_owner, tokenId, tokenAmount);
        }
    }

        
    function addItemsToOwner(address _owner, uint256[] calldata _tokenIds, uint256[] calldata _tokenAmounts) external onlyLayerZeroBridge() {
        for (uint256 i; i < _tokenIds.length; i++) {
            uint256 tokenId = _tokenIds[i];
            uint256 tokenAmount = _tokenAmounts[i];
            LibItems.addToOwner(_owner, tokenId, tokenAmount);
        }
    }

}
