// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";

contract TestVault {
    IERC20 public immutable wGHST;

    mapping(address => uint256) public balances;

    event Deposit(address indexed user, uint256 amount);
    event Withdrawal(address indexed user, uint256 amount);

    constructor(address _wGHST) {
        wGHST = IERC20(_wGHST);
    }

    function deposit(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(wGHST.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        balances[msg.sender] += amount;
        emit Deposit(msg.sender, amount);
    }

    function withdraw(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(balances[msg.sender] >= amount, "Insufficient balance");
        balances[msg.sender] -= amount;
        require(wGHST.transfer(msg.sender, amount), "Transfer failed");
        emit Withdrawal(msg.sender, amount);
    }

    function depositWithPermit(address owner, address spender, uint256 amount, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external {
        require(amount > 0, "Amount must be greater than 0");

        IERC20Permit(address(wGHST)).permit(owner, spender, amount, deadline, v, r, s);
        wGHST.transferFrom(owner, address(this), amount);
        balances[spender] += amount;
        emit Deposit(owner, amount);
    }

    function balanceOf(address user) external view returns (uint256) {
        return balances[user];
    }
}
