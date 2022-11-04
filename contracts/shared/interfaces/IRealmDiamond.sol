// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IRealmDiamond {
    function balanceOf(address _owner) external view returns (uint256 balance_);
}
