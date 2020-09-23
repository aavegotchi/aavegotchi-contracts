// SPDX-License-Identifier: MIT
pragma solidity 0.7.1;

interface IAavegotchiDiamond {
    function buyPortals(uint256 _ghst) external;

    function ghstAddress() external view returns (address contract_);

    function getAavegotchiSVG(uint256 _tokenId) external view returns (string memory ag);

    function balanceOf(address _owner) external view returns (uint256 balance);

    function ownerOf(uint256 _tokenId) external view returns (address owner);

    function safeTransferFrom(
        address _from,
        address _to,
        uint256 _tokenId,
        bytes calldata _data
    ) external;

    function safeTransferFrom(
        address _from,
        address _to,
        uint256 _tokenId
    ) external;

    function transferFrom(
        address _from,
        address _to,
        uint256 _tokenId
    ) external;

    function approve(address _approved, uint256 _tokenId) external;

    function setApprovalForAll(address _operator, bool _approved) external;

    function getApproved(uint256 _tokenId) external view returns (address approved);

    function isApprovedForAll(address _owner, address _operator) external view returns (bool approved);
}
