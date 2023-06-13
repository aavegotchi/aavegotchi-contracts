// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {Aavegotchi} from "../libraries/LibAppStorage.sol";
import {Modifiers} from "../libraries/LibAppStorage.sol";
import {LibItems} from "../libraries/LibItems.sol";

contract PolygonXGotchichainBridgeFacet is Modifiers {

    address public layerZeroBridge;

    modifier onlyLayerZeroBridge() {
        require(msg.sender == layerZeroBridge, "PolygonXGotchichainBridgeFacet: Do not have access");
        _;
    }

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

    function setLayerZeroBridge(address _newLayerZeroBridge) external onlyDaoOrOwner {
        layerZeroBridge = _newLayerZeroBridge;
    }

    function getAavegotchiData(uint256 _tokenId) external view returns (Aavegotchi memory aavegotchi_) {
        aavegotchi_ = s.aavegotchis[_tokenId];
    }
}
