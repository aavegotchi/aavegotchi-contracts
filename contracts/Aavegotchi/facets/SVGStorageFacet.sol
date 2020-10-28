//SPDX-License-Identifier: Unlicense
pragma solidity 0.7.4;
pragma experimental ABIEncoderV2;

import {AppStorage, SvgLayer} from "../libraries/LibAppStorage.sol"; 
import "../../shared/libraries/LibDiamond.sol";

// This contract was added as a facet to the diamond
contract SvgStorageFacet {
    AppStorage internal s;

    struct SvgTypeAndSizes {        
        bytes32 svgType;
        uint256[] sizes;
    }

    function storeSvg(string calldata _svg,  SvgTypeAndSizes[] calldata _typesAndSizes) external {
        LibDiamond.enforceIsContractOwner();
        address svgContract = storeSvgInContract(_svg);
        uint256 offset = 0;
        for (uint256 i; i < _typesAndSizes.length; i++) {
            SvgTypeAndSizes calldata svgTypeAndSizes = _typesAndSizes[i];
            for(uint256 j; j < svgTypeAndSizes.sizes.length; j++) {                
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
