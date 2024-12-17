// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

library LibCollateralsEvents {
    event IncreaseStake(uint256 indexed _tokenId, uint256 _stakeAmount);
    event DecreaseStake(uint256 indexed _tokenId, uint256 _reduceAmount);
    event ExperienceTransfer(uint256 indexed _fromTokenId, uint256 indexed _toTokenId, uint256 experience);
}
