// SPDX-License-Identifier: MIT
pragma solidity 0.7.6;

import "./LibAppStorage.sol";

//import "hardhat/console.sol";

library LibSvg {
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
        //  console.log("length:", svgLayers.length);
        SvgLayer storage svgLayer = _svgLayers[_id];
        address svgContract = svgLayer.svgLayersContract;
        uint256 size = svgLayer.size;
        uint256 offset = svgLayer.offset;
        svg_ = new bytes(size);
        assembly {
            extcodecopy(svgContract, add(svg_, 32), offset, size)
        }
    }
}
