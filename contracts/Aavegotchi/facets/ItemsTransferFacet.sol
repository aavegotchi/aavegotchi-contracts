// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {Modifiers, EQUIPPED_WEARABLE_SLOTS, Aavegotchi} from "../libraries/LibAppStorage.sol";
import {IERC721} from "../../shared/interfaces/IERC721.sol";
import {LibMeta} from "../../shared/libraries/LibMeta.sol";
import {LibItems} from "../libraries/LibItems.sol";
import {LibERC1155} from "../../shared/libraries/LibERC1155.sol";
import {LibERC1155Marketplace} from "../libraries/LibERC1155Marketplace.sol";

contract ItemsTransferFacet is Modifiers {
    /**
        @notice Transfers `_value` amount of an `_id` from the `_from` address to the `_to` address specified (with safety call).
        @dev Caller must be approved to manage the tokens being transferred out of the `_from` account (see "Approval" section of the standard).
        MUST revert if `_to` is the zero address.
        MUST revert if balance of holder for token `_id` is lower than the `_value` sent.
        MUST revert on any other error.
        MUST emit the `TransferSingle` event to reflect the balance change (see "Safe Transfer Rules" section of the standard).
        After the above conditions are met, this function MUST check if `_to` is a smart contract (e.g. code size > 0). If so, it MUST call `onERC1155Received` on `_to` and act appropriately (see "Safe Transfer Rules" section of the standard).        
        @param _from    Source address
        @param _to      Target address
        @param _id      ID of the token type
        @param _value   Transfer amount
        @param _data    Additional data with no specified format, MUST be sent unaltered in call to `onERC1155Received` on `_to`
    */
    function safeTransferFrom(
        address _from,
        address _to,
        uint256 _id,
        uint256 _value,
        bytes calldata _data
    ) external {
        require(_to != address(0), "ItemsTransfer: Can't transfer to 0 address");
        address sender = LibMeta.msgSender();
        require(sender == _from || s.operators[_from][sender] || sender == address(this), "ItemsTransfer: Not owner and not approved to transfer");
        LibItems.removeFromOwner(_from, _id, _value);
        LibItems.addToOwner(_to, _id, _value);
        LibERC1155Marketplace.updateERC1155Listing(address(this), _id, _from);
        emit LibERC1155.TransferSingle(sender, _from, _to, _id, _value);        
        LibERC1155.onERC1155Received(sender, _from, _to, _id, _value, _data);
    }

    /**
        @notice Transfers `_values` amount(s) of `_ids` from the `_from` address to the `_to` address specified (with safety call).
        @dev Caller must be approved to manage the tokens being transferred out of the `_from` account (see "Approval" section of the standard).
        MUST revert if `_to` is the zero address.
        MUST revert if length of `_ids` is not the same as length of `_values`.
        MUST revert if any of the balance(s) of the holder(s) for token(s) in `_ids` is lower than the respective amount(s) in `_values` sent to the recipient.
        MUST revert on any other error.        
        MUST emit `TransferSingle` or `TransferBatch` event(s) such that all the balance changes are reflected (see "Safe Transfer Rules" section of the standard).
        Balance changes and events MUST follow the ordering of the arrays (_ids[0]/_values[0] before _ids[1]/_values[1], etc).
        After the above conditions for the transfer(s) in the batch are met, this function MUST check if `_to` is a smart contract (e.g. code size > 0). If so, it MUST call the relevant `ERC1155TokenReceiver` hook(s) on `_to` and act appropriately (see "Safe Transfer Rules" section of the standard).                      
        @param _from    Source address
        @param _to      Target address
        @param _ids     IDs of each token type (order and length must match _values array)
        @param _values  Transfer amounts per token type (order and length must match _ids array)
        @param _data    Additional data with no specified format, MUST be sent unaltered in call to the `ERC1155TokenReceiver` hook(s) on `_to`
    */
    function safeBatchTransferFrom(
        address _from,
        address _to,
        uint256[] calldata _ids,
        uint256[] calldata _values,
        bytes calldata _data
    ) external {
        require(_to != address(0), "ItemsTransfer: Can't transfer to 0 address");
        require(_ids.length == _values.length, "ItemsTransfer: ids not same length as values");
        address sender = LibMeta.msgSender();
        require(sender == _from || s.operators[_from][sender], "ItemsTransfer: Not owner and not approved to transfer");
        for (uint256 i; i < _ids.length; i++) {
            uint256 id = _ids[i];
            uint256 value = _values[i];
            LibItems.removeFromOwner(_from, id, value);
            LibItems.addToOwner(_to, id, value);
            LibERC1155Marketplace.updateERC1155Listing(address(this), id, _from);
        }
        emit LibERC1155.TransferBatch(sender, _from, _to, _ids, _values);
        LibERC1155.onERC1155BatchReceived(sender, _from, _to, _ids, _values, _data);
    }

    /// @notice Transfer tokens from owner address to a token
    /// @param _from The owner address
    /// @param _id ID of the token
    /// @param _toContract The ERC721 contract of the receiving token
    /// @param _toTokenId The receiving token
    /// @param _value The amount of tokens to transfer
    function transferToParent(
        address _from,
        address _toContract,
        uint256 _toTokenId,
        uint256 _id,
        uint256 _value
    ) external {
        require(_toContract != address(0), "ItemsTransfer: Can't transfer to 0 address");
        address sender = LibMeta.msgSender();
        require(sender == _from || s.operators[_from][sender], "ItemsTransfer: Not owner and not approved to transfer");
        LibItems.removeFromOwner(_from, _id, _value);
        LibItems.addToParent(_toContract, _toTokenId, _id, _value);
        LibERC1155Marketplace.updateERC1155Listing(address(this), _id, _from);
        emit LibERC1155.TransferSingle(sender, _from, _toContract, _id, _value);
        emit LibERC1155.TransferToParent(_toContract, _toTokenId, _id, _value);
        
    }

    function batchTransferToParent(
        address _from,
        address _toContract,
        uint256 _toTokenId,
        uint256[] calldata _ids,
        uint256[] calldata _values
    ) external {
        require(_toContract != address(0), "ItemsTransfer: Can't transfer to 0 address");
        require(_ids.length == _values.length, "ItemsTransfer: ids.length not the same as values.length");
        address sender = LibMeta.msgSender();
        require(sender == _from || s.operators[_from][sender], "ItemsTransfer: Not owner and not approved to transfer");
        for (uint256 i; i < _ids.length; i++) {
            uint256 id = _ids[i];
            uint256 value = _values[i];
            LibItems.removeFromOwner(_from, id, value);
            LibItems.addToParent(_toContract, _toTokenId, id, value);
            LibERC1155Marketplace.updateERC1155Listing(address(this), id, _from);
            emit LibERC1155.TransferToParent(_toContract, _toTokenId, id, value);            
        }
        emit LibERC1155.TransferBatch(sender, _from, _toContract, _ids, _values);
    }

    function transferFromTokenApproved(
        address _sender,
        address _fromContract,
        uint256 _fromTokenId
    ) internal view {
        if (_fromContract == address(this)) {
            address owner = s.aavegotchis[_fromTokenId].owner;
            require(
                _sender == owner || s.operators[owner][_sender] || _sender == s.approved[_fromTokenId],
                "ItemsTransfer: Not owner and not approved to transfer"
            );
            require(s.aavegotchis[_fromTokenId].locked == false, "ItemsTransfer: Only callable on unlocked Aavegotchis");
        } else {
            address owner = IERC721(_fromContract).ownerOf(_fromTokenId);
            require(
                owner == _sender ||
                    IERC721(_fromContract).getApproved(_fromTokenId) == _sender ||
                    IERC721(_fromContract).isApprovedForAll(owner, _sender),
                "ItemsTransfer: Not owner and not approved to transfer"
            );
        }
    }

    /// @notice Transfer token from a token to an address
    /// @param _fromContract The address of the owning contract
    /// @param _fromTokenId The owning token
    /// @param _to The address the token is transferred to
    /// @param _id ID of the token
    /// @param _value The amount of tokens to transfer
    function transferFromParent(
        address _fromContract,
        uint256 _fromTokenId,
        address _to,
        uint256 _id,
        uint256 _value
    ) external {
        require(_to != address(0), "ItemsTransfer: Can't transfer to 0 address");
        address sender = LibMeta.msgSender();
        transferFromTokenApproved(sender, _fromContract, _fromTokenId);
        LibItems.removeFromParent(_fromContract, _fromTokenId, _id, _value);
        LibItems.addToOwner(_to, _id, _value);
        emit LibERC1155.TransferSingle(sender, _fromContract, _to, _id, _value);
        emit LibERC1155.TransferFromParent(_fromContract, _fromTokenId, _id, _value);
    }

    function batchTransferFromParent(
        address _fromContract,
        uint256 _fromTokenId,
        address _to,
        uint256[] calldata _ids,
        uint256[] calldata _values
    ) external {
        require(_ids.length == _values.length, "ItemsTransfer: ids.length not the same as values.length");
        require(_to != address(0), "ItemsTransfer: Can't transfer to 0 address");
        address sender = LibMeta.msgSender();
        transferFromTokenApproved(sender, _fromContract, _fromTokenId);
        for (uint256 i; i < _ids.length; i++) {
            uint256 id = _ids[i];
            uint256 value = _values[i];
            LibItems.removeFromParent(_fromContract, _fromTokenId, id, value);
            LibItems.addToOwner(_to, id, value);
            emit LibERC1155.TransferFromParent(_fromContract, _fromTokenId, id, value);
        }
        emit LibERC1155.TransferBatch(sender, _fromContract, _to, _ids, _values);
    }

    function transferAsChild(
        address _fromContract,
        uint256 _fromTokenId,
        address _toContract,
        uint256 _toTokenId,
        uint256 _id,
        uint256 _value
    ) external {
        require(_toContract != address(0), "ItemsTransfer: Can't transfer to 0 address");
        address sender = LibMeta.msgSender();
        transferFromTokenApproved(sender, _fromContract, _fromTokenId);
        LibItems.removeFromParent(_fromContract, _fromTokenId, _id, _value);
        LibItems.addToParent(_toContract, _toTokenId, _id, _value);
        emit LibERC1155.TransferSingle(sender, _fromContract, _toContract, _id, _value);
        emit LibERC1155.TransferFromParent(_fromContract, _fromTokenId, _id, _value);
        emit LibERC1155.TransferToParent(_toContract, _toTokenId, _id, _value);
    }

    function batchTransferAsChild(
        address _fromContract,
        uint256 _fromTokenId,
        address _toContract,
        uint256 _toTokenId,
        uint256[] calldata _ids,
        uint256[] calldata _values
    ) external {
        require(_ids.length == _values.length, "ItemsTransfer: ids.length not the same as values.length");
        require(_toContract != address(0), "ItemsTransfer: Can't transfer to 0 address");
        address sender = LibMeta.msgSender();
        transferFromTokenApproved(sender, _fromContract, _fromTokenId);
        for (uint256 i; i < _ids.length; i++) {
            uint256 id = _ids[i];
            uint256 value = _values[i];
            LibItems.removeFromParent(_fromContract, _fromTokenId, id, value);
            LibItems.addToParent(_toContract, _toTokenId, id, value);
            emit LibERC1155.TransferFromParent(_fromContract, _fromTokenId, id, value);
            emit LibERC1155.TransferToParent(_toContract, _toTokenId, id, value);
        }
        emit LibERC1155.TransferBatch(sender, _fromContract, _toContract, _ids, _values);
    }
}
