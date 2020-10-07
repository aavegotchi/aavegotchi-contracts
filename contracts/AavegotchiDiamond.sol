// SPDX-License-Identifier: MIT
pragma solidity 0.7.1;
pragma experimental ABIEncoderV2;

/******************************************************************************\
* Author: Nick Mudge
*
* Implementation of an example of a diamond.
/******************************************************************************/

import "./facets/OwnershipFacet.sol";
import "./libraries/LibDiamondCut.sol";
import "./facets/DiamondCutFacet.sol";
import "./facets/DiamondLoupeFacet.sol";
import "./interfaces/IERC165.sol";
import "./interfaces/IDiamondCut.sol";
import "./interfaces/IDiamondLoupe.sol";
import "./facets/AavegotchiNFT.sol";
import "./facets/SVGStorage.sol";
import "./libraries/AppStorage.sol";
import "./facets/Wearables.sol";
import "./GHST.sol";

contract Aavegotchi {
    AppStorage s;
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor(IDiamondCut.FacetCut[] memory _diamondCut, address _owner, address _ghstContract) {
        LibDiamondCut.diamondCut(_diamondCut, address(0), new bytes(0));
        s.contractOwner = _owner;
        s.wearablesSVG.push();
        
        LibDiamondStorage.DiamondStorage storage ds = LibDiamondStorage.diamondStorage();      

        // adding ERC165 data
        ds.supportedInterfaces[IERC165.supportsInterface.selector] = true;
        ds.supportedInterfaces[IDiamondCut.diamondCut.selector] = true;
        bytes4 interfaceID = IDiamondLoupe.facets.selector ^
            IDiamondLoupe.facetFunctionSelectors.selector ^
            IDiamondLoupe.facetAddresses.selector ^
            IDiamondLoupe.facetAddress.selector;
        ds.supportedInterfaces[interfaceID] = true;
        
        s.ghstContract = _ghstContract;
    }

    // Find facet for function that is called and execute the
    // function if a facet is found and return any value.
    fallback() external payable {
        LibDiamondStorage.DiamondStorage storage ds;
        bytes32 position = LibDiamondStorage.DIAMOND_STORAGE_POSITION;                
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
