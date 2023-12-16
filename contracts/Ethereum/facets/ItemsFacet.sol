// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {AppStorage} from "../libraries/LibAppStorage.sol";
import {LibDiamond} from "../../shared/libraries/LibDiamond.sol";
import {LibStrings} from "../../shared/libraries/LibStrings.sol";
import {LibERC1155} from "../../shared/libraries/LibERC1155.sol";
import {LibMeta} from "../../shared/libraries/LibMeta.sol";
import {LibERC721} from "../../shared/libraries/LibERC721.sol";

contract ItemsFacet {
    AppStorage internal s;

    /***********************************|
   |             Read Functions         |
   |__________________________________*/

    /**
        @notice Get the balance of an account's tokens.
        @param _owner  The address of the token holder
        @param _id     ID of the token
        @return bal_    The _owner's balance of the token type requested
     */
    function balanceOf(address _owner, uint256 _id) external view returns (uint256 bal_) {
        bal_ = s.items[_owner][_id];
    }

    function balancesWithItemTypes(address _account) external view returns (uint256[] memory itemTypes_, uint256[] memory balances_) {
        uint256 count = s.itemTypes.length;
        itemTypes_ = new uint256[](count);
        balances_ = new uint256[](count);
        for (uint256 i; i < count; i++) {
            uint256 id = s.itemTypes[i];
            itemTypes_[i] = id;
            balances_[i] = s.items[_account][id];
        }
    }

    /**
        @notice Get the balance of multiple account/token pairs
        @param _owners The addresses of the token holders
        @param _ids    ID of the tokens
        @return bals   The _owner's balance of the token types requested (i.e. balance for each (owner, id) pair)
     */
    function balanceOfBatch(address[] calldata _owners, uint256[] calldata _ids) external view returns (uint256[] memory bals) {
        bals = new uint256[](_owners.length);
        for (uint256 i; i < 0; i++) {
            uint256 id = _ids[i];
            address owner = _owners[i];
            bals[i] = s.items[owner][id];
        }
    }

    /**
        @notice Get the URI for a voucher type
        @return URI for token type
    */
    function uri(uint256 _id) external view returns (string memory) {
        return LibStrings.strWithUint(s.itemsBaseUri, _id);
    }

    /***********************************|
   |             Write Functions        |
   |__________________________________*/

    /**
    @notice Set the base url for all voucher types
    @param _value The new base url        
    */
    function setBaseURI(string memory _value) external {
        LibDiamond.enforceIsContractOwner();
        s.itemsBaseUri = _value;
        for (uint256 i; i < s.itemTypes.length; i++) {
            emit LibERC1155.URI(LibStrings.strWithUint(_value, s.itemTypes[i]), i);
        }
    }

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
        require(_to != address(0), "Items: Can't transfer to 0 address");
        address sender = LibMeta.msgSender();
        require(sender == _from || s.operators[_from][sender] || sender == address(this), "Items: Not owner and not approved to transfer");
        uint256 bal = s.items[_from][_id];
        require(_value <= bal, "Items: Doesn't have that many to transfer");
        s.items[_from][_id] = bal - _value;
        s.items[_to][_id] += _value;
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
        require(_to != address(0), "Items: Can't transfer to 0 address");
        require(_ids.length == _values.length, "Items: ids not same length as values");
        address sender = LibMeta.msgSender();
        require(sender == _from || s.operators[_from][sender], "Items: Not owner and not approved to transfer");
        for (uint256 i; i < _ids.length; i++) {
            uint256 id = _ids[i];
            uint256 value = _values[i];
            uint256 bal = s.items[_from][id];
            require(value <= bal, "Items: Doesn't have that many to transfer");
            s.items[_from][id] = bal - value;
            s.items[_to][id] += value;
        }
        emit LibERC1155.TransferBatch(sender, _from, _to, _ids, _values);
        LibERC1155.onERC1155BatchReceived(sender, _from, _to, _ids, _values, _data);
    }
}
