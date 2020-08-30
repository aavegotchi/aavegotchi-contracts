// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

/******************************************************************************\
* Author: Nick Mudge
*
* Implementation of an example of a diamond.
/******************************************************************************/

import "./libs/DiamondLib.sol";
import "./facets/DiamondFacet.sol";
import "./facets/DiamondLoupeFacet.sol";
import "./interfaces/IERC165.sol";
import "./interfaces/IDiamond.sol";
import "./interfaces/IDiamondLoupe.sol";
import "./facets/AavegotchiNFT.sol";
import "./facets/SVGStorage.sol";
import "./libs/ALib.sol";
import "./facets/Wearables.sol";

contract Aavegotchi {

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor() {
        DiamondLib.Storage storage ds = DiamondLib.getStorage();
        ds.contractOwner = msg.sender;
            
        ALib.Storage storage ags = ALib.getStorage();               
        ags.wearablesSVG.push();

        
        // Create a DiamondFacet contract which implements the Diamond interface
        DiamondFacet diamondFacet = new DiamondFacet();

        // Create a DiamondLoupeFacet contract which implements the Diamond Loupe interface
        DiamondLoupeFacet diamondLoupeFacet = new DiamondLoupeFacet();

        SVGStorage svgStorage = new SVGStorage();

        AavegotchiNFT aavegotchiNFT = new AavegotchiNFT();

        Wearables wearables = new Wearables();

        bytes[] memory cut = new bytes[](6);

        // Adding cut function
        cut[0] = abi.encodePacked(diamondFacet, IDiamond.diamondCut.selector);

        // Adding diamond loupe functions
        cut[1] = abi.encodePacked(
            diamondLoupeFacet,
            IDiamondLoupe.facetFunctionSelectors.selector,
            IDiamondLoupe.facets.selector,
            IDiamondLoupe.facetAddress.selector,
            IDiamondLoupe.facetAddresses.selector
        );

        // Adding supportsInterface function
        cut[2] = abi.encodePacked(address(this), IERC165.supportsInterface.selector);

        cut[3] = abi.encodePacked(
            aavegotchiNFT,
            AavegotchiNFT.mintAavegotchi.selector,
            AavegotchiNFT.getAavegotchiSVG.selector,
            AavegotchiNFT.getFirstAavegotchi.selector            
        );

        cut[4] = abi.encodePacked(
            svgStorage,
            SVGStorage.storeAavegotchiLayersSVG.selector,
            SVGStorage.storeWearablesSVG.selector
        );

        cut[5] = abi.encodePacked(
            wearables,
            Wearables.mintWearables.selector,
            Wearables.transferToParent.selector,
            Wearables.transferFromParent.selector,
            Wearables.wearablesBalances.selector,
            Wearables.balanceOfToken.selector
        );

        // execute non-standard internal diamondCut function to add functions
        DiamondLib.diamondCut(cut);
        
        // adding ERC165 data
        ds.supportedInterfaces[IERC165.supportsInterface.selector] = true;
        ds.supportedInterfaces[IDiamond.diamondCut.selector] = true;
        bytes4 interfaceID = IDiamondLoupe.facets.selector ^ IDiamondLoupe.facetFunctionSelectors.selector ^ IDiamondLoupe.facetAddresses.selector ^ IDiamondLoupe.facetAddress.selector;
        ds.supportedInterfaces[interfaceID] = true;
    }

    // This is an immutable functions because it is defined directly in the diamond.
    // Why is it here instead of in a facet?  No reason, just to show an immutable function.
    // This implements ERC-165.
    function supportsInterface(bytes4 _interfaceID) external view returns (bool) {
        DiamondLib.Storage storage ds = DiamondLib.getStorage();
        return ds.supportedInterfaces[_interfaceID];
    }

    // Finds facet for function that is called and executes the
    // function if it is found and returns any value.
    fallback() external payable {
        DiamondLib.Storage storage ds;
        bytes32 position = DiamondLib.DIAMOND_STORAGE_POSITION;
        assembly { ds.slot := position }
        address facet = address(bytes20(ds.facets[msg.sig]));
        require(facet != address(0));   
        assembly {            
            calldatacopy(0, 0, calldatasize())
            let result := delegatecall(gas(), facet, 0, calldatasize(), 0, 0)            
            returndatacopy(0, 0, returndatasize())
            switch result
            case 0 {revert(0, returndatasize())}
            default {return (0, returndatasize())}
        }
    }

    receive() external payable {}
}
