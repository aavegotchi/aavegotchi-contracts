//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.0;
//pragma experimental ABIEncoderV2;
import '../libs/ALib.sol';

// This contract was added as a facet to the diamond
contract SVGStorage { 

    // Stores aavegotchi layers
    // The id for an SVG is the same as its position in the aavegotchiLayersSVG array
    function storeAavegotchiLayersSVG(string calldata _svgLayers, uint[] memory sizes) external {
        require(bytes(_svgLayers).length < 24576, "Exceeded 24KB max contract size");
        ALib.Storage storage ags = ALib.getStorage();
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
          ags.aavegotchiLayersSVG.push(ALib.SVGLayer(svgLayersContract,uint16(offset),uint16(sizes[i])));
          offset += sizes[i];          
        }    
    }

    // Stores wearable SVGs
    // The id for a wearable is the same as its position in the wearablesSVG array
    function storeWearablesSVG(string calldata _svgLayers, uint[] memory sizes) external {
        require(bytes(_svgLayers).length < 24576, "Exceeded 24KB max contract size");
        ALib.Storage storage ags = ALib.getStorage();
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
          ags.wearablesSVG.push(ALib.SVGLayer(svgLayersContract,uint16(offset),uint16(sizes[i])));
          offset += sizes[i];          
        }    
    }   
}
