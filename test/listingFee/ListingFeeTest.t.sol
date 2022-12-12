// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.1;

import "forge-std/Test.sol";
import "../../contracts/shared/interfaces/IDiamondCut.sol";

import "../periphery/foundry/PeripheryConstants.sol";
import "../../contracts/Aavegotchi/facets/ERC1155MarketplaceFacet.sol";
import "../../contracts/Aavegotchi/facets/ERC721MarketplaceFacet.sol";
import "../../contracts/shared/facets/OwnershipFacet.sol";

contract ListingFeeTest is Test, IDiamondCut, PeripheryConstants {
    ERC1155MarketplaceFacet erc1155;
    ERC721MarketplaceFacet erc721;

    function setUp() public {
        diamondOwner = OwnershipFacet(aavegotchiDiamond).owner();

        //deploy all changed aavegotchi diamond facets
        erc1155 = new ERC1155MarketplaceFacet();
        erc721 = new ERC721MarketplaceFacet();

        cutDiamonds();
    }

    function cutDiamonds() internal {
        //prepare cut args for aavegotchi diamond

        IDiamondCut.FacetCut[] memory cut = new IDiamondCut.FacetCut[](2);

        vm.startPrank(diamondOwner);
        cut[0] = IDiamondCut.FacetCut({
            facetAddress: address(erc1155),
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: generateSelectors("ERC1155MarketplaceFacet")
        });

        cut[1] = IDiamondCut.FacetCut({
            facetAddress: address(erc721),
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: generateSelectors("ERC721MarketplaceFacet")
        });

        /////UPGRADE AAVEGOTCHI DIAMOND
        IDiamondCut(aavegotchiDiamond).diamondCut(cut, address(0), "");
        vm.stopPrank();
    }

    function testListingFee() external {
        address parcelOwner = IERC721(realmAddress).ownerOf(parcelId);
        //get balances before
        //test ERC1155listing
        uint256 ghstbalanceBefore = ERC20(ghstAddress).balanceOf(parcelOwner);
        uint256 maticBalanceBefore = parcelOwner.balance;
        uint256 targetAddressBalanceBefore = address(0).balance;
        vm.prank(parcelOwner);
        ERC721MarketplaceFacet(aavegotchiDiamond).addERC721Listing{value: 1e18}(realmAddress, parcelId, 100e18);
        uint256 targetAddressBalanceAfter = address(0).balance;
        uint256 ghstbalanceAfter = ERC20(ghstAddress).balanceOf(parcelOwner);
        uint256 maticBalanceAfter = parcelOwner.balance;
        assertEq(targetAddressBalanceAfter, targetAddressBalanceBefore + 1e17);
        assertEq(maticBalanceAfter, maticBalanceBefore - 1e17);
        assertEq(ghstbalanceBefore, ghstbalanceAfter);
    }

    //no need to test for erc1155 since internal function is shared
    function diamondCut(FacetCut[] calldata _diamondCut, address _init, bytes calldata _calldata) external override {}

    function generateSelectors(string memory _facetName) internal returns (bytes4[] memory selectors) {
        string[] memory cmd = new string[](3);
        cmd[0] = "node";
        cmd[1] = "scripts/genSelectors.js";
        cmd[2] = _facetName;
        bytes memory res = vm.ffi(cmd);
        selectors = abi.decode(res, (bytes4[]));
    }
}

interface ERC20 {
    function balanceOf(address _owner) external view returns (uint256);
}
