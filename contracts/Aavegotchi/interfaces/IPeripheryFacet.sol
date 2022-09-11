pragma solidity 0.8.1;

interface IPeripheryFacet {
    function peripheryBalanceOf(address _owner, uint256 _id) external view returns (uint256 balance_);

    function peripheryBalanceOfBatch(address[] calldata _owners, uint256[] calldata _ids) external view returns (uint256[] memory bals_);

    function peripheryUri(uint256 _id) external view returns (string memory);

    function peripheryIsApprovedForAll(address _owner, address _operator) external view returns (bool approved_);

    //WRITE

    function peripherySetApprovalForAll(address _operator, bool _approved) external;

    function peripherySetBaseURI(string memory _value) external returns (uint256 _itemsLength);

    function peripherySafeTransferFrom(
        address _from,
        address _to,
        uint256 _id,
        uint256 _value,
        bytes calldata _data
    ) external;

    function peripherySafeBatchTransferFrom(
        address _from,
        address _to,
        uint256[] calldata _ids,
        uint256[] calldata _values,
        bytes calldata _data
    ) external;
}
