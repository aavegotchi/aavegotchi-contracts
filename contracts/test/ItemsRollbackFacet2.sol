// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {LibItems} from "../Aavegotchi/libraries/LibItems.sol";
import {IERC1155} from "../shared/interfaces/IERC1155.sol";

contract ItemsRollbackFacet2 {
    function rollback() external {
        address aavegotchiDiamond = 0x86935F11C86623deC8a25696E1C19a8659CbF95d;
        address userAddress = 0x69aC8b337794dAD862C691b00ccc3a89F1F3293d;
        uint256[3] memory wearableIds = [uint256(57), uint256(58), uint256(59)];
        uint256[3] memory wearableCounts = [uint256(1), uint256(1), uint256(1)];

        for (uint256 i; i < wearableIds.length; i++) {
            LibItems.removeFromOwner(aavegotchiDiamond, wearableIds[i], wearableCounts[i]);
            LibItems.addToOwner(userAddress, wearableIds[i], wearableCounts[i]);
        }
    }
}
