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
import "./GHST.sol";

contract Aavegotchi {
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor(address[] memory _facets) {
        LibDiamondStorage.DiamondStorage storage ds = LibDiamondStorage.diamondStorage();
        ds.contractOwner = msg.sender;

        LibA.Storage storage ags = LibA.diamondStorage();
        ags.wearablesSVG.push();

        SVGStorage svgStorage = new SVGStorage();

        AavegotchiNFT aavegotchiNFT = new AavegotchiNFT();

        Wearables wearables = new Wearables();

        IDiamondCut.FacetCut[] memory diamondCut = new IDiamondCut.FacetCut[](6);

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

        diamondCut[3].facetAddress = address(aavegotchiNFT);
        diamondCut[3].action = IDiamondCut.FacetCutAction.Add;
        diamondCut[3].functionSelectors = new bytes4[](15);
        diamondCut[3].functionSelectors[0] = AavegotchiNFT.buyPortals.selector;
        diamondCut[3].functionSelectors[1] = AavegotchiNFT.ghstAddress.selector;
        diamondCut[3].functionSelectors[2] = AavegotchiNFT.getAavegotchiSVG.selector;
        diamondCut[3].functionSelectors[3] = AavegotchiNFT.getFirstAavegotchi.selector;
        diamondCut[3].functionSelectors[4] = AavegotchiNFT.balanceOf.selector;
        diamondCut[3].functionSelectors[5] = AavegotchiNFT.tokenOfOwnerByIndex.selector;
        diamondCut[3].functionSelectors[6] = AavegotchiNFT.ownerOf.selector;
        diamondCut[3].functionSelectors[7] = 0x42842e0e; // safeTransferFrom(address,address,uint256)
        diamondCut[3].functionSelectors[8] = 0xb88d4fde; // safeTransferFrom(address,address,uint256,bytes)
        diamondCut[3].functionSelectors[9] = AavegotchiNFT.transferFrom.selector;
        diamondCut[3].functionSelectors[10] = AavegotchiNFT.approve.selector;
        diamondCut[3].functionSelectors[11] = AavegotchiNFT.setApprovalForAll.selector;
        diamondCut[3].functionSelectors[12] = AavegotchiNFT.getApproved.selector;
        diamondCut[3].functionSelectors[13] = AavegotchiNFT.isApprovedForAll.selector;
        diamondCut[3].functionSelectors[14] = AavegotchiNFT.allAavegotchisOfOwner.selector;

        diamondCut[4].facetAddress = address(svgStorage);
        diamondCut[4].action = IDiamondCut.FacetCutAction.Add;
        diamondCut[4].functionSelectors = new bytes4[](3);
        diamondCut[4].functionSelectors[0] = SVGStorage.storeAavegotchiLayersSVG.selector;
        diamondCut[4].functionSelectors[1] = SVGStorage.storeWearablesSVG.selector;
        diamondCut[4].functionSelectors[2] = SVGStorage.storeItemsSVG.selector;

        diamondCut[5].facetAddress = address(wearables);
        diamondCut[5].action = IDiamondCut.FacetCutAction.Add;
        diamondCut[5].functionSelectors = new bytes4[](5);
        diamondCut[5].functionSelectors[0] = Wearables.mintWearables.selector;
        diamondCut[5].functionSelectors[1] = Wearables.transferToParent.selector;
        diamondCut[5].functionSelectors[2] = Wearables.transferFromParent.selector;
        diamondCut[5].functionSelectors[3] = Wearables.wearablesBalances.selector;
        diamondCut[5].functionSelectors[4] = Wearables.balanceOfToken.selector;

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
        
        ags.ghstDiamond = address(new GHST(msg.sender, _facets, address(this)));

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
