// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {AppStorage} from "../libraries/LibAppStorage.sol";

contract InitBorrowLimit {
    AppStorage internal s;

    // Set borrow limit for whitelist id 0 to 1 gotchi
    function init() external {
        s.whitelistAccessRights[0][0] = 1;
    }
}
