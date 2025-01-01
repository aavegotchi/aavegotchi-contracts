// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {LibMeta} from "../../shared/libraries/LibMeta.sol";
import {LibAavegotchi} from "../libraries/LibAavegotchi.sol";
import {LibItems} from "../libraries/LibItems.sol";
import {LibAppStorage, AppStorage, WearablesConfig, ItemType, EQUIPPED_WEARABLE_SLOTS} from "../libraries/LibAppStorage.sol";

library LibWearablesConfig {

    /// @notice Returns true only if the given tokenId is a valid aavegotchi or unbridged
    /// @param _tokenId The tokenId of the aavegotchi
    /// @return result True if the tokenId is valid or unbridged
    function _checkAavegotchiOrUnbridged(uint256 _tokenId) internal view returns (bool result) {
        AppStorage storage s = LibAppStorage.diamondStorage();
        if (s.aavegotchis[_tokenId].status == LibAavegotchi.STATUS_AAVEGOTCHI) {
            result = true;
        // Unbridged aavegotchis do not have a owner or a haunt set
        } else if (s.aavegotchis[_tokenId].hauntId == 0 && s.aavegotchis[_tokenId].owner == address(0)) {
            // Only allow unbridged aavegotchis up to the current supply
            uint256 maxSupply;
            for (uint256 i = 1; i <= s.currentHauntId; i++) {
                maxSupply += s.haunts[i].hauntMaxSize;
            }
            require(_tokenId < maxSupply, "LibWearablesConfig: Invalid tokenId for unbridged aavegotchi");

            result = true;
        }
    }

    /// @notice Returns the next wearables config id for that gotchi given that owner
    /// @param _owner The owner of the gotchi
    /// @param _tokenId The tokenId of the gotchi
    /// @return nextWearablesConfigId The next free wearables config id
    function _getNextWearablesConfigId(address _owner, uint256 _tokenId) internal view returns (uint16 nextWearablesConfigId) {
        AppStorage storage s = LibAppStorage.diamondStorage();
        // slots start at 0 so slotsUsed is always the next config id
        nextWearablesConfigId = s.ownerGotchiSlotsUsed[_owner][_tokenId];
    }

    /// @notice Checks if a wearables config exists for a gotchi given an owner
    /// @param _owner The owner of the gotchi
    /// @param _tokenId The tokenId of the gotchi
    /// @param _wearablesConfigId The wearables config id
    /// @return exists True if the wearables config exists false otherwise
    function _wearablesConfigExists(address _owner, uint256 _tokenId, uint16 _wearablesConfigId) internal view returns (bool exists) {
        AppStorage storage s = LibAppStorage.diamondStorage();
        // slots start at 0 so slots used should always be greater by 1 than the last config id
        exists = (s.ownerGotchiSlotsUsed[_owner][_tokenId] > _wearablesConfigId);
    }

    /// @notice Checks if a wearables configuration consist of valid wearables and are for the correct slot
    /// @param _wearablesToStore The wearables to store
    /// @return valid True if the wearables configuration is valid and false otherwise
    function _checkValidWearables(uint16[EQUIPPED_WEARABLE_SLOTS] memory _wearablesToStore) internal view returns (bool) {
        AppStorage storage s = LibAppStorage.diamondStorage();
        uint256 itemTypesLength = s.itemTypes.length;
        bool valid = true;
        for (uint256 slot; slot < EQUIPPED_WEARABLE_SLOTS; slot++) {
            uint256 toStoreId = _wearablesToStore[slot];
            if (toStoreId != 0) {
                require(itemTypesLength > toStoreId, "LibWearablesConfig: Item type does not exist");
                ItemType storage itemType = s.itemTypes[toStoreId];
                if (itemType.category != LibItems.ITEM_CATEGORY_WEARABLE) {
                  valid = false;
                  break;
                }
                if (itemType.slotPositions[slot] == false) {
                  valid = false;
                  break;
                }
            }
        }
        return valid;
    }
}
