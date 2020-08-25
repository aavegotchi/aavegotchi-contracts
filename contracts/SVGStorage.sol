//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.0;
//pragma experimental ABIEncoderV2;

contract SVGStorage {

  struct SVGLayer {
    address svgLayersContract;
    uint16 offset;
    uint16 size;
  }
  SVGLayer[] svgLayers;

  function createSVGContract(string calldata _svgLayers, uint[] memory sizes) external {
    require(bytes(_svgLayers).length < 24576, "Exceeded 24KB max contract size");
    // 61_00_00 -- PUSH2 (size)
    // 60_00 -- PUSH1 (code position)
    // 60_00 -- PUSH1 (mem position)    
    // 39 CODECOPY
    // 61_00_00 PUSH2 (size)
    // 60_00 PUSH1 (mem position)
    // f3 RETURN 
    bytes memory init = hex"610000_600e_6000_39_610000_6000_f3";
    byte size1 = byte(uint8(bytes(_svgLayers).length));
    byte size2 = byte(uint8(bytes(_svgLayers).length >> 8));
    init[2] = size1;
    init[1] = size2;
    init[10] = size1;
    init[9] = size2;    
    bytes memory code = abi.encodePacked(init, _svgLayers);
        
    address svgLayersContract;
    
    assembly {
      svgLayersContract := create(0, add(code, 32), mload(code))
    }
    uint offset = 0;
    for(uint i; i < sizes.length; i++) {
      svgLayers.push(SVGLayer(svgLayersContract,uint16(offset),uint16(sizes[i])));
      offset += sizes[i];
    }
    
  }
 
  function getSVGLayer(uint _id) external view returns(bytes memory) {
    require(_id < svgLayers.length, "SVG id does not exist.");
    SVGLayer storage svgLayer = svgLayers[_id];
    address svgContract = svgLayer.svgLayersContract;
    uint size = svgLayer.size;
    uint offset = svgLayer.offset;
    bytes memory data = new bytes(size);
    assembly {
        extcodecopy(svgContract, add(data,32), offset, size)
    }
    return data;

  }
}
