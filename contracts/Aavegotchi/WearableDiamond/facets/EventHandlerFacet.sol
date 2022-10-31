// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;
import {LibEventHandler} from "../libraries/LibEventHandler.sol";
import {WearableLibDiamond} from "../libraries/WearableLibDiamond.sol";

contract EventHandlerFacet {
    function emitApprovalEvent(
        address _account,
        address _operator,
        bool _approved
    ) external {
        WearableLibDiamond.enforceIsDiamond();
        LibEventHandler._receiveAndEmitApprovalEvent(_account, _operator, _approved);
    }

    function emitUriEvent(string memory _value, uint256 _id) external {
        WearableLibDiamond.enforceIsDiamond();
        LibEventHandler._receiveAndEmitUriEvent(_value, _id);
    }

    function emitTransferSingleEvent(
        address _operator,
        address _from,
        address _to,
        uint256 _id,
        uint256 _value
    ) external {
        WearableLibDiamond.enforceIsDiamond();
        LibEventHandler._receiveAndEmitTransferSingleEvent(_operator, _from, _to, _id, _value);
    }

    function emitTransferBatchEvent(
        address _operator,
        address _from,
        address _to,
        uint256[] calldata _ids,
        uint256[] calldata _values
    ) external {
        WearableLibDiamond.enforceIsDiamond();
        LibEventHandler._receiveAndEmitTransferBatchEvent(_operator, _from, _to, _ids, _values);
    }
}
