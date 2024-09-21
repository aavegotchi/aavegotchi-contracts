// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {Aavegotchi, Modifiers} from "../libraries/LibAppStorage.sol";
import {LibAavegotchi} from "../libraries/LibAavegotchi.sol";
import {LibItems} from "../libraries/LibItems.sol";
import {LibERC721} from "../../shared/libraries/LibERC721.sol";
import {INFTBridge} from "../../shared/interfaces/INFTBridge.sol";

contract PolygonXGeistBridgeFacet is Modifiers {

    function bridgeGotchi(
        address _receiver,
        uint256 _tokenId,
        uint256 _msgGasLimit,
        address _connector
    ) external payable {
        Aavegotchi memory _aavegotchi = s.aavegotchis[_tokenId];
        bytes memory _metadata = abi.encode(_aavegotchi);
        INFTBridge(s.gotchGeistBridge).bridge(_receiver, msg.sender, _tokenId, 1, _msgGasLimit, _connector, _metadata, new bytes(0));
        for (uint i; i < _aavegotchi.equippedWearables.length; i++) {
            if (_aavegotchi.equippedWearables[i] != 0) {
                uint wearableId = _aavegotchi.equippedWearables[i];
                LibItems.removeFromParent(address(this), _tokenId, wearableId, 1);
            }
        }
    }

    function setMetadata(uint _tokenId, bytes memory _metadata) external onlyGotchiGeistBridge {
        Aavegotchi memory _aavegotchi = abi.decode(_metadata, (Aavegotchi));
        s.aavegotchis[_tokenId] = _aavegotchi;

        for (uint i; i < _aavegotchi.equippedWearables.length; i++) {
            if (_aavegotchi.equippedWearables[i] != 0) {
                uint wearableId = _aavegotchi.equippedWearables[i];
                LibItems.addToParent(address(this), _tokenId, wearableId, 1);
            }
        }
    }

    function mint(address _to, uint _tokenId) external onlyGotchiGeistBridge() {
        s.aavegotchis[_tokenId].owner = _to;
        s.tokenIds.push(uint32(_tokenId));
        s.ownerTokenIdIndexes[_to][_tokenId] = s.ownerTokenIds[_to].length;
        s.ownerTokenIds[_to].push(uint32(_tokenId));
        emit LibERC721.Transfer(address(0), _to, _tokenId);
    }

    function burn(address _from, uint _tokenId) external onlyGotchiGeistBridge() {
        s.aavegotchis[_tokenId].owner = address(0);
        uint256 index = s.ownerTokenIdIndexes[_from][_tokenId];
        uint256 lastIndex = s.ownerTokenIds[_from].length - 1;
        if (index != lastIndex) {
            uint32 lastTokenId = s.ownerTokenIds[_from][lastIndex];
            s.ownerTokenIds[_from][index] = lastTokenId;
            s.ownerTokenIdIndexes[_from][lastTokenId] = index;
        }
        s.ownerTokenIds[_from].pop();
        delete s.ownerTokenIdIndexes[_from][_tokenId];

        // delete token approval if any
        if (s.approved[_tokenId] != address(0)) {
            delete s.approved[_tokenId];
            emit LibERC721.Approval(_from, address(0), _tokenId);
        }

        emit LibERC721.Transfer(_from, address(0), _tokenId);

        // delete aavegotchi info
        string memory name = s.aavegotchis[_tokenId].name;
        if (bytes(name).length > 0) {
            delete s.aavegotchiNamesUsed[LibAavegotchi.validateAndLowerName(name)];
        }
        delete s.aavegotchis[_tokenId];
    }

    function bridgeItem(
        address _receiver,
        uint256 _tokenId,
        uint256 _amount,
        uint256 _msgGasLimit,
        address _connector
    ) external payable {
        INFTBridge(s.itemGeistBridge).bridge(_receiver, msg.sender, _tokenId, _amount, _msgGasLimit, _connector, new bytes(0), new bytes(0));
    }

    function mint(address _to, uint _tokenId, uint _quantity) external onlyItemGeistBridge() {
        uint256 totalQuantity = s.itemTypes[_tokenId].totalQuantity + _quantity;
        require(totalQuantity <= s.itemTypes[_tokenId].maxQuantity, "BridgeFacet: Total item quantity exceeds max quantity");

        LibItems.addToOwner(_to, _tokenId, _quantity);
        s.itemTypes[_tokenId].totalQuantity = totalQuantity;
    }

    function burn(address _from, uint _tokenId, uint _quantity) external onlyItemGeistBridge() {
        require(_quantity <= s.itemTypes[_tokenId].totalQuantity, "BridgeFacet: item quantity exceeds total quantity");

        LibItems.removeFromOwner(_from, _tokenId, _quantity);
        s.itemTypes[_tokenId].totalQuantity = s.itemTypes[_tokenId].totalQuantity - _quantity;
    }
}
