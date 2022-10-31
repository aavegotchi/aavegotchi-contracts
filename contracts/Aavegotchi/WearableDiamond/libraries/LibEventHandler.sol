pragma solidity 0.8.1;

import {WearableLibDiamond} from "./WearableLibDiamond.sol";

library LibEventHandler {
    //INTERFACES
    event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value);

    event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values);

    event ApprovalForAll(address indexed account, address indexed operator, bool approved);

    event URI(string value, uint256 indexed id);

    function _receiveAndEmitApprovalEvent(
        address account,
        address operator,
        bool approved
    ) internal {
        emit ApprovalForAll(account, operator, approved);
    }

    function _receiveAndEmitUriEvent(string memory value, uint256 id) internal {
        emit URI(value, id);
    }

    function _receiveAndEmitTransferSingleEvent(
        address operator,
        address from,
        address to,
        uint256 id,
        uint256 value
    ) internal {
        emit TransferSingle(operator, from, to, id, value);
    }

    function _receiveAndEmitTransferBatchEvent(
        address operator,
        address from,
        address to,
        uint256[] calldata ids,
        uint256[] calldata values
    ) internal {
        emit TransferBatch(operator, from, to, ids, values);
    }
}
