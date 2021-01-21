// SPDX-License-Identifier: MIT
pragma solidity 0.7.6;
pragma experimental ABIEncoderV2;

/******************************************************************************\
* Author: Nick Mudge
*
* Implementation of an example of a diamond.
/******************************************************************************/

import "../shared/libraries/LibDiamond.sol";
import "../shared/interfaces/IDiamondLoupe.sol";
import "../shared/interfaces/IDiamondCut.sol";
import "../shared/interfaces/IERC173.sol";
import "../shared/interfaces/IERC165.sol";
import "./libraries/AppStorage.sol";

contract GHSTDiamond {
    AppStorage s;

    struct ConstructorArgs {
        address owner;
    }

    constructor(IDiamondCut.FacetCut[] memory _diamondCut, ConstructorArgs memory _args) {
        LibDiamond.diamondCut(_diamondCut, address(0), new bytes(0));
        LibDiamond.setContractOwner(_args.owner);

        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();

        // adding ERC165 data
        ds.supportedInterfaces[type(IERC165).interfaceId] = true;
        ds.supportedInterfaces[type(IDiamondCut).interfaceId] = true;
        ds.supportedInterfaces[type(IDiamondLoupe).interfaceId] = true;
        ds.supportedInterfaces[type(IERC173).interfaceId] = true;
    }

    // Find facet for function that is called and execute the
    // function if a facet is found and return any value.
    fallback() external payable {
        LibDiamond.DiamondStorage storage ds;
        bytes32 position = LibDiamond.DIAMOND_STORAGE_POSITION;
        assembly {
            ds.slot := position
        }
        address facet = address(bytes20(ds.facets[msg.sig]));
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

    receive() external payable {}
}
