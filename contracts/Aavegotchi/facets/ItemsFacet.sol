// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {LibItems} from "../libraries/LibItems.sol";
import {LibAppStorage, LibAppStorageModifiers, ItemType, Aavegotchi} from "../libraries/LibAppStorage.sol";
import {LibAavegotchi, NUMERIC_TRAITS_NUM} from "../libraries/LibAavegotchi.sol";
import {LibStrings} from "../../shared/libraries/LibStrings.sol";
import {LibMeta} from "../../shared/libraries/LibMeta.sol";
import {LibERC1155Marketplace} from "../libraries/LibERC1155Marketplace.sol";

// import "hardhat/console.sol";

contract ItemsFacet is LibAppStorageModifiers {
    //using LibAppStorage for AppStorage;

    event TransferToParent(address indexed _toContract, uint256 indexed _toTokenId, uint256 indexed _tokenTypeId, uint256 _value);
    event Transfer(address indexed _from, address indexed _to, uint256 indexed _tokenId);

    event EquipWearables(uint256 indexed _tokenId, uint256 _oldWearables, uint256 _newWearables);

    event UseConsumables(uint256 indexed _tokenId, uint256[] _itemIds, uint256[] _quantities);

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

    event TransferSingle(address indexed _operator, address indexed _from, address indexed _to, uint256 _id, uint256 _value);
    event TransferBatch(address indexed _operator, address indexed _from, address indexed _to, uint256[] _ids, uint256[] _values);

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
        for (uint256 id; id < count; id++) {
            bals_[id] = s.items[_account][id];
        }
    }

    struct BalanceItemTypeIO {
        uint256[] balances;
        ItemType[] itemTypes;
    }

    function balancesWithItemTypes(address _account) external view returns (BalanceItemTypeIO memory output_) {
        uint256 count = s.itemTypes.length;
        uint256[] memory bals_ = new uint256[](count);
        ItemType[] memory itemTypes_ = new ItemType[](count);
        for (uint256 id; id < count; id++) {
            bals_[id] = s.items[_account][id];
            itemTypes_[id] = s.itemTypes[id];
        }

        output_.balances = bals_;
        output_.itemTypes = itemTypes_;

        return output_;
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
        for (uint256 id; id < count; id++) {
            bals_[id] = s.nftBalances[_tokenContract][_tokenId][id];
        }
    }

    function slotPositionsToArray(uint256 _itemId) internal view returns (uint256[] memory slotPositions_) {
        uint256 slotPositions = s.itemTypes[_itemId].slotPositions;
        slotPositions_ = new uint256[](16);
        uint256 numSlots;
        for (uint256 i; i < 16; i++) {
            if ((slotPositions >> i) & 1 == 1) {
                slotPositions_[numSlots] = i;
                numSlots++;
            }
        }
        assembly {
            mstore(slotPositions_, numSlots)
        }
    }

    struct ItemBalanceWithSlotsIO {
        uint256 itemId;
        uint256 balance;
        uint256[] slotPositions;
        string name;
        int256[] traitModifiers;
        uint256 minLevel;
    }

    function itemBalancesOfTokenWithSlots(address _tokenContract, uint256 _tokenId)
        external
        view
        returns (ItemBalanceWithSlotsIO[] memory itemBalanceWithSlots_)
    {
        uint256 count = s.itemTypes.length;
        itemBalanceWithSlots_ = new ItemBalanceWithSlotsIO[](count);
        uint256 numItems;
        for (uint256 id; id < count; id++) {
            uint256 bal = s.nftBalances[_tokenContract][_tokenId][id];
            if (bal == 0) {
                continue;
            }
            itemBalanceWithSlots_[numItems].itemId = id;
            itemBalanceWithSlots_[numItems].balance = bal;
            itemBalanceWithSlots_[numItems].slotPositions = slotPositionsToArray(id);
            itemBalanceWithSlots_[numItems].name = s.itemTypes[id].name;
            uint256 traitModifiers = s.itemTypes[id].traitModifiers;
            for (uint256 i; i < NUMERIC_TRAITS_NUM; i++) {
                itemBalanceWithSlots_[numItems].traitModifiers[i] = int8(uint8(traitModifiers >> (i * 8)));
            }
            itemBalanceWithSlots_[numItems].minLevel = s.itemTypes[id].minLevel;
            numItems++;
        }
        assembly {
            mstore(itemBalanceWithSlots_, numItems)
        }
    }

    function itemBalancesWithSlots(address _owner) external view returns (ItemBalanceWithSlotsIO[] memory itemBalanceWithSlots_) {
        uint256 count = s.itemTypes.length;
        itemBalanceWithSlots_ = new ItemBalanceWithSlotsIO[](count);
        uint256 numItems;
        for (uint256 id; id < count; id++) {
            uint256 bal = s.items[_owner][id];
            if (bal == 0) {
                continue;
            }
            itemBalanceWithSlots_[numItems].itemId = id;
            itemBalanceWithSlots_[numItems].balance = bal;
            itemBalanceWithSlots_[numItems].slotPositions = slotPositionsToArray(id);
            itemBalanceWithSlots_[numItems].name = s.itemTypes[id].name;
            uint256 traitModifiers = s.itemTypes[id].traitModifiers;
            for (uint256 i; i < NUMERIC_TRAITS_NUM; i++) {
                itemBalanceWithSlots_[numItems].traitModifiers[i] = int8(uint8(traitModifiers >> (i * 8)));
            }
            itemBalanceWithSlots_[numItems].minLevel = s.itemTypes[id].minLevel;
            numItems++;
        }
        assembly {
            mstore(itemBalanceWithSlots_, numItems)
        }
    }

    /**
        @notice Get the balance of multiple account/token pairs
        @param _owners The addresses of the token holders
        @param _ids    ID of the tokens
        @return bals   The _owner's balance of the token types requested (i.e. balance for each (owner, id) pair)
     */
    function balanceOfBatch(address[] calldata _owners, uint256[] calldata _ids) external view returns (uint256[] memory bals) {
        require(_owners.length == _ids.length, "ItemsFacet: _owners length not same as _ids length");
        bals = new uint256[](_owners.length);
        for (uint256 i; i < _owners.length; i++) {
            uint256 id = _ids[i];
            address owner = _owners[i];
            bals[i] = s.items[owner][id];
        }
    }

    function equippedWearables(uint256 _tokenId) external view returns (uint256[16] memory wearableIds_) {
        uint256 l_equippedWearables = s.aavegotchis[_tokenId].equippedWearables;
        for (uint256 i; i < 16; i++) {
            wearableIds_[i] = uint16(l_equippedWearables >> (i * 16));
        }
    }

    struct WearableSetIO {
        string name;
        uint8[] allowedCollaterals;
        uint256[16] wearableIds;
        int256[5] traitsBonuses;
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
        wearableSet_.allowedCollaterals = s.wearableSets[_index].allowedCollaterals;
        wearableSet_.wearableIds = LibAppStorage.uintToSixteenBitArray(s.wearableSets[_index].wearableIds);
        uint256 traitsBonuses = s.wearableSets[_index].traitsBonuses;
        for (uint256 i; i < 5; i++) {
            wearableSet_.traitsBonuses[i] = int8(uint8(traitsBonuses >> (8 * i)));
        }
    }

    function totalWearableSets() external view returns (uint256) {
        return s.wearableSets.length;
    }

    struct ItemTypeIO {
        // treated as int8s array
        // [Experience, Rarity Score, Kinship, Eye Color, Eye Shape, Brain Size, Spookiness, Aggressiveness, Energy]
        int256[NUMERIC_TRAITS_NUM] traitModifiers; //[WEARABLE ONLY] How much the wearable modifies each trait. Should not be more than +-5 total
        // this is an array of uint indexes into the collateralTypes array

        uint8[] allowedCollaterals; //[WEARABLE ONLY] The collaterals this wearable can be equipped to. An empty array is "any"
        string name; //The name of the item
        uint96 ghstPrice; //How much GHST this item costs
        uint32 svgId; //The svgId of the item
        uint32 maxQuantity; //Total number that can be minted of this item.
        uint8 rarityScoreModifier; //Number from 1-50.
        // Each bit is a slot position. 1 is true, 0 is false
        bool[16] slotPositions; //[WEARABLE ONLY] The slots that this wearable can be added to.
        bool canPurchaseWithGhst;
        uint32 totalQuantity; //The total quantity of this item minted so far
        uint8 minLevel; //The minimum Aavegotchi level required to use this item. Default is 1.
        bool canBeTransferred;
        uint8 category; // 0 is wearable, 1 is badge, 2 is consumable
        int8 kinshipBonus; //[CONSUMABLE ONLY] How much this consumable boosts (or reduces) kinship score
        uint32 experienceBonus; //[CONSUMABLE ONLY]
        uint256 x;
        uint256 y;
        uint256 width;
        uint256 height;
        string description;
        string author;
    }

    function getItemType(uint256 _itemId) public view returns (ItemTypeIO memory itemType_) {
        require(_itemId < s.itemTypes.length, "ItemsFacet: Item type doesn't exist");
        ItemType storage itemType = s.itemTypes[_itemId];
        uint256 traitModifiers = itemType.traitModifiers;
        for (uint256 i; i < NUMERIC_TRAITS_NUM; i++) {
            itemType_.traitModifiers[i] = int8(uint8(traitModifiers >> (i * 8)));
        }
        itemType_.allowedCollaterals = itemType.allowedCollaterals;
        itemType_.name = itemType.name;
        itemType_.ghstPrice = itemType.ghstPrice;
        itemType_.svgId = itemType.svgId;
        itemType_.maxQuantity = itemType.maxQuantity;
        itemType_.rarityScoreModifier = itemType.rarityScoreModifier;
        for (uint256 i; i < 16; i++) {
            itemType_.slotPositions[i] = ((itemType.slotPositions >> i) & 1) == 1;
        }
        itemType_.canPurchaseWithGhst = itemType.canPurchaseWithGhst;
        itemType_.totalQuantity = itemType.totalQuantity;
        itemType_.minLevel = itemType.minLevel; //The minimum Aavegotchi level required to use this item. Default is 1.
        itemType_.canBeTransferred = itemType.canBeTransferred;
        itemType_.category = itemType.category;
        itemType_.kinshipBonus = itemType.kinshipBonus;
        itemType_.experienceBonus = itemType.experienceBonus;
        uint256 dimensions = itemType.dimensions;
        itemType_.x = uint8(dimensions);
        itemType_.y = uint8(dimensions >> 8);
        itemType_.width = uint8(dimensions >> 16);
        itemType_.height = uint8(dimensions >> 24);
        itemType_.description = itemType.description;
        itemType_.author = itemType.author;
    }

    function getItemTypes(uint256[] calldata _itemIds) external view returns (ItemTypeIO[] memory itemTypes_) {
        itemTypes_ = new ItemTypeIO[](_itemIds.length);
        for (uint256 i; i < _itemIds.length; i++) {
            itemTypes_[i] = getItemType(_itemIds[i]);
        }
    }

    /**
        @notice Get the URI for a voucher type
        @return URI for token type
    */
    function uri(uint256 _id) external view returns (string memory) {
        require(_id < s.itemTypes.length, "ItemsFacet: _id not found for item");
        return LibStrings.strWithUint(s.itemsBaseUri, _id);
    }

    /**
        @notice Set the base url for all voucher types
        @param _value The new base url        
    */
    function setBaseURI(string memory _value) external onlyDaoOrOwner {
        // require(LibMeta.msgSender() == s.contractOwner, "ItemsFacet: Must be contract owner");
        s.itemsBaseUri = _value;
        for (uint256 i; i < s.itemTypes.length; i++) {
            emit URI(LibStrings.strWithUint(_value, i), i);
        }
    }

    /***********************************|
   |             Write Functions        |
   |__________________________________*/

    function equipWearables(uint256 _tokenId, uint256 _equippedWearables) external onlyAavegotchiOwner(_tokenId) {
        Aavegotchi storage aavegotchi = s.aavegotchis[_tokenId];
        address sender = LibMeta.msgSender();

        uint256 aavegotchiLevel = LibAavegotchi.aavegotchiLevel(aavegotchi.experience);

        for (uint256 slot; slot < 16; slot++) {
            uint256 wearableId = uint16(_equippedWearables >> (16 * slot));

            if (wearableId == 0) {
                continue;
            }
            ItemType storage itemType = s.itemTypes[wearableId];
            require(aavegotchiLevel >= itemType.minLevel, "ItemsFacet: Aavegotchi level lower than minLevel");
            require(itemType.category == LibItems.ITEM_CATEGORY_WEARABLE, "ItemsFacet: Only wearables can be equippped");

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
                require(canBeEquipped, "ItemsFacet: Wearable cannot be equipped in this collateral type");
            }

            //Then check if this wearable is in the Aavegotchis inventory
            uint256 balance = s.nftBalances[address(this)][_tokenId][wearableId];
            //To do (Nick) prevent wearable from being equipped twice in the same transaction

            if (balance == 0) {
                balance = s.items[sender][wearableId];
                require(balance > 0, "ItemsFacet: Wearable is not in inventories");

                //Transfer to Aavegotchi
                s.items[sender][wearableId] = balance - 1;
                s.nftBalances[address(this)][_tokenId][wearableId] += 1;
                emit TransferToParent(address(this), _tokenId, wearableId, 1);
                emit TransferSingle(sender, sender, address(this), wearableId, 1);
                LibERC1155Marketplace.updateERC1155Listing(address(this), wearableId, sender);
            }
        }
        emit EquipWearables(_tokenId, aavegotchi.equippedWearables, _equippedWearables);
        aavegotchi.equippedWearables = _equippedWearables;
        LibAavegotchi.interact(_tokenId);
    }

    function useConsumables(
        uint256 _tokenId,
        uint256[] calldata _itemIds,
        uint256[] calldata _quantities
    ) external onlyUnlocked(_tokenId) onlyAavegotchiOwner(_tokenId) {
        require(_itemIds.length == _quantities.length, "ItemsFacet: _itemIds length does not match _quantities length");
        address sender = LibMeta.msgSender();
        for (uint256 i; i < _itemIds.length; i++) {
            uint256 itemId = _itemIds[i];
            uint256 quantity = _quantities[i];
            ItemType memory itemType = s.itemTypes[itemId];
            require(itemType.category == LibItems.ITEM_CATEGORY_CONSUMABLE, "ItemsFacet: Item must be consumable");

            {
                // prevent stack too deep error with braces here
                uint256 bal = s.items[sender][itemId];
                require(quantity <= bal, "Items: Do not have that many to consume");
                s.items[sender][itemId] = bal - quantity;
            }
            //Increase kinship permanently
            if (itemType.kinshipBonus > 0) {
                uint256 kinship = (uint256(int256(itemType.kinshipBonus)) * quantity) + s.aavegotchis[_tokenId].interactionCount;
                require(kinship <= type(uint16).max, "ItemsFacet: kinship beyond max value");
                s.aavegotchis[_tokenId].interactionCount = uint16(kinship);
            }

            //Boost traits and reset clock
            if (itemType.traitModifiers != 0) {
                s.aavegotchis[_tokenId].lastTemporaryBoost = uint40(block.timestamp);
                s.aavegotchis[_tokenId].temporaryTraitBoosts = itemType.traitModifiers;
            }

            //Increase experience
            if (itemType.experienceBonus > 0) {
                uint256 experience = (uint256(itemType.experienceBonus) * quantity) + s.aavegotchis[_tokenId].experience;
                require(experience <= type(uint32).max, "ItemsFacet: Experience beyond max value");
                s.aavegotchis[_tokenId].experience = uint32(experience);
            }

            itemType.totalQuantity -= uint32(quantity);
            LibAavegotchi.interact(_tokenId);
            LibERC1155Marketplace.updateERC1155Listing(address(this), itemId, sender);
        }
        emit UseConsumables(_tokenId, _itemIds, _quantities);
        emit TransferBatch(sender, sender, address(0), _itemIds, _quantities);
    }
}
