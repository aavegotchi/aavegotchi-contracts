// SPDX-License-Identifier: MIT
pragma solidity 0.7.4;

import "./LibAppStorage.sol";

library LibSvg {
    function getSvg(bytes32 svgType, uint256 _id) internal view returns (bytes memory svg_) {
        AppStorage storage s = LibAppStorage.diamondStorage();        
        SvgLayer[] storage svgLayers = s.svgLayers[svgType];
        svg_ = getSvg(svgLayers, _id);
    }

    function getSvg(SvgLayer[] storage svgLayers, uint256 _id) internal view returns (bytes memory svg_) {
        require(_id < svgLayers.length, "LibSvg: SVG type or id does not exist");
        SvgLayer storage svgLayer = svgLayers[_id];
        address svgContract = svgLayer.svgLayersContract;
        uint256 size = svgLayer.size;
        uint256 offset = svgLayer.offset;
        svg_ = new bytes(size);
        assembly {
            extcodecopy(svgContract, add(svg_, 32), offset, size)
        }        
    }
}
