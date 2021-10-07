// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {SvgFacet} from "./SvgFacet.sol";
import {AppStorage, SvgLayer, Dimensions} from "../libraries/LibAppStorage.sol";
import {LibAavegotchi, PortalAavegotchiTraitsIO, EQUIPPED_WEARABLE_SLOTS, PORTAL_AAVEGOTCHIS_NUM, NUMERIC_TRAITS_NUM} from "../libraries/LibAavegotchi.sol";
import {LibItems} from "../libraries/LibItems.sol";
import {Modifiers, ItemType} from "../libraries/LibAppStorage.sol";
import {LibSvg} from "../libraries/LibSvg.sol";
import {LibStrings} from "../../shared/libraries/LibStrings.sol";
import "hardhat/console.sol";

contract SvgViewsFacet is Modifiers {
    ///@notice Get the sideview svgs of an aavegotchi
    ///@dev Only valid for claimed aavegotchis
    ///@param _tokenId The identifier of the aavegotchi to query
    ///@return ag_ An array of svgs, each one representing a certain perspective i.e front,left,right,back views respectively
    function getAavegotchiSideSvgs(uint256 _tokenId) public view returns (string[] memory ag_) {
        // 0 == front view
        // 1 == leftSide view
        // 2 == rightSide view
        // 3 == backSide view
        uint256 hauntId = s.aavegotchis[_tokenId].hauntId;
        ag_ = new string[](4);
        require(s.aavegotchis[_tokenId].status == LibAavegotchi.STATUS_AAVEGOTCHI, "SvgFacet: Aavegotchi not claimed");
        ag_[0] = SvgFacet(address(this)).getAavegotchiSvg(_tokenId);

        address collateralType = s.aavegotchis[_tokenId].collateralType;
        int16[NUMERIC_TRAITS_NUM] memory _numericTraits = s.aavegotchis[_tokenId].numericTraits;
        uint16[EQUIPPED_WEARABLE_SLOTS] memory equippedWearables = s.aavegotchis[_tokenId].equippedWearables;

        bytes memory viewBox = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">';

        ag_[1] = string(getAavegotchiSideSvgLayers("left", collateralType, _numericTraits, _tokenId, hauntId, equippedWearables));
        ag_[1] = string(abi.encodePacked(viewBox, ag_[1], "</svg>"));

        ag_[2] = string(getAavegotchiSideSvgLayers("right", collateralType, _numericTraits, _tokenId, hauntId, equippedWearables));
        ag_[2] = string(abi.encodePacked(viewBox, ag_[2], "</svg>"));

        ag_[3] = string(getAavegotchiSideSvgLayers("back", collateralType, _numericTraits, _tokenId, hauntId, equippedWearables));
        ag_[3] = string(abi.encodePacked(viewBox, ag_[3], "</svg>"));
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

    function getAavegotchiSideSvgLayers(
        bytes memory _sideView,
        address _collateralType,
        int16[NUMERIC_TRAITS_NUM] memory _numericTraits,
        uint256 _tokenId,
        uint256 _hauntId,
        uint16[EQUIPPED_WEARABLE_SLOTS] memory equippedWearables
    ) internal view returns (bytes memory svg_) {
        SvgLayerDetails memory details;

        details.primaryColor = LibSvg.bytes3ToColorString(s.collateralTypeInfo[_collateralType].primaryColor);
        details.secondaryColor = LibSvg.bytes3ToColorString(s.collateralTypeInfo[_collateralType].secondaryColor);
        details.cheekColor = LibSvg.bytes3ToColorString(s.collateralTypeInfo[_collateralType].cheekColor);

        // aavagotchi body
        svg_ = LibSvg.getSvg(LibSvg.bytesToBytes32("aavegotchi-", _sideView), LibSvg.AAVEGOTCHI_BODY_SVG_ID);
        details.collateral = LibSvg.getSvg(LibSvg.bytesToBytes32("collaterals-", _sideView), s.collateralTypeInfo[_collateralType].svgId);

        bytes memory eyeSvgType = "eyeShapes-";
        if (_hauntId != 1) {
            //Convert Haunt into string to match the uploaded category name
            bytes memory haunt = abi.encodePacked(LibSvg.uint2str(_hauntId));
            eyeSvgType = abi.encodePacked("eyeShapesH", haunt, "-");
        }

        details.trait = _numericTraits[4];

        if (details.trait < 0) {
            details.eyeShape = LibSvg.getSvg(LibSvg.bytesToBytes32(eyeSvgType, _sideView), 0);
        } else if (details.trait > 97) {
            details.eyeShape = LibSvg.getSvg(LibSvg.bytesToBytes32(eyeSvgType, _sideView), s.collateralTypeInfo[_collateralType].eyeShapeSvgId);
        } else {
            details.eyeShapeTraitRange = [int256(0), 1, 2, 5, 7, 10, 15, 20, 25, 42, 58, 75, 80, 85, 90, 93, 95, 98];
            for (uint256 i; i < details.eyeShapeTraitRange.length - 1; i++) {
                if (details.trait >= details.eyeShapeTraitRange[i] && details.trait < details.eyeShapeTraitRange[i + 1]) {
                    details.eyeShape = LibSvg.getSvg(LibSvg.bytesToBytes32(eyeSvgType, _sideView), i);
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

        bytes32 back = LibSvg.bytesToBytes32("wearables-", "back");
        bytes32 side = LibSvg.bytesToBytes32("wearables-", _sideView);

        //If tokenId is MAX_INT, we're rendering a Portal Aavegotchi, so no wearables.
        if (_tokenId == type(uint256).max) {
            if (side == back) {
                svg_ = abi.encodePacked(
                    applySideStyles(details, _tokenId, equippedWearables),
                    LibSvg.getSvg(LibSvg.bytesToBytes32("aavegotchi-", _sideView), LibSvg.BACKGROUND_SVG_ID),
                    svg_
                );
            } else {
                svg_ = abi.encodePacked(
                    applySideStyles(details, _tokenId, equippedWearables),
                    LibSvg.getSvg(LibSvg.bytesToBytes32("aavegotchi-", _sideView), LibSvg.BACKGROUND_SVG_ID),
                    svg_,
                    details.collateral,
                    details.eyeShape
                );
            }
        } else {
            if (back != side) {
                svg_ = abi.encodePacked(applySideStyles(details, _tokenId, equippedWearables), svg_, details.collateral, details.eyeShape);
                svg_ = addBodyAndWearableSideSvgLayers(_sideView, svg_, equippedWearables);
            } else {
                svg_ = abi.encodePacked(applySideStyles(details, _tokenId, equippedWearables), svg_);
                svg_ = addBodyAndWearableSideSvgLayers(_sideView, svg_, equippedWearables);
            }
        }
    }

    function applySideStyles(
        SvgLayerDetails memory _details,
        uint256 _tokenId,
        uint16[EQUIPPED_WEARABLE_SLOTS] memory equippedWearables
    ) internal pure returns (bytes memory) {
        bytes memory styles = abi.encodePacked(
            "<style>.gotchi-primary{fill:#",
            _details.primaryColor,
            ";}.gotchi-secondary{fill:#",
            _details.secondaryColor,
            ";}.gotchi-cheek{fill:#",
            _details.cheekColor,
            ";}.gotchi-eyeColor{fill:#",
            _details.eyeColor,
            ";}.gotchi-primary-mouth{fill:#",
            _details.primaryColor,
            ";}.gotchi-sleeves-up{display:none;}",
            ".gotchi-handsUp{display:none;}"
        );

        if (
            _tokenId != type(uint256).max &&
            (equippedWearables[LibItems.WEARABLE_SLOT_BODY] != 0 ||
                equippedWearables[LibItems.WEARABLE_SLOT_HAND_LEFT] != 0 ||
                equippedWearables[LibItems.WEARABLE_SLOT_HAND_RIGHT] != 0)
        ) {
            //Open-hands aavegotchi
            return abi.encodePacked(styles, ".gotchi-handsDownOpen{display:block;}", ".gotchi-handsDownClosed{display:none;}", "</style>");
        } else {
            //Normal Aavegotchi, closed hands
            return abi.encodePacked(styles, ".gotchi-handsDownOpen{display:none;}", ".gotchi-handsDownClosed{display:block}", "</style>");
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

    //@notice Allow the sideview preview of an aavegotchi given the haunt id,a set of traits,wearables and collateral type
    ///@param _hauntId Haunt id to use in preview
    ///@param _collateralType The type of collateral to use
    ///@param _numericTraits The numeric traits to use for the aavegotchi
    ///@param equippedWearables The set of wearables to wear for the aavegotchi
    ///@return ag_ The final sideview svg strings being generated based on the given test parameters
    function previewSideAavegotchi(
        uint256 _hauntId,
        address _collateralType,
        int16[NUMERIC_TRAITS_NUM] memory _numericTraits,
        uint16[EQUIPPED_WEARABLE_SLOTS] memory equippedWearables
    ) external view returns (string[] memory ag_) {
        ag_ = new string[](4);

        //Front
        ag_[0] = SvgFacet(address(this)).previewAavegotchi(_hauntId, _collateralType, _numericTraits, equippedWearables);

        bytes memory viewBox = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">';

        //Left
        bytes memory svg_ = getAavegotchiSideSvgLayers("left", _collateralType, _numericTraits, type(uint256).max - 1, _hauntId, equippedWearables);
        svg_ = abi.encodePacked(addBodyAndWearableSideSvgLayers("left", svg_, equippedWearables));
        ag_[1] = string(abi.encodePacked(viewBox, svg_, "</svg>"));

        //Right
        svg_ = getAavegotchiSideSvgLayers("right", _collateralType, _numericTraits, type(uint256).max - 1, _hauntId, equippedWearables);
        svg_ = abi.encodePacked(addBodyAndWearableSideSvgLayers("right", svg_, equippedWearables));
        ag_[2] = string(abi.encodePacked(viewBox, svg_, "</svg>"));

        //Back
        svg_ = getAavegotchiSideSvgLayers("back", _collateralType, _numericTraits, type(uint256).max - 1, _hauntId, equippedWearables);
        svg_ = abi.encodePacked(addBodyAndWearableSideSvgLayers("back", svg_, equippedWearables));
        ag_[3] = string(abi.encodePacked(viewBox, svg_, "</svg>"));
    }

    //_sideView should either be left, right, front or back
    function addBodyAndWearableSideSvgLayers(
        bytes memory _sideView,
        bytes memory _body,
        uint16[EQUIPPED_WEARABLE_SLOTS] memory equippedWearables
    ) internal view returns (bytes memory svg_) {
        //Wearables
        AavegotchiLayers memory layers;
        layers.hands = abi.encodePacked(svg_, LibSvg.getSvg(LibSvg.bytesToBytes32("aavegotchi-", _sideView), LibSvg.HANDS_SVG_ID));

        for (uint256 i = 0; i < equippedWearables.length; i++) {
            uint256 wearableId = equippedWearables[i];
            bytes memory sideview = getWearableSideView(_sideView, wearableId, i);

            if (i == LibItems.WEARABLE_SLOT_BG && wearableId != 0) {
                layers.background = sideview;
            } else {
                layers.background = LibSvg.getSvg("aavegotchi", 4);
            }

            if (i == LibItems.WEARABLE_SLOT_BODY && wearableId != 0) {
                (layers.bodyWearable, layers.sleeves) = getBodySideWearable(_sideView, wearableId);
            } else if (i == LibItems.WEARABLE_SLOT_FACE && wearableId != 0) {
                layers.face = sideview;
            } else if (i == LibItems.WEARABLE_SLOT_EYES && wearableId != 0) {
                layers.eyes = sideview;
            } else if (i == LibItems.WEARABLE_SLOT_HEAD && wearableId != 0) {
                layers.head = sideview;
            } else if (i == LibItems.WEARABLE_SLOT_HAND_RIGHT && wearableId != 0) {
                layers.handLeft = sideview;
            } else if (i == LibItems.WEARABLE_SLOT_HAND_LEFT && wearableId != 0) {
                layers.handRight = sideview;
            } else if (i == LibItems.WEARABLE_SLOT_PET && wearableId != 0) {
                layers.pet = sideview;
            }
        }

        bytes32 left = LibSvg.bytesToBytes32("wearables-", "left");
        bytes32 right = LibSvg.bytesToBytes32("wearables-", "right");
        bytes32 back = LibSvg.bytesToBytes32("wearables-", "back");
        bytes32 side = LibSvg.bytesToBytes32("wearables-", _sideView);

        if (side == left) {
            svg_ = abi.encodePacked(layers.background, _body, layers.bodyWearable);
            svg_ = abi.encodePacked(svg_, layers.face, layers.eyes, layers.head, layers.handLeft, layers.hands, layers.sleeves, layers.pet);
        } else if (side == right) {
            svg_ = abi.encodePacked(layers.background, _body, layers.bodyWearable);
            svg_ = abi.encodePacked(svg_, layers.face, layers.eyes, layers.head, layers.handRight, layers.hands, layers.sleeves, layers.pet);
        } else if (side == back) {
            svg_ = abi.encodePacked(layers.background);
            svg_ = abi.encodePacked(svg_, layers.handRight, layers.handLeft, layers.hands);
            svg_ = abi.encodePacked(svg_, _body);
            svg_ = abi.encodePacked(svg_, layers.bodyWearable, layers.face, layers.eyes, layers.head, layers.pet);
        }
    }

    function getSideWearableClass(uint256 _slotPosition) internal pure returns (string memory className_) {
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

    function getWearableSideView(
        bytes memory _sideView,
        uint256 _wearableId,
        uint256 _slotPosition
    ) internal view returns (bytes memory svg_) {
        ItemType storage wearableType = s.itemTypes[_wearableId];
        Dimensions memory dimensions = s.sideViewDimensions[_wearableId][_sideView];

        string memory wearableClass = getSideWearableClass(_slotPosition);

        svg_ = abi.encodePacked(
            '<g class="gotchi-wearable ',
            wearableClass,
            // x
            LibStrings.strWithUint('"><svg x="', dimensions.x),
            // y
            LibStrings.strWithUint('" y="', dimensions.y),
            '">'
        );

        bytes32 back = LibSvg.bytesToBytes32("wearables-", "back");
        bytes32 side = LibSvg.bytesToBytes32("wearables-", _sideView);

        if (side == back && _slotPosition == LibItems.WEARABLE_SLOT_HAND_RIGHT) {
            svg_ = abi.encodePacked(svg_, LibSvg.getSvg(LibSvg.bytesToBytes32("wearables-", _sideView), wearableType.svgId), "</svg></g>");
        } else if (side == back && _slotPosition == LibItems.WEARABLE_SLOT_HAND_LEFT) {
            svg_ = abi.encodePacked(
                svg_,
                LibStrings.strWithUint('<g transform="scale(-1, 1) translate(-', 64 - (dimensions.x * 2)),
                ', 0)">',
                LibSvg.getSvg(LibSvg.bytesToBytes32("wearables-", _sideView), wearableType.svgId),
                "</g></svg></g>"
            );
        } else {
            svg_ = abi.encodePacked(svg_, LibSvg.getSvg(LibSvg.bytesToBytes32("wearables-", _sideView), wearableType.svgId), "</svg></g>");
        }
    }

    function getBodySideWearable(bytes memory _sideView, uint256 _wearableId)
        internal
        view
        returns (bytes memory bodyWearable_, bytes memory sleeves_)
    {
        ItemType storage wearableType = s.itemTypes[_wearableId];
        Dimensions memory dimensions = s.sideViewDimensions[_wearableId][_sideView];

        bodyWearable_ = abi.encodePacked(
            '<g class="gotchi-wearable wearable-body',
            // x
            LibStrings.strWithUint('"><svg x="', dimensions.x),
            // y
            LibStrings.strWithUint('" y="', dimensions.y),
            '">',
            LibSvg.getSvg(LibSvg.bytesToBytes32("wearables-", _sideView), wearableType.svgId),
            "</svg></g>"
        );
        uint256 svgId = s.sleeves[_wearableId];
        if (svgId == 0 && _wearableId == 8) {
            sleeves_ = abi.encodePacked(
                // x
                LibStrings.strWithUint('"><svg x="', dimensions.x),
                // y
                LibStrings.strWithUint('" y="', dimensions.y),
                '">',
                LibSvg.getSvg(LibSvg.bytesToBytes32("sleeves-", _sideView), svgId),
                "</svg>"
            );
        } else if (svgId != 0) {
            sleeves_ = abi.encodePacked(
                // x
                LibStrings.strWithUint('"><svg x="', dimensions.x),
                // y
                LibStrings.strWithUint('" y="', dimensions.y),
                '">',
                LibSvg.getSvg(LibSvg.bytesToBytes32("sleeves-", _sideView), svgId),
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

    ///@notice Query the sideview svg of an item
    ///@param _itemId Identifier of the item to query
    ///@return svg_ The sideview svg of the item`
    function getItemSvgs(uint256 _itemId) public view returns (string[] memory svg_) {
        require(_itemId < s.itemTypes.length, "ItemsFacet: _id not found for item");
        svg_ = new string[](4);
        svg_[0] = prepareItemSvg(s.itemTypes[_itemId].dimensions, LibSvg.getSvg("wearables", _itemId));
        svg_[1] = prepareItemSvg(s.sideViewDimensions[_itemId]["left"], LibSvg.getSvg("wearables-left", _itemId));
        svg_[2] = prepareItemSvg(s.sideViewDimensions[_itemId]["right"], LibSvg.getSvg("wearables-right", _itemId));
        svg_[3] = prepareItemSvg(s.sideViewDimensions[_itemId]["back"], LibSvg.getSvg("wearables-back", _itemId));
    }

    ///@notice Query the svg of multiple items
    ///@param _itemIds Identifiers of the items to query
    ///@return svgs_ The svgs of each item in `_itemIds`
    function getItemsSvgs(uint256[] calldata _itemIds) public view returns (string[][] memory svgs_) {
        svgs_ = new string[][](_itemIds.length);
        for (uint256 i; i < _itemIds.length; i++) {
            svgs_[i] = getItemSvgs(_itemIds[i]);
        }
    }

    struct SideViewDimensionsArgs {
        uint256 itemId;
        string side;
        Dimensions dimensions;
    }

    ///@notice Allow an item manager to set the sideview dimensions of an existing item
    ///@param _sideViewDimensions An array of structs, each struct onating details about the sideview dimensions like `itemId`,`side` amd `dimensions`
    function setSideViewDimensions(SideViewDimensionsArgs[] calldata _sideViewDimensions) external onlyItemManager {
        for (uint256 i; i < _sideViewDimensions.length; i++) {
            s.sideViewDimensions[_sideViewDimensions[i].itemId][bytes(_sideViewDimensions[i].side)] = _sideViewDimensions[i].dimensions;
        }
    }
}
