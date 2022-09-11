// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.1;

import "forge-std/Test.sol";

import "../../../contracts/shared/interfaces/IDiamondCut.sol";

//AavegotchiDiamond
import "../../../contracts/Aavegotchi/facets/AavegotchiFacet.sol";
import "../../../contracts/Aavegotchi/facets/BridgeFacet.sol";
import "../../../contracts/Aavegotchi/facets/DAOFacet.sol";
import "../../../contracts/Aavegotchi/facets/ERC1155MarketplaceFacet.sol";
import "../../../contracts/Aavegotchi/facets/ItemsFacet.sol";
import "../../../contracts/Aavegotchi/facets/ItemsTransferFacet.sol";
import "../../../contracts/Aavegotchi/facets/ShopFacet.sol";
import "../../../contracts/Aavegotchi/facets/VoucherMigrationFacet.sol";
import "../../../contracts/Aavegotchi/facets/PeripheryFacet.sol";
import "../../../contracts/shared/facets/OwnershipFacet.sol";
import "./PeripheryConstants.sol";

//Periphery

import "../../../contracts/Aavegotchi/WearableDiamond/WearableDiamond.sol";
import "../../../contracts/Aavegotchi/WearableDiamond/facets/WearablesFacet.sol";
import "../../../contracts/Aavegotchi/WearableDiamond/facets/EventHandlerFacet.sol";

