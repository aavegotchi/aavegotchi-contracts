// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {LibItems, ItemTypeIO} from "../libraries/LibItems.sol";
import {
    LibAppStorage,
    Modifiers,
    ItemType,
    Aavegotchi,
    ItemType,
    WearableSet,
    NUMERIC_TRAITS_NUM,
    EQUIPPED_WEARABLE_SLOTS,
    PORTAL_AAVEGOTCHIS_NUM
} from "../libraries/LibAppStorage.sol";
import {LibAavegotchi} from "../libraries/LibAavegotchi.sol";
import {LibStrings} from "../../shared/libraries/LibStrings.sol";
import {LibMeta} from "../../shared/libraries/LibMeta.sol";
import {LibERC1155Marketplace} from "../libraries/LibERC1155Marketplace.sol";
import {LibERC1155} from "../../shared/libraries/LibERC1155.sol";

// import "hardhat/console.sol";

contract ItemsFacet is Modifiers {
    //using LibAppStorage for AppStorage;

    event TransferToParent(address indexed _toContract, uint256 indexed _toTokenId, uint256 indexed _tokenTypeId, uint256 _value);

    event EquipWearables(uint256 indexed _tokenId, uint16[EQUIPPED_WEARABLE_SLOTS] _oldWearables, uint16[EQUIPPED_WEARABLE_SLOTS] _newWearables);
    event UseConsumables(uint256 indexed _tokenId, uint256[] _itemIds, uint256[] _quantities);

    uint16 internal constant SLOT_BODY = 0;
    uint16 internal constant SLOT_FACE = 1;
    uint16 internal constant SLOT_EYES = 2;
    uint16 internal constant SLOT_HEAD = 3;
    uint16 internal constant SLOT_HAND_LEFT = 4;
    uint16 internal constant SLOT_HAND_RIGHT = 5;
    uint16 internal constant SLOT_PET = 6;

    /***********************************|
   |             Read Functions         |
   |__________________________________*/

    struct ItemIdIO {
        uint256 itemId;
        uint256 balance;
    }

    // Returns balance for each item that exists for an account
    function itemBalances(address _account) external view returns (ItemIdIO[] memory bals_) {
        uint256 count = s.ownerItems[_account].length;
        bals_ = new ItemIdIO[](count);
        for (uint256 i; i < count; i++) {
            uint256 itemId = s.ownerItems[_account][i];
            bals_[i].balance = s.ownerItemBalances[_account][itemId];
            bals_[i].itemId = itemId;
        }
    }

    function itemBalancesWithTypes(address _owner) external view returns (ItemTypeIO[] memory output_) {
        uint256 count = s.ownerItems[_owner].length;
        output_ = new ItemTypeIO[](count);
        for (uint256 i; i < count; i++) {
            uint256 itemId = s.ownerItems[_owner][i];
            output_[i].balance = s.ownerItemBalances[_owner][itemId];
            output_[i].itemId = itemId;
            output_[i].itemType = s.itemTypes[itemId];
        }
    }

    /**
        @notice Get the balance of an account's tokens.
        @param _owner  The address of the token holder
        @param _id     ID of the token
        @return bal_    The _owner's balance of the token type requested
     */
    function balanceOf(address _owner, uint256 _id) external view returns (uint256 bal_) {
        bal_ = s.ownerItemBalances[_owner][_id];
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
        value = s.nftItemBalances[_tokenContract][_tokenId][_id];
    }

    // returns the balances for all items for a token
    function itemBalancesOfToken(address _tokenContract, uint256 _tokenId) external view returns (ItemIdIO[] memory bals_) {
        uint256 count = s.nftItems[_tokenContract][_tokenId].length;
        bals_ = new ItemIdIO[](count);
        for (uint256 i; i < count; i++) {
            uint256 itemId = s.nftItems[_tokenContract][_tokenId][i];
            bals_[i].itemId = itemId;
            bals_[i].balance = s.nftItemBalances[_tokenContract][_tokenId][itemId];
        }
    }

    function itemBalancesOfTokenWithTypes(address _tokenContract, uint256 _tokenId)
        external
        view
        returns (ItemTypeIO[] memory itemBalancesOfTokenWithTypes_)
    {
        itemBalancesOfTokenWithTypes_ = LibItems.itemBalancesOfTokenWithTypes(_tokenContract, _tokenId);
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
            bals[i] = s.ownerItemBalances[owner][id];
        }
    }

    function equippedWearables(uint256 _tokenId) external view returns (uint16[EQUIPPED_WEARABLE_SLOTS] memory wearableIds_) {
        wearableIds_ = s.aavegotchis[_tokenId].equippedWearables;
    }

    // Called by off chain software so not too concerned about gas costs
    function getWearableSets() external view returns (WearableSet[] memory wearableSets_) {
        wearableSets_ = s.wearableSets;
    }

    function getWearableSet(uint256 _index) public view returns (WearableSet memory wearableSet_) {
        uint256 length = s.wearableSets.length;
        require(_index < length, "ItemsFacet: Wearable set does not exist");
        wearableSet_ = s.wearableSets[_index];
    }

    function totalWearableSets() external view returns (uint256) {
        return s.wearableSets.length;
    }

    function getItemType(uint256 _itemId) public view returns (ItemType memory itemType_) {
        require(_itemId < s.itemTypes.length, "ItemsFacet: Item type doesn't exist");
        itemType_ = s.itemTypes[_itemId];
    }

    function getItemTypes(uint256[] calldata _itemIds) external view returns (ItemType[] memory itemTypes_) {
        if (_itemIds.length == 0) {
            itemTypes_ = s.itemTypes;
        } else {
            itemTypes_ = new ItemType[](_itemIds.length);
            for (uint256 i; i < _itemIds.length; i++) {
                itemTypes_[i] = s.itemTypes[_itemIds[i]];
            }
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
            emit LibERC1155.URI(LibStrings.strWithUint(_value, i), i);
        }
    }

    /***********************************|
   |             Write Functions        |
   |__________________________________*/

    function equipWearables(uint256 _tokenId, uint16[EQUIPPED_WEARABLE_SLOTS] calldata _equippedWearables) external onlyAavegotchiOwner(_tokenId) {
        Aavegotchi storage aavegotchi = s.aavegotchis[_tokenId];
        address sender = LibMeta.msgSender();

        uint256 aavegotchiLevel = LibAavegotchi.aavegotchiLevel(aavegotchi.experience);

        for (uint256 slot; slot < EQUIPPED_WEARABLE_SLOTS; slot++) {
            uint256 wearableId = _equippedWearables[slot];

            if (wearableId == 0) {
                continue;
            }
            ItemType storage itemType = s.itemTypes[wearableId];
            require(aavegotchiLevel >= itemType.minLevel, "ItemsFacet: Aavegotchi level lower than minLevel");
            require(itemType.category == LibItems.ITEM_CATEGORY_WEARABLE, "ItemsFacet: Only wearables can be equippped");
            require(itemType.slotPositions[slot] == true, "ItemsFacet: Wearable cannot be equipped in this slot");
            {
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
            }

            //Then check if this wearable is in the Aavegotchis inventory
            uint256 nftBalance = s.nftItemBalances[address(this)][_tokenId][wearableId];
            //To do (Nick) prevent wearable from being equipped twice in the same transaction
            uint256 neededBalance = 1;
            if (slot == LibItems.WEARABLE_SLOT_HAND_LEFT) {
                if (_equippedWearables[LibItems.WEARABLE_SLOT_HAND_RIGHT] == wearableId) {
                    neededBalance = 2;
                }
            }

            if (nftBalance < neededBalance) {
                uint256 ownerBalance = s.ownerItemBalances[sender][wearableId];
                require(nftBalance + ownerBalance >= neededBalance, "ItemsFacet: Wearable is not in inventories");
                uint256 balToTransfer = neededBalance - nftBalance;

                //Transfer to Aavegotchi
                LibItems.removeFromOwner(sender, wearableId, balToTransfer);
                LibItems.addToParent(address(this), _tokenId, wearableId, balToTransfer);
                emit TransferToParent(address(this), _tokenId, wearableId, balToTransfer);
                emit LibERC1155.TransferSingle(sender, sender, address(this), wearableId, balToTransfer);
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

            LibItems.removeFromOwner(sender, itemId, quantity);

            //Increase kinship permanently
            if (itemType.kinshipBonus > 0) {
                uint256 kinship = (uint256(int256(itemType.kinshipBonus)) * quantity) + s.aavegotchis[_tokenId].interactionCount;
                require(kinship <= type(uint16).max, "ItemsFacet: kinship beyond max value");
                s.aavegotchis[_tokenId].interactionCount = uint16(kinship);
            }
            {
                // prevent stack too deep error with braces here
                //Boost traits and reset clock
                bool boost = false;
                for (uint256 j; j < NUMERIC_TRAITS_NUM; j++) {
                    if (itemType.traitModifiers[j] != 0) {
                        boost = true;
                        break;
                    }
                }
                if (boost) {
                    s.aavegotchis[_tokenId].lastTemporaryBoost = uint40(block.timestamp);
                    s.aavegotchis[_tokenId].temporaryTraitBoosts = itemType.traitModifiers;
                }
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
        emit LibERC1155.TransferBatch(sender, sender, address(0), _itemIds, _quantities);
    }
}
