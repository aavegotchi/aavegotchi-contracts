// SPDX-License-Identifier: UNLICENSED
// © Copyright 2021. Patent pending. All rights reserved. Perpetual Altruism Ltd.
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title Mintable and burnable ERC20 for testing
contract ERC20MintableBurnable is ERC20 {

  constructor() ERC20("ERC20MintableBurnable", "MOCK20") {
  }

  function mint(address _account, uint256 _value) public {
    _mint(_account, _value);
  }

  function burn(address _account, uint256 _value) public {
    _burn(_account, _value);
  }
}
