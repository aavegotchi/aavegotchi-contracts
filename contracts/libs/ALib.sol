// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

library ALib {
    uint16 constant AAVEGOTCHI_TOKEN_TYPE = 1;

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
        mapping(address => mapping(uint => mapping(uint => uint))) nftBalances;
        
        // owner => (id => balance)
        mapping(address => mapping(uint => uint)) wearables;
        // owner => aavegotchis
        mapping(address => uint[]) aavegotchis;
        mapping(uint => OwnerAndIndex) owner;
        // owner => (operator => bool)
        mapping(address => mapping(address => bool)) operators;
        mapping(uint => address) approved;
        
        mapping(uint => bytes32) traits;
        uint totalSupply;       
    }

    function getStorage() internal pure returns(Storage storage ds) {
        bytes32 position = keccak256("diamond.Aavegotchi");
        assembly { ds.slot := position }
    }

    function getAavegotchiLayerSVG(uint _id) internal view returns(bytes memory) {
        ALib.Storage storage ags = ALib.getStorage();
        require(_id < ags.aavegotchiLayersSVG.length, "SVG id does not exist.");
        ALib.SVGLayer storage svgLayer = ags.aavegotchiLayersSVG[_id];
        address svgContract = svgLayer.svgLayersContract;
        uint size = svgLayer.size;
        uint offset = svgLayer.offset;
        bytes memory data = new bytes(size);
        assembly {
            extcodecopy(svgContract, add(data,32), offset, size)
        }
        return data;
    }

  function getWearablesSVG(uint _id) internal view returns(bytes memory) {
        ALib.Storage storage ags = ALib.getStorage();
        require(_id < ags.wearablesSVG.length, "SVG id does not exist.");
        ALib.SVGLayer storage svgLayer = ags.wearablesSVG[_id];
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