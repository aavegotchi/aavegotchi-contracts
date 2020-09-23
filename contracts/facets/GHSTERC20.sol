// SPDX-License-Identifier: MIT
pragma solidity 0.7.1;
pragma experimental ABIEncoderV2;

import "../libraries/LibGHST.sol";

contract GHSTERC20 {
    uint256 constant MAX_UINT = uint256(-1);

    event Approval(address indexed _owner, address indexed _spender, uint256 _value);
    event Transfer(address indexed _from, address indexed _to, uint256 _value);

    function name() external pure returns (string memory) {
        return "GHST";
    }

    function symbol() external pure returns (string memory) {
        return "GHST";
    }

    function decimals() external pure returns (uint8) {
        return 18;
    }

    function totalSupply() public view returns (uint256) {
        LibGHST.Storage storage ghst = LibGHST.diamondStorage();
        return ghst.totalSupply;
    }

    function balancesOf(address _owner) public view returns (uint256 balances) {
        LibGHST.Storage storage ghst = LibGHST.diamondStorage();
        balances = ghst.balances[_owner];
    }

    function transfer(address _to, uint256 _value) public returns (bool success) {
        LibGHST.Storage storage ghst = LibGHST.diamondStorage();
        uint256 frombalances = ghst.balances[msg.sender];
        require(frombalances >= _value, "GHST: Not enough GHST to transfer");
        ghst.balances[msg.sender] = frombalances - _value;
        ghst.balances[_to] += _value;
        emit Transfer(msg.sender, _to, _value);
        success = true;
    }

    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    ) public returns (bool success) {
        LibGHST.Storage storage ghst = LibGHST.diamondStorage();
        uint256 fromBalance = ghst.balances[_from];
        if (msg.sender == _from || msg.sender == ghst.aavegotchiDiamond) {
            // pass
        } else {
            uint256 allowance = ghst.allowances[msg.sender][_from];
            require(allowance >= _value, "GHST: Not allowed to transfer");
            if (allowance != MAX_UINT) {
                ghst.allowances[msg.sender][_from] = allowance - _value;
            }
        }
        require(fromBalance >= _value, "GHST: Not enough GHST to transfer");
        ghst.balances[_from] = fromBalance - _value;
        ghst.balances[_to] += _value;
        emit Transfer(_from, _to, _value);
        success = true;
    }

    function approve(address _spender, uint256 _value) public returns (bool success) {
        LibGHST.Storage storage ghst = LibGHST.diamondStorage();
        ghst.allowances[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        success = true;
    }

    function increaseAllowance(address _spender, uint256 _value) external returns (bool success) {
        LibGHST.Storage storage ghst = LibGHST.diamondStorage();
        uint256 allowance = ghst.allowances[msg.sender][_spender];
        uint256 newAllowance = allowance + _value;
        // if overflow
        if (allowance > newAllowance) {
            newAllowance = MAX_UINT;
        }
        ghst.allowances[msg.sender][_spender] = newAllowance;
        emit Approval(msg.sender, _spender, newAllowance);
        success = true;
    }

    function decreaseAllowance(address _spender, uint256 _value) external returns (bool success) {
        LibGHST.Storage storage ghst = LibGHST.diamondStorage();
        uint256 allowance = ghst.allowances[msg.sender][_spender];
        // if underflow
        if (_value > allowance) {
            allowance = 0;
        } else {
            allowance -= _value;
        }
        ghst.allowances[msg.sender][_spender] = allowance;
        emit Approval(msg.sender, _spender, allowance);
        success = true;
    }

    function allowance(address _owner, address _spender) public view returns (uint256 remaining) {
        LibGHST.Storage storage ghst = LibGHST.diamondStorage();
        remaining = ghst.allowances[_owner][_spender];
    }

    function mint() external {
        LibGHST.Storage storage ghst = LibGHST.diamondStorage();
        uint256 amount = 10000e18;
        ghst.balances[msg.sender] += amount;
        ghst.totalSupply += uint40(amount);
        emit Transfer(address(0), msg.sender, amount);
    }
}
