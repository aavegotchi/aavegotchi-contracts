// SPDX-License-Identifier: Unlicense
pragma solidity 0.8.1;

import {Modifiers, XPMerkleDrops} from "../libraries/LibAppStorage.sol";
import {LibMerkle} from "../libraries/LibMerkle.sol";
import "../libraries/LibXPAllocation.sol";

contract MerkleDropFacet is Modifiers {
    ///@notice Allow the Diamond owner to create new xp drops
    ///@param _propId The id of the drop
    ///@param _merkleRoot The merkle root of the drop
    ///@param _xpAmount The amount of xp to be dropped to all eligible claimers
    function createXPDrop(bytes32 _propId, bytes32 _merkleRoot, uint256 _xpAmount) external onlyOwnerOrDaoOrGameManager {
        LibXPAllocation._createXPDrop(_propId, _merkleRoot, _xpAmount);
    }

    ///@notice Allow an eligible claimer to claim a single drop
    ///@param _propId The id of the drop
    ///@param _claimer The address of the claimer
    ///@param _gotchiId An array of gotchi ids that are eligible to claim the drop
    ///@param _proof The merkle proof of the claimer
    ///@param _onlyGotchis An array of gotchi ids that should only be claimed for
    ///@param _onlyGotchisPositions An array containing the positions of each gotchiId specified in _onlyGotchis in the _gotchiId array
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

    ///@notice Allow caller to batch claim for multiple addresses in a single drop
    ///@param _propId The id of the drop
    ///@param _claimers An array of addresses to claim for
    ///@param _gotchiIds An array of arrays of gotchi ids that are eligible to claim the drop corresponding to each _claimer
    ///@param _proofs An array of merkle proofs of the claimers corresponding to each _claimer
    ///@param _onlyGotchis An array of arrays of gotchi ids that should only be claimed for corresponding to each _claimer
    ///@param _onlyGotchisPositions An array of arrays containing the positions of each gotchiId specified in _onlyGotchis in the _gotchiId array corresponding to each _claimer
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

    ///@notice Allow caller to batch claim for multiple addresses in multiple drops
    ///@param _propIds An array of ids of the drops
    ///@param _claimers An array of addresses to claim for
    ///@param _gotchiIds An array of arrays of gotchi ids that are eligible to claim the drop corresponding to each _claimer
    ///@param _proofs An array of merkle proofs of the claimers corresponding to each _claimer
    ///@param _onlyGotchis An array of arrays of gotchi ids that should only be claimed for corresponding to each _claimer
    ///@param _onlyGotchisPositions An array of arrays containing the positions of each gotchiId specified in _onlyGotchis in the _gotchiId array corresponding to each _claimer
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

    ///@notice Query if a tokenId has claimed for a particluar drop
    ///@param _propId The id of the drop
    ///@param _gotchId The id of the gotchi to query
    ///@return claimed_ The amount of xp claimed for the drop, 0 if not claimed, 10 or 20 if claimed
    function isClaimed(bytes32 _propId, uint256 _gotchId) public view returns (uint256 claimed_) {
        if (s.xpDrops[_propId].xpAmount == 0) revert("NonExistentDrop");
        claimed_ = s.xpClaimed[_gotchId][_propId];
    }

    ///@notice Query the details of a certain drop
    ///@param _propId The id of the drop
    ///@return xpDrops_ A struct containing the details of the drop
    function viewXPDrop(bytes32 _propId) public view returns (XPMerkleDrops memory) {
        return s.xpDrops[_propId];
    }
}
