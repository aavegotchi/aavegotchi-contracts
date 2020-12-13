// SPDX-License-Identifier: MIT
pragma solidity 0.7.4;
pragma experimental ABIEncoderV2;

import "../libraries/LibAppStorage.sol";
import "../../shared/libraries/LibDiamond.sol";
import "hardhat/console.sol";
import "../interfaces/IERC721.sol";
// import "../interfaces/IERC1155TokenReceiver.sol";
import "../libraries/LibERC1155.sol";
import "./AavegotchiFacet.sol";

contract ItemsFacet is LibAppStorageModifiers {
    using LibAppStorage for AppStorage;

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

    event EquipWearables(uint256 indexed _tokenId, uint256 _oldWearables, uint256 _newWearables);

    event UseConsumable(uint256 indexed _tokenId, uint256 indexed _itemId);

    uint16 internal constant SLOT_BODY = 0;
    uint16 internal constant SLOT_FACE = 1;
    uint16 internal constant SLOT_EYES = 2;
    uint16 internal constant SLOT_HEAD = 3;
    uint16 internal constant SLOT_HAND_LEFT = 4;
    uint16 internal constant SLOT_HAND_RIGHT = 5;
    uint16 internal constant SLOT_PET = 6;

    /***********************************|
   |             Events                  |
   |__________________________________*/

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

    /***********************************|
   |             Read Functions         |
   |__________________________________*/

    // Returns balance for each item that exists for an account
    function itemBalances(address _account) external view returns (uint256[] memory bals_) {
        uint256 count = s.itemTypes.length;
        bals_ = new uint256[](count);
        for (uint256 id = 0; id < count; id++) {
            bals_[id] = s.items[_account][id];
        }
    }

    /**
        @notice Get the balance of an account's tokens.
        @param _owner  The address of the token holder
        @param _id     ID of the token
        @return bal_    The _owner's balance of the token type requested
     */
    function balanceOf(address _owner, uint256 _id) external view returns (uint256 bal_) {
        bal_ = s.items[_owner][_id];
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

    // returns the balances for all items for a token
    function itemBalancesOfToken(address _tokenContract, uint256 _tokenId) external view returns (uint256[] memory bals_) {
        uint256 count = s.itemTypes.length;
        bals_ = new uint256[](count);
        for (uint256 id = 0; id < count; id++) {
            bals_[id] = s.nftBalances[_tokenContract][_tokenId][id];
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

    function equippedWearables(uint256 _tokenId) external view returns (uint256[16] memory wearableIds_) {
        uint256 l_equippedWearables = s.aavegotchis[_tokenId].equippedWearables;
        for (uint16 i; i < 16; i++) {
            wearableIds_[i] = uint16(l_equippedWearables >> (i * 16));
        }
    }

    // Called by off chain software so not too concerned about gas costs
    function getWearableSets() external view returns (WearableSetIO[] memory wearableSets_) {
        uint256 length = s.wearableSets.length;
        wearableSets_ = new WearableSetIO[](length);
        for (uint256 i; i < length; i++) {
            wearableSets_[i] = getWearableSet(i);
        }
    }

    function getWearableSet(uint256 _index) public view returns (WearableSetIO memory wearableSet_) {
        uint256 length = s.wearableSets.length;
        require(_index < length, "ItemsFacet: Wearable set does not exist");
        wearableSet_.name = s.wearableSets[_index].name;
        wearableSet_.wearableIds = LibAppStorage.uintToSixteenBitArray(s.wearableSets[_index].wearableIds);
        uint256 traitsBonuses = s.wearableSets[_index].traitsBonuses;
        for (uint256 i; i < 5; i++) {
            wearableSet_.traitsBonuses[i] = int16(traitsBonuses >> (16 * i));
        }
    }

    function totalWearableSets() external view returns (uint256) {
        return s.wearableSets.length;
    }

    function getItemType(uint256 _itemId) public view returns (ItemType memory itemType_) {
        require(_itemId < s.itemTypes.length, "ItemsFacet: Item type doesn't exist");
        itemType_ = s.itemTypes[_itemId];
    }

    function getItemTypes() external view returns (ItemType[] memory itemTypes_) {
        uint256 length = s.itemTypes.length;
        itemTypes_ = new ItemType[](length);
        for (uint256 i; i < length; i++) {
            itemTypes_[i] = getItemType(i);
        }
    }

    /***********************************|
   |             Write Functions        |
   |__________________________________*/

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
        require(msg.sender == _from || s.operators[_from][msg.sender], "Items: Not owner and not approved to transfer");
        uint256 bal = s.items[_from][_id];
        require(_value <= bal, "Items: Doesn't have that many to transfer");
        s.items[_from][_id] = bal - _value;
        s.items[_to][_id] += _value;
        LibERC1155.onERC1155Received(_from, _to, _id, _value, _data);
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
        require(msg.sender == _from || s.operators[_from][msg.sender], "Items: Not owner and not approved to transfer");
        for (uint256 i; i < _ids.length; i++) {
            uint256 id = _ids[i];
            uint256 value = _values[i];
            uint256 bal = s.items[_from][id];
            require(value <= bal, "Items: Doesn't have that many to transfer");
            s.items[_from][id] = bal - value;
            s.items[_to][id] += value;
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
        require(msg.sender == _from || s.operators[_from][msg.sender], "Items: Not owner and not approved to transfer");
        uint256 bal = s.items[_from][_id];
        require(_value <= bal, "Items: Doesn't have that many to transfer");
        s.items[_from][_id] = bal - _value;
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
        require(_to != address(0), "Items: Can't transfer to 0 address");
        if (_fromContract == address(this)) {
            address owner = s.aavegotchis[_fromTokenId].owner;
            require(
                msg.sender == owner || s.operators[owner][msg.sender] || msg.sender == s.approved[_fromTokenId],
                "Items: Not owner and not approved to transfer"
            );
            require(s.aavegotchis[_fromTokenId].unlockTime < block.timestamp, "Items: Only callable on unlocked Aavegotchis");
        } else {
            address owner = IERC721(_fromContract).ownerOf(_fromTokenId);
            require(
                owner == msg.sender ||
                    IERC721(_fromContract).getApproved(_fromTokenId) == msg.sender ||
                    IERC721(_fromContract).isApprovedForAll(owner, msg.sender),
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
        require(_toContract != address(0), "Items: Can't transfer to 0 address");
        if (_fromContract == address(this)) {
            address owner = s.aavegotchis[_fromTokenId].owner;
            require(
                msg.sender == owner || s.operators[owner][msg.sender] || msg.sender == s.approved[_fromTokenId],
                "Items: Not owner and not approved to transfer"
            );
            require(s.aavegotchis[_fromTokenId].unlockTime <= block.timestamp, "Items: Only callable on unlocked Aavegotchis");
        } else {
            address owner = IERC721(_fromContract).ownerOf(_fromTokenId);
            require(
                owner == msg.sender ||
                    IERC721(_fromContract).getApproved(_fromTokenId) == msg.sender ||
                    IERC721(_fromContract).isApprovedForAll(owner, msg.sender),
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
        emit TransferSingle(msg.sender, _fromContract, _toContract, _id, _value);
        emit TransferFromParent(_fromContract, _fromTokenId, _id, _value);
        emit TransferToParent(_toContract, _toTokenId, _id, _value);
    }

    function equipWearables(uint256 _tokenId, uint256 _equippedWearables) external onlyUnlocked(_tokenId) onlyAavegotchiOwner(_tokenId) {
        Aavegotchi storage aavegotchi = s.aavegotchis[_tokenId];

        //To test (Dan): Add in actual dynamic level
        uint256 aavegotchiLevel = LibAppStorage.aavegotchiLevel(aavegotchi.experience);

        for (uint256 slot; slot < 16; slot++) {
            uint256 wearableId = uint16(_equippedWearables >> (16 * slot));
            if (wearableId == 0) {
                continue;
            }
            ItemType storage itemType = s.itemTypes[wearableId];
            require(aavegotchiLevel >= itemType.minLevel, "ItemsFacet: Aavegotchi level lower than minLevel");
            require(itemType.category == LibAppStorage.ITEM_CATEGORY_WEARABLE, "ItemsFacet: Only wearables can be equippped");

            // bitmask and bitwise operators used here. Info on them: https://code.tutsplus.com/articles/understanding-bitwise-operators--active-11301
            uint256 slotAllowed = (itemType.slotPositions >> slot) & 1;
            require(slotAllowed == 1, "ItemsFacet: Wearable cannot be equipped in this slot");
            bool canBeEquipped;
            uint8[] memory allowedCollaterals = itemType.allowedCollaterals;
            if (allowedCollaterals.length > 0) {
                uint256 collateralIndex = s.collateralTypeIndexes[aavegotchi.collateralType];

                for (uint256 i; i < allowedCollaterals.length; i++) {
                    if (collateralIndex == allowedCollaterals[i]) {
                        canBeEquipped = true;
                        break;
                    }
                }
                require(canBeEquipped == true, "ItemsFacet: Wearable cannot be equipped in this collateral type");
            }

            //Then check if this wearable is in the Aavegotchis inventory
            //To test (Dan): If not in inventory, then transfer from Owner's inventory
            uint256 balance = s.nftBalances[address(this)][_tokenId][wearableId];
            if (balance == 0) {
                balance = s.items[msg.sender][wearableId];
                require(balance > 0, "ItemsFacet: Wearable is not in inventories");
                s.items[msg.sender][wearableId] = balance - 1;
                s.nftBalances[address(this)][_tokenId][wearableId] += 1;
                emit TransferToParent(address(this), _tokenId, wearableId, 1);
            }
        }
        emit EquipWearables(_tokenId, aavegotchi.equippedWearables, _equippedWearables);
        aavegotchi.equippedWearables = _equippedWearables;
        LibAppStorage.interact(_tokenId);
    }

    struct WearableSetIO {
        string name;
        uint256[] wearableIds;
        int256[5] traitsBonuses;
    }

    function useConsumable(uint256 _tokenId, uint256 _itemId) external onlyUnlocked(_tokenId) onlyAavegotchiOwner(_tokenId) {
        // require(_itemIds.length == _values.length, "ItemsFacet: _itemIds length does not match _tokenIds length");
        // for (uint256 i; i < _itemIds.length; i++) {
        //  uint256 value = _values[i];
        // uint256 consumableId = _itemIds[i];
        ItemType memory itemType = s.itemTypes[_itemId];
        require(itemType.category == LibAppStorage.ITEM_CATEGORY_CONSUMABLE, "ItemsFacet: Item must be consumable");
        uint256 bal = s.items[msg.sender][_itemId];

        require(1 <= bal, "Items: Do not have that many to consume");
        s.items[msg.sender][_itemId] = bal - 1;

        //Increase kinship permanently
        if (itemType.kinshipBonus > 0) {
            s.aavegotchis[_tokenId].interactionCount += uint16(itemType.kinshipBonus);
        }

        //Boost traits and reset clock
        if (itemType.traitModifiers != 0) {
            s.aavegotchis[_tokenId].lastTemporaryBoost = uint40(block.timestamp);
            s.aavegotchis[_tokenId].temporaryTraitBoosts = itemType.traitModifiers;
        }

        //Increase experience
        if (itemType.experienceBonus > 0) {
            s.aavegotchis[_tokenId].experience += itemType.experienceBonus;
        }

        itemType.totalQuantity -= 1;
        LibAppStorage.interact(_tokenId);
        emit UseConsumable(_tokenId, _itemId);
        emit TransferSingle(msg.sender, msg.sender, address(0), _itemId, 1);
    }
}
