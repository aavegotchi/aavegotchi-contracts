pragma solidity 0.8.1;

interface IPeripheryFacet {
    //WRITE

    function peripherySetApprovalForAll(address _operator, bool _approved) external;

    function peripherySetBaseURI(string memory _value) external returns (uint256 _itemsLength);

    function peripherySafeTransferFrom(
        address _operator,
        address _from,
        address _to,
        uint256 _id,
        uint256 _value,
        bytes calldata _data
    ) external;

    function peripherySafeBatchTransferFrom(
        address _operator,
        address _from,
        address _to,
        uint256[] calldata _ids,
        uint256[] calldata _values,
        bytes calldata _data
    ) external;
}
