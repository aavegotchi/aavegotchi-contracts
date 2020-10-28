// SPDX-License-Identifier: MIT
pragma solidity 0.7.4;

import "./AppStorage.sol";
import "./LibERC20.sol";
import "./LibName.sol";

/// @dev Note: the ERC-165 identifier for this interface is 0x150b7a02.
contract MyFacet1 {
    using LibERC20 for AppStorage;
    using LibName for AppStorage;
    AppStorage s;

    function balanceOf(address _account) external view returns (uint256 balance_) {
        balance_ = s.balances[_account];
    }

    function burn(uint256 _value) external {
        s.transfer(address(0), _value);
    }

    function getName() external view returns (string memory name_) {
        name_ = s.getName();
    }
}
