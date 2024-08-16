// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {ItemRolesInfo, GotchiEquippedDepositsInfo, LibAppStorage, AppStorage} from "../libraries/LibAppStorage.sol";
import {LibItems} from "../libraries/LibItems.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {LibERC1155} from "../../shared/libraries/LibERC1155.sol";
import {LibMeta} from "../../shared/libraries/LibMeta.sol";

library LibDelegatedWearables {
    using EnumerableSet for EnumerableSet.UintSet;

    /**
     * @notice Removes a delegated wearable from an Aavegotchi
     * @dev Transfers the wearable from the Aavegotchi to the diamond and updates delegation info
     * @param _slot The slot to remove the wearable from
     * @param _gotchiId The id of the Aavegotchi
     * @param _existingEquippedWearableId The id of the equipped wearable to be removed
     */
    function removeDelegatedWearableFromGotchi(uint256 _slot, uint256 _gotchiId, uint256 _existingEquippedWearableId) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();

        LibItems.removeFromParent(address(this), _gotchiId, _existingEquippedWearableId, 1);
        emit LibERC1155.TransferFromParent(address(this), _gotchiId, _existingEquippedWearableId, 1);

        //We do not need to emit the TransferSingle event because the wearable is not moving from the AavegotchiDiamond

        GotchiEquippedDepositsInfo storage gotchiInfo = s.gotchiEquippedDepositsInfo[_gotchiId];
        uint256 depositIdToUnequip = gotchiInfo.equippedDepositIds[_slot];

        // remove wearable from Aavegotchi and delete delegation
        ItemRolesInfo storage depositInfo = s.itemRolesDepositInfo[depositIdToUnequip];
        bool _sameHandDelegationEquipped = (_slot == LibItems.WEARABLE_SLOT_HAND_LEFT && // if is hand left and right has the same delegation as this
            gotchiInfo.equippedDepositIds[LibItems.WEARABLE_SLOT_HAND_RIGHT] == depositIdToUnequip) ||
            // if is hand right and left has the same delegation as this
            (_slot == LibItems.WEARABLE_SLOT_HAND_RIGHT && gotchiInfo.equippedDepositIds[LibItems.WEARABLE_SLOT_HAND_LEFT] == depositIdToUnequip);

        // it will only skip, when the same hand delegation is equipped in the other hand
        // to avoid removing the delegation from the depositInfo while the depositId still equipped in the other hand
        if (!_sameHandDelegationEquipped) {
            depositInfo.equippedGotchis.remove(_gotchiId);
        }

        depositInfo.balanceUsed--;
        // this counter is decremented whenever a delegated wearable is unequipped
        // this is used to allow Aavegotchis to be transferred or listed again (when the counter reaches 0)
        gotchiInfo.equippedDelegatedWearablesCount--;
        delete gotchiInfo.equippedDepositIds[_slot];
    }

    /**
     * @notice Adds a delegated wearable to an Aavegotchi
     * @dev Transfers the wearable from the diamond to the Aavegotchi and updates delegation info
     * @param _depositIdToEquip The depositId of the Wearable to be equipped
     * @param _gotchiId The id of the Aavegotchi
     * @param _wearableIdToEquip The id of the wearable to be equipped
     */
    function addDelegatedWearableToGotchi(uint256 _depositIdToEquip, uint256 _gotchiId, uint256 _wearableIdToEquip) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();
        GotchiEquippedDepositsInfo storage _gotchiInfo = s.gotchiEquippedDepositsInfo[_gotchiId];
        ItemRolesInfo storage depositInfo = s.itemRolesDepositInfo[_depositIdToEquip];

        require(depositInfo.roleAssignment.grantee == LibMeta.msgSender(), "ItemsFacet: Wearable not delegated to sender or depositId not valid");
        require(depositInfo.roleAssignment.expirationDate > block.timestamp, "ItemsFacet: Wearable delegation expired");
        require(
            s.itemRolesDepositInfo[_depositIdToEquip].deposit.tokenId == _wearableIdToEquip,
            "ItemsFacet: Delegated Wearable not of this delegation"
        );
        require((depositInfo.deposit.tokenAmount - depositInfo.balanceUsed) > 0, "ItemsFacet: Not enough delegated balance");

        // this counter is incremented whenever a delegated wearable is equipped
        // this is used to prevent Aavegotchis equipped with delegated Wearables from being transferred or listed
        _gotchiInfo.equippedDelegatedWearablesCount++;
        // the balanceUsed counter is used to verify if all tokens delegated are in use, or if they can still be equipped
        depositInfo.balanceUsed++;
        // equippedGotchis stores all Aavegotchis that are equipped if Wearables of a given depositId
        // this is important because we need to make sure that all aavegotchis are unequipped when the owner is withdrawing their Wearables
        depositInfo.equippedGotchis.add(_gotchiId);

        LibItems.addToParent(address(this), _gotchiId, depositInfo.deposit.tokenId, 1);
        emit LibERC1155.TransferToParent(address(this), _gotchiId, depositInfo.deposit.tokenId, 1);

        //We do not need to emit the TransferSingle event because the wearable is not moving from the AavegotchiDiamond
    }
}
