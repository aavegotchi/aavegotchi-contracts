// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {SvgFacet} from "./SvgFacet.sol";
import {AppStorage, SvgLayer, Dimensions, SideViewDimensions} from "../libraries/LibAppStorage.sol";
import {
    LibAavegotchi,
    PortalAavegotchiTraitsIO,
    EQUIPPED_WEARABLE_SLOTS,
    PORTAL_AAVEGOTCHIS_NUM,
    NUMERIC_TRAITS_NUM
} from "../libraries/LibAavegotchi.sol";
import {LibItems} from "../libraries/LibItems.sol";
import {Modifiers, ItemType} from "../libraries/LibAppStorage.sol";
import {LibSvg} from "../libraries/LibSvg.sol";
import {LibStrings} from "../../shared/libraries/LibStrings.sol";

contract SvgViewsFacet is Modifiers {

    function getAavegotchiSvgs(uint256 _tokenId) public view returns (string[] memory ag_) {
        ag_ = new string[](4);        
        require(s.aavegotchis[_tokenId].status == LibAavegotchi.STATUS_AAVEGOTCHI, "SvgFacet: Aavegotchi not claimed");        
        ag_[0] = SvgFacet(address(this)).getAavegotchiSvg(_tokenId);
                
        // aavagotchi body
        bytes memory svg = LibSvg.getSvg("aavegotchi", LibSvg.AAVEGTOTCHI_BODY_SVG_ID);    


    }
    struct AavegotchiLayers {
        bytes background;
        bytes bodyWearable;
        bytes hands;
        bytes face;
        bytes eyes;
        bytes head;
        bytes sleeves;
        bytes handLeft;
        bytes handRight;
        bytes pet;
    }

    function addBodyAndWearableSvgLayers(
        bytes memory _body,
        string memory side,        
        uint256 _tokenId
    ) internal view returns (bytes memory svg_) {
        //Wearables
        uint16[EQUIPPED_WEARABLE_SLOTS] storage equippedWearables = s.aavegotchis[_tokenId].equippedWearables;
        AavegotchiLayers memory layers;

        // If background is equipped
        uint256 wearableId = equippedWearables[LibItems.WEARABLE_SLOT_BG];
        if (wearableId != 0) {
            layers.background = getWearable(wearableId, LibItems.WEARABLE_SLOT_BG);
        } else {
            layers.background = LibSvg.getSvg("aavegotchi", 4);
        }

        wearableId = equippedWearables[LibItems.WEARABLE_SLOT_BODY];
        if (wearableId != 0) {
            (layers.bodyWearable, layers.sleeves) = getBodyWearable(wearableId);
        }

        // get hands
        layers.hands = abi.encodePacked(svg_, LibSvg.getSvg("aavegotchi", LibSvg.HANDS_SVG_ID));

        wearableId = equippedWearables[LibItems.WEARABLE_SLOT_FACE];
        if (wearableId != 0) {
            layers.face = getWearable(wearableId, LibItems.WEARABLE_SLOT_FACE);
        }

        wearableId = equippedWearables[LibItems.WEARABLE_SLOT_EYES];
        if (wearableId != 0) {
            layers.eyes = getWearable(wearableId, LibItems.WEARABLE_SLOT_EYES);
        }

        wearableId = equippedWearables[LibItems.WEARABLE_SLOT_HEAD];
        if (wearableId != 0) {
            layers.head = getWearable(wearableId, LibItems.WEARABLE_SLOT_HEAD);
        }

        wearableId = equippedWearables[LibItems.WEARABLE_SLOT_HAND_LEFT];
        if (wearableId != 0) {
            layers.handLeft = getWearable(wearableId, LibItems.WEARABLE_SLOT_HAND_LEFT);
        }

        wearableId = equippedWearables[LibItems.WEARABLE_SLOT_HAND_RIGHT];
        if (wearableId != 0) {
            layers.handRight = getWearable(wearableId, LibItems.WEARABLE_SLOT_HAND_RIGHT);
        }

        wearableId = equippedWearables[LibItems.WEARABLE_SLOT_PET];
        if (wearableId != 0) {
            layers.pet = getWearable(wearableId, LibItems.WEARABLE_SLOT_PET);
        }

        //1. Background wearable
        //2. Body
        //3. Body wearable
        //4. Hands
        //5. Face
        //6. Eyes
        //7. Head
        //8. Sleeves of body wearable
        //9. Left hand wearable
        //10. Right hand wearable
        //11. Pet wearable

        svg_ = abi.encodePacked(layers.background, _body, details.eyeShape, details.collateral, layers.bodyWearable);
        svg_ = abi.encodePacked(
            svg_,
            layers.hands,
            layers.face,
            layers.eyes,
            layers.head,
            layers.sleeves,
            layers.handLeft,
            layers.handRight,
            layers.pet
        );
    }

    function getWearableClass(uint256 _slotPosition) internal pure returns (string memory className_) {
        //Wearables

        if (_slotPosition == LibItems.WEARABLE_SLOT_BODY) className_ = "wearable-body";
        if (_slotPosition == LibItems.WEARABLE_SLOT_FACE) className_ = "wearable-face";
        if (_slotPosition == LibItems.WEARABLE_SLOT_EYES) className_ = "wearable-eyes";
        if (_slotPosition == LibItems.WEARABLE_SLOT_HEAD) className_ = "wearable-head";
        if (_slotPosition == LibItems.WEARABLE_SLOT_HAND_LEFT) className_ = "wearable-hand wearable-hand-left";
        if (_slotPosition == LibItems.WEARABLE_SLOT_HAND_RIGHT) className_ = "wearable-hand wearable-hand-right";
        if (_slotPosition == LibItems.WEARABLE_SLOT_PET) className_ = "wearable-pet";
        if (_slotPosition == LibItems.WEARABLE_SLOT_BG) className_ = "wearable-bg";
    }

    function getWearableView(uint256 _wearableId, uint256 _slotPosition) internal view returns (bytes memory svg_) {
        ItemType storage wearableType = s.itemTypes[_wearableId];
        SideViewDimensions memory dimensions = s.sideViewDimensions[_wearableId];

        string memory wearableClass = getWearableClass(_slotPosition);

        svg_ = abi.encodePacked(
            '<g class="gotchi-wearable ',
            wearableClass,
            // x
            LibStrings.strWithUint('"><svg x="', dimensions.x),
            // y
            LibStrings.strWithUint('" y="', dimensions.y),
            '">'
        );
        
        svg_ = abi.encodePacked(svg_, LibSvg.getSvg("wearables", wearableType.svgId), "</svg></g>");
        
    }


  


    function prepareItemSvg(Dimensions storage _dimensions, bytes memory _svg) internal view returns (string memory svg_) {
        svg_ = string(
            abi.encodePacked(
                // width
                LibStrings.strWithUint('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ', _dimensions.width),
                // height
                LibStrings.strWithUint(" ", _dimensions.height),
                '">',
                _svg,
                "</svg>"
            )
        );
    }

    function getItemSvg(uint256 _itemId) external view returns (string memory ag_) {
        require(_itemId < s.itemTypes.length, "ItemsFacet: _id not found for item");
        bytes memory svg;
        svg = LibSvg.getSvg("wearables", _itemId);
        // uint256 dimensions = s.itemTypes[_itemId].dimensions;
        Dimensions storage dimensions = s.itemTypes[_itemId].dimensions;
        ag_ = prepareItemSvg(dimensions, svg);
        
    }

    function getItemSvgs(uint256 _itemId) public view returns (string[] memory svg_) {
        require(_itemId < s.itemTypes.length, "ItemsFacet: _id not found for item");
        svg_ = new string[](4);
        svg_[0] = prepareItemSvg(s.itemTypes[_itemId].dimensions, LibSvg.getSvg("wearables", _itemId));
        SideViewDimensions storage sideViewDimensions = s.sideViewDimensions[_itemId];
        svg_[1] = prepareItemSvg(sideViewDimensions.leftSide, LibSvg.getSvg("wearables-leftSide", _itemId));
        svg_[2] = prepareItemSvg(sideViewDimensions.rightSide, LibSvg.getSvg("wearables-rightSide", _itemId));
        svg_[3] = prepareItemSvg(sideViewDimensions.backSide, LibSvg.getSvg("wearables-backSide", _itemId));
    }

    function getItemsSvgs(uint256[] calldata _itemIds) public view returns (string[][] memory svgs_) {
        svgs_ = new string[][](_itemIds.length);
        for(uint256 i; i < _itemIds.length; i++) {
            svgs_[i] = getItemSvgs(_itemIds[i]);
        }        
    }

function setSideViews(uint256[] calldata _itemIds, SideViewDimensions[] calldata _sideViewDimensions) external onlyDaoOrOwner {
        require(_itemIds.length == _sideViewDimensions.length, "SvgFacet: _itemIds length not same as _sideViews.length");
        for(uint256 i; i < _itemIds.length; i++) {
            s.sideViews[_itemIds[i]] = _sideViewDimensions[i];
        }
    }

}