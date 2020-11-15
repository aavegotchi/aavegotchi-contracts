// SPDX-License-Identifier: MIT
pragma solidity 0.7.4;
pragma experimental ABIEncoderV2;

import "../shared/interfaces/IERC20.sol";

contract CollateralEscrow {
    constructor(address _aTokenContract) {
        IERC20(_aTokenContract).approve(msg.sender, uint256(-1));
        selfdestruct(msg.sender);
    }
}
