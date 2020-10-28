// SPDX-License-Identifier: MIT
pragma solidity 0.7.4;

import "./AppStorage.sol";

library LibName {
    function getName(AppStorage storage s) internal view returns (string memory name_) {
        name_ = s.name;
    }
}
