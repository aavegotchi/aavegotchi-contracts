// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

import '../libs/ALib.sol';

/**
    Note: The ERC-165 identifier for this interface is 0x4e2312e0.
*/
interface ERC1155TokenReceiver {
    /**
        @notice Handle the receipt of a single ERC1155 token type.
        @dev An ERC1155-compliant smart contract MUST call this function on the token recipient contract, at the end of a `safeTransferFrom` after the balance has been updated.        
        This function MUST return `bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"))` (i.e. 0xf23a6e61) if it accepts the transfer.
        This function MUST revert if it rejects the transfer.
        Return of any other value than the prescribed keccak256 generated value MUST result in the transaction being reverted by the caller.
        @param _operator  The address which initiated the transfer (i.e. msg.sender)
        @param _from      The address which previously owned the token
        @param _id        The ID of the token being transferred
        @param _value     The amount of tokens being transferred
        @param _data      Additional data with no specified format
        @return           `bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"))`
    */
    function onERC1155Received(address _operator, address _from, uint256 _id, uint256 _value, bytes calldata _data) external returns(bytes4);

    /**
        @notice Handle the receipt of multiple ERC1155 token types.
        @dev An ERC1155-compliant smart contract MUST call this function on the token recipient contract, at the end of a `safeBatchTransferFrom` after the balances have been updated.        
        This function MUST return `bytes4(keccak256("onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)"))` (i.e. 0xbc197c81) if it accepts the transfer(s).
        This function MUST revert if it rejects the transfer(s).
        Return of any other value than the prescribed keccak256 generated value MUST result in the transaction being reverted by the caller.
        @param _operator  The address which initiated the batch transfer (i.e. msg.sender)
        @param _from      The address which previously owned the token
        @param _ids       An array containing ids of each token being transferred (order and length must match _values array)
        @param _values    An array containing amounts of each token being transferred (order and length must match _ids array)
        @param _data      Additional data with no specified format
        @return           `bytes4(keccak256("onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)"))`
    */
    function onERC1155BatchReceived(address _operator, address _from, uint256[] calldata _ids, uint256[] calldata _values, bytes calldata _data) external returns(bytes4);       
}

