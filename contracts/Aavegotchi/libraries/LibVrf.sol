// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {ILink} from "../interfaces/ILink.sol";

library LibVrf {
    bytes32 internal constant DIAMOND_STORAGE_POSITION = keccak256("chainlink.VRF");

    struct Storage {
        mapping(bytes32 => uint256) vrfRequestIdToTokenId;
        mapping(bytes32 => uint256) nonces;
        mapping(uint256 => bool) tokenIdToVrfPending;
        bytes32 keyHash;
        uint144 fee;
        address vrfCoordinator;
        ILink link;
    }

    function diamondStorage() internal pure returns (Storage storage ds) {
        bytes32 position = DIAMOND_STORAGE_POSITION;
        assembly {
            ds.slot := position
        }
    }
}
