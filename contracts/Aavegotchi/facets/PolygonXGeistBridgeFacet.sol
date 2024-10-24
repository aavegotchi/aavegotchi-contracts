// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {Aavegotchi, Modifiers} from "../libraries/LibAppStorage.sol";
import {LibAavegotchi} from "../libraries/LibAavegotchi.sol";
import {LibItems} from "../libraries/LibItems.sol";
import {LibERC721} from "../../shared/libraries/LibERC721.sol";
import {LibERC1155} from "../../shared/libraries/LibERC1155.sol";
import {INFTBridge} from "../../shared/interfaces/INFTBridge.sol";
import "../WearableDiamond/interfaces/IEventHandlerFacet.sol";

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
        for (uint slot; slot < _aavegotchi.equippedWearables.length; slot++) {
            uint wearableId = _aavegotchi.equippedWearables[slot];
            if (wearableId != 0) {
                delete s.aavegotchis[_tokenId].equippedWearables[slot];
                LibItems.removeFromParent(address(this), _tokenId, wearableId, 1);
                LibItems.addToOwner(s.itemGeistBridge, wearableId, 1);
                IEventHandlerFacet(s.wearableDiamond).emitTransferSingleEvent(msg.sender, address(this), s.itemGeistBridge, wearableId, 1);
                emit LibERC1155.TransferFromParent(address(this), _tokenId, wearableId, 1);
            }
        }
    }

    function setMetadata(uint _tokenId, bytes memory _metadata) external onlyGotchiGeistBridge {
        Aavegotchi memory _aavegotchi = abi.decode(_metadata, (Aavegotchi));
        s.aavegotchis[_tokenId] = _aavegotchi;

        for (uint slot; slot < _aavegotchi.equippedWearables.length; slot++) {
            if (_aavegotchi.equippedWearables[slot] != 0) {
                uint wearableId = _aavegotchi.equippedWearables[slot];
                LibItems.removeFromOwner(s.itemGeistBridge, wearableId, 1);
                IEventHandlerFacet(s.wearableDiamond).emitTransferSingleEvent(msg.sender, s.itemGeistBridge, address(this), wearableId, 1);
                LibItems.addToParent(address(this), _tokenId, wearableId, 1);
                emit LibERC1155.TransferToParent(address(this), _tokenId, wearableId, 1);
            }
        }
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
}
