// SPDX-License-Identifier: Unlicense
pragma solidity 0.8.1;

import {Modifiers, XPMerkleDrops} from "../libraries/LibAppStorage.sol";
import {LibMerkle} from "../libraries/LibMerkle.sol";
import "../libraries/LibXPAllocation.sol";

contract MerkleDropFacet is Modifiers {
    //allow the diamond owner to create new xp drops
    function createXPDrop(bytes32 _propId, bytes32 _merkleRoot, uint256 _xpAmount) external onlyOwnerOrDaoOrGameManager {
        LibXPAllocation._createXPDrop(_propId, _merkleRoot, _xpAmount);
    }

    function claimXPDrop(
        bytes32 _propId,
        address _claimer,
        uint256[] calldata _gotchiId,
        bytes32[] calldata _proof,
        uint256[] calldata _onlyGotchis,
        uint256[] calldata _onlyGotchisPositions
    ) external {
        LibXPAllocation._claimXPDrop(_propId, _claimer, _gotchiId, _proof, _onlyGotchis, _onlyGotchisPositions);
    }

    //claim for multiple addresses for one particular drop

    function batchGotchiClaimXPDrop(
        bytes32 _propId,
        address[] calldata _claimers,
        uint256[][] calldata _gotchiIds,
        bytes32[][] calldata _proofs,
        uint256[][] calldata _onlyGotchis,
        uint256[][] calldata _onlyGotchisPositions
    ) external {
        if (_claimers.length != _gotchiIds.length || _gotchiIds.length != _proofs.length) revert("ArrayLengthMismatch");
        for (uint256 i; i < _gotchiIds.length; i++) {
            LibXPAllocation._claimXPDrop(_propId, _claimers[i], _gotchiIds[i], _proofs[i], _onlyGotchis[i], _onlyGotchisPositions[i]);
        }
    }

    //claim for multiple addresses in multiple drops

    function batchDropClaimXPDrop(
        bytes32[] calldata _propIds,
        address[] calldata _claimers,
        uint256[][] calldata _gotchiIds,
        bytes32[][] calldata _proofs,
        uint256[][] calldata _onlyGotchis,
        uint256[][] calldata _onlyGotchisPositions
    ) external {
        if (_propIds.length != _gotchiIds.length || _claimers.length != _gotchiIds.length || _gotchiIds.length != _proofs.length)
            revert("ArrayLengthMismatch");
        for (uint256 i; i < _propIds.length; i++) {
            LibXPAllocation._claimXPDrop(_propIds[i], _claimers[i], _gotchiIds[i], _proofs[i], _onlyGotchis[i], _onlyGotchisPositions[i]);
        }
    }

    function isClaimed(bytes32 _propId, uint256 _gotchId) public view returns (uint256 claimed_) {
        if (s.xpDrops[_propId].xpAmount == 0) revert("NonExistentDrop");
        claimed_ = s.xpClaimed[_gotchId][_propId];
    }

    function viewXPDrop(bytes32 _propId) public view returns (XPMerkleDrops memory) {
        return s.xpDrops[_propId];
    }
}
