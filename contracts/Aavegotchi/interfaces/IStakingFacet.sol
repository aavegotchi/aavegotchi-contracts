// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

interface IStakingFacet {
    function increaseFrens(address _account, uint256 _amount, uint256 _time) external;
}
