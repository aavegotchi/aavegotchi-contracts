// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {LibItems, ItemTypeIO} from "../libraries/LibItems.sol";
import {LibAppStorage, Modifiers, ItemType, Aavegotchi, ItemType, WearableSet, NUMERIC_TRAITS_NUM, EQUIPPED_WEARABLE_SLOTS, PORTAL_AAVEGOTCHIS_NUM, GotchiEquippedCommitmentsInfo, ItemRolesInfo} from "../libraries/LibAppStorage.sol";
import {LibAavegotchi} from "../libraries/LibAavegotchi.sol";
import {LibStrings} from "../../shared/libraries/LibStrings.sol";
import {LibMeta} from "../../shared/libraries/LibMeta.sol";
import {LibERC1155Marketplace} from "../libraries/LibERC1155Marketplace.sol";
import {LibERC1155} from "../../shared/libraries/LibERC1155.sol";

import "../WearableDiamond/interfaces/IEventHandlerFacet.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract ItemsFacet is Modifiers {
    //using LibAppStorage for AppStorage;
    using EnumerableSet for EnumerableSet.UintSet;

    event EquipWearables(uint256 indexed _tokenId, uint16[EQUIPPED_WEARABLE_SLOTS] _oldWearables, uint16[EQUIPPED_WEARABLE_SLOTS] _newWearables);
    event UseConsumables(uint256 indexed _tokenId, uint256[] _itemIds, uint256[] _quantities);
    event EquipDelegatedWearables(
        uint256 indexed _tokenId, 
        uint256[EQUIPPED_WEARABLE_SLOTS] _oldCommitmentIds, 
        uint256[EQUIPPED_WEARABLE_SLOTS] _newCommitmentIds
    );


    /***********************************|
   |             Read Functions         |
   |__________________________________*/

    struct ItemIdIO {
        uint256 itemId;
        uint256 balance;
    }

    ///@notice Returns balance for each item that exists for an account
    ///@param _account Address of the account to query
    ///@return bals_ An array of structs,each struct containing details about each item owned
    function itemBalances(address _account) external view returns (ItemIdIO[] memory bals_) {
        uint256 count = s.ownerItems[_account].length;
        bals_ = new ItemIdIO[](count);
        for (uint256 i; i < count; i++) {
            uint256 itemId = s.ownerItems[_account][i];
            bals_[i].balance = s.ownerItemBalances[_account][itemId];
            bals_[i].itemId = itemId;
        }
    }

    ///@notice Returns balance for each item(and their types) that exists for an account
    ///@param _owner Address of the account to query
    ///@return output_ An array of structs containing details about each item owned(including the item types)
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

    ///@notice Returns the balances for all ERC1155 items for a ERC721 token
    ///@dev Only valid for claimed aavegotchis
    ///@param _tokenContract Contract address for the token to query
    ///@param _tokenId Identifier of the token to query
    ///@return bals_ An array of structs containing details about each item owned
    function itemBalancesOfToken(address _tokenContract, uint256 _tokenId) external view returns (ItemIdIO[] memory bals_) {
        uint256 count = s.nftItems[_tokenContract][_tokenId].length;
        bals_ = new ItemIdIO[](count);
        for (uint256 i; i < count; i++) {
            uint256 itemId = s.nftItems[_tokenContract][_tokenId][i];
            bals_[i].itemId = itemId;
            bals_[i].balance = s.nftItemBalances[_tokenContract][_tokenId][itemId];
        }
    }

    ///@notice Returns the balances for all ERC1155 items for a ERC721 token
    ///@dev Only valid for claimed aavegotchis
    ///@param _tokenContract Contract address for the token to query
    ///@param _tokenId Identifier of the token to query
    ///@return itemBalancesOfTokenWithTypes_ An array of structs containing details about each item owned(including the types)
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

    ///@notice Query the current wearables equipped for an NFT
    ///@dev only valid for claimed aavegotchis
    ///@param _tokenId Identifier of the NFT to query
    ///@return wearableIds_ An array containing the Identifiers of the wearable items currently equipped for the NFT
    function equippedWearables(uint256 _tokenId) external view returns (uint16[EQUIPPED_WEARABLE_SLOTS] memory wearableIds_) {
        wearableIds_ = s.aavegotchis[_tokenId].equippedWearables;
    }

    ///@notice Query the item type of a particular item
    ///@param _itemId Item to query
    ///@return itemType_ A struct containing details about the item type of an item with identifier `_itemId`
    function getItemType(uint256 _itemId) public view returns (ItemType memory itemType_) {
        require(_itemId < s.itemTypes.length, "ItemsFacet: Item type doesn't exist");
        itemType_ = s.itemTypes[_itemId];
    }

    ///@notice Query the item type of multiple  items
    ///@param _itemIds An array containing the identifiers of items to query
    ///@return itemTypes_ An array of structs,each struct containing details about the item type of the corresponding item
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
        require(_id < s.itemTypes.length, "ItemsFacet: Item _id not found");
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
            //delegate event to wearableDiamond
            IEventHandlerFacet(s.wearableDiamond).emitUriEvent(LibStrings.strWithUint(_value, i), i);
        }
    }

    /***********************************|
   |             Write Functions        |
   |__________________________________*/

    ///@notice Allow the owner of a claimed aavegotchi to equip/unequip wearables to his aavegotchi
    ///@dev Only valid for claimed aavegotchis
    ///@dev A zero value will unequip that slot and a non-zero value will equip that slot with the wearable whose identifier is provided
    ///@dev A wearable cannot be equipped in the wrong slot
    ///@param _tokenId The identifier of the aavegotchi to make changes to
    ///@param _wearablesToEquip An array containing the identifiers of the wearables to equip
    function equipWearables(
        uint256 _tokenId,
        uint16[EQUIPPED_WEARABLE_SLOTS] calldata _wearablesToEquip
    )
        external
    {
        uint256[EQUIPPED_WEARABLE_SLOTS] memory _commitmentIds;
        _equipWearables(_tokenId, _wearablesToEquip, _commitmentIds);
    }

    ///@notice Allow the owner of a claimed aavegotchi to equip/unequip wearables to his aavegotchi
    ///@dev Only valid for claimed aavegotchis
    ///@dev A zero value will unequip that slot and a non-zero value will equip that slot with the wearable whose identifier is provided
    ///@dev A wearable cannot be equipped in the wrong slot
    ///@param _tokenId The identifier of the aavegotchi to make changes to
    ///@param _wearablesToEquip An array containing the identifiers of the wearables to equip
    ///@param _commitmentIds An array containing the identifiers of the deposited wearables to equip
    function equipDelegatedWearables(
        uint256 _tokenId,
        uint16[EQUIPPED_WEARABLE_SLOTS] calldata _wearablesToEquip,
        uint256[EQUIPPED_WEARABLE_SLOTS] calldata _commitmentIds
    )
        external
    {
        
        _equipWearables(_tokenId, _wearablesToEquip, _commitmentIds);
    }


    function _equipWearables(
        uint256 _tokenId,
        uint16[EQUIPPED_WEARABLE_SLOTS] calldata _wearablesToEquip,
        uint256[EQUIPPED_WEARABLE_SLOTS] memory _commitmentIdsToEquip
    )
        internal
        onlyAavegotchiOwner(_tokenId)
        onlyUnlocked(_tokenId)
    {
        Aavegotchi storage aavegotchi = s.aavegotchis[_tokenId];
        require(aavegotchi.status == LibAavegotchi.STATUS_AAVEGOTCHI, "LibAavegotchi: Only valid for AG");
        emit EquipWearables(_tokenId, aavegotchi.equippedWearables, _wearablesToEquip);
        emit EquipDelegatedWearables(_tokenId, s.gotchiEquippedItemsInfo[_tokenId].equippedCommitmentIds, _commitmentIdsToEquip);
        GotchiEquippedCommitmentsInfo storage _gotchiInfo = s.gotchiEquippedItemsInfo[_tokenId];

        for (uint256 slot; slot < EQUIPPED_WEARABLE_SLOTS; slot++) {
            
            uint256 toEquipId = _wearablesToEquip[slot];
            uint256 existingEquippedWearableId = aavegotchi.equippedWearables[slot];
            bool _sameWearablesIds = toEquipId == existingEquippedWearableId;

            uint256 _commitmentIdToEquip = _commitmentIdsToEquip[slot];
            uint256 _existingEquippedCommitmentId = _gotchiInfo.equippedCommitmentIds[slot];

            //If the new wearable value is equal to the current equipped wearable in that slot
            //do nothing
            if (_sameWearablesIds && _existingEquippedCommitmentId == _commitmentIdToEquip) {
                continue;
            }

            //If a wearable was equipped in this slot and can be transferred, transfer back to owner.
            
            if (existingEquippedWearableId != 0 && s.itemTypes[existingEquippedWearableId].canBeTransferred) {
                // Unequip wearable (Sets to 0)
                delete aavegotchi.equippedWearables[slot];
                // remove wearable from Aavegotchi and transfer item to owner
                _removeWearableFromGotchi(_tokenId, existingEquippedWearableId, slot, _gotchiInfo);
            }

            //If a wearable is being equipped
            if (toEquipId != 0) {
                ItemType storage itemType = s.itemTypes[toEquipId];
                require(LibAavegotchi.aavegotchiLevel(aavegotchi.experience) >= itemType.minLevel, "ItemsFacet: AG level lower than minLevel");
                require(itemType.category == LibItems.ITEM_CATEGORY_WEARABLE, "ItemsFacet: Only wearables can be equippped");
                require(itemType.slotPositions[slot] == true, "ItemsFacet: Wearable can't be equipped in slot");
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
                        require(canBeEquipped, "ItemsFacet: Wearable can't be used for this collateral");
                    }
                }
                
                //Equips new wearable
                aavegotchi.equippedWearables[slot] = uint16(toEquipId);

                //Transfer to Aavegotchi
                _addWearableToGotchi(_commitmentIdToEquip, _tokenId, toEquipId, slot, _gotchiInfo);
            }
        }
        LibAavegotchi.interact(_tokenId);
    }

    function _addWearableToGotchi(
        uint256 _commitmentId,
        uint256 _gotchiId,
        uint256 _toEquipWearableId,
        uint256 _slot,
        GotchiEquippedCommitmentsInfo storage _gotchiInfo
    ) internal {
        
        address _sender = LibMeta.msgSender();
        
        if (_commitmentId != 0) {
            ItemRolesInfo storage _commitmentInfo = s.itemRolesCommitmentInfo[_commitmentId];

            require(_commitmentInfo.roleAssignment.grantee == _sender, "ItemsFacet: Wearable not delegated to sender or commitmentId not valid");
            require(_commitmentInfo.roleAssignment.expirationDate > block.timestamp, "ItemsFacet: Wearable delegation expired");
            require(_commitmentInfo.commitment.tokenId == _toEquipWearableId, "ItemsFacet: Delegated Wearable not of this delegation");
            require((_commitmentInfo.commitment.tokenAmount - _commitmentInfo.balanceUsed) > 0, "ItemsFacet: Not enough delegated balance");
            
            _gotchiInfo.equippedCommitmentIds[_slot] = _commitmentId;
            _gotchiInfo.equippedCommitmentIdsCount++;
            _commitmentInfo.balanceUsed++;
            _commitmentInfo.equippedGotchis.add(_gotchiId);
        } else {
            require(s.ownerItemBalances[_sender][_toEquipWearableId] >= 1, "ItemsFacet: Wearable isn't in inventory");

            LibItems.removeFromOwner(_sender, _toEquipWearableId, 1);
            IEventHandlerFacet(s.wearableDiamond).emitTransferSingleEvent(_sender, _sender, address(this), _toEquipWearableId, 1);
            LibERC1155Marketplace.updateERC1155Listing(address(this), _toEquipWearableId, _sender);
        }

        LibItems.addToParent(address(this), _gotchiId, _toEquipWearableId, 1);
        emit LibERC1155.TransferToParent(address(this), _gotchiId, _toEquipWearableId, 1);
    }
    
    function _removeWearableFromGotchi(
        uint256 _gotchiId,
        uint256 _existingEquippedWearableId,
        uint256 _slot,
        GotchiEquippedCommitmentsInfo storage _gotchiInfo
    ) internal {
       
        LibItems.removeFromParent(address(this), _gotchiId, _existingEquippedWearableId, 1);
        emit LibERC1155.TransferFromParent(address(this), _gotchiId, _existingEquippedWearableId, 1);
        
        address _sender = LibMeta.msgSender();
        uint256 _commitmentIdToUnequip = _gotchiInfo.equippedCommitmentIds[_slot];
        
        if (_commitmentIdToUnequip != 0) {
            // remove wearable from Aavegotchi and delete delegation
            ItemRolesInfo storage _commitmentInfo = s.itemRolesCommitmentInfo[_commitmentIdToUnequip];
            bool _sameHandDelegationEquipped =
                (
                    _slot == LibItems.WEARABLE_SLOT_HAND_LEFT &&
                    _gotchiInfo.equippedCommitmentIds[LibItems.WEARABLE_SLOT_HAND_RIGHT] == _commitmentIdToUnequip
                ) ||
                (
                    _slot == LibItems.WEARABLE_SLOT_HAND_RIGHT &&
                    _gotchiInfo.equippedCommitmentIds[LibItems.WEARABLE_SLOT_HAND_LEFT] == _commitmentIdToUnequip
                );
                
            if(!_sameHandDelegationEquipped) {
                _commitmentInfo.equippedGotchis.remove(_gotchiId);
            }
            
            _commitmentInfo.balanceUsed--;
            _gotchiInfo.equippedCommitmentIdsCount--;
            delete _gotchiInfo.equippedCommitmentIds[_slot];
        } else {
            // Remove wearable from Aavegotchi and transfer item to owner
            LibItems.addToOwner(_sender, _existingEquippedWearableId, 1);
            IEventHandlerFacet(s.wearableDiamond).emitTransferSingleEvent(_sender, address(this), _sender, _existingEquippedWearableId, 1);
        }
    }

    ///@notice Allow the owner of an NFT to use multiple consumable items for his aavegotchi
    ///@dev Only valid for claimed aavegotchis
    ///@dev Consumables can be used to boost kinship/XP of an aavegotchi
    ///@param _tokenId Identtifier of aavegotchi to use the consumables on
    ///@param _itemIds An array containing the identifiers of the items/consumables to use
    ///@param _quantities An array containing the quantity of each consumable to use
    function useConsumables(
        uint256 _tokenId,
        uint256[] calldata _itemIds,
        uint256[] calldata _quantities
    ) external onlyUnlocked(_tokenId) onlyAavegotchiOwner(_tokenId) {
        require(_itemIds.length == _quantities.length, "ItemsFacet: _itemIds length != _quantities length");
        require(s.aavegotchis[_tokenId].status == LibAavegotchi.STATUS_AAVEGOTCHI, "LibAavegotchi: Only valid for AG");

        address sender = LibMeta.msgSender();
        for (uint256 i; i < _itemIds.length; i++) {
            uint256 itemId = _itemIds[i];
            uint256 quantity = _quantities[i];
            ItemType memory itemType = s.itemTypes[itemId];
            require(itemType.category == LibItems.ITEM_CATEGORY_CONSUMABLE, "ItemsFacet: Item isn't consumable");

            LibItems.removeFromOwner(sender, itemId, quantity);

            //Increase kinship
            if (itemType.kinshipBonus > 0) {
                uint256 kinship = (uint256(int256(itemType.kinshipBonus)) * quantity) + s.aavegotchis[_tokenId].interactionCount;
                s.aavegotchis[_tokenId].interactionCount = kinship;
            } else if (itemType.kinshipBonus < 0) {
                uint256 kinshipBonus = LibAppStorage.abs(itemType.kinshipBonus) * quantity;
                if (s.aavegotchis[_tokenId].interactionCount > kinshipBonus) {
                    s.aavegotchis[_tokenId].interactionCount -= kinshipBonus;
                } else {
                    s.aavegotchis[_tokenId].interactionCount = 0;
                }
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
                s.aavegotchis[_tokenId].experience = experience;
            }

            itemType.totalQuantity -= quantity;
            LibAavegotchi.interact(_tokenId);
            LibERC1155Marketplace.updateERC1155Listing(address(this), itemId, sender);
        }
        emit UseConsumables(_tokenId, _itemIds, _quantities);
        IEventHandlerFacet(s.wearableDiamond).emitTransferBatchEvent(sender, sender, address(0), _itemIds, _quantities);
    }
}
