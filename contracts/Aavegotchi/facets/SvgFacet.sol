//SPDX-License-Identifier: Unlicense
pragma solidity 0.7.4;
pragma experimental ABIEncoderV2;

import {AppStorage, SvgLayer} from "../libraries/LibAppStorage.sol";
import "../../shared/libraries/LibDiamond.sol";
import "../libraries/LibSvg.sol";
import "./AavegotchiFacet.sol";

// This contract was added as a facet to the diamond
contract SvgFacet is LibAppStorageModifiers {
    uint256 internal constant EQUIPPED_WEARABLE_SLOTS = 16;
    uint256 internal constant PORTAL_AAVEGOTCHIS_NUM = 10;

    /***********************************|
   |             Read Functions         |
   |__________________________________*/

    function bytes3ToColorString(bytes3 _color) internal pure returns (string memory) {
        bytes memory numbers = "0123456789ABCDEF";
        bytes memory toString = new bytes(6);
        uint256 pos = 0;
        for (uint256 i; i < 3; i++) {
            toString[pos] = numbers[uint8(_color[i] >> 4)];
            pos++;
            toString[pos] = numbers[uint8(_color[i] & 0x0f)];
            pos++;
        }
        return string(toString);
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

    function getAavegotchiSvgLayers(address _collateralType, uint256 _numericTraits) internal view returns (bytes memory svg_) {
        SvgLayerDetails memory details;
        details.primaryColor = bytes3ToColorString(s.collateralTypeInfo[_collateralType].primaryColor);
        details.secondaryColor = bytes3ToColorString(s.collateralTypeInfo[_collateralType].secondaryColor);
        details.cheekColor = bytes3ToColorString(s.collateralTypeInfo[_collateralType].cheekColor);

        // aavagotchi body
        svg_ = LibSvg.getSvg("aavegotchi", 2);
        details.background = LibSvg.getSvg("aavegotchi", 3);
        details.collateral = LibSvg.getSvg("collaterals", s.collateralTypeInfo[_collateralType].svgId);

        details.trait = uint16(_numericTraits >> (4 * 16));
        details.eyeShape;
        details.eyeShapeTraitRange = [int256(0), 1, 2, 5, 7, 10, 15, 20, 25, 42, 58, 75, 80, 85, 90, 93, 95, 98];
        for (uint256 i; i < details.eyeShapeTraitRange.length - 1; i++) {
            if (details.trait >= details.eyeShapeTraitRange[i] && details.trait < details.eyeShapeTraitRange[i + 1]) {
                details.eyeShape = LibSvg.getSvg("eyeShapes", i);
                break;
            }
        }
        // eyeShapeTrait is 98 or 99
        if (details.eyeShape.length == 0) {
            details.eyeShape = LibSvg.getSvg("eyeShapes", s.collateralTypeInfo[_collateralType].eyeShapeSvgId);
        }

        details.trait = uint16(_numericTraits >> (5 * 16));
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
        for (uint256 i; i < details.eyeColorTraitRanges.length - 1; i++) {
            if (details.trait >= details.eyeColorTraitRanges[i] && details.trait < details.eyeColorTraitRanges[i + 1]) {
                details.eyeColor = details.eyeColors[i];
                break;
            }
        }

        svg_ = abi.encodePacked(
            "<style>.primary{fill:#",
            details.primaryColor,
            ";}.secondary{fill:#",
            details.secondaryColor,
            ";}.cheek{fill:#",
            details.cheekColor,
            ";}.eyeColor{fill:#",
            details.eyeColor,
            ";}</style>",
            details.background,
            svg_,
            details.collateral,
            details.eyeShape
        );
    }

    function getAavegotchiSvgLayers(uint256 _tokenId) internal view returns (bytes memory svg_) {
        svg_ = getAavegotchiSvgLayers(s.aavegotchis[_tokenId].collateralType, s.aavegotchis[_tokenId].numericTraits);

        //Wearables
        uint256 equippedWearables = s.aavegotchis[_tokenId].equippedWearables;
        bytes memory wearablesSvg;
        for (uint256 slotPosition; slotPosition < EQUIPPED_WEARABLE_SLOTS; slotPosition++) {
            uint256 wearableId = uint16(equippedWearables >> (slotPosition * 16));
            if (wearableId > 0) {
                ItemType storage wearableType = s.itemTypes[wearableId];
                // right hand, then flip the wearable
                if (slotPosition == 5) {
                    wearablesSvg = abi.encodePacked(
                        wearablesSvg,
                        '<g transform="scale(-1, 1) translate(-64, 0)">',
                        LibSvg.getSvg("wearables", wearableType.svgId),
                        "</g>"
                    );
                } else {
                    wearablesSvg = abi.encodePacked(wearablesSvg, LibSvg.getSvg("wearables", wearableType.svgId));
                }
            }
        }
        if (wearablesSvg.length > 0) {
            svg_ = abi.encodePacked(svg_, wearablesSvg);
        }
    }

    // Given an aavegotchi token id, return the combined SVG of its layers and its wearables
    function getAavegotchiSvg(uint256 _tokenId) public view returns (string memory ag_) {
        require(s.aavegotchis[_tokenId].owner != address(0), "AavegotchiFacet: _tokenId does not exist");

        bytes memory svg;
        uint8 status = s.aavegotchis[_tokenId].status;
        if (status == LibAppStorage.STATUS_CLOSED_PORTAL) {
            // sealed closed portal
            svg = LibSvg.getSvg("aavegotchi", 0);
        } else if (status == LibAppStorage.STATUS_OPEN_PORTAL) {
            // open portal
            svg = LibSvg.getSvg("aavegotchi", 1);
        } else if (status == LibAppStorage.STATUS_AAVEGOTCHI) {
            svg = getAavegotchiSvgLayers(_tokenId);
        }
        ag_ = string(abi.encodePacked('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">', svg, "</svg>"));
    }

    function portalAavegotchisSvg(uint256 _tokenId) external view returns (string[PORTAL_AAVEGOTCHIS_NUM] memory svg_) {
        require(s.aavegotchis[_tokenId].status == LibAppStorage.STATUS_OPEN_PORTAL, "AavegotchiFacet: Portal not open");
        AavegotchiFacet.PortalAavegotchiTraitsIO[PORTAL_AAVEGOTCHIS_NUM] memory l_portalAavegotchiTraits =
            AavegotchiFacet(address(this)).portalAavegotchiTraits(_tokenId);
        for (uint256 i; i < svg_.length; i++) {
            address collateralType = l_portalAavegotchiTraits[i].collateralType;
            uint256 numericTraits = l_portalAavegotchiTraits[i].numericTraits;
            svg_[i] = string(
                abi.encodePacked(
                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">',
                    getAavegotchiSvgLayers(collateralType, numericTraits),
                    "</svg>"
                )
            );
        }
    }

    /***********************************|
   |             Write Functions        |
   |__________________________________*/

    function storeSvg(string calldata _svg, LibSvg.SvgTypeAndSizes[] calldata _typesAndSizes) public onlyDaoOrOwner {
        address svgContract = storeSvgInContract(_svg);
        uint256 offset = 0;
        for (uint256 i; i < _typesAndSizes.length; i++) {
            LibSvg.SvgTypeAndSizes calldata svgTypeAndSizes = _typesAndSizes[i];
            for (uint256 j; j < svgTypeAndSizes.sizes.length; j++) {
                uint256 size = svgTypeAndSizes.sizes[j];
                s.svgLayers[svgTypeAndSizes.svgType].push(SvgLayer(svgContract, uint16(offset), uint16(size)));
                offset += size;
            }
        }
    }

    function storeSvgInContract(string calldata _svg) internal returns (address svgContract) {
        require(bytes(_svg).length < 24576, "SvgStorage: Exceeded 24KB max contract size");
        // 61_00_00 -- PUSH2 (size)
        // 60_00 -- PUSH1 (code position)
        // 60_00 -- PUSH1 (mem position)
        // 39 CODECOPY
        // 61_00_00 PUSH2 (size)
        // 60_00 PUSH1 (mem position)
        // f3 RETURN
        bytes memory init = hex"610000_600e_6000_39_610000_6000_f3";
        bytes1 size1 = bytes1(uint8(bytes(_svg).length));
        bytes1 size2 = bytes1(uint8(bytes(_svg).length >> 8));
        init[2] = size1;
        init[1] = size2;
        init[10] = size1;
        init[9] = size2;
        bytes memory code = abi.encodePacked(init, _svg);

        assembly {
            svgContract := create(0, add(code, 32), mload(code))
        }
    }
}
