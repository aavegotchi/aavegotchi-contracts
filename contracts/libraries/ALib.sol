// SPDX-License-Identifier: MIT
pragma solidity 0.7.1;

library ALib {
    // uint16 constant AAVEGOTCHI_TOKEN_TYPE = 1;

    struct OwnerAndIndex {
        address owner;
        uint32 index;
    }

    struct SVGLayer {
        address svgLayersContract;
        uint16 offset;
        uint16 size;
    }

    struct Storage {
        SVGLayer[] aavegotchiLayersSVG;
        SVGLayer[] wearablesSVG;
        // contractAddress => nftId  => id => balance
        mapping(address => mapping(uint256 => mapping(uint256 => uint256))) nftBalances;
        // owner => (id => balance)
        mapping(address => mapping(uint256 => uint256)) wearables;
        // owner => aavegotchis
        mapping(address => uint256[]) aavegotchis;
        mapping(uint256 => OwnerAndIndex) owner;
        // owner => (operator => bool)
        mapping(address => mapping(address => bool)) operators;
        mapping(uint256 => address) approved;
        mapping(uint256 => bytes32) traits;
        uint256 totalSupply;
    }

    function getStorage() internal pure returns (Storage storage ds) {
        bytes32 position = keccak256("diamond.Aavegotchi");
        assembly {
            ds.slot := position
        }
    }

    function getAavegotchiLayerSVG(uint256 _id) internal view returns (bytes memory) {
        ALib.Storage storage ags = ALib.getStorage();
        require(_id < ags.aavegotchiLayersSVG.length, "SVG id does not exist.");
        ALib.SVGLayer storage svgLayer = ags.aavegotchiLayersSVG[_id];
        address svgContract = svgLayer.svgLayersContract;
        uint256 size = svgLayer.size;
        uint256 offset = svgLayer.offset;
        bytes memory data = new bytes(size);
        assembly {
            extcodecopy(svgContract, add(data, 32), offset, size)
        }
        return data;
    }

    function getWearablesSVG(uint256 _id) internal view returns (bytes memory) {
        ALib.Storage storage ags = ALib.getStorage();
        require(_id < ags.wearablesSVG.length, "SVG id does not exist.");
        ALib.SVGLayer storage svgLayer = ags.wearablesSVG[_id];
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
