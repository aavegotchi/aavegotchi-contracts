pragma solidity ^0.8.0;

interface IAavegotchiDiamondERC721 {
    function balanceOf(address _owner) external view returns (uint256 balance_);

    function ownerOf(uint256 _tokenId) external view returns (address owner_);

    function getApproved(uint256 _tokenId) external view returns (address approved_);

    function isApprovedForAll(address _owner, address _operator) external view returns (bool approved_);

    function approve(address _approved, uint256 _tokenId) external;

    function setApprovalForAll(address _operator, bool _approved) external;

    function name() external view returns (string memory);

    function symbol() external view returns (string memory);

    function tokenURI(uint256 _tokenId) external pure returns (string memory);

    function peripheryApprove(
        address _sender,
        address _approved,
        uint256 _tokenId
    ) external;

    function peripherySetApprovalForAll(
        address _sender,
        address _operator,
        bool _approved
    ) external;

    function peripheryTransferFrom(
        address _sender,
        address _from,
        address _to,
        uint256 _tokenId
    ) external;

    function peripherySafeTransferFrom(
        address _sender,
        address _from,
        address _to,
        uint256 _tokenId
    ) external;

    function peripherySafeTransferFrom(
        address _sender,
        address _from,
        address _to,
        uint256 _tokenId,
        bytes calldata _data
    ) external;
}
