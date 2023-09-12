// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;
import {LibEventHandler} from "../libraries/LibEventHandler.sol";
import {WearableLibDiamond} from "../libraries/WearableLibDiamond.sol";

contract EventHandlerFacet {
    ///@notice Emit the standard ERC1155 Approval event
    ///@dev Only callable via the Aavegotchi Diamond
    ///@param _account The account that is approving an operator
    ///@param _operator The account that is being approved as an operator
    ///@param _approved Whether or not the operator is being approved
    function emitApprovalEvent(address _account, address _operator, bool _approved) external {
        WearableLibDiamond.enforceIsDiamond();
        LibEventHandler._receiveAndEmitApprovalEvent(_account, _operator, _approved);
    }

    ///@notice Emit the standard ERC1155 URI event
    ///@dev Only callable via the Aavegotchi Diamond
    ///@param _value The URI value
    ///@param _id The token ID whose uri is being set/changed
    function emitUriEvent(string memory _value, uint256 _id) external {
        WearableLibDiamond.enforceIsDiamond();
        LibEventHandler._receiveAndEmitUriEvent(_value, _id);
    }

    ///@notice Emit the standard ERC1155 TransferSingle event
    ///@dev Only callable via the Aavegotchi Diamond
    ///@param _operator The address performing the operation
    ///@param _from The address from which the token is being transferred
    ///@param _to The address to which the token is being transferred
    ///@param _id The ID of the token being transferred
    ///@param _value The amount of tokens being transferred
    function emitTransferSingleEvent(address _operator, address _from, address _to, uint256 _id, uint256 _value) external {
        WearableLibDiamond.enforceIsDiamond();
        LibEventHandler._receiveAndEmitTransferSingleEvent(_operator, _from, _to, _id, _value);
    }

    ///@notice Emit the standard ERC1155 TransferBatch event
    ///@dev Only callable via the Aavegotchi Diamond
    ///@param _operator The address performing the operation
    ///@param _from The address from which the token is being transferred
    ///@param _to The address to which the token is being transferred
    ///@param _ids An array containing the IDs of the tokens being transferred
    ///@param _values An array containing the amounts of tokens being transferred
    function emitTransferBatchEvent(address _operator, address _from, address _to, uint256[] calldata _ids, uint256[] calldata _values) external {
        WearableLibDiamond.enforceIsDiamond();
        LibEventHandler._receiveAndEmitTransferBatchEvent(_operator, _from, _to, _ids, _values);
    }
}
