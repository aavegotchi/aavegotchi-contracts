// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

/**
 * @dev Handles events shared in multiple facets.
 */
library LibEvents {
    event UnlockNFT(uint256 indexed _tokenId);
    event LockNFT(uint256 indexed _tokenId);

    function emitUnlockNFT(uint256 _tokenId) internal {
        emit UnlockNFT(_tokenId);
    }

    function emitLockNFT(uint256 _tokenId) internal {
        emitLockNFT(_tokenId);
    }
}
