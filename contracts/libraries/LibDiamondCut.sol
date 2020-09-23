// SPDX-License-Identifier: MIT
pragma solidity ^0.7.1;
pragma experimental ABIEncoderV2;

/******************************************************************************\
* Author: Nick Mudge
*
* Implementation of Diamond facet.
* This is gas optimized by reducing storage reads and storage writes.
* This code is as complex as it is to reduce gas costs.
/******************************************************************************/

import "./LibDiamondStorage.sol";
import "../interfaces/IDiamondCut.sol";

library LibDiamondCut {
    event DiamondCut(IDiamondCut.Facet[] _diamondCut, address _init, bytes _calldata);

    bytes32 constant CLEAR_ADDRESS_MASK = bytes32(uint256(0xffffffffffffffffffffffff));
    bytes32 constant CLEAR_SELECTOR_MASK = bytes32(uint256(0xffffffff << 224));

    // Non-standard internal function version of diamondCut.
    // This code is almost the same as the diamondCut external function,
    // except it is using Facet[] memory _diamondCut' instead of
    // Facet[] calldata _diamondCut'.
    // The code is duplicated to prevent copying calldata to memory which
    // causes an error for a two dimensional array.
    function diamondCut(IDiamondCut.Facet[] memory _diamondCut) internal {
        LibDiamondStorage.DiamondStorage storage ds = LibDiamondStorage.diamondStorage();
        uint256 originalSelectorCount = ds.selectorCount;
        uint256 selectorCount = originalSelectorCount;
        bytes32 selectorSlot;
        // Check if last selector slot is not full
        if (selectorCount % 8 > 0) {
            // get last selectorSlot
            selectorSlot = ds.selectorSlots[selectorCount / 8];
        }
        // loop through diamond cut
        for (uint256 facetIndex; facetIndex < _diamondCut.length; facetIndex++) {
            (selectorCount, selectorSlot) = addReplaceRemoveFacetSelectors(
                selectorCount,
                selectorSlot,
                _diamondCut[facetIndex].facetAddress,
                _diamondCut[facetIndex].functionSelectors
            );
        }
        if (selectorCount != originalSelectorCount) {
            ds.selectorCount = selectorCount;
        }
        // If last selector slot is not full
        if (selectorCount % 8 > 0) {
            ds.selectorSlots[selectorCount / 8] = selectorSlot;
        }
        emit DiamondCut(_diamondCut, address(0), new bytes(0));
    }

    function addReplaceRemoveFacetSelectors(
        uint256 _selectorCount,
        bytes32 _selectorSlot,
        address _newFacetAddress,
        bytes4[] memory _selectors
    ) internal returns (uint256, bytes32) {
        LibDiamondStorage.DiamondStorage storage ds = LibDiamondStorage.diamondStorage();
        // Get how many function selectors are in the last 32 byte slot
        uint256 selectorsInSlot = _selectorCount % 8;
        // Get how many 32 byte slots are used
        uint256 selectorSlotCount = _selectorCount / 8;
        // adding or replacing functions
        if (_newFacetAddress != address(0)) {
            hasContractCode(_newFacetAddress, "LibDiamondCut: facet has no code");
            // add and replace selectors
            for (uint256 selectorIndex; selectorIndex < _selectors.length; selectorIndex++) {
                bytes4 selector = _selectors[selectorIndex];
                bytes32 oldFacet = ds.facets[selector];
                // add
                if (oldFacet == 0) {
                    // update the last slot at then end of the function
                    ds.facets[selector] = bytes32(bytes20(_newFacetAddress)) | (bytes32(selectorsInSlot) << 64) | bytes32(selectorSlotCount);
                    // clear selector position in slot and add selector
                    _selectorSlot =
                        (_selectorSlot & ~(CLEAR_SELECTOR_MASK >> (selectorsInSlot * 32))) |
                        (bytes32(selector) >> (selectorsInSlot * 32));
                    selectorsInSlot++;
                    // if slot is full then write it to storage
                    if (selectorsInSlot == 8) {
                        ds.selectorSlots[selectorSlotCount] = _selectorSlot;
                        _selectorSlot = 0;
                        selectorsInSlot = 0;
                        selectorSlotCount++;
                    }
                } else {
                    // replace
                    require(address(bytes20(oldFacet)) != address(this), "LibDiamondCut: Can't replace immutable function");
                    if (address(bytes20(oldFacet)) != _newFacetAddress) {
                        // replace old facet address
                        ds.facets[selector] = (oldFacet & CLEAR_ADDRESS_MASK) | bytes32(bytes20(_newFacetAddress));
                    }
                }
            }
        } else {
            // remove functions
            for (uint256 selectorIndex; selectorIndex < _selectors.length; selectorIndex++) {
                bytes4 selector = _selectors[selectorIndex];
                bytes32 oldFacet = ds.facets[selector];
                // if function does not exist then do nothing
                if (oldFacet == 0) {
                    continue;
                }
                require(address(bytes20(oldFacet)) != address(this), "LibDiamondCut: Can't remove immutable function");
                if (_selectorSlot == 0) {
                    selectorSlotCount--;
                    _selectorSlot = ds.selectorSlots[selectorSlotCount];
                    selectorsInSlot = 8;
                }
                uint256 oldSelectorsSlotCount = uint64(uint256(oldFacet));
                uint256 oldSelectorsInSlot = uint32(uint256(oldFacet >> 64));
                // gets the last selector in the slot
                bytes4 lastSelector = bytes4(_selectorSlot << ((selectorsInSlot - 1) * 32));
                if (oldSelectorsSlotCount != selectorSlotCount) {
                    bytes32 oldSelectorSlot = ds.selectorSlots[oldSelectorsSlotCount];
                    // clears the selector we are deleting and puts the last selector in its place.
                    oldSelectorSlot =
                        (oldSelectorSlot & ~(CLEAR_SELECTOR_MASK >> (oldSelectorsInSlot * 32))) |
                        (bytes32(lastSelector) >> (oldSelectorsInSlot * 32));
                    // update storage with the modified slot
                    ds.selectorSlots[oldSelectorsSlotCount] = oldSelectorSlot;
                } else {
                    // clears the selector we are deleting and puts the last selector in its place.
                    _selectorSlot =
                        (_selectorSlot & ~(CLEAR_SELECTOR_MASK >> (oldSelectorsInSlot * 32))) |
                        (bytes32(lastSelector) >> (oldSelectorsInSlot * 32));
                }
                selectorsInSlot--;
                if (selectorsInSlot == 0) {
                    delete ds.selectorSlots[selectorSlotCount];
                    _selectorSlot = 0;
                }
                if (lastSelector != selector) {
                    // update last selector slot position info
                    ds.facets[lastSelector] = (oldFacet & CLEAR_ADDRESS_MASK) | bytes20(ds.facets[lastSelector]);
                }
                delete ds.facets[selector];
            }
        }
        return (selectorSlotCount * 8 + selectorsInSlot, _selectorSlot);
    }

    function hasContractCode(address _contract, string memory _errorMessage) internal view {
        uint256 contractSize;
        assembly {
            contractSize := extcodesize(_contract)
        }
        require(contractSize > 0, _errorMessage);
    }
}
