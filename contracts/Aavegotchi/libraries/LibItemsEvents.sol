// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {EQUIPPED_WEARABLE_SLOTS} from "./LibAppStorage.sol";


library LibItemsEvents {
    event EquipWearables(uint256 indexed _tokenId, uint16[EQUIPPED_WEARABLE_SLOTS] _oldWearables, uint16[EQUIPPED_WEARABLE_SLOTS] _newWearables);
    event EquipDelegatedWearables(
        uint256 indexed _tokenId,
        uint256[EQUIPPED_WEARABLE_SLOTS] _oldDepositIds,
        uint256[EQUIPPED_WEARABLE_SLOTS] _newDepositIds
    );
}
