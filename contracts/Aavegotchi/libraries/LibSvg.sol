// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {LibAppStorage, AppStorage, SvgLayer} from "./LibAppStorage.sol";

library LibSvg {
    event StoreSvg(LibSvg.SvgTypeAndSizes[] _typesAndSizes);
    event UpdateSvg(SvgTypeAndIdsAndSizes[] _typesAndIdsAndSizes);
    // svg type: "aavegotchiSvgs"
    uint256 internal constant CLOSED_PORTAL_SVG_ID = 0;
    uint256 internal constant OPEN_PORTAL_SVG_ID = 1;
    uint256 internal constant AAVEGOTCHI_BODY_SVG_ID = 2;
    uint256 internal constant HANDS_SVG_ID = 3;
    uint256 internal constant BACKGROUND_SVG_ID = 4;

    struct SvgTypeAndSizes {
        bytes32 svgType;
        uint256[] sizes;
    }

    function getSvg(bytes32 _svgType, uint256 _id) internal view returns (bytes memory svg_) {
        AppStorage storage s = LibAppStorage.diamondStorage();
        SvgLayer[] storage svgLayers = s.svgLayers[_svgType];
        svg_ = getSvg(svgLayers, _id);
    }

    function getSvg(SvgLayer[] storage _svgLayers, uint256 _id) internal view returns (bytes memory svg_) {
        require(_id < _svgLayers.length, "LibSvg: SVG type or id does not exist");

        SvgLayer storage svgLayer = _svgLayers[_id];
        address svgContract = svgLayer.svgLayersContract;
        uint256 size = svgLayer.size;
        uint256 offset = svgLayer.offset;
        svg_ = new bytes(size);
        assembly {
            extcodecopy(svgContract, add(svg_, 32), offset, size)
        }
    }

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

    function bytesToBytes32(bytes memory _bytes1, bytes memory _bytes2) internal pure returns (bytes32 result_) {
        bytes memory theBytes = abi.encodePacked(_bytes1, _bytes2);
        require(theBytes.length <= 32, "LibSvg: bytes array greater than 32");
        assembly {
            result_ := mload(add(theBytes, 32))
        }
    }

    function uint2str(uint256 _i) internal pure returns (string memory _uintAsString) {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_i - (_i / 10) * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }

    function storeSvgInContract(string calldata _svg) internal returns (address svgContract) {
        require(bytes(_svg).length < 24576, "SvgStorage: Exceeded 24,576 bytes max contract size");
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
            if eq(svgContract, 0) {
                returndatacopy(0, 0, returndatasize())
                revert(0, returndatasize())
            }
        }
    }

    function storeSvg(string calldata _svg, LibSvg.SvgTypeAndSizes[] calldata _typesAndSizes) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();
        emit StoreSvg(_typesAndSizes);
        address svgContract = storeSvgInContract(_svg);
        uint256 offset;
        for (uint256 i; i < _typesAndSizes.length; i++) {
            LibSvg.SvgTypeAndSizes calldata svgTypeAndSizes = _typesAndSizes[i];
            for (uint256 j; j < svgTypeAndSizes.sizes.length; j++) {
                uint256 size = svgTypeAndSizes.sizes[j];
                s.svgLayers[svgTypeAndSizes.svgType].push(SvgLayer(svgContract, uint16(offset), uint16(size)));
                offset += size;
            }
        }
    }

    struct SvgTypeAndIdsAndSizes {
        bytes32 svgType;
        uint256[] ids;
        uint256[] sizes;
    }

    function updateSvg(string calldata _svg, LibSvg.SvgTypeAndIdsAndSizes[] calldata _typesAndIdsAndSizes) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();
        emit UpdateSvg(_typesAndIdsAndSizes);
        address svgContract = storeSvgInContract(_svg);
        uint256 offset;
        for (uint256 i; i < _typesAndIdsAndSizes.length; i++) {
            LibSvg.SvgTypeAndIdsAndSizes calldata svgTypeAndIdsAndSizes = _typesAndIdsAndSizes[i];
            for (uint256 j; j < svgTypeAndIdsAndSizes.sizes.length; j++) {
                uint256 size = svgTypeAndIdsAndSizes.sizes[j];
                uint256 id = svgTypeAndIdsAndSizes.ids[j];
                s.svgLayers[svgTypeAndIdsAndSizes.svgType][id] = SvgLayer(svgContract, uint16(offset), uint16(size));
                offset += size;
            }
        }
    }
}
