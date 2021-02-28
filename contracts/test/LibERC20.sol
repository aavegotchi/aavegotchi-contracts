// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import "./AppStorage.sol";

library LibERC20 {
    event Transfer(address indexed _from, address indexed _to, uint256 _value);

    function transfer(
        AppStorage storage s,
        address _from,
        address _to,
        uint256 _value
    ) internal returns (bool success) {
        uint256 frombalances = s.balances[_from];
        require(frombalances >= _value, "LibERC20: Not enough balance to transfer");
        s.balances[_from] = frombalances - _value;
        s.balances[_to] += _value;
        emit Transfer(_from, _to, _value);
        success = true;
    }
}
