// SPDX-License-Identifier: MIT
pragma solidity 0.7.4;
pragma experimental ABIEncoderV2;

import "../shared/interfaces/IERC20.sol";

struct AppStorage {
    address owner;
}

contract CollateralEscrow {
    AppStorage internal s;

    constructor(address _aTokenContract) {
        s.owner = msg.sender;
        approveAavegotchiDiamond(_aTokenContract);
    }

    function approveAavegotchiDiamond(address _aTokenContract) public {
        require(msg.sender == s.owner, "CollateralEscrow: Not owner of contract");
        IERC20(_aTokenContract).approve(s.owner, type(uint256).max);
    }
}
