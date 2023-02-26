// SPDX-License-Identifier: Unlicense
pragma solidity 0.8.1;

import {Modifiers, XPMerkleDrops} from "../libraries/LibAppStorage.sol";
import {MerkleProofLib} from "../libraries/LibMerkle.sol";
import "../libraries/LibXPAllocation.sol";

contract MerkleDropFacet is Modifiers {
    //allow the diamond owner to create new xp drops
    function createXPDrop(bytes32 _propId, bytes32 _merkleRoot, uint8 _propType) external onlyOwnerOrDaoOrGameManager {
        LibXPAllocation._createXPDrop(_propId, _merkleRoot, _propType);
    }

    function claimXPDrop(bytes32 _propId, address _claimer, uint256[] calldata _gotchiIds, bytes32[] calldata _proof) external {
        LibXPAllocation._claimXPDrop(_propId, _claimer, _gotchiIds, _proof);
    }

    function isClaimed(bytes32 _propId, address _claimer) public view returns (bool claimed_) {
        if (s.xpDrops[_propId].propType == 0) revert("NonExistentDrop");
        claimed_ = s.xpClaimed[_claimer][_propId];
    }

    function viewXPDrop(bytes32 _propId) public view returns (XPMerkleDrops memory) {
        return s.xpDrops[_propId];
    }
}
