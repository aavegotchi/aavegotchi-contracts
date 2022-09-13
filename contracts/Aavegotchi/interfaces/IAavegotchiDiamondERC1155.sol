// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

interface IAavegotchiDiamondERC1155 {
    //LEGACY ERC1155 FUNCTIONS

    //READ

    function balanceOf(address _owner, uint256 _id) external view returns (uint256 balance_);

    function balanceOfBatch(address[] calldata _owners, uint256[] calldata _ids) external view returns (uint256[] memory bals);

    function uri(uint256 _id) external view returns (string memory);

    function isApprovedForAll(address _owner, address _operator) external view returns (bool approved_);

    function symbol() external view returns (string memory);

    function name() external view returns (string memory);

    //WRITE

    function setBaseURI(string memory _value) external;

    function setApprovalForAll(address _operator, bool _approved) external;

    function safeTransferFrom(
        address _from,
        address _to,
        uint256 _id,
        uint256 _value,
        bytes calldata _data
    ) external;

    function safeBatchTransferFrom(
        address _from,
        address _to,
        uint256[] calldata _ids,
        uint256[] calldata _values,
        bytes calldata _data
    ) external;
}
