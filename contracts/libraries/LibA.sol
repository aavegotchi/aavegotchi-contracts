// SPDX-License-Identifier: MIT
pragma solidity 0.7.1;

library LibA {
    // uint16 constant AAVEGOTCHI_TOKEN_TYPE = 1;

    struct Aavegotchi {
        bytes32 traits;
        address owner;
        uint32 ownerEnumerationIndex;
        bool isPortal;

    }

    struct SVGLayer {
        address svgLayersContract;
        uint16 offset;
        uint16 size;
    }

    struct Storage {
        SVGLayer[] aavegotchiLayersSVG;
        SVGLayer[] wearablesSVG;
        SVGLayer[] itemsSVG;
        // contractAddress => nftId  => id => balance
        mapping(address => mapping(uint256 => mapping(uint256 => uint256))) nftBalances;
        // owner => (id => balance)
        mapping(address => mapping(uint256 => uint256)) wearables;
        // owner => aavegotchiOwnerEnumeration
        mapping(address => uint256[]) aavegotchiOwnerEnumeration;
        mapping(uint256 => Aavegotchi) aavegotchis;
        // owner => (operator => bool)
        mapping(address => mapping(address => bool)) operators;
        mapping(uint256 => address) approved;        
        uint32 totalSupply;
        address ghstDiamond;


    }

    function diamondStorage() internal pure returns (Storage storage ds) {
        bytes32 position = keccak256("diamond.Aavegotchi");
        assembly {
            ds.slot := position
        }
    }
    
    function getSVG(SVGLayer[] storage items, uint256 _id) internal view returns (bytes memory) {        
        require(_id < items.length, "SVG id does not exist.");
        LibA.SVGLayer storage svgLayer = items[_id];
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