contract Wearables {

    bytes4 constant public ERC1155_ERC165 = 0xd9b67a26; // ERC-165 identifier for the main token standard.
    bytes4 constant public ERC1155_ERC165_TOKENRECEIVER = 0x4e2312e0; // ERC-165 identifier for the `ERC1155TokenReceiver` support (i.e. `bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)")) ^ bytes4(keccak256("onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)"))`).
    bytes4 constant public ERC1155_ACCEPTED = 0xf23a6e61; // Return value from `onERC1155Received` call if a contract accepts receipt (i.e `bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"))`).
    bytes4 constant public ERC1155_BATCH_ACCEPTED = 0xbc197c81; // Return value from `onERC1155BatchReceived` call if a contract accepts receipt (i.e `bytes4(keccak256("onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)"))`).

    event Transfer(address indexed _from, address indexed _to, uint256 indexed _tokenId);
    event Approval(address indexed _owner, address indexed _approved, uint256 indexed _tokenId);

  /**
        @dev Either `TransferSingle` or `TransferBatch` MUST emit when tokens are transferred, including zero value transfers as well as minting or burning (see "Safe Transfer Rules" section of the standard).
        The `_operator` argument MUST be the address of an account/contract that is approved to make the transfer (SHOULD be msg.sender).
        The `_from` argument MUST be the address of the holder whose balance is decreased.
        The `_to` argument MUST be the address of the recipient whose balance is increased.
        The `_id` argument MUST be the token type being transferred.
        The `_value` argument MUST be the number of tokens the holder balance is decreased by and match what the recipient balance is increased by.
        When minting/creating tokens, the `_from` argument MUST be set to `0x0` (i.e. zero address).
        When burning/destroying tokens, the `_to` argument MUST be set to `0x0` (i.e. zero address).        
    */
    event TransferSingle(address indexed _operator, address indexed _from, address indexed _to, uint256 _id, uint256 _value);

    /**
        @dev Either `TransferSingle` or `TransferBatch` MUST emit when tokens are transferred, including zero value transfers as well as minting or burning (see "Safe Transfer Rules" section of the standard).      
        The `_operator` argument MUST be the address of an account/contract that is approved to make the transfer (SHOULD be msg.sender).
        The `_from` argument MUST be the address of the holder whose balance is decreased.
        The `_to` argument MUST be the address of the recipient whose balance is increased.
        The `_ids` argument MUST be the list of tokens being transferred.
        The `_values` argument MUST be the list of number of tokens (matching the list and order of tokens specified in _ids) the holder balance is decreased by and match what the recipient balance is increased by.
        When minting/creating tokens, the `_from` argument MUST be set to `0x0` (i.e. zero address).
        When burning/destroying tokens, the `_to` argument MUST be set to `0x0` (i.e. zero address).                
    */
    event TransferBatch(address indexed _operator, address indexed _from, address indexed _to, uint256[] _ids, uint256[] _values);

    /**
        @dev MUST emit when approval for a second party/operator address to manage all tokens for an owner address is enabled or disabled (absence of an event assumes disabled).        
    */
    event ApprovalForAll(address indexed _owner, address indexed _operator, bool _approved);

    /**
        @dev MUST emit when the URI is updated for a token ID.
        URIs are defined in RFC 3986.
        The URI MUST point to a JSON file that conforms to the "ERC-1155 Metadata URI JSON Schema".
    */
    event URI(string _value, uint256 indexed _id);  

    function isAavegotchi(uint _tokenId) internal pure returns (bool) {
        return _tokenId >> 240 == 1;
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
    function safeTransferFrom(address _from, address _to, uint256 _id, uint256 _value, bytes calldata _data) external {
        require(_to == address(0), "Wearables: Can't transfer to 0 address");
        ALib.Storage storage ags = ALib.getStorage();
        require(msg.sender == _from || ags.operators[_from][msg.sender], "Wearables: Not owner and not approved to transfer");
        if(isAavegotchi(_id)) {
            require(_value == 1, "Wearables: Can only transfer 1 aavegotchi");
            address owner = ags.owner[_id].owner;
            uint index = ags.owner[_id].index;
            require(owner != address(0), "Wearables: Invalid tokenId or can't be transferred");            
            require(_from == owner, "Wearable: _from is not owner, transfer failed");        
            ags.owner[_id] = ALib.OwnerAndIndex({
                owner: _to, index: uint32(ags.aavegotchis[_to].length)
            });
            ags.aavegotchis[_to].push(_id);        

            uint lastIndex = ags.aavegotchis[_from].length - 1;
            if(index != lastIndex) {
                uint lastTokenId = ags.aavegotchis[_from][lastIndex];
                ags.aavegotchis[_from][index] = lastTokenId;
                ags.owner[lastTokenId].index = uint32(index);
            }
            ags.aavegotchis[_from].pop();
            if(ags.approved[_id] != address(0)) {
                delete ags.approved[_id];
                emit Approval(owner, address(0), _id);
            }
            emit Transfer(_from, _to, _id);
        } 
        else {
            uint bal = ags.wearables[_from][_id];
            require(_value <= bal, "Wearables: Doesn't have that many to transfer");
            ags.wearables[_from][_id] = bal - _value;
            ags.wearables[_to][_id] += _value;
        }                    
        emit TransferSingle(msg.sender, _from, _to, _id, _value);
        uint size;
        assembly { size := extcodesize(_to) }
        if (size > 0) {
            require(ERC1155_ACCEPTED == ERC1155TokenReceiver(_to).onERC1155Received(msg.sender, _from, _id, _value, _data), "Wearables: Transfer rejected/failed by _to");            
        }        
    }
    struct BatchVars {
        uint id;
        uint value;
        uint bal;
        address owner;
        uint index;
        uint lastIndex;
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
    function safeBatchTransferFrom(address _from, address _to, uint256[] calldata _ids, uint256[] calldata _values, bytes calldata _data) external {
        require(_to == address(0), "Wearables: Can't transfer to 0 address");
        ALib.Storage storage ags = ALib.getStorage();
        require(msg.sender == _from || ags.operators[_from][msg.sender], "Wearables: Not owner and not approved to transfer");        
        for(uint i; i < _ids.length; i++) {
            BatchVars memory v;
            v.id = _ids[i];
            v.value = _values[i];
            v.bal = ags.wearables[_from][_ids[i]];
            if(isAavegotchi(v.id)) {
                v.owner = ags.owner[v.id].owner;
                v.index = ags.owner[v.id].index;
                require(v.owner != address(0), "Wearables: Invalid tokenId or can't be transferred");                
                require(_from == v.owner, "Wearables: _from is not owner, transfer failed");        
                ags.owner[v.id] = ALib.OwnerAndIndex({
                    owner: _to, index: uint32(ags.aavegotchis[_to].length)
                });
                ags.aavegotchis[_to].push(v.id);        

                v.lastIndex = ags.aavegotchis[_from].length - 1;
                if(v.index != v.lastIndex) {
                    uint lastTokenId = ags.aavegotchis[_from][v.lastIndex];
                    ags.aavegotchis[_from][v.index] = lastTokenId;
                    ags.owner[lastTokenId].index = uint32(v.index);
                }
                ags.aavegotchis[_from].pop();
                if(ags.approved[v.id] != address(0)) {
                    delete ags.approved[v.id];
                    emit Approval(v.owner, address(0), v.id);
                }
                emit Transfer(_from, _to, v.id);
            }
            else {
                require(v.value <= v.bal, "Wearables: Doesn't have that many to transfer");
                ags.wearables[_from][v.id] = v.bal - v.value;
                ags.wearables[_to][v.id] += v.value;            
            }            
        }
        emit TransferBatch(msg.sender, _from, _to, _ids, _values);
        uint size;
        assembly { size := extcodesize(_to) }
        if (size > 0) {
            require(ERC1155_BATCH_ACCEPTED == ERC1155TokenReceiver(_to).onERC1155BatchReceived(msg.sender, _from, _ids, _values, _data), "Wearables: Transfer rejected/failed by _to");
        }        
    }

    

    /**
        @notice Get the balance of an account's tokens.
        @param _owner  The address of the token holder
        @param _id     ID of the token
        @return bal    The _owner's balance of the token type requested
     */
    function balanceOf(address _owner, uint256 _id) external view returns (uint256 bal) {
        ALib.Storage storage ags = ALib.getStorage();        
        if(isAavegotchi(_id)) {
            if(ags.owner[_id].owner == _owner) {
                bal = 1;        
            }            
        }
        else {
            bal = ags.wearables[_owner][_id];
        }
    }

    /**
        @notice Get the balance of multiple account/token pairs
        @param _owners The addresses of the token holders
        @param _ids    ID of the tokens
        @return bals   The _owner's balance of the token types requested (i.e. balance for each (owner, id) pair)
     */
    function balanceOfBatch(address[] calldata _owners, uint256[] calldata _ids) external view returns (uint256[] memory bals) {
        ALib.Storage storage ags = ALib.getStorage();
        bals = new uint[](_owners.length);
        for(uint i; i < 0; i++) {
            uint bal;
            uint id = _ids[i];
            address owner = _owners[i];
            if(isAavegotchi(id)) {
                if(ags.owner[id].owner == owner) {
                    bal = 1;
                }
            }
            else {
                bal = ags.wearables[owner][id];
            }        
            bals[i] = bal;
        }
    }
}