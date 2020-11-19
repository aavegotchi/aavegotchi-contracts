// SPDX-License-Identifier: MIT
pragma solidity 0.7.4;

library LibVrf {
    bytes32 internal constant DIAMOND_STORAGE_POSITION = keccak256("chainlink.VRF");

    struct Storage {
        mapping(uint256 => uint256) batchIdToRandomNumber;
        bytes32 keyHash;
        bool vrfPending;
        uint40 nextVrfCallTime;
        uint32 nextBatchId;
        uint32 batchCount;
        uint144 fee;
    }

    function diamondStorage() internal pure returns (Storage storage ds) {
        bytes32 position = DIAMOND_STORAGE_POSITION;
        assembly {
            ds.slot := position
        }
    }

    function getBatchRandomNumber(uint256 _batchId) internal view returns (uint256 randomNumber_) {
        randomNumber_ = diamondStorage().batchIdToRandomNumber[_batchId];
    }
}
