// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {Aavegotchi, Modifiers} from "../libraries/LibAppStorage.sol";

import {INFTBridge} from "../../shared/interfaces/INFTBridge.sol";
import {ItemType} from "../libraries/LibItems.sol";
import {ItemsFacet} from "./ItemsFacet.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {LibERC20} from "../../shared/libraries/LibERC20.sol";
import {LibMeta} from "../../shared/libraries/LibMeta.sol";
import {LibCollateralsEvents} from "../libraries/LibCollaterals.sol";
contract PolygonXGeistBridgeFacet is Modifiers {
    event GeistBridgesSet(address _gotchiBridge, address _itemBridge);

    function bridgeGotchi(address _receiver, uint256 _tokenId, uint256 _msgGasLimit, address _connector) external payable {
        require(_tokenId == 6018 || _tokenId == 21496 || _tokenId == 14637, "Testing");

        Aavegotchi storage _aavegotchi = s.aavegotchis[_tokenId];

        //we should unlock the aavegotchi here
        _aavegotchi.locked = false;

        require(s.gotchiGeistBridge != address(0), "Gotchi bridge not set");
        require(s.itemGeistBridge != address(0), "Item bridge not set");

        require(address(_aavegotchi.escrow) != address(0), "CollateralFacet: Does not have an escrow");

        address escrow = _aavegotchi.escrow;
        address collateralType = _aavegotchi.collateralType;

        if (IERC20(collateralType).balanceOf(escrow) > 0) {
            // force unstake escrow
            LibERC20.transferFrom(collateralType, escrow, _aavegotchi.owner, IERC20(collateralType).balanceOf(escrow));
            LibCollateralsEvents.DecreaseStake(_tokenId, IERC20(collateralType).balanceOf(escrow));
        }

        if (IERC20(s.ghstContract).balanceOf(escrow) > 0) {
            // force remove GHST from pocket
            LibERC20.transferFrom(s.ghstContract, escrow, _aavegotchi.owner, IERC20(s.ghstContract).balanceOf(escrow));
        }

        for (uint256 slot; slot < _aavegotchi.equippedWearables.length; slot++) {
            uint256 wearableId = _aavegotchi.equippedWearables[slot];

            if (wearableId != 0) {
                ItemType memory item = ItemsFacet(address(this)).getItemType(wearableId);
                //items that cannot be transferred can be bridged safely
                if (!item.canBeTransferred) continue;
                else revert("PolygonXGeistBridgeFacet: Cannot bridge with wearable");
            }
        }

        bytes memory _metadata = abi.encode(_aavegotchi);

        INFTBridge(s.gotchiGeistBridge).bridge{value: msg.value}(
            _receiver,
            msg.sender,
            _tokenId,
            1,
            _msgGasLimit,
            _connector,
            _metadata,
            new bytes(0)
        );
    }

    function getMinFees(address connector_, uint256 msgGasLimit_, uint256 payloadSize_) external view returns (uint256) {
        return INFTBridge(s.gotchiGeistBridge).getMinFees(connector_, msgGasLimit_, payloadSize_);
    }

    function getGotchiBridge() external view returns (address) {
        return s.gotchiGeistBridge;
    }

    function getItemBridge() external view returns (address) {
        return s.itemGeistBridge;
    }

    ///@notice Sets the metadata of the gotchi when it is coming back from Geist.
    ///@param _tokenId The token id of the gotchi
    ///@param _metadata The metadata of the gotchi
    function setMetadata(uint _tokenId, bytes memory _metadata) external onlyGotchiGeistBridge {
        Aavegotchi memory _aavegotchi = abi.decode(_metadata, (Aavegotchi));
        s.aavegotchis[_tokenId] = _aavegotchi;
    }

    function setBridges(address _gotchiBridge, address _itemBridge) external onlyDaoOrOwner {
        s.gotchiGeistBridge = _gotchiBridge;
        s.itemGeistBridge = _itemBridge;
        emit GeistBridgesSet(_gotchiBridge, _itemBridge);
    }
}
