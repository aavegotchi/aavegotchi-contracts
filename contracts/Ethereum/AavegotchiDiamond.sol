// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;
pragma experimental ABIEncoderV2;

/******************************************************************************\
* Authors: Nick Mudge (mudgen), 
*
* Implementation of an example of a diamond.
/******************************************************************************/

import "../shared/facets/OwnershipFacet.sol";
import "./libraries/LibAppStorage.sol";
import "../shared/facets/DiamondCutFacet.sol";
import "../shared/facets/DiamondLoupeFacet.sol";
import "../shared/interfaces/IERC165.sol";
import "../shared/interfaces/IDiamondCut.sol";
import "../shared/interfaces/IDiamondLoupe.sol";
import "../shared/libraries/LibDiamond.sol";

contract AavegotchiDiamond {
    AppStorage internal s;
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    struct ConstructorArgs {
        address contractOwner;
        address rootChainManager;
    }

    constructor(IDiamondCut.FacetCut[] memory _diamondCut, ConstructorArgs memory _args) {
        LibDiamond.diamondCut(_diamondCut, address(0), new bytes(0));
        LibDiamond.setContractOwner(_args.contractOwner);
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        s.itemsBaseUri = "https://aavegotchi.com/metadata/items/";
        s.rootChainManager = _args.rootChainManager; //0x0D29aDA4c818A9f089107201eaCc6300e56E0d5c;

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

    receive() external payable {}
}
