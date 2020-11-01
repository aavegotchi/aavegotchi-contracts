// SPDX-License-Identifier: MIT
pragma solidity 0.7.4;

import "./LibAppStorage.sol";

//import "hardhat/console.sol";

library LibSvg {
    function getSvg(bytes32 svgType, uint256 _id) internal view returns (bytes memory svg_) {
        //   string memory converted = bytes32ToString(svgType);
        //  console.log(converted);
        // console.log("id:", _id);
        AppStorage storage s = LibAppStorage.diamondStorage();
        SvgLayer[] storage svgLayers = s.svgLayers[svgType];
        svg_ = getSvg(svgLayers, _id);
    }

    function getSvg(SvgLayer[] storage svgLayers, uint256 _id) internal view returns (bytes memory svg_) {
        require(_id < svgLayers.length, "LibSvg: SVG type or id does not exist");
        //  console.log("length:", svgLayers.length);
        SvgLayer storage svgLayer = svgLayers[_id];
        address svgContract = svgLayer.svgLayersContract;
        uint256 size = svgLayer.size;
        uint256 offset = svgLayer.offset;
        svg_ = new bytes(size);
        assembly {
            extcodecopy(svgContract, add(svg_, 32), offset, size)
        }
    }

    /*
    function bytes32ToString(bytes32 _bytes32) internal pure returns (string memory) {
        uint8 i = 0;
        while (i < 32 && _bytes32[i] != 0) {
            i++;
        }
        bytes memory bytesArray = new bytes(i);
        for (i = 0; i < 32 && _bytes32[i] != 0; i++) {
            bytesArray[i] = _bytes32[i];
        }
        return string(bytesArray);
    }
    */
}
