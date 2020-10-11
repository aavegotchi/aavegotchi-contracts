// SPDX-License-Identifier: MIT
pragma solidity ^0.7.3;

interface IERC20 {
    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    ) external returns (bool success);

    function transfer(address _to, uint256 _value) external returns (bool success);
}
