// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

interface IEventHandlerFacet {
    function emitApprovalEvent(
        address _account,
        address _operator,
        bool _approved
    ) external;

    function emitUriEvent(string memory _value, uint256 _id) external;

    function emitTransferSingleEvent(
        address _operator,
        address _from,
        address _to,
        uint256 _id,
        uint256 _value
    ) external;

    function emitTransferBatchEvent(
        address _operator,
        address _from,
        address _to,
        uint256[] calldata _ids,
        uint256[] calldata _values
    ) external;
}
