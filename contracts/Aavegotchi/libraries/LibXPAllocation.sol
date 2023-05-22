// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {AppStorage, LibAppStorage, XPMerkleDrops} from "./LibAppStorage.sol";
import {LibMerkle} from "../libraries/LibMerkle.sol";

library LibXPAllocation {
    event XPDropCreated(bytes32 indexed _propId, bytes32 _merkleRoot, uint256 _xpAmount);
    event XPClaimed(bytes32 indexed _propId, uint256 _gotchiId);
    event GrantExperience(uint256[] _tokenIds, uint256[] _xpValues);

    function _createXPDrop(bytes32 _propId, bytes32 _merkleRoot, uint256 _xpAmount) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();
        XPMerkleDrops storage xp = s.xpDrops[_propId];
        xp.root = _merkleRoot;
        xp.xpAmount = _xpAmount;
        emit XPDropCreated(_propId, _merkleRoot, _xpAmount);
    }

    function _claimXPDrop(
        bytes32 _propId,
        address _claimer,
        uint256[] calldata _gotchiIds,
        bytes32[] calldata _proof,
        uint256[] calldata _onlyGotchis
    ) internal {
        //short-circuits
        AppStorage storage s = LibAppStorage.diamondStorage();
        uint256 xpAmount = s.xpDrops[_propId].xpAmount;
        //short-circuit here
        if (xpAmount == 0) revert("NonExistentDrop");
        //drops are unique by their roots
        bytes32 node = keccak256(abi.encodePacked(_claimer, _gotchiIds));
        bytes32 root = s.xpDrops[_propId].root;

        //short-circuits do not revert entire claim process
        //proof is valid
        if (LibMerkle.verify(_proof, root, node)) {
            //claiming for a set of gotchis
            if (_onlyGotchis.length > 0) {
                //make sure gotchi is a subset
                for (uint256 i; i < _onlyGotchis.length; i++) {
                    uint256 gotchiId = _onlyGotchis[i];
                    if (_inUintArray(_gotchiIds, gotchiId)) {
                        //check claimed status
                        if (s.xpClaimed[gotchiId][_propId] == 0) {
                            //allocate xp
                            _allocateXPViaDrop(_propId, gotchiId, xpAmount);
                        }
                    }
                }
            } else {
                //claiming for all gotchis
                for (uint256 i; i < _gotchiIds.length; i++) {
                    uint256 gotchiId = _gotchiIds[i];
                    //check claimed status
                    if (s.xpClaimed[gotchiId][_propId] == 0) {
                        //allocate xp
                        _allocateXPViaDrop(_propId, gotchiId, xpAmount);
                    }
                }
            }
        }
    }

    function _allocateXPViaDrop(bytes32 _propId, uint256 _tokenId, uint256 _xpAmount) private {
        //we assume that xp allocation via drops are limited by the tree
        AppStorage storage s = LibAppStorage.diamondStorage();
        s.aavegotchis[_tokenId].experience += _xpAmount;
        s.xpClaimed[_tokenId][_propId] = _xpAmount;

        //populate array for event
        uint256[] memory tokenIds = new uint256[](1);
        uint256[] memory xpAmounts = new uint256[](1);
        tokenIds[0] = _tokenId;
        xpAmounts[0] = _xpAmount;
        emit GrantExperience(tokenIds, xpAmounts);
        emit XPClaimed(_propId, _tokenId);
    }
}

function _inUintArray(uint256[] memory _array, uint256 _targ) pure returns (bool exists_) {
    //linear search is better for unsorted arrays
    if (_array.length > 0) {
        for (uint256 i; i < _array.length; i++) {
            if (_targ == _array[i]) {
                exists_ = true;
                break;
            }
        }
    }
}
