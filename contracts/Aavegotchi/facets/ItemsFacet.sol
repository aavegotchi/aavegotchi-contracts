// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {LibItems, ItemTypeIO} from "../libraries/LibItems.sol";
import {LibAppStorage, Modifiers, ItemType, Aavegotchi, ItemType, WearableSet, NUMERIC_TRAITS_NUM, EQUIPPED_WEARABLE_SLOTS, PORTAL_AAVEGOTCHIS_NUM, GotchiEquippedDepositsInfo, ItemRolesInfo} from "../libraries/LibAppStorage.sol";
import {LibAavegotchi} from "../libraries/LibAavegotchi.sol";
import {LibStrings} from "../../shared/libraries/LibStrings.sol";
import {LibMeta} from "../../shared/libraries/LibMeta.sol";
import {LibERC1155Marketplace} from "../libraries/LibERC1155Marketplace.sol";
import {LibERC1155} from "../../shared/libraries/LibERC1155.sol";

import "../WearableDiamond/interfaces/IEventHandlerFacet.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {LibDelegatedWearables} from "../libraries/LibDelegatedWearables.sol";
import {LibItemsEvents} from "../libraries/LibItemsEvents.sol";

contract ItemsFacet is Modifiers {
    //using LibAppStorage for AppStorage;
    using EnumerableSet for EnumerableSet.UintSet;

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
    function itemBalances(address _account) public view returns (ItemIdIO[] memory bals_) {
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
    function balanceOfToken(address _tokenContract, uint256 _tokenId, uint256 _id) external view returns (uint256 value) {
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
    function itemBalancesOfTokenWithTypes(
        address _tokenContract,
        uint256 _tokenId
    ) external view returns (ItemTypeIO[] memory itemBalancesOfTokenWithTypes_) {
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
    ) public onlyAavegotchiOwner(_tokenId) onlyUnlocked(_tokenId) {
        uint256[EQUIPPED_WEARABLE_SLOTS] memory _depositIds;
        _equipWearables(_tokenId, _wearablesToEquip, _depositIds);
    }

    ///@notice Allow the owner of a claimed aavegotchi to equip/unequip wearables to his aavegotchi
    ///@dev Only valid for claimed aavegotchis
    ///@dev A zero value will unequip that slot and a non-zero value will equip that slot with the wearable whose identifier is provided
    ///@dev A wearable cannot be equipped in the wrong slot
    ///@param _tokenId The identifier of the aavegotchi to make changes to
    ///@param _wearablesToEquip An array containing the identifiers of the wearables to equip
    ///@param _depositIds An array containing the identifiers of the deposited wearables to equip
    function equipDelegatedWearables(
        uint256 _tokenId,
        uint16[EQUIPPED_WEARABLE_SLOTS] calldata _wearablesToEquip,
        uint256[EQUIPPED_WEARABLE_SLOTS] calldata _depositIds
    ) public onlyAavegotchiOwner(_tokenId) onlyUnlocked(_tokenId) {
        _equipWearables(_tokenId, _wearablesToEquip, _depositIds);
    }

    ///@notice Allow the owner of a claimed aavegotchi to equip/unequip wearables to his aavegotchis in batch
    ///@dev Arrays in _wearablesToEquip need to be the same length as _tokenIds
    ///@dev _wearablesToEquip are equiped to aavegotchis in the order of _tokenIds
    ///@param _tokenIds Array containing the identifiers of the aavegotchis to make changes to
    ///@param _wearablesToEquip An array of arrays containing the identifiers of the wearables to equip for aavegotchi in _tokenIds
    function batchEquipWearables(uint256[] calldata _tokenIds, uint16[EQUIPPED_WEARABLE_SLOTS][] calldata _wearablesToEquip) external {
        require(_wearablesToEquip.length == _tokenIds.length, "ItemsFacet: _wearablesToEquip length not same as _tokenIds length");
        for (uint256 i = 0; i < _tokenIds.length; i++) {
            equipWearables(_tokenIds[i], _wearablesToEquip[i]);
        }
    }

    ///@notice Allow the owner of a claimed aavegotchi to equip/unequip wearables to his aavegotchis in batch
    ///@dev Arrays in _wearablesToEquip need to be the same length as _tokenIds
    ///@dev _wearablesToEquip are equiped to aavegotchis in the order of _tokenIds
    ///@dev _depositIds are equiped to aavegotchis in the order of _tokenIds
    ///@param _tokenIds Array containing the identifiers of the aavegotchis to make changes to
    ///@param _wearablesToEquip An array of arrays containing the identifiers of the wearables to equip for aavegotchis in _tokenIds
    ///@param _depositIds An array of arrays containing the identifiers of the deposited wearables to equip for aavegotchis in _tokenIds
    function batchEquipDelegatedWearables(
        uint256[] calldata _tokenIds,
        uint16[EQUIPPED_WEARABLE_SLOTS][] calldata _wearablesToEquip,
        uint256[EQUIPPED_WEARABLE_SLOTS][] calldata _depositIds
    ) external {
        require(_wearablesToEquip.length == _tokenIds.length, "ItemsFacet: _wearablesToEquip length not same as _tokenIds length");
        require(_depositIds.length == _tokenIds.length, "ItemsFacet: _depositIds length not same as _tokenIds length");
        for (uint256 i = 0; i < _tokenIds.length; i++) {
            equipDelegatedWearables(_tokenIds[i], _wearablesToEquip[i], _depositIds[i]);
        }
    }

    function _equipWearables(
        uint256 _tokenId,
        uint16[EQUIPPED_WEARABLE_SLOTS] calldata _wearablesToEquip,
        uint256[EQUIPPED_WEARABLE_SLOTS] memory _depositIdsToEquip
    ) internal diamondPaused {
        Aavegotchi storage aavegotchi = s.aavegotchis[_tokenId];

        // Get the GotchiEquippedDepositsInfo struct
        GotchiEquippedDepositsInfo storage gotchiDepositInfo = s.gotchiEquippedDepositsInfo[_tokenId];

        // Only valid for claimed aavegotchis
        require(aavegotchi.status == LibAavegotchi.STATUS_AAVEGOTCHI, "LibAavegotchi: Only valid for AG");
        emit LibItemsEvents.EquipWearables(_tokenId, aavegotchi.equippedWearables, _wearablesToEquip);
        emit LibItemsEvents.EquipDelegatedWearables(_tokenId, gotchiDepositInfo.equippedDepositIds, _depositIdsToEquip);

        address sender = LibMeta.msgSender();

        for (uint256 slot; slot < EQUIPPED_WEARABLE_SLOTS; slot++) {
            uint256 toEquipId = _wearablesToEquip[slot];
            uint256 existingEquippedWearableId = aavegotchi.equippedWearables[slot];

            uint256 depositIdToEquip = _depositIdsToEquip[slot];
            uint256 existingEquippedDepositId = gotchiDepositInfo.equippedDepositIds[slot];

            // Users might replace Wearables they own with delegated Werables.
            // For this reason, we only skip this slot if both the Wearable tokenId & depositId match
            if (toEquipId == existingEquippedWearableId && existingEquippedDepositId == depositIdToEquip) {
                continue;
            }

            // To prevent the function `removeFromParent` to revert, it's necessary first to unequip this Wearable (delete from storage slot)
            // This is an edge case introduced by delegated Wearables, since users can now equip and unequip Wearables of same tokenId (but different depositId)
            // This is also necessary regardless of whether the item is transferrable or not. Non-transferrable items can still be equipped/unequipped (they just aren't transferred back to the user's wallet)
            delete aavegotchi.equippedWearables[slot];

            //Handle unequipping wearable case
            if (existingEquippedWearableId != 0 && s.itemTypes[existingEquippedWearableId].canBeTransferred) {
                //If no deposits have been made to this gotchi for this slot, it's a normal wearable unequipping case.
                if (gotchiDepositInfo.equippedDepositIds[slot] == 0) {
                    // remove wearable from Aavegotchi and transfer item to owner
                    LibItems.removeFromParent(address(this), _tokenId, existingEquippedWearableId, 1);
                    LibItems.addToOwner(sender, existingEquippedWearableId, 1);
                    IEventHandlerFacet(s.wearableDiamond).emitTransferSingleEvent(sender, address(this), sender, existingEquippedWearableId, 1);
                    emit LibERC1155.TransferFromParent(address(this), _tokenId, existingEquippedWearableId, 1);
                } else {
                    // remove wearable from Aavegotchi
                    LibDelegatedWearables.removeDelegatedWearableFromGotchi(slot, _tokenId, existingEquippedWearableId);
                }
            }

            //Handle equipping wearables case
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

                // Equips new Wearable
                // Wearable is equipped one by one, even if hands has the same id (but different depositId)
                aavegotchi.equippedWearables[slot] = uint16(toEquipId);
                gotchiDepositInfo.equippedDepositIds[slot] = depositIdToEquip;

                // If no deposits have been made to this gotchi for this slot, it's a normal wearable equipping case.
                if (depositIdToEquip == 0) {
                    // We need to check if wearable is already in the inventory, if it is, we don't transfer it from the owner
                    uint256 maxBalance = slot == LibItems.WEARABLE_SLOT_HAND_LEFT || slot == LibItems.WEARABLE_SLOT_HAND_RIGHT ? 2 : 1;
                    if (s.nftItemBalances[address(this)][_tokenId][toEquipId] >= maxBalance) continue;
                    require(s.ownerItemBalances[sender][toEquipId] >= 1, "ItemsFacet: Wearable isn't in inventory");

                    //Transfer to Aavegotchi
                    LibItems.removeFromOwner(sender, toEquipId, 1);
                    LibItems.addToParent(address(this), _tokenId, toEquipId, 1);
                    emit LibERC1155.TransferToParent(address(this), _tokenId, toEquipId, 1);
                    IEventHandlerFacet(s.wearableDiamond).emitTransferSingleEvent(sender, sender, address(this), toEquipId, 1);
                    LibERC1155Marketplace.updateERC1155Listing(address(this), toEquipId, sender);
                } else {
                    // add wearable to Aavegotchi and add delegation
                    LibDelegatedWearables.addDelegatedWearableToGotchi(depositIdToEquip, _tokenId, toEquipId);
                }
            }
        }
        LibAavegotchi.interact(_tokenId);
    }
}