contract PeripheryTest is Test, IDiamondCut, PeripheryConstants {
    event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value);

    event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values);

    event ApprovalForAll(address indexed account, address indexed operator, bool approved);

    event URI(string value, uint256 indexed id);

    //Aavegotchi existing facets
    AavegotchiFacet aFacet;
    BridgeFacet bFacet;
    DAOFacet dFacet;
    ERC1155MarketplaceFacet marketplaceFacet;
    ItemsFacet iFacet;
    ItemsTransferFacet iTransferFacet;
    ShopFacet sFacet;
    VoucherMigrationFacet vFacet;
    //new facet
    PeripheryFacet pFacet;

    //WearableDiamond
    WearableDiamond wDiamond;
    WearablesFacet wFacet;
    EventHandlerFacet eFacet;

    //uses already deployed DiaomondCut,DiamondLoupe and OwnershipFacet of aavegotchiDiamond

    function setUp() public {
        diamondOwner = OwnershipFacet(aavegotchiDiamond).owner();

        //deploy all changed aavegotchi diamond facets
        aFacet = new AavegotchiFacet();
        bFacet = new BridgeFacet();
        dFacet = new DAOFacet();
        marketplaceFacet = new ERC1155MarketplaceFacet();
        iFacet = new ItemsFacet();
        iTransferFacet = new ItemsTransferFacet();
        sFacet = new ShopFacet();
        vFacet = new VoucherMigrationFacet();

        //deploy new peripheryFacet
        pFacet = new PeripheryFacet();

        //deploy wearableDiamond contracts and facets
        wDiamond = new WearableDiamond(diamondOwner, cutFacet, loupeFacet, ownerShipFacet);
        wearableDiamond = address(wDiamond);
        wFacet = new WearablesFacet();
        eFacet = new EventHandlerFacet();
        cutDiamonds();
    }

    function cutDiamonds() internal {
        //prepare cut args for aavegotchi diamond

        IDiamondCut.FacetCut[] memory cut = new IDiamondCut.FacetCut[](9);

        vm.startPrank(diamondOwner);
        cut[0] = IDiamondCut.FacetCut({
            facetAddress: address(aFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: populateBytes4(AavegotchiFacet.setPeriphery.selector)
        });

        cut[1] = IDiamondCut.FacetCut({
            facetAddress: address(bFacet),
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: populateBytes4(BridgeFacet.withdrawItemsBatch.selector, BridgeFacet.deposit.selector)
        });

        cut[2] = IDiamondCut.FacetCut({
            facetAddress: address(dFacet),
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: populateBytes4(DAOFacet.addItemTypes.selector, DAOFacet.addItemTypesAndSvgs.selector, DAOFacet.mintItems.selector)
        });

        cut[3] = IDiamondCut.FacetCut({
            facetAddress: address(marketplaceFacet),
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: populateBytes4(
                ERC1155MarketplaceFacet.executeERC1155ListingToRecipient.selector,
                ERC1155MarketplaceFacet.executeERC1155Listing.selector
            )
        });

        cut[4] = IDiamondCut.FacetCut({
            facetAddress: address(iFacet),
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: populateBytes4(ItemsFacet.setBaseURI.selector, ItemsFacet.equipWearables.selector, ItemsFacet.useConsumables.selector)
        });

        cut[5] = IDiamondCut.FacetCut({
            facetAddress: address(iTransferFacet),
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: generateSelectors("ItemsTransferFacet")
        });

        cut[6] = IDiamondCut.FacetCut({
            facetAddress: address(sFacet),
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: populateBytes4(ShopFacet.purchaseTransferItemsWithGhst.selector, ShopFacet.purchaseItemsWithGhst.selector)
        });

        cut[7] = IDiamondCut.FacetCut({
            facetAddress: address(vFacet),
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: populateBytes4(VoucherMigrationFacet.migrateVouchers.selector)
        });

        cut[8] = IDiamondCut.FacetCut({
            facetAddress: address(pFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: generateSelectors("PeripheryFacet")
        });

        //set the periphery diamond address in the aavegotchi diamond
        bytes memory payload = abi.encodeWithSelector(AavegotchiFacet.setPeriphery.selector, address(wDiamond));

        /////UPGRADE AAVEGOTCHI DIAMOND
        IDiamondCut(aavegotchiDiamond).diamondCut(cut, aavegotchiDiamond, payload);

        //prepare cut args for wearable diamond
        IDiamondCut.FacetCut[] memory wearableCut = new IDiamondCut.FacetCut[](2);
        wearableCut[0] = IDiamondCut.FacetCut({
            facetAddress: address(wFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: generateSelectors("WearablesFacet")
        });
        wearableCut[1] = IDiamondCut.FacetCut({
            facetAddress: address(eFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: generateSelectors("EventHandlerFacet")
        });

        /////UPGRADE WEARABLE DIAMOND
        IDiamondCut(address(wDiamond)).diamondCut(wearableCut, address(0), "");
        vm.stopPrank();
    }

    function testEvents() public {
        vm.startPrank(wearableOwner);

        ///ITEMSFACET
        //cache equipped wearables
        uint16[16] memory equipped = ItemsFacet(aavegotchiDiamond).equippedWearables(gotchiId);

        //unequip all wearables
        //make sure the wearableDiamond is asserting the TransferSingle Event
        vm.expectEmit(true, true, true, true, address(wDiamond));
        emit TransferSingle(wearableOwner, aavegotchiDiamond, wearableOwner, sampleWearableId, 1);
        ItemsFacet(aavegotchiDiamond).equipWearables(gotchiId, [uint16(0), 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

        //equip wearables back and assert events
        vm.expectEmit(true, true, true, true, address(wDiamond));
        emit TransferSingle(wearableOwner, wearableOwner, aavegotchiDiamond, sampleWearableId, 1);
        ItemsFacet(aavegotchiDiamond).equipWearables(gotchiId, equipped);

        //ITEMSTRANSFERFACET
        //transfer an item
        //unequip wearables first
        ItemsFacet(aavegotchiDiamond).equipWearables(gotchiId, [uint16(0), 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
        //transfer a sngle wearable
        vm.expectEmit(true, true, true, true, address(wDiamond));
        emit TransferSingle(wearableOwner, wearableOwner, potionOwner, sampleWearableId, 1);
        ItemsTransferFacet(aavegotchiDiamond).safeTransferFrom(wearableOwner, potionOwner, sampleWearableId, 1, "");

        //batch transfer
        vm.expectEmit(true, true, true, true, address(wDiamond));
        emit TransferBatch(wearableOwner, wearableOwner, potionOwner, populateUint(301, 303), populateUint(1, 1));
        ItemsTransferFacet(aavegotchiDiamond).safeBatchTransferFrom(wearableOwner, potionOwner, populateUint(301, 303), populateUint(1, 1), "");

        vm.stopPrank();
        //use a potion
        vm.startPrank(potionOwner);
        vm.expectEmit(true, true, true, true, address(wDiamond));
        emit TransferBatch(potionOwner, potionOwner, address(0), populateUint(potionId), populateUint(1));
        ItemsFacet(aavegotchiDiamond).useConsumables(potionOwnerGotchiId, populateUint(potionId), populateUint(1));
        vm.stopPrank();

        vm.startPrank(ghstOwner);
        //MARKETPLACE
        vm.expectEmit(true, true, true, true, address(wDiamond));
        emit TransferSingle(aavegotchiDiamond, listingOwner, potionOwner, itemTypeId, 1);
        ERC1155MarketplaceFacet(aavegotchiDiamond).executeERC1155ListingToRecipient(listingId, aavegotchiDiamond, itemTypeId, 1, price, potionOwner);
    }

    function testWearableDiamond() public {
        vm.prank(wearableOwner);

        //unequip all wearables
        ItemsFacet(aavegotchiDiamond).equipWearables(gotchiId, [uint16(0), 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

        vm.startPrank(address(this), wearableOwner);
        //check balance via periphery
        WearablesFacet(wearableDiamond).balanceOf(wearableOwner, sampleWearableId);

        //check URI
        WearablesFacet(wearableDiamond).uri(202);

        //approve via periphery
        vm.expectEmit(true, true, true, false, address(wDiamond));
        emit ApprovalForAll(wearableOwner, wearableDiamond, true);
        WearablesFacet(wearableDiamond).setApprovalForAll(wearableDiamond, true);

        //single transfer via periphery
        vm.expectEmit(true, true, true, true, address(wDiamond));
        emit TransferSingle(wearableOwner, wearableOwner, potionOwner, sampleWearableId, 1);
        WearablesFacet(wearableDiamond).safeTransferFrom(wearableOwner, potionOwner, sampleWearableId, 1, "");

        //batch transfer via periphery
        vm.expectEmit(true, true, true, true, address(wDiamond));
        emit TransferBatch(wearableOwner, wearableOwner, potionOwner, populateUint(301, 303), populateUint(1, 1));
        WearablesFacet(wearableDiamond).safeBatchTransferFrom(wearableOwner, potionOwner, populateUint(301, 303), populateUint(1, 1), "");

        vm.stopPrank();
        //vm.prank(diamondOwner);

        vm.startPrank(wearableOwner, address(this));
        //set base uri
        //Note: this emits a lot of events and clogs up the terminal, uncomment after testing the others

        // vm.expectEmit(true, true, false, false, address(wDiamond));
        // emit URI("example301", 301);
        // WearablesFacet(wearableDiamond).setBaseURI("example");

        //only wearable diamond can call peripheryFacet write functions
        vm.expectRevert("LibAppStorage: Not wearable diamond");
        PeripheryFacet(aavegotchiDiamond).peripherySetBaseURI("example");

        //only aavegotchi diamond can call eventHandlerFacet functions
        vm.expectRevert("LibDiamond: Caller must be Aavegotchi Diamond");
        EventHandlerFacet(wearableDiamond).emitUriEvent("random", 1);
    }

    function diamondCut(
        FacetCut[] calldata _diamondCut,
        address _init,
        bytes calldata _calldata
    ) external override {}

    function generateSelectors(string memory _facetName) internal returns (bytes4[] memory selectors) {
        string[] memory cmd = new string[](3);
        cmd[0] = "node";
        cmd[1] = "scripts/genSelectors.js";
        cmd[2] = _facetName;
        bytes memory res = vm.ffi(cmd);
        selectors = abi.decode(res, (bytes4[]));
    }
}

function populateBytes4(bytes4 val) pure returns (bytes4[] memory b) {
    b = new bytes4[](1);
    b[0] = val;
}

function populateUint(uint256 val) pure returns (uint256[] memory b) {
    b = new uint256[](1);
    b[0] = val;
}

function populateUint(uint256 val, uint256 val2) pure returns (uint256[] memory b) {
    b = new uint256[](2);
    b[0] = val;
    b[1] = val2;
}

function populateBytes4(bytes4 val, bytes4 val2) pure returns (bytes4[] memory b) {
    b = new bytes4[](2);
    b[0] = val;
    b[1] = val2;
}

function populateBytes4(
    bytes4 val,
    bytes4 val2,
    bytes4 val3
) pure returns (bytes4[] memory b) {
    b = new bytes4[](3);
    b[0] = val;
    b[1] = val2;
    b[2] = val3;
}
