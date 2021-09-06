// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {LibItems} from "../Aavegotchi/libraries/LibItems.sol";

contract ItemsRollbackFacet {
    function rollback1() external {
        address aavegotchiDiamond = 0x86935F11C86623deC8a25696E1C19a8659CbF95d;
        address userAddress = 0xed3BBbe2e3eacE311a94b059508Bbdda9149AB23;
        uint256 tokenId = 1172;
        uint256[4] memory wearableIds = [uint256(143), uint256(197), uint256(235), uint256(236)];
        uint256[4] memory wearableCounts = [uint256(2), uint256(1), uint256(5), uint256(10)];

        for (uint256 i; i < wearableIds.length; i++) {
            LibItems.removeFromParent(aavegotchiDiamond, tokenId, wearableIds[i], wearableCounts[i]);
            LibItems.addToOwner(userAddress, wearableIds[i], wearableCounts[i]);
        }
    }

    function rollback2() external {
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
