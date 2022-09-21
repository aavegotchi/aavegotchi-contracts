//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/// @title Example of ERC721 contract with ERC2981
/// @notice This is a mock, mint and mintBatch are not protected. Please do not use as-is in production

contract ERC721WithRoyalties is ERC721 {
    struct RoyaltyInfo {
        address recipient;
        uint24 amount;
    }

    uint256 nextTokenId;
    mapping(uint256 => RoyaltyInfo) internal _royalties;

    constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) {}

    /// @notice Mint one token to `to`
    /// @param to the recipient of the token
    /// @param royaltyRecipient the recipient for royalties (if royaltyValue > 0)
    /// @param royaltyValue the royalties asked for (EIP2981)
    function mint(
        address to,
        address royaltyRecipient,
        uint256 royaltyValue
    ) external {
        uint256 tokenId = nextTokenId;
        _safeMint(to, tokenId, "");

        if (royaltyValue > 0) {
            _setTokenRoyalty(tokenId, royaltyRecipient, royaltyValue);
        }

        nextTokenId = tokenId + 1;
    }

    /// @notice Mint several tokens at once
    /// @param recipients an array of recipients for each token
    /// @param royaltyRecipients an array of recipients for royalties (if royaltyValues[i] > 0)
    /// @param royaltyValues an array of royalties asked for (EIP2981)
    function mintBatch(
        address[] memory recipients,
        address[] memory royaltyRecipients,
        uint256[] memory royaltyValues
    ) external {
        uint256 tokenId = nextTokenId;
        require(recipients.length == royaltyRecipients.length && recipients.length == royaltyValues.length, "ERC721: Arrays length mismatch");

        for (uint256 i; i < recipients.length; i++) {
            _safeMint(recipients[i], tokenId, "");
            if (royaltyValues[i] > 0) {
                _setTokenRoyalty(tokenId, royaltyRecipients[i], royaltyValues[i]);
            }
            tokenId++;
        }

        nextTokenId = tokenId;
    }

    /// @dev Sets token royalties
    /// @param tokenId the token id fir which we register the royalties
    /// @param recipient recipient of the royalties
    /// @param value percentage (using 2 decimals - 10000 = 100, 0 = 0)
    function _setTokenRoyalty(
        uint256 tokenId,
        address recipient,
        uint256 value
    ) internal {
        require(value <= 10000, "ERC2981Royalties: Too high");
        _royalties[tokenId] = RoyaltyInfo(recipient, uint24(value));
    }

    function royaltyInfo(uint256 tokenId, uint256 value) external view returns (address receiver, uint256 royaltyAmount) {
        RoyaltyInfo memory royalties = _royalties[tokenId];
        receiver = royalties.recipient;
        royaltyAmount = (value * royalties.amount) / 10000;
    }

    function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
        return interfaceId == 0x2a55205a || super.supportsInterface(interfaceId);
    }
}
