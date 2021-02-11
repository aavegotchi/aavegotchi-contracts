// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import "../libraries/LibAppStorage.sol";
import "../../shared/libraries/LibStrings.sol";
import "../../shared/interfaces/IERC721.sol";
import "../libraries/LibERC1155.sol";

interface IERC1155MaretplaceFacet {
    // needed by the marketplace facet to update listings
    function updateERC1155Listing(bytes32 _listingId) external;
}

contract ItemsTransferFacet is LibAppStorageModifiers {
    event TransferToParent(address indexed _toContract, uint256 indexed _toTokenId, uint256 indexed _tokenTypeId, uint256 _value);
    event TransferFromParent(address indexed _fromContract, uint256 indexed _fromTokenId, uint256 indexed _tokenTypeId, uint256 _value);
    event TransferSingle(address indexed _operator, address indexed _from, address indexed _to, uint256 _id, uint256 _value);
    event TransferBatch(address indexed _operator, address indexed _from, address indexed _to, uint256[] _ids, uint256[] _values);

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
        LibERC1155.onERC1155Received(_from, _to, _id, _value, _data);
        bytes32 listingId = keccak256(abi.encodePacked(address(this), _id, _from));
        IERC1155MaretplaceFacet(address(this)).updateERC1155Listing(listingId);
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
            bytes32 listingId = keccak256(abi.encodePacked(address(this), id, _from));
            IERC1155MaretplaceFacet(address(this)).updateERC1155Listing(listingId);
        }
        LibERC1155.onERC1155BatchReceived(_from, _to, _ids, _values, _data);
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
        require(_toContract != address(0), "Items: Can't transfer to 0 address");
        address sender = LibMeta.msgSender();
        require(sender == _from || s.operators[_from][sender], "Items: Not owner and not approved to transfer");
        uint256 bal = s.items[_from][_id];
        require(_value <= bal, "Items: Doesn't have that many to transfer");
        s.items[_from][_id] = bal - _value;
        s.nftBalances[_toContract][_toTokenId][_id] += _value;
        emit TransferSingle(sender, _from, _toContract, _id, _value);
        emit TransferToParent(_toContract, _toTokenId, _id, _value);
        bytes32 listingId = keccak256(abi.encodePacked(address(this), _id, _from));
        IERC1155MaretplaceFacet(address(this)).updateERC1155Listing(listingId);
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
        require(_to != address(0), "Items: Can't transfer to 0 address");
        if (_fromContract == address(this)) {
            address owner = s.aavegotchis[_fromTokenId].owner;
            require(
                LibMeta.msgSender() == owner || s.operators[owner][LibMeta.msgSender()] || LibMeta.msgSender() == s.approved[_fromTokenId],
                "Items: Not owner and not approved to transfer"
            );
            require(s.aavegotchis[_fromTokenId].unlockTime < block.timestamp, "Items: Only callable on unlocked Aavegotchis");
        } else {
            address owner = IERC721(_fromContract).ownerOf(_fromTokenId);
            require(
                owner == LibMeta.msgSender() ||
                    IERC721(_fromContract).getApproved(_fromTokenId) == LibMeta.msgSender() ||
                    IERC721(_fromContract).isApprovedForAll(owner, LibMeta.msgSender()),
                "Items: Not owner and not approved to transfer"
            );
        }
        uint256 bal = s.nftBalances[_fromContract][_fromTokenId][_id];
        require(_value <= bal, "Items: Doesn't have that many to transfer");
        bal -= _value;
        if (bal == 0 && _fromContract == address(this)) {
            uint256 l_equippedWearables = s.aavegotchis[_fromTokenId].equippedWearables;
            for (uint256 i; i < 16; i++) {
                require(uint16(l_equippedWearables >> (i * 16)) != _id, "Items: Cannot transfer wearable that is equipped");
            }
        }
        s.nftBalances[_fromContract][_fromTokenId][_id] = bal;
        s.items[_to][_id] += _value;
        emit TransferSingle(LibMeta.msgSender(), _fromContract, _to, _id, _value);
        emit TransferFromParent(_fromContract, _fromTokenId, _id, _value);
    }

    function batchTransferFromParent(
        address _fromContract,
        uint256 _fromTokenId,
        address _to,
        uint256[] calldata _ids,
        uint256[] calldata _values
    ) external {
        require(_ids.length == _values.length, "Items: ids.length not the same as values.length");
        require(_to != address(0), "Items: Can't transfer to 0 address");
        if (_fromContract == address(this)) {
            address owner = s.aavegotchis[_fromTokenId].owner;
            require(
                LibMeta.msgSender() == owner || s.operators[owner][LibMeta.msgSender()] || LibMeta.msgSender() == s.approved[_fromTokenId],
                "Items: Not owner and not approved to transfer"
            );
            require(s.aavegotchis[_fromTokenId].unlockTime < block.timestamp, "Items: Only callable on unlocked Aavegotchis");
        } else {
            address owner = IERC721(_fromContract).ownerOf(_fromTokenId);
            require(
                owner == LibMeta.msgSender() ||
                    IERC721(_fromContract).getApproved(_fromTokenId) == LibMeta.msgSender() ||
                    IERC721(_fromContract).isApprovedForAll(owner, LibMeta.msgSender()),
                "Items: Not owner and not approved to transfer"
            );
        }
        for (uint256 i; i < _ids.length; i++) {
            uint256 id = _ids[i];
            uint256 value = _values[i];
            uint256 bal = s.nftBalances[_fromContract][_fromTokenId][id];
            require(value <= bal, "Items: Doesn't have that many to transfer");
            bal -= value;
            if (bal == 0 && _fromContract == address(this)) {
                uint256 l_equippedWearables = s.aavegotchis[_fromTokenId].equippedWearables;
                for (uint256 j; j < 16; j++) {
                    require(uint16(l_equippedWearables >> (j * 16)) != id, "Items: Cannot transfer wearable that is equipped");
                }
            }
            s.nftBalances[_fromContract][_fromTokenId][id] = bal;
            s.items[_to][id] += value;
            emit TransferFromParent(_fromContract, _fromTokenId, id, value);
        }
        emit TransferBatch(LibMeta.msgSender(), _fromContract, _to, _ids, _values);
    }

    /// @notice Transfer a token from a token to another token
    /// @param _fromContract The address of the owning contract
    /// @param _fromTokenId The owning token
    /// @param _toContract The ERC721 contract of the receiving token
    /// @param _toTokenId The receiving token
    /// @param _id ID of the token
    /// @param _value The amount tokens to transfer
    function transferAsChild(
        address _fromContract,
        uint256 _fromTokenId,
        address _toContract,
        uint256 _toTokenId,
        uint256 _id,
        uint256 _value
    ) external {
        require(_toContract != address(0), "Items: Can't transfer to 0 address");
        if (_fromContract == address(this)) {
            address owner = s.aavegotchis[_fromTokenId].owner;
            require(
                LibMeta.msgSender() == owner || s.operators[owner][LibMeta.msgSender()] || LibMeta.msgSender() == s.approved[_fromTokenId],
                "Items: Not owner and not approved to transfer"
            );
            require(s.aavegotchis[_fromTokenId].unlockTime <= block.timestamp, "Items: Only callable on unlocked Aavegotchis");
        } else {
            address owner = IERC721(_fromContract).ownerOf(_fromTokenId);
            require(
                owner == LibMeta.msgSender() ||
                    IERC721(_fromContract).getApproved(_fromTokenId) == LibMeta.msgSender() ||
                    IERC721(_fromContract).isApprovedForAll(owner, LibMeta.msgSender()),
                "Items: Not owner and not approved to transfer"
            );
        }
        uint256 bal = s.nftBalances[_fromContract][_fromTokenId][_id];
        require(_value <= bal, "Items: Doesn't have that many to transfer");
        bal -= _value;
        if (bal == 0 && _fromContract == address(this)) {
            uint256 l_equippedWearables = s.aavegotchis[_fromTokenId].equippedWearables;
            for (uint256 i; i < 16; i++) {
                require(uint16(l_equippedWearables >> (i * 16)) != _id, "Items: Cannot transfer wearable that is equipped");
            }
        }
        s.nftBalances[_fromContract][_fromTokenId][_id] = bal;
        s.nftBalances[_toContract][_toTokenId][_id] += _value;
        emit TransferSingle(LibMeta.msgSender(), _fromContract, _toContract, _id, _value);
        emit TransferFromParent(_fromContract, _fromTokenId, _id, _value);
        emit TransferToParent(_toContract, _toTokenId, _id, _value);
    }
}
