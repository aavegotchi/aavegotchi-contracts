// SPDX-License-Identifier: MIT
pragma solidity 0.7.3;

import {SVGLayer} from "./LibAppStorage.sol";

library LibSVG {
    function getSVG(SVGLayer[] storage items, uint256 _id) internal view returns (bytes memory) {
        require(_id < items.length, "SVG id does not exist.");
        SVGLayer storage svgLayer = items[_id];
        address svgContract = svgLayer.svgLayersContract;
        uint256 size = svgLayer.size;
        uint256 offset = svgLayer.offset;
        bytes memory data = new bytes(size);
        assembly {
            extcodecopy(svgContract, add(data, 32), offset, size)
        }
        return data;
    }
}
