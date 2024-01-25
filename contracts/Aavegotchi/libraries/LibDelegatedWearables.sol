// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {ItemRolesInfo, GotchiEquippedDepositsInfo, LibAppStorage, AppStorage} from "../libraries/LibAppStorage.sol";
import {LibItems} from "../libraries/LibItems.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {LibERC1155} from "../../shared/libraries/LibERC1155.sol";
import {LibMeta} from "../../shared/libraries/LibMeta.sol";

library LibDelegatedWearables {
    using EnumerableSet for EnumerableSet.UintSet;

    function removeDelegatedWearableFromGotchi(uint256 _slot, uint256 _gotchiId, uint256 _existingEquippedWearableId) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();

        LibItems.removeFromParent(address(this), _gotchiId, _existingEquippedWearableId, 1);
        emit LibERC1155.TransferFromParent(address(this), _gotchiId, _existingEquippedWearableId, 1);

        GotchiEquippedDepositsInfo storage _gotchiInfo = s.gotchiEquippedDepositsInfo[_gotchiId];
        uint256 _depositIdToUnequip = _gotchiInfo.equippedDepositIds[_slot];

        // remove wearable from Aavegotchi and delete delegation
        ItemRolesInfo storage _depositInfo = s.itemRolesDepositInfo[_depositIdToUnequip];
        bool _sameHandDelegationEquipped = (_slot == LibItems.WEARABLE_SLOT_HAND_LEFT && // if is hand left and right has the same delegation as this
            _gotchiInfo.equippedDepositIds[LibItems.WEARABLE_SLOT_HAND_RIGHT] == _depositIdToUnequip) ||
            // if is hand right and left has the same delegation as this
            (_slot == LibItems.WEARABLE_SLOT_HAND_RIGHT && _gotchiInfo.equippedDepositIds[LibItems.WEARABLE_SLOT_HAND_LEFT] == _depositIdToUnequip);

        // it will only skip, when the same hand delegation is equipped in the other hand
        // to avoid removing the delegation from the depositInfo while the depositId still equipped in the other hand
        if (!_sameHandDelegationEquipped) {
            _depositInfo.equippedGotchis.remove(_gotchiId);
        }

        _depositInfo.balanceUsed--;
        // this counter is decremented whenever a delegated wearable is unequipped
        // this is used to allow Aavegotchis to be transferred or listed again (when the counter reaches 0)
        _gotchiInfo.equippedDelegatedWearablesCount--;
        delete _gotchiInfo.equippedDepositIds[_slot];
    }

    function addDelegatedWearableToGotchi(uint256 _depositIdToEquip, uint256 _gotchiId, uint256 _wearableIdToEquip) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();
        GotchiEquippedDepositsInfo storage _gotchiInfo = s.gotchiEquippedDepositsInfo[_gotchiId];
        ItemRolesInfo storage _depositInfo = s.itemRolesDepositInfo[_depositIdToEquip];

        require(_depositInfo.roleAssignment.grantee == LibMeta.msgSender(), "ItemsFacet: Wearable not delegated to sender or depositId not valid");
        require(_depositInfo.roleAssignment.expirationDate > block.timestamp, "ItemsFacet: Wearable delegation expired");
        require(s.itemRolesDepositInfo[_depositIdToEquip].deposit.tokenId == _wearableIdToEquip, "ItemsFacet: Delegated Wearable not of this delegation");
        require((_depositInfo.deposit.tokenAmount - _depositInfo.balanceUsed) > 0, "ItemsFacet: Not enough delegated balance");
      
        // this counter is incremented whenever a delegated wearable is equipped
        // this is used to prevent Aavegotchis equipped with delegated Wearables from being transferred or listed
        _gotchiInfo.equippedDelegatedWearablesCount++;
        // the balanceUsed counter is used to verify if all tokens delegated are in use, or if they can still be equipped
        _depositInfo.balanceUsed++;
        // equippedGotchis stores all Aavegotchis that are equipped if Wearables of a given depositId
        // this is important because we need to make sure that all aavegotchis are unequipped when the owner is withdrawing their Wearables
        _depositInfo.equippedGotchis.add(_gotchiId);

        LibItems.addToParent(address(this), _gotchiId, _depositInfo.deposit.tokenId, 1);
        emit LibERC1155.TransferToParent(address(this), _gotchiId, _depositInfo.deposit.tokenId, 1);
    }
}
