// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {SvgFacet} from "./SvgFacet.sol";
import {AppStorage, SvgLayer, Dimensions} from "../libraries/LibAppStorage.sol";
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
        // 0 == front view
        // 1 == leftSide view
        // 2 == rightSide view
        // 3 == backSide view
        ag_ = new string[](4);        
        require(s.aavegotchis[_tokenId].status == LibAavegotchi.STATUS_AAVEGOTCHI, "SvgFacet: Aavegotchi not claimed");        
        ag_[0] = SvgFacet(address(this)).getAavegotchiSvg(_tokenId);

        address collateralType = s.aavegotchis[_tokenId].collateralType;
        ag_[1] = getAavegotchiSvgLayers(collateralType, 'aavegotchi-left', s.aavegotchis[_tokenId].numericTraits, _tokenId);
                
        // aavegotchi body
        // bytes memory svg = LibSvg.getSvg("aavegotchi", LibSvg.AAVEGTOTCHI_BODY_LEFT_SVG_ID);
    }

    struct SvgLayerDetails {
        string primaryColor;
        string secondaryColor;
        string cheekColor;
        bytes collateral;
        int256 trait;
        int256[18] eyeShapeTraitRange;
        bytes eyeShape;
        string eyeColor;
        int256[8] eyeColorTraitRanges;
        string[7] eyeColors;
    }

    function getAavegotchiSvgLayers(
        address _collateralType,
        bytes32 _sideView,
        int16[NUMERIC_TRAITS_NUM] memory _numericTraits,
        uint256 _tokenId
    ) internal view returns (bytes memory svg_) {
        SvgLayerDetails memory details;
        details.primaryColor = LibSvg.bytes3ToColorString(s.collateralTypeInfo[_collateralType].primaryColor);
        details.secondaryColor = LibSvg.bytes3ToColorString(s.collateralTypeInfo[_collateralType].secondaryColor);
        details.cheekColor = LibSvg.bytes3ToColorString(s.collateralTypeInfo[_collateralType].cheekColor);

        // aavagotchi body
        svg_ = LibSvg.getSvg(_sideView, LibSvg.AAVEGTOTCHI_BODY_SVG_ID);
        details.collateral = LibSvg.getSvg("collaterals", s.collateralTypeInfo[_collateralType].svgId);

        details.trait = _numericTraits[4];
        if (details.trait < 0) {
            details.eyeShape = LibSvg.getSvg("eyeShapes", 0);
        } else if (details.trait > 97) {
            details.eyeShape = LibSvg.getSvg("eyeShapes", s.collateralTypeInfo[_collateralType].eyeShapeSvgId);
        } else {
            details.eyeShapeTraitRange = [int256(0), 1, 2, 5, 7, 10, 15, 20, 25, 42, 58, 75, 80, 85, 90, 93, 95, 98];
            for (uint256 i; i < details.eyeShapeTraitRange.length - 1; i++) {
                if (details.trait >= details.eyeShapeTraitRange[i] && details.trait < details.eyeShapeTraitRange[i + 1]) {
                    details.eyeShape = LibSvg.getSvg("eyeShapes", i);
                    break;
                }
            }
        }

        details.trait = _numericTraits[5];
        details.eyeColorTraitRanges = [int256(0), 2, 10, 25, 75, 90, 98, 100];
        details.eyeColors = [
            "FF00FF", // mythical_low
            "0064FF", // rare_low
            "5D24BF", // uncommon_low
            details.primaryColor, // common
            "36818E", // uncommon_high
            "EA8C27", // rare_high
            "51FFA8" // mythical_high
        ];
        if (details.trait < 0) {
            details.eyeColor = "FF00FF";
        } else if (details.trait > 99) {
            details.eyeColor = "51FFA8";
        } else {
            for (uint256 i; i < details.eyeColorTraitRanges.length - 1; i++) {
                if (details.trait >= details.eyeColorTraitRanges[i] && details.trait < details.eyeColorTraitRanges[i + 1]) {
                    details.eyeColor = details.eyeColors[i];
                    break;
                }
            }
        }

        //Add wearables if tokenId isn't MAX_INT
        if (_tokenId == type(uint256).max) {
            svg_ = abi.encodePacked(
                applyStyles(details, _tokenId),
                LibSvg.getSvg("aavegotchi", LibSvg.BACKGROUND_SVG_ID),
                svg_,
                details.collateral,
                details.eyeShape
            );
        } else {
            svg_ = abi.encodePacked(applyStyles(details, _tokenId), addBodyAndWearableSvgLayers(svg_, details, _tokenId));
        }
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
        bytes32 _sideView,
        uint256 _tokenId
    ) internal view returns (bytes memory svg_) {
        //Wearables
        uint16[EQUIPPED_WEARABLE_SLOTS] storage equippedWearables = s.aavegotchis[_tokenId].equippedWearables;
        AavegotchiLayers memory layers;

        // If background is equipped
        uint256 wearableId = equippedWearables[LibItems.WEARABLE_SLOT_BG];
        if (wearableId != 0) {
            layers.background = getWearableView(wearableId, "wearables", LibItems.WEARABLE_SLOT_BG);
        } else {
            layers.background = LibSvg.getSvg("aavegotchi", 4);
        }

        wearableId = equippedWearables[LibItems.WEARABLE_SLOT_BODY];
        if (wearableId != 0) {
            // (layers.bodyWearable, layers.sleeves) = getBodyWearable(wearableId);
        }

        // get hands
        layers.hands = abi.encodePacked(svg_, LibSvg.getSvg(_sideView, LibSvg.HANDS_SVG_ID));

        wearableId = equippedWearables[LibItems.WEARABLE_SLOT_FACE];
        if (wearableId != 0) {
            layers.face = getWearableView(wearableId, _sideView, LibItems.WEARABLE_SLOT_FACE);
        }

        wearableId = equippedWearables[LibItems.WEARABLE_SLOT_EYES];
        if (wearableId != 0) {
            layers.eyes = getWearableView(wearableId, _sideView, LibItems.WEARABLE_SLOT_EYES);
        }

        wearableId = equippedWearables[LibItems.WEARABLE_SLOT_HEAD];
        if (wearableId != 0) {
            layers.head = getWearableView(wearableId, _sideView, LibItems.WEARABLE_SLOT_HEAD);
        }

        wearableId = equippedWearables[LibItems.WEARABLE_SLOT_HAND_LEFT];
        if (wearableId != 0) {
            layers.handLeft = getWearableView(wearableId, _sideView,  LibItems.WEARABLE_SLOT_HAND_LEFT);
        }

        wearableId = equippedWearables[LibItems.WEARABLE_SLOT_HAND_RIGHT];
        if (wearableId != 0) {
            layers.handRight = getWearableView(wearableId, _sideView,  LibItems.WEARABLE_SLOT_HAND_RIGHT);
        }

        wearableId = equippedWearables[LibItems.WEARABLE_SLOT_PET];
        if (wearableId != 0) {
            layers.pet = getWearableView(wearableId, _sideView,  LibItems.WEARABLE_SLOT_PET);
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

        svg_ = abi.encodePacked(layers.background, _body, layers.bodyWearable);
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

    function getWearableView(uint256 _wearableId, bytes32 _sideView, uint256 _slotPosition) internal view returns (bytes memory svg_) {
        ItemType storage wearableType = s.itemTypes[_wearableId];
        Dimensions memory dimensions = s.sideViewDimensions[_wearableId][_sideView];

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
        
        svg_ = abi.encodePacked(svg_, LibSvg.getSvg(_sideView, wearableType.svgId), "</svg></g>");        
    }

    function getBodyWearable(uint256 _wearableId, bytes32 _sideView) internal view returns (bytes memory bodyWearable_, bytes memory sleeves_) {
        ItemType storage wearableType = s.itemTypes[_wearableId];
        Dimensions memory dimensions = s.sideViewDimensions[_wearableId][_sideView];

        bodyWearable_ = abi.encodePacked(
            '<g class="gotchi-wearable wearable-body',
            // x
            LibStrings.strWithUint('"><svg x="', dimensions.x),
            // y
            LibStrings.strWithUint('" y="', dimensions.y),
            '">',
            LibSvg.getSvg(_sideView, wearableType.svgId),
            "</svg></g>"
        );
        uint256 svgId = s.sleeves[_wearableId];
        if (svgId != 0) {
            sleeves_ = abi.encodePacked(
                // x
                LibStrings.strWithUint('"><svg x="', dimensions.x),
                // y
                LibStrings.strWithUint('" y="', dimensions.y),
                '">',
                LibSvg.getSvg("sleeves", svgId),
                "</svg>"
            );
        }
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

    

    function getItemSvgs(uint256 _itemId) public view returns (string[] memory svg_) {
        require(_itemId < s.itemTypes.length, "ItemsFacet: _id not found for item");
        svg_ = new string[](4);
        svg_[0] = prepareItemSvg(s.itemTypes[_itemId].dimensions, LibSvg.getSvg("wearables", _itemId));        
        svg_[1] = prepareItemSvg(s.sideViewDimensions[_itemId]["wearables-leftSide"], LibSvg.getSvg("wearables-leftSide", _itemId));
        svg_[2] = prepareItemSvg(s.sideViewDimensions[_itemId]["wearables-rightSide"], LibSvg.getSvg("wearables-rightSide", _itemId));
        svg_[3] = prepareItemSvg(s.sideViewDimensions[_itemId]["wearables-backSide"], LibSvg.getSvg("wearables-backSide", _itemId));
    }

    function getItemsSvgs(uint256[] calldata _itemIds) public view returns (string[][] memory svgs_) {
        svgs_ = new string[][](_itemIds.length);
        for(uint256 i; i < _itemIds.length; i++) {
            svgs_[i] = getItemSvgs(_itemIds[i]);
        }        
    }

    function setSideViewDimensions(uint256[] calldata _itemIds, bytes32[] calldata _sideViews, Dimensions[] calldata _sideViewDimensions) external onlyDaoOrOwner {
        require(_itemIds.length == _sideViewDimensions.length, "SvgViewsFacet: _itemIds length not same as __sideViewDimensions length");
        require(_itemIds.length == _sideViews.length, "SvgViewsFacet: _sideViews length not same as _itemIds length");
        for(uint256 i; i < _itemIds.length; i++) {
            s.sideViewDimensions[_itemIds[i]][_sideViews[i]] = _sideViewDimensions[i];
        }
    }

}