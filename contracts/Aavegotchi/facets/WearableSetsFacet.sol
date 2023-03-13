// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {Modifiers, WearableSet} from "../libraries/LibAppStorage.sol";

contract WearableSetsFacet is Modifiers {
    ///@notice Query all available wearable sets
    ///@dev Called by off chain software so not too concerned about gas costs
    ///@return wearableSets_ Am array of structs, each struct containing details about a wearable set
    function getWearableSets() external view returns (WearableSet[] memory wearableSets_) {
        wearableSets_ = s.wearableSets;
    }

    ///@notice Query a particular wearable set
    ///@param _index Index of the set to query
    ///@return wearableSet_ A struct containing details about a wearable set with index `_index`
    function getWearableSet(uint256 _index) public view returns (WearableSet memory wearableSet_) {
        uint256 length = s.wearableSets.length;
        require(_index < length, "ItemsFacet: Wearable set does not exist");
        wearableSet_ = s.wearableSets[_index];
    }

    ///@notice Query how many wearable sets are available
    ///@return The total number of wearable sets available
    function totalWearableSets() external view returns (uint256) {
        return s.wearableSets.length;
    }

    ///@notice Query the wearable set identiiers that a wearable belongs to
    ///@param _wearableIds An array containing the wearable identifiers to query
    ///@return wearableSetIds_ An array containing the wearable set identifiers for each `_wearableIds`
    function findWearableSets(uint256[] calldata _wearableIds) external view returns (uint256[] memory wearableSetIds_) {
        unchecked {
            uint256 length = s.wearableSets.length;
            wearableSetIds_ = new uint256[](length);
            uint256 count;
            for (uint256 i; i < length; i++) {
                uint16[] memory setWearableIds = s.wearableSets[i].wearableIds;
                bool foundSet = true;
                for (uint256 j; j < setWearableIds.length; j++) {
                    uint256 setWearableId = setWearableIds[j];
                    bool foundWearableId = false;
                    for (uint256 k; k < _wearableIds.length; k++) {
                        if (_wearableIds[k] == setWearableId) {
                            foundWearableId = true;
                            break;
                        }
                    }
                    if (foundWearableId == false) {
                        foundSet = false;
                        break;
                    }
                }
                if (foundSet) {
                    wearableSetIds_[count] = i;
                    count++;
                }
            }
            assembly {
                mstore(wearableSetIds_, count)
            }
        }
    }
}
