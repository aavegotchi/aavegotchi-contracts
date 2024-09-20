// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

/******************************************************************************\
* Authors: Nick Mudge (https://twitter.com/mudgen)
*
* Implementation of a diamond.
/******************************************************************************/

import {WearableLibDiamond} from "./libraries/WearableLibDiamond.sol";
import {DiamondCutFacet} from "../../shared/facets/DiamondCutFacet.sol";
import {DiamondLoupeFacet} from "../../shared/facets/DiamondLoupeFacet.sol";
import {OwnershipFacet} from "../../shared/facets/OwnershipFacet.sol";

contract WearableDiamond {
    constructor(
        address _contractOwner,
        address _diamondCutFacet,
        address _diaomondLoupeFacet,
        address _ownershipFacet
    ) {
        WearableLibDiamond.setContractOwner(_contractOwner);
        WearableLibDiamond.addDiamondFunctions(_diamondCutFacet, _diaomondLoupeFacet, _ownershipFacet);
        WearableLibDiamond.DiamondStorage storage ds = WearableLibDiamond.diamondStorage();
        ds.supportedInterfaces[0xd9b67a26] = true; //erc1155
    }

    // Find facet for function that is called and execute the
    // function if a facet is found and return any value.
    fallback() external payable {
        WearableLibDiamond.DiamondStorage storage ds;
        bytes32 position = WearableLibDiamond.DIAMOND_STORAGE_POSITION;
        assembly {
            ds.slot := position
        }
        address facet = ds.selectorToFacetAndPosition[msg.sig].facetAddress;
        require(facet != address(0), "Diamond: Function does not exist");
        assembly {
            calldatacopy(0, 0, calldatasize())
            let result := delegatecall(gas(), facet, 0, calldatasize(), 0, 0)
            returndatacopy(0, 0, returndatasize())
            switch result
            case 0 {
                revert(0, returndatasize())
            }
            default {
                return(0, returndatasize())
            }
        }
    }
}
