//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/// @title Example of ERC721 contract with multi royalty
/// @notice This is a mock, mint and mintBatch are not protected. Please do not use as-is in production

contract ERC721WithMultiRoyalties is ERC721 {
    struct RoyaltyInfo {
        address[] recipients;
        uint256[] amounts;
    }

    uint256 nextTokenId;
    mapping(uint256 => RoyaltyInfo) internal _royalties;

    constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) {}

    /// @notice Mint one token to `to`
    function mint(
        address to,
        address[] memory royaltyRecipients,
        uint256[] memory royaltyValues
    ) external {
        require(royaltyRecipients.length == royaltyValues.length, "MultiRoyalties: length not matched");

        uint256 tokenId = nextTokenId;
        _safeMint(to, tokenId, "");

        if (royaltyValues.length > 0) {
            _setTokenRoyalty(tokenId, royaltyRecipients, royaltyValues);
        }

        nextTokenId = tokenId + 1;
    }

    /// @dev Sets token royalties
    function _setTokenRoyalty(
        uint256 tokenId,
        address[] memory recipients,
        uint256[] memory values
    ) internal {
        _royalties[tokenId] = RoyaltyInfo(recipients, values);
    }

    function multiRoyaltyInfo(uint256 tokenId, uint256 value) external view returns (address[] memory receivers, uint256[] memory royaltyAmounts) {
        RoyaltyInfo memory royalties = _royalties[tokenId];
        receivers = royalties.recipients;
        royaltyAmounts = new uint256[](royalties.amounts.length);
        for (uint256 i = 0; i < royalties.amounts.length; i++) {
            royaltyAmounts[i] = (value * royalties.amounts[i]) / 10000;
        }
    }

    function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
        return interfaceId == 0x24d34933 || super.supportsInterface(interfaceId);
    }
}
