// SPDX-License-Identifier: MIT
pragma solidity 0.7.4;
pragma experimental ABIEncoderV2;

import "../libraries/LibAppStorage.sol";
import "../../shared/libraries/LibDiamond.sol";
import "hardhat/console.sol";

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
    function onERC1155Received(
        address _operator,
        address _from,
        uint256 _id,
        uint256 _value,
        bytes calldata _data
    ) external returns (bytes4);

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
    function onERC1155BatchReceived(
        address _operator,
        address _from,
        uint256[] calldata _ids,
        uint256[] calldata _values,
        bytes calldata _data
    ) external returns (bytes4);
}

contract WearablesFacet {
    using LibAppStorage for AppStorage;
    AppStorage internal s;
    bytes4 internal constant ERC1155_ERC165 = 0xd9b67a26; // ERC-165 identifier for the main token standard.
    bytes4 internal constant ERC1155_ERC165_TOKENRECEIVER = 0x4e2312e0; // ERC-165 identifier for the `ERC1155TokenReceiver` support (i.e. `bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)")) ^ bytes4(keccak256("onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)"))`).
    bytes4 internal constant ERC1155_ACCEPTED = 0xf23a6e61; // Return value from `onERC1155Received` call if a contract accepts receipt (i.e `bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"))`).
    bytes4 internal constant ERC1155_BATCH_ACCEPTED = 0xbc197c81; // Return value from `onERC1155BatchReceived` call if a contract accepts receipt (i.e `bytes4(keccak256("onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)"))`).

    /// @dev This emits when a token is transferred to an ERC721 token
    /// @param _toContract The contract the token is transferred to
    /// @param _toTokenId The token the token is transferred to
    /// @param _tokenTypeId The token type that is being transferred
    /// @param _value The amount of tokens transferred
    event TransferToParent(address indexed _toContract, uint256 indexed _toTokenId, uint256 indexed _tokenTypeId, uint256 _value);

    /// @dev This emits when a token is transferred from an ERC721 token
    /// @param _fromContract The contract the token is transferred from
    /// @param _fromTokenId The token the token is transferred from
    /// @param _tokenTypeId The token type that is being transferred
    /// @param _value The amount of tokens transferred
    event TransferFromParent(address indexed _fromContract, uint256 indexed _fromTokenId, uint256 indexed _tokenTypeId, uint256 _value);

    event Transfer(address indexed _from, address indexed _to, uint256 indexed _tokenId);
    event Approval(address indexed _owner, address indexed _approved, uint256 indexed _tokenId);

    uint16 internal constant SLOT_HEAD = 0;
    uint16 internal constant SLOT_FACE = 1;
    uint16 internal constant SLOT_EYES = 2;
    uint16 internal constant SLOT_BODY = 3;
    uint16 internal constant SLOT_HAND_LEFT = 4;
    uint16 internal constant SLOT_HAND_RIGHT = 5;
    uint16 internal constant SLOT_HANDS_BOTH = 6;
    uint16 internal constant SLOT_PET = 7;
    uint16 internal constant SLOT_HEAD_BODY = 8;
    uint16 internal constant SLOT_HEAD_FACE = 9;
    uint16 internal constant SLOT_HEAD_FACE_EYES = 10;

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

    function setWearableSlotsLength(uint16 _length) external {
        LibDiamond.enforceIsContractOwner();
        //To do: Allow DAO access
        s.wearableSlotsLength = _length;
    }

    function createWearableSet(WearableSet calldata _wearableSet) external {
        LibDiamond.enforceIsContractOwner();
        s.wearableSets.push(_wearableSet);
    }

    function addWearableTypes(WearableType[] calldata _wearableTypes) external {
        LibDiamond.enforceIsContractOwner();
        for (uint256 i; i < _wearableTypes.length; i++) {
            s.wearableTypes.push(_wearableTypes[i]);
        }
    }

    // Mint a set of wearables.
    // How many wearables there are is determined by how many wearable SVG files have been uploaded.
    // The wearbles are minted to the account that calls this function
    function mintWearables(uint256[] memory _wearableIds, uint256[] memory _quantities) external {
        //To do: Only by contract owner (and eventually DAO)
        LibDiamond.enforceIsContractOwner();
        require(_wearableIds.length == _quantities.length, "WearablesFacet: Ids and quantities length must match");

        //  uint256 count = s.svgLayers["wearables"].length;
        for (uint256 i = 0; i < _wearableIds.length; i++) {
            uint256 wearableId = _wearableIds[i];

            require(s.wearableTypes.length > wearableId, "WearablesFacet: Wearable does not exist");

            uint256 quantity = _quantities[i];

            require(
                (s.wearableTypes[wearableId].totalQuantity += quantity) <= s.wearableTypes[wearableId].maxQuantity,
                "WearablesFacet: Total quantity exceeds max quantity"
            );

            s.wearables[msg.sender][wearableId] += quantity;
            s.wearableTypes[wearableId].totalQuantity += quantity;
            emit TransferSingle(msg.sender, address(0), msg.sender, wearableId, quantity);
        }
    }

    // Returns balance for each wearable that exists for an account
    function wearablesBalances(address _account) external view returns (uint256[] memory bals) {
        uint256 count = s.wearableTypes.length;
        bals = new uint256[](count - 1);
        for (uint256 i = 1; i < count; i++) {
            uint256 id = i << 240;
            bals[i - 1] = s.wearables[_account][id];
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
        require(_to != address(0), "Wearables: Can't transfer to 0 address");
        require(msg.sender == _from || s.operators[_from][msg.sender], "Wearables: Not owner and not approved to transfer");

        uint256 bal = s.wearables[_from][_id];
        require(_value <= bal, "Wearables: Doesn't have that many to transfer");
        s.wearables[_from][_id] = bal - _value;
        s.wearables[_to][_id] += _value;
        // }
        emit TransferSingle(msg.sender, _from, _to, _id, _value);
        uint256 size;
        assembly {
            size := extcodesize(_to)
        }
        if (size > 0) {
            require(
                ERC1155_ACCEPTED == ERC1155TokenReceiver(_to).onERC1155Received(msg.sender, _from, _id, _value, _data),
                "Wearables: Transfer rejected/failed by _to"
            );
        }
    }

    struct BatchVars {
        uint256 id;
        uint256 value;
        uint256 bal;
        address owner;
        uint256 index;
        uint256 lastIndex;
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
        require(_to != address(0), "Wearables: Can't transfer to 0 address");
        require(msg.sender == _from || s.operators[_from][msg.sender], "Wearables: Not owner and not approved to transfer");
        for (uint256 i; i < _ids.length; i++) {
            BatchVars memory v;
            v.id = _ids[i];
            v.value = _values[i];
            v.bal = s.wearables[_from][_ids[i]];

            require(v.value <= v.bal, "Wearables: Doesn't have that many to transfer");
            s.wearables[_from][v.id] = v.bal - v.value;
            s.wearables[_to][v.id] += v.value;
            // }
        }
        emit TransferBatch(msg.sender, _from, _to, _ids, _values);
        uint256 size;
        assembly {
            size := extcodesize(_to)
        }
        if (size > 0) {
            require(
                ERC1155_BATCH_ACCEPTED == ERC1155TokenReceiver(_to).onERC1155BatchReceived(msg.sender, _from, _ids, _values, _data),
                "Wearables: Transfer rejected/failed by _to"
            );
        }
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
        require(_toContract != address(0), "Wearables: Can't transfer to 0 address");
        require(msg.sender == _from || s.operators[_from][msg.sender], "Wearables: Not owner and not approved to transfer");
        //    require(!isAavegotchi(_id), "Wearables: Cannot transfer aavegotchi to token");

        uint256 bal = s.wearables[_from][_id];
        require(_value <= bal, "Wearables: Doesn't have that many to transfer");
        s.wearables[_from][_id] = bal - _value;
        s.nftBalances[_toContract][_toTokenId][_id] += _value;
        emit TransferSingle(msg.sender, _from, _toContract, _id, _value);
        emit TransferToParent(_toContract, _toTokenId, _id, _value);
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
        require(_to != address(0), "Wearables: Can't transfer to 0 address");
        address owner = s.aavegotchis[_fromTokenId].owner;
        require(msg.sender == owner || s.operators[owner][msg.sender], "Wearables: Not owner and not approved to transfer");
        //  require(!isAavegotchi(_id), "Wearables: Cannot transfer aavegotchi to token");
        uint256 bal = s.nftBalances[_fromContract][_fromTokenId][_id];
        require(_value <= bal, "Wearables: Doesn't have that many to transfer");
        s.nftBalances[_fromContract][_fromTokenId][_id] = bal - _value;
        s.wearables[_to][_id] += _value;
        emit TransferSingle(msg.sender, _fromContract, _to, _id, _value);
        emit TransferFromParent(_fromContract, _fromTokenId, _id, _value);
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
        require(_toContract != address(0), "Wearables: Can't transfer to 0 address");
        address owner = s.aavegotchis[_fromTokenId].owner;
        require(msg.sender == owner || s.operators[owner][msg.sender], "Wearables: Not owner and not approved to transfer");
        uint256 bal = s.nftBalances[_fromContract][_fromTokenId][_id];
        require(_value <= bal, "Wearables: Doesn't have that many to transfer");
        s.nftBalances[_fromContract][_fromTokenId][_id] = bal - _value;
        s.nftBalances[_toContract][_toTokenId][_id] += _value;
        emit TransferSingle(msg.sender, _fromContract, _toContract, _id, _value);
        emit TransferFromParent(_fromContract, _fromTokenId, _id, _value);
        emit TransferToParent(_toContract, _toTokenId, _id, _value);
    }

    /**
        @notice Get the balance of an account's tokens.
        @param _owner  The address of the token holder
        @param _id     ID of the token
        @return bal    The _owner's balance of the token type requested
     */
    function balanceOf(address _owner, uint256 _id) external view returns (uint256 bal) {
        bal = s.wearables[_owner][_id];
    }

    /// @notice Get the balance of a non-fungible parent token
    /// @param _tokenContract The contract tracking the parent token
    /// @param _tokenId The ID of the parent token
    /// @param _id     ID of the token
    /// @return value The balance of the token
    function balanceOfToken(
        address _tokenContract,
        uint256 _tokenId,
        uint256 _id
    ) external view returns (uint256 value) {
        value = s.nftBalances[_tokenContract][_tokenId][_id];
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
            uint256 bal;
            uint256 id = _ids[i];
            address owner = _owners[i];

            bal = s.wearables[owner][id];
            bals[i] = bal;
        }
    }

    function equipWearables(
        uint256 _tokenId,
        uint256[] memory _wearableIds,
        uint16[] memory _slots
    ) external {
        require(_wearableIds.length == _slots.length, "Aavegotchi Facet: Slots and Ids length must match");

        for (uint256 index = 0; index < _slots.length; index++) {
            //First check if slot is available
            uint16 slot = _slots[index];
            require(slotIsAvailable(_tokenId, slot) == true, "Slot not available");

            //Then check if wearable can be equipped in this slot
            uint256 wearableId = _wearableIds[index];
            uint8[] memory allowedSlots = s.wearableTypes[wearableId].slots;

            bool canBeEquipped = false;

            for (uint8 i = 0; i < allowedSlots.length; i++) {
                if (allowedSlots[i] == slot) {
                    canBeEquipped = true;
                    break;
                }
            }

            require(canBeEquipped == true, "WearablesFacet: Cannot be equipped in this slot");

            //Then check if this wearable is in the Aavegotchis inventory

            uint256 balance = s.nftBalances[address(this)][_tokenId][wearableId];
            require(balance > 0, "WearablesFacet: Wearable is not in Aavegotchi inventory");

            s.aavegotchis[_tokenId].equippedWearables[slot] = uint16(wearableId);
        }

        //To do in WearableFacet: Prevent wearable from being transferred if it's equipped
    }

    function slotIsAvailable(uint256 _tokenId, uint16 _slot) internal view returns (bool available) {
        //First handle base case
        if (s.aavegotchis[_tokenId].equippedWearables[_slot] != 0) return false;

        /*
        const SLOT_HEAD = 0
        const SLOT_FACE = 1
        const SLOT_EYES = 2
        const SLOT_BODY = 3
        const SLOT_HAND_LEFT = 4
        const SLOT_HAND_RIGHT = 5
        const SLOT_HANDS_BOTH = 6
        const SLOT_PET = 7
        const SLOT_HEAD_BODY = 8
        const SLOT_HEAD_FACE = 9
        const SLOT_HEAD_FACE_EYES = 10
        */

        //Then handle each slot combination case

        mapping(uint16 => uint256) storage equipped = s.aavegotchis[_tokenId].equippedWearables;

        if (_slot == SLOT_HEAD) {
            //All combos containing head
            if (equipped[SLOT_HEAD_BODY] != 0) return false;
            if (equipped[SLOT_HEAD_FACE] != 0) return false;
            if (equipped[SLOT_HEAD_FACE_EYES] != 0) return false;
        } else if (_slot == SLOT_FACE) {
            //All combos containing face
            if (equipped[SLOT_HEAD_FACE] != 0) return false;
            if (equipped[SLOT_HEAD_FACE_EYES] != 0) return false;
        } else if (_slot == SLOT_EYES) {
            //All combos containing eyes
            if (equipped[SLOT_HEAD_FACE_EYES] != 0) return false;
        } else if (_slot == SLOT_BODY) {
            //All combos containing body
            if (equipped[SLOT_HEAD_BODY] != 0) return false;
        } else if (_slot == SLOT_HAND_LEFT) {
            if (equipped[SLOT_HANDS_BOTH] != 0) return false;
        } else if (_slot == SLOT_HAND_RIGHT) {
            if (equipped[SLOT_HANDS_BOTH] != 0) return false;
        } else if (_slot == SLOT_HANDS_BOTH) {
            if (equipped[SLOT_HAND_LEFT] != 0) return false;
            if (equipped[SLOT_HAND_RIGHT] != 0) return false;
        } else if (_slot == SLOT_HEAD_BODY) {
            if (equipped[SLOT_HEAD] != 0) return false;
            if (equipped[SLOT_BODY] != 0) return false;
        } else if (_slot == SLOT_HEAD_FACE) {
            if (equipped[SLOT_HEAD] != 0) return false;
            if (equipped[SLOT_FACE] != 0) return false;
        } else if (_slot == SLOT_HEAD_FACE_EYES) {
            if (equipped[SLOT_HEAD] != 0) return false;
            if (equipped[SLOT_FACE] != 0) return false;
            if (equipped[SLOT_EYES] != 0) return false;
        }

        return true;
    }

    function equippedWearables(uint256 _tokenId) external view returns (uint256[] memory equipped) {
        equipped = new uint256[](s.wearableSlotsLength);

        for (uint16 index = 0; index < s.wearableSlotsLength; index++) {
            equipped[index] = s.aavegotchis[_tokenId].equippedWearables[index];
        }

        return equipped;
    }

    function unequipWearables(uint256 _tokenId, uint16[] memory _slotIds) public {
        for (uint256 i = 0; i < _slotIds.length; i++) {
            uint16 slotId = _slotIds[i];
            require(s.aavegotchis[_tokenId].equippedWearables[slotId] != 0, "WearablesFacet: Slot has not been equipped!");

            s.aavegotchis[_tokenId].equippedWearables[slotId] = 0;
        }
    }
}
