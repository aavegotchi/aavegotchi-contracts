// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {LibAppStorage, AppStorage} from "./LibAppStorage.sol";

library LibAccessRights {
    function verifyAccessRight(uint256 _action, uint256 _access) internal pure returns (bool) {
        // Action 0: Solo Channeling Rights
        // 0: Can channel on lending
        // 1: Cannot channel on lending
        if (_action == 0) return _access <= 1;
        else return false;
    }
}
