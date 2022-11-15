// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {LibWhitelist} from "../libraries/LibWhitelist.sol";

contract InitBorrowLimit {
    // Set borrow limit for whitelist id 0 to 1 gotchi
    function init() external {
        LibWhitelist.setWhitelistAccessRight(0, 0, 0);
    }
}
