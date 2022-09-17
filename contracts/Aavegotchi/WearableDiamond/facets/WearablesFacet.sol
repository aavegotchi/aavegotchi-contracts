// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;
import "../../facets/PeripheryFacet.sol";
import "../libraries/LibEventHandler.sol";
import "../libraries/LibDiamond.sol";
import "../../../shared/libraries/LibStrings.sol";

contract WearablesFacet {
    //READ
    function periphery() internal pure returns (PeripheryFacet pFacet) {
        pFacet = PeripheryFacet(WearableLibDiamond.AAVEGOTCHI_DIAMOND);
    }

    function balanceOf(address _owner, uint256 _id) external view returns (uint256 balance_) {
        balance_ = periphery().peripheryBalanceOf(_owner, _id);
    }

    function balanceOfBatch(address[] calldata _owners, uint256[] calldata _ids) external view returns (uint256[] memory bals) {
        bals = periphery().peripheryBalanceOfBatch(_owners, _ids);
    }

    function uri(uint256 _id) external view returns (string memory) {
        return periphery().peripheryUri(_id);
    }

    function isApprovedForAll(address _owner, address _operator) external view returns (bool approved_) {
        approved_ = periphery().peripheryIsApprovedForAll(_owner, _operator);
    }

    function symbol() external pure returns (string memory) {
        return "GOTCHI";
    }

    function name() external pure returns (string memory) {
        return "AAVEGOTCHI";
    }

    //WRITE

    function setApprovalForAll(address _operator, bool _approved) external {
        periphery().peripherySetApprovalForAll(_operator, _approved, msg.sender);
        //emit event
        //previous address in frame should be the owner
        LibEventHandler._receiveAndEmitApprovalEvent(msg.sender, _operator, _approved);
    }

    function setBaseURI(string memory _value) external {
        WearableLibDiamond.enforceIsContractOwner();
        uint256 itemLength = periphery().peripherySetBaseURI(_value);
        //emit events
        for (uint256 i; i < itemLength; i++) {
            LibEventHandler._receiveAndEmitUriEvent(LibStrings.strWithUint(_value, i), i);
        }
    }

    function safeTransferFrom(
        address _from,
        address _to,
        uint256 _id,
        uint256 _value,
        bytes calldata _data
    ) external {
        periphery().peripherySafeTransferFrom(_from, _to, _id, _value, _data);
        //emit event
        LibEventHandler._receiveAndEmitTransferSingleEvent(tx.origin, _from, _to, _id, _value);
    }

    function safeBatchTransferFrom(
        address _from,
        address _to,
        uint256[] calldata _ids,
        uint256[] calldata _values,
        bytes calldata _data
    ) external {
        periphery().peripherySafeBatchTransferFrom(_from, _to, _ids, _values, _data);
        //emit event
        LibEventHandler._receiveAndEmitTransferBatchEvent(tx.origin, _from, _to, _ids, _values);
    }
}
