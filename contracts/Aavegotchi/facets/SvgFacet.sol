// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

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

contract SvgFacet is Modifiers {
    /***********************************|
   |             Read Functions         |
   |__________________________________*/

    function bytes3ToColorString(bytes3 _color) internal pure returns (string memory) {
        bytes memory numbers = "0123456789ABCDEF";
        bytes memory toString = new bytes(6);
        uint256 pos;
        for (uint256 i; i < 3; i++) {
            toString[pos] = numbers[uint8(_color[i] >> 4)];
            pos++;
            toString[pos] = numbers[uint8(_color[i] & 0x0f)];
            pos++;
        }
        return string(toString);
    }

    // Given an aavegotchi token id, return the combined SVG of its layers and its wearables
    function getAavegotchiSvg(uint256 _tokenId) public view returns (string memory ag_) {
        require(s.aavegotchis[_tokenId].owner != address(0), "SvgFacet: _tokenId does not exist");

        bytes memory svg;
        uint8 status = s.aavegotchis[_tokenId].status;
        if (status == LibAavegotchi.STATUS_CLOSED_PORTAL) {
            // sealed closed portal
            svg = LibSvg.getSvg("aavegotchi", 0);
        } else if (status == LibAavegotchi.STATUS_OPEN_PORTAL) {
            // open portal
            svg = LibSvg.getSvg("aavegotchi", 1);
        } else if (status == LibAavegotchi.STATUS_AAVEGOTCHI) {
            address collateralType = s.aavegotchis[_tokenId].collateralType;
            svg = getAavegotchiSvgLayers(collateralType, s.aavegotchis[_tokenId].numericTraits, _tokenId);
        }
        ag_ = string(abi.encodePacked('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">', svg, "</svg>"));
    }

    struct SvgLayerDetails {
        string primaryColor;
        string secondaryColor;
        string cheekColor;
        bytes background;
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
        int16[NUMERIC_TRAITS_NUM] memory _numericTraits,
        uint256 _tokenId
    ) internal view returns (bytes memory svg_) {
        SvgLayerDetails memory details;
        details.primaryColor = bytes3ToColorString(s.collateralTypeInfo[_collateralType].primaryColor);
        details.secondaryColor = bytes3ToColorString(s.collateralTypeInfo[_collateralType].secondaryColor);
        details.cheekColor = bytes3ToColorString(s.collateralTypeInfo[_collateralType].cheekColor);

        // aavagotchi body
        svg_ = LibSvg.getSvg("aavegotchi", 2);
        details.background = LibSvg.getSvg("aavegotchi", 4);
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
            svg_ = abi.encodePacked(applyStyles(details, _tokenId), details.background, svg_, details.collateral, details.eyeShape);
        } else {
            svg_ = abi.encodePacked(applyStyles(details, _tokenId), addBodyAndWearableSvgLayers(svg_, details, _tokenId));
        }
    }

    //Apply styles based on the traits and wearables
    function applyStyles(SvgLayerDetails memory _details, uint256 _tokenId) internal view returns (bytes memory) {
        uint16[EQUIPPED_WEARABLE_SLOTS] storage equippedWearables = s.aavegotchis[_tokenId].equippedWearables;

        if (
            _tokenId != type(uint256).max &&
            (equippedWearables[LibItems.WEARABLE_SLOT_BODY] != 0 ||
                equippedWearables[LibItems.WEARABLE_SLOT_HAND_LEFT] != 0 ||
                equippedWearables[LibItems.WEARABLE_SLOT_HAND_RIGHT] != 0)
        ) {
            //Open-hands aavegotchi
            return
                abi.encodePacked(
                    "<style>.gotchi-primary{fill:#",
                    _details.primaryColor,
                    ";}.gotchi-secondary{fill:#",
                    _details.secondaryColor,
                    ";}.gotchi-cheek{fill:#",
                    _details.cheekColor,
                    ";}.gotchi-eyeColor{fill:#",
                    _details.eyeColor,
                    ";}.gotchi-sleeves-up{display:none;}",
                    ".gotchi-handsUp{display:none;}",
                    ".gotchi-handsDownOpen{display:block;}",
                    ".gotchi-handsDownClosed{display:none;}",
                    "</style>"
                );
        } else {
            //Normal Aavegotchi, closed hands
            return
                abi.encodePacked(
                    "<style>.gotchi-primary{fill:#",
                    _details.primaryColor,
                    ";}.gotchi-secondary{fill:#",
                    _details.secondaryColor,
                    ";}.gotchi-cheek{fill:#",
                    _details.cheekColor,
                    ";}.gotchi-eyeColor{fill:#",
                    _details.eyeColor,
                    ";}.gotchi-sleeves-up{display:none;}",
                    ".gotchi-handsUp{display:none;}",
                    ".gotchi-handsDownOpen{display:none;}",
                    ".gotchi-handsDownClosed{display:block}",
                    "</style>"
                );
        }
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

    function getWearable(uint256 _wearableId, uint256 _slotPosition) internal view returns (bytes memory svg_) {
        ItemType storage wearableType = s.itemTypes[_wearableId];
        Dimensions memory dimensions = wearableType.dimensions;

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
        if (_slotPosition == LibItems.WEARABLE_SLOT_HAND_RIGHT) {
            svg_ = abi.encodePacked(
                svg_,
                LibStrings.strWithUint('<g transform="scale(-1, 1) translate(-', 64 - (dimensions.x * 2)),
                ', 0)">',
                LibSvg.getSvg("wearables", wearableType.svgId),
                "</g></svg></g>"
            );
        } else {
            svg_ = abi.encodePacked(svg_, LibSvg.getSvg("wearables", wearableType.svgId), "</svg></g>");
        }
    }

    function addBodyAndWearableSvgLayers(
        bytes memory _body,
        SvgLayerDetails memory details,
        uint256 _tokenId
    ) internal view returns (bytes memory svg_) {
        //Wearables
        uint16[EQUIPPED_WEARABLE_SLOTS] storage equippedWearables = s.aavegotchis[_tokenId].equippedWearables;

        // If background is equipped
        uint256 wearableId = equippedWearables[LibItems.WEARABLE_SLOT_BG];
        if (wearableId != 0) {
            svg_ = abi.encodePacked(getWearable(wearableId, LibItems.WEARABLE_SLOT_BG), _body, details.eyeShape, details.collateral);
        } else {
            //background, body, eyes, collateral
            svg_ = abi.encodePacked(details.background, _body, details.eyeShape, details.collateral);
        }

        // get hands
        svg_ = abi.encodePacked(svg_, LibSvg.getSvg("aavegotchi", 3));

        // body, face, eyes, head, left hand, right hand wearables
        for (uint256 slotPosition; slotPosition < 6; slotPosition++) {
            wearableId = equippedWearables[slotPosition];
            if (wearableId == 0) {
                continue;
            }
            svg_ = abi.encodePacked(svg_, getWearable(wearableId, slotPosition));
        }

        // pet wearable
        wearableId = equippedWearables[LibItems.WEARABLE_SLOT_PET];
        if (wearableId != 0) {
            svg_ = abi.encodePacked(svg_, getWearable(wearableId, 6));
        }
        // 1. background wearable
        // 2. body
        // 3. hands
        // 4. body wearable
        // 5. face wearable
        // 6. eyes wearable
        // 7. head wearable
        // 8. left hand wearable
        // 9. right hand wearable
        // 10. pet wearable
    }

    function portalAavegotchisSvg(uint256 _tokenId) external view returns (string[PORTAL_AAVEGOTCHIS_NUM] memory svg_) {
        require(s.aavegotchis[_tokenId].status == LibAavegotchi.STATUS_OPEN_PORTAL, "AavegotchiFacet: Portal not open");
        PortalAavegotchiTraitsIO[PORTAL_AAVEGOTCHIS_NUM] memory l_portalAavegotchiTraits = LibAavegotchi.portalAavegotchiTraits(_tokenId);
        for (uint256 i; i < svg_.length; i++) {
            address collateralType = l_portalAavegotchiTraits[i].collateralType;
            svg_[i] = string(
                abi.encodePacked(
                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">',
                    getAavegotchiSvgLayers(collateralType, l_portalAavegotchiTraits[i].numericTraits, type(uint256).max),
                    // get hands
                    LibSvg.getSvg("aavegotchi", 3),
                    "</svg>"
                )
            );
        }
    }

    function getItemSvg(uint256 _itemId) external view returns (string memory ag_) {
        require(_itemId < s.itemTypes.length, "ItemsFacet: _id not found for item");
        bytes memory svg;
        svg = LibSvg.getSvg("wearables", _itemId);
        // uint256 dimensions = s.itemTypes[_itemId].dimensions;
        Dimensions storage dimensions = s.itemTypes[_itemId].dimensions;
        ag_ = string(
            abi.encodePacked(
                // width
                LibStrings.strWithUint('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ', dimensions.width),
                // height
                LibStrings.strWithUint(" ", dimensions.height),
                '">',
                svg,
                "</svg>"
            )
        );
    }

    /***********************************|
   |             Write Functions        |
   |__________________________________*/

    function storeSvg(string calldata _svg, LibSvg.SvgTypeAndSizes[] calldata _typesAndSizes) public onlyDaoOrOwner {
        LibSvg.storeSvg(_svg, _typesAndSizes);
    }
}
