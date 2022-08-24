// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library Math {
    function min(uint256 a, uint256 b) internal pure returns (uint256 c) {
        c = a < b ? a : b;
    }

    function max(uint256 a, uint256 b) internal pure returns (uint256 c) {
        c = a < b ? b : a;
    }
}
