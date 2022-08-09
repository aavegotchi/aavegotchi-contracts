pragma solidity 0.8.1;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IAavegotchiDiamondERC721} from "../Aavegotchi/interfaces/IAavegotchiDiamondERC721.sol";

contract ERC721Periphery is IERC721 {
    address public constant DIAMOND = 0x86935F11C86623deC8a25696E1C19a8659CbF95d;

    function diamond() internal pure returns (IAavegotchiDiamondERC721) {
        return IAavegotchiDiamondERC721(DIAMOND);
    }

    function balanceOf(address owner) external view override returns (uint256 balance) {
        return diamond().balanceOf(owner);
    }

    function ownerOf(uint256 tokenId) external view override returns (address owner) {
        return diamond().ownerOf(tokenId);
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes calldata data
    ) external override {
        diamond().peripherySafeTransferFrom(msg.sender, from, to, tokenId, data);
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) external override {
        diamond().peripherySafeTransferFrom(msg.sender, from, to, tokenId);
    }

    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) external override {
        diamond().peripheryTransferFrom(msg.sender, from, to, tokenId);
    }

    function approve(address to, uint256 tokenId) external override {
        diamond().peripheryApprove(msg.sender, to, tokenId);
    }

    function setApprovalForAll(address operator, bool _approved) external override {
        diamond().peripherySetApprovalForAll(msg.sender, operator, _approved);
    }

    function getApproved(uint256 tokenId) external view override returns (address operator) {
        return diamond().getApproved(tokenId);
    }

    function isApprovedForAll(address owner, address operator) external view override returns (bool) {
        return diamond().isApprovedForAll(owner, operator);
    }

    function name() external view returns (string memory) {
        return diamond().name();
    }

    function symbol() external view returns (string memory) {
        return diamond().symbol();
    }

    function tokenURI(uint256 _tokenId) external pure returns (string memory) {
        return diamond().tokenURI(_tokenId);
    }

    function supportsInterface(bytes4 interfaceId) external view override returns (bool) {}
}
