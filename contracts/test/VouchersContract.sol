// SPDX-License-Identifier: MIT
pragma solidity 0.7.6;
pragma experimental ABIEncoderV2;

import "./interfaces/IERC1155.sol";
import "./interfaces/IERC1155TokenReceiver.sol";
import "./interfaces/IERC1155Metadata_URI.sol";
import "./libraries/LibStrings.sol";
import "./interfaces/IERC173.sol";
import "./interfaces/IERC165.sol";

struct Vouchers {
    // user address => balance
    mapping(address => uint256) accountBalances;
    uint256 totalSupply;
}

struct AppStorage {
    mapping(bytes4 => bool) supportedInterfaces;
    mapping(address => mapping(address => bool)) approved;
    Vouchers[] vouchers;
    string vouchersBaseUri;
    address contractOwner;
}

contract VouchersContract is IERC1155, IERC173, IERC165 {
    AppStorage internal s;
    bytes4 internal constant ERC1155_ACCEPTED = 0xf23a6e61; // Return value from `onERC1155Received` call if a contract accepts receipt (i.e `bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"))`).
    bytes4 internal constant ERC1155_BATCH_ACCEPTED = 0xbc197c81; // Return value from `onERC1155BatchReceived` call if a contract accepts receipt (i.e `bytes4(keccak256("onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)"))`).

    constructor(address _contractOwner) {
        s.contractOwner = _contractOwner;
        s.vouchersBaseUri = "https://aavegotchi.com/metadata/vouchers/";

        // adding ERC165 data
        s.supportedInterfaces[type(IERC165).interfaceId] = true;
        s.supportedInterfaces[type(IERC173).interfaceId] = true;

        // ERC1155
        // ERC165 identifier for the main token standard.
        s.supportedInterfaces[type(IERC1155).interfaceId] = true;

        // ERC1155
        // ERC1155Metadata_URI
        s.supportedInterfaces[type(IERC1155Metadata_URI).interfaceId] = true;
    }

    function supportsInterface(bytes4 _interfaceId) external view override returns (bool) {
        return s.supportedInterfaces[_interfaceId];
    }

    function owner() external view override returns (address) {
        return s.contractOwner;
    }

    function transferOwnership(address _newContractOwner) external override {
        address previousOwner = s.contractOwner;
        require(msg.sender == previousOwner, "Vouchers: Must be contract owner");
        s.contractOwner = _newContractOwner;
        emit OwnershipTransferred(previousOwner, _newContractOwner);
    }

    /**
        @notice Creates new voucher types and mints vouchers
        @dev Can only be called by contract owner
        @param _to      Who gets the vouchers that are minted
        @param _values  How many vouchers to mint for each new voucher type
        @param _data    Additional data with no specified format, MUST be sent unaltered in call to `onERC1155BatchReceived` on `_to`
    */
    function createVoucherTypes(
        address _to,
        uint256[] calldata _values,
        bytes calldata _data
    ) external {
        require(_to != address(0), "Vouchers: Can't mint to 0 address");
        require(msg.sender == s.contractOwner, "Vouchers: Must be contract owner");
        uint256 vouchersIndex = s.vouchers.length;
        uint256[] memory ids = new uint256[](_values.length);
        for (uint256 i; i < _values.length; i++) {
            ids[i] = vouchersIndex;
            uint256 value = _values[i];
            s.vouchers.push();
            s.vouchers[vouchersIndex].totalSupply = value;
            s.vouchers[vouchersIndex].accountBalances[_to] = value;
            vouchersIndex++;
        }
        emit TransferBatch(msg.sender, address(0), _to, ids, _values);
        uint256 size;
        assembly {
            size := extcodesize(_to)
        }
        if (size > 0) {
            require(
                ERC1155_BATCH_ACCEPTED == IERC1155TokenReceiver(_to).onERC1155BatchReceived(msg.sender, address(0), ids, _values, _data),
                "Vouchers: createVoucherTypes rejected/failed"
            );
        }
    }

    /**
        @notice Mints new vouchers
        @dev Can only be called by contract owner
        @param _to      Who gets the vouchers that are minted
        @param _ids     Which voucher types to mint
        @param _values  How many vouchers to mint for each voucher type
        @param _data    Additional data with no specified format, MUST be sent unaltered in call to `onERC1155BatchReceived` on `_to`
    */
    function mintVouchers(
        address _to,
        uint256[] calldata _ids,
        uint256[] calldata _values,
        bytes calldata _data
    ) external {
        require(_to != address(0), "Vouchers: Can't mint to 0 address");
        require(msg.sender == s.contractOwner, "Vouchers: Must be contract owner");
        require(_ids.length == _values.length, "Vouchers: _ids must be same length as _values");
        uint256 vouchersLength = s.vouchers.length;
        for (uint256 i; i < _values.length; i++) {
            uint256 id = _ids[i];
            require(id < vouchersLength, "Vouchers: id does not exist");
            uint256 value = _values[i];
            s.vouchers[id].totalSupply += value;
            s.vouchers[id].accountBalances[_to] += value;
        }
        emit TransferBatch(msg.sender, address(0), _to, _ids, _values);
        uint256 size;
        assembly {
            size := extcodesize(_to)
        }
        if (size > 0) {
            require(
                ERC1155_BATCH_ACCEPTED == IERC1155TokenReceiver(_to).onERC1155BatchReceived(msg.sender, address(0), _ids, _values, _data),
                "Vouchers: Mint rejected/failed"
            );
        }
    }

    /**
        @notice Set the base url for all voucher types
        @param _value The new base url        
    */
    function setBaseURI(string memory _value) external {
        require(msg.sender == s.contractOwner, "Vouchers: Must be contract owner");
        s.vouchersBaseUri = _value;
        for (uint256 i; i < s.vouchers.length; i++) {
            emit URI(string(abi.encodePacked(_value, LibStrings.uintStr(i))), i);
        }
    }

    /**
        @notice Get the URI for a voucher type
        @return URI for token type
    */
    function uri(uint256 _id) external view returns (string memory) {
        require(_id < s.vouchers.length, "_id not found for  ticket");
        return string(abi.encodePacked(s.vouchersBaseUri, LibStrings.uintStr(_id)));
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
    ) external override {
        require(_to != address(0), "Vouchers: Can't transfer to 0 address");
        require(_id < s.vouchers.length, "Vouchers: _id not found");
        require(_from == msg.sender || s.approved[_from][msg.sender], "Vouchers: Not approved to transfer");
        uint256 bal = s.vouchers[_id].accountBalances[_from];
        require(bal >= _value, "Vouchers: _value greater than balance");
        s.vouchers[_id].accountBalances[_from] = bal - _value;
        s.vouchers[_id].accountBalances[_to] += _value;
        emit TransferSingle(msg.sender, _from, _to, _id, _value);
        uint256 size;
        assembly {
            size := extcodesize(_to)
        }
        if (size > 0) {
            require(
                ERC1155_ACCEPTED == IERC1155TokenReceiver(_to).onERC1155Received(msg.sender, _from, _id, _value, _data),
                "Vouchers: Transfer rejected/failed by _to"
            );
        }
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
    ) external override {
        require(_to != address(0), "Vouchers: Can't transfer to 0 address");
        require(_ids.length == _values.length, "Vouchers: _ids not the same length as _values");
        require(_from == msg.sender || s.approved[_from][msg.sender], "Vouchers: Not approved to transfer");
        uint256 vouchersLength = s.vouchers.length;
        for (uint256 i; i < _ids.length; i++) {
            uint256 id = _ids[i];
            require(id < vouchersLength, "Vouchers: id not found");
            uint256 value = _values[i];
            uint256 bal = s.vouchers[id].accountBalances[_from];
            require(bal >= value, "Vouchers: _value greater than balance");
            s.vouchers[id].accountBalances[_from] = bal - value;
            s.vouchers[id].accountBalances[_to] += value;
        }
        emit TransferBatch(msg.sender, _from, _to, _ids, _values);
        uint256 size;
        assembly {
            size := extcodesize(_to)
        }
        if (size > 0) {
            require(
                ERC1155_BATCH_ACCEPTED == IERC1155TokenReceiver(_to).onERC1155BatchReceived(msg.sender, _from, _ids, _values, _data),
                "Vouchers: Batch transfer rejected/failed by _to"
            );
        }
    }

    /**
        @notice Get total supply of each voucher type        
        @return totalSupplies_ The totalSupply of each voucher type
    */
    function totalSupplies() external view returns (uint256[] memory totalSupplies_) {
        uint256 vouchersLength = s.vouchers.length;
        totalSupplies_ = new uint256[](vouchersLength);
        for (uint256 i; i < vouchersLength; i++) {
            totalSupplies_[i] = s.vouchers[i].totalSupply;
        }
    }

    /**
        @notice Get total supply of voucher type
        @param _id           The voucher type id
        @return totalSupply_ The totalSupply of a voucher type
    */
    function totalSupply(uint256 _id) external view returns (uint256 totalSupply_) {
        require(_id < s.vouchers.length, "Vourchers:  Voucher not found");
        totalSupply_ = s.vouchers[_id].totalSupply;
    }

    /**
        @notice Get balance of an account's vouchers for each voucher type.
        @param _owner    The address of the token holder        
        @return balances_ The _owner's balances of the token types
    */
    function balanceOfAll(address _owner) external view returns (uint256[] memory balances_) {
        uint256 vouchersLength = s.vouchers.length;
        balances_ = new uint256[](vouchersLength);
        for (uint256 i; i < vouchersLength; i++) {
            balances_[i] = s.vouchers[i].accountBalances[_owner];
        }
    }

    /**
        @notice Get the balance of an account's tokens.
        @param _owner    The address of the token holder
        @param _id       ID of the token
        @return balance_ The _owner's balance of the token type requested
    */
    function balanceOf(address _owner, uint256 _id) external view override returns (uint256 balance_) {
        require(_id < s.vouchers.length, "Vouchers: _id not found");
        balance_ = s.vouchers[_id].accountBalances[_owner];
    }

    /**
        @notice Get the balance of multiple account/token pairs
        @param _owners    The addresses of the token holders
        @param _ids       ID of the tokens
        @return balances_ The _owner's balance of the token types requested (i.e. balance for each (owner, id) pair)
     */
    function balanceOfBatch(address[] calldata _owners, uint256[] calldata _ids) external view override returns (uint256[] memory balances_) {
        require(_owners.length == _ids.length, "Vouchers: _owners not same length as _ids");
        uint256 vouchersLength = s.vouchers.length;
        balances_ = new uint256[](_owners.length);
        for (uint256 i; i < _owners.length; i++) {
            uint256 id = _ids[i];
            require(id < vouchersLength, "Vouchers: id not found");
            balances_[i] = s.vouchers[id].accountBalances[_owners[i]];
        }
    }

    /**
        @notice Enable or disable approval for a third party ("operator") to manage all of the caller's tokens.
        @dev MUST emit the ApprovalForAll event on success.
        @param _operator  Address to add to the set of authorized operators
        @param _approved  True if the operator is approved, false to revoke approval
    */
    function setApprovalForAll(address _operator, bool _approved) external override {
        s.approved[msg.sender][_operator] = _approved;
        emit ApprovalForAll(msg.sender, _operator, _approved);
    }

    /**
        @notice Queries the approval status of an operator for a given owner.
        @param _owner     The owner of the tokens
        @param _operator  Address of authorized operator
        @return           True if the operator is approved, false if not
    */
    function isApprovedForAll(address _owner, address _operator) external view override returns (bool) {
        return s.approved[_owner][_operator];
    }
}
