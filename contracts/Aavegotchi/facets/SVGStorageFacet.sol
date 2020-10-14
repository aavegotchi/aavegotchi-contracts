//SPDX-License-Identifier: Unlicense
pragma solidity 0.7.3;
//pragma experimental ABIEncoderV2;
import {AppStorage, SVGLayer} from "../libraries/LibAppStorage.sol";
import "../../shared/libraries/LibDiamond.sol";

// This contract was added as a facet to the diamond
contract SVGStorageFacet {
    AppStorage internal s;

    // Stores aavegotchi layers
    // The id for an SVG is the same as its position in the aavegotchiLayersSVG array
    function storeAavegotchiLayersSVG(string calldata _svgLayers, uint256[] calldata sizes) external {
        LibDiamond.enforceIsContractOwner();
        address svgContract = storeSVG(_svgLayers);
        uint256 offset = 0;
        for (uint256 i; i < sizes.length; i++) {
            s.aavegotchiLayersSVG.push(SVGLayer(svgContract, uint16(offset), uint16(sizes[i])));
            offset += sizes[i];
        }
    }

    // Stores wearable SVGs
    // The id for a wearable is the same as its position in the wearablesSVG array
    function storeWearablesSVG(string calldata _svgLayers, uint256[] calldata sizes) external {
        LibDiamond.enforceIsContractOwner();
        address svgContract = storeSVG(_svgLayers);
        uint256 offset = 0;
        for (uint256 i; i < sizes.length; i++) {
            s.wearablesSVG.push(SVGLayer(svgContract, uint16(offset), uint16(sizes[i])));
            offset += sizes[i];
        }
    }

    function storeItemsSVG(string calldata _svgLayers, uint256[] calldata sizes) external {
        LibDiamond.enforceIsContractOwner();
        address svgContract = storeSVG(_svgLayers);
        uint256 offset = 0;
        for (uint256 i; i < sizes.length; i++) {
            s.itemsSVG.push(SVGLayer(svgContract, uint16(offset), uint16(sizes[i])));
            offset += sizes[i];
        }
    }

    function storeSVG(string calldata _svgLayers) internal returns (address svgContract) {
        require(bytes(_svgLayers).length < 24576, "SVGStorage: Exceeded 24KB max contract size");
        // 61_00_00 -- PUSH2 (size)
        // 60_00 -- PUSH1 (code position)
        // 60_00 -- PUSH1 (mem position)
        // 39 CODECOPY
        // 61_00_00 PUSH2 (size)
        // 60_00 PUSH1 (mem position)
        // f3 RETURN
        bytes memory init = hex"610000_600e_6000_39_610000_6000_f3";
        bytes1 size1 = bytes1(uint8(bytes(_svgLayers).length));
        bytes1 size2 = bytes1(uint8(bytes(_svgLayers).length >> 8));
        init[2] = size1;
        init[1] = size2;
        init[10] = size1;
        init[9] = size2;
        bytes memory code = abi.encodePacked(init, _svgLayers);

        assembly {
            svgContract := create(0, add(code, 32), mload(code))
        }
    }
}
