// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

interface IFakeGotchiDiamond {
    function getRoyaltyInfo(uint256 _tokenId) external view returns (address[2] memory, uint256[2] memory);
}
