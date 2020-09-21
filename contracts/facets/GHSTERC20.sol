// SPDX-License-Identifier: MIT
pragma solidity 0.7.1;
pragma experimental ABIEncoderV2;

contract GHSTERC20 {
    function name() external pure returns (string memory) {
        return "GHST";
    }

    function symbol() external pure returns (string memory) {
        return "GHST";
    }

    function decimals() external pure returns (uint8) {
        return 18;
    }
}
