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
import "./libraries/LibA.sol";
import "./facets/Wearables.sol";
import "./facets/GHSTERC20.sol";

contract GHST {
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor(address _owner, address[] memory _facets, address _aavegotchiDiamond) {
        LibDiamondStorage.DiamondStorage storage ds = LibDiamondStorage.diamondStorage();
        LibGHST.Storage storage ghst = LibGHST.diamondStorage();
        ds.contractOwner = _owner;
        
        GHSTERC20 ghstERC20 = new GHSTERC20();

        IDiamondCut.FacetCut[] memory diamondCut = new IDiamondCut.FacetCut[](4);

        // adding diamondCut function
        diamondCut[0].facetAddress = _facets[0];
        diamondCut[0].action = IDiamondCut.FacetCutAction.Add;
        diamondCut[0].functionSelectors = new bytes4[](1);
        diamondCut[0].functionSelectors[0] = DiamondCutFacet.diamondCut.selector;

        // adding diamond loupe functions
        diamondCut[1].facetAddress = _facets[1];
        diamondCut[1].action = IDiamondCut.FacetCutAction.Add;
        diamondCut[1].functionSelectors = new bytes4[](5);
        diamondCut[1].functionSelectors[0] = DiamondLoupeFacet.facetFunctionSelectors.selector;
        diamondCut[1].functionSelectors[1] = DiamondLoupeFacet.facets.selector;
        diamondCut[1].functionSelectors[2] = DiamondLoupeFacet.facetAddress.selector;
        diamondCut[1].functionSelectors[3] = DiamondLoupeFacet.facetAddresses.selector;
        diamondCut[1].functionSelectors[4] = DiamondLoupeFacet.supportsInterface.selector;

        // adding ownership functions
        diamondCut[2].facetAddress = _facets[2];
        diamondCut[2].action = IDiamondCut.FacetCutAction.Add;
        diamondCut[2].functionSelectors = new bytes4[](2);
        diamondCut[2].functionSelectors[0] = OwnershipFacet.transferOwnership.selector;
        diamondCut[2].functionSelectors[1] = OwnershipFacet.owner.selector;

        diamondCut[3].facetAddress = address(ghstERC20);
        diamondCut[3].action = IDiamondCut.FacetCutAction.Add;
        diamondCut[3].functionSelectors = new bytes4[](13);
        diamondCut[3].functionSelectors[0] = GHSTERC20.name.selector;
        diamondCut[3].functionSelectors[1] = GHSTERC20.symbol.selector;
        diamondCut[3].functionSelectors[2] = GHSTERC20.decimals.selector;
        diamondCut[3].functionSelectors[3] = GHSTERC20.totalSupply.selector;
        diamondCut[3].functionSelectors[4] = GHSTERC20.balanceOf.selector;
        diamondCut[3].functionSelectors[5] = GHSTERC20.transfer.selector;
        diamondCut[3].functionSelectors[6] = GHSTERC20.transferFrom.selector;
        diamondCut[3].functionSelectors[7] = GHSTERC20.approve.selector;
        diamondCut[3].functionSelectors[8] = GHSTERC20.increaseAllowance.selector;
        diamondCut[3].functionSelectors[10] = GHSTERC20.decreaseAllowance.selector;
        diamondCut[3].functionSelectors[11] = GHSTERC20.allowance.selector;
        diamondCut[3].functionSelectors[12] = GHSTERC20.mint.selector;  

        // execute non-standard internal diamondCut function to add functions
        LibDiamondCut.diamondCut(diamondCut, address(0), new bytes(0));

        // adding ERC165 data
        ds.supportedInterfaces[IERC165.supportsInterface.selector] = true;
        ds.supportedInterfaces[IDiamondCut.diamondCut.selector] = true;
        bytes4 interfaceID = IDiamondLoupe.facets.selector ^
            IDiamondLoupe.facetFunctionSelectors.selector ^
            IDiamondLoupe.facetAddresses.selector ^
            IDiamondLoupe.facetAddress.selector;
        ds.supportedInterfaces[interfaceID] = true;

        ghst.aavegotchiDiamond = _aavegotchiDiamond;
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
