// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import {Aavegotchi} from "../Aavegotchi/libraries/LibAppStorage.sol";
import "./ProxyONFT1155.sol";
import "../Aavegotchi/facets/AavegotchiFacet.sol";
import "../Aavegotchi/facets/PolygonXGotchichainBridgeFacet.sol";

contract ItemsBridgeGotchichainSide is ProxyONFT1155 {
    constructor(address _lzEndpoint, address _proxyToken) ProxyONFT1155(_lzEndpoint, _proxyToken) {}

    function estimateSendBatchFee(
        uint16 _dstChainId,
        bytes memory _toAddress,
        uint[] memory _tokenIds,
        uint[] memory _amounts,
        bool _useZro,
        bytes memory _adapterParams
    ) public view override returns (uint nativeFee, uint zroFee) {
        bytes memory payload = abi.encode(_toAddress, _tokenIds, _amounts);
        return lzEndpoint.estimateFees(_dstChainId, address(this), payload, _useZro, _adapterParams);
    }

    function _debitFrom(address _from, uint16, bytes memory, uint[] memory _tokenIds, uint[] memory _amounts) internal override {
        require(_from == _msgSender(), "ItemsBridgePolygonSide: owner is not send caller");
        PolygonXGotchichainBridgeFacet(address(token)).removeItemsFromOwner(_from, _tokenIds, _amounts);
    }

    function _creditTo(uint16, address _toAddress, uint[] memory _tokenIds, uint[] memory _amounts) internal override {
        PolygonXGotchichainBridgeFacet(address(token)).addItemsToOwner(_toAddress, _tokenIds, _amounts);
    }

    function _updateAavegotchiMetadata(address newOwner, uint[] memory tokenIds, Aavegotchi[] memory aavegotchis) internal {
        for (uint i = 0; i < tokenIds.length; i++) {
            aavegotchis[i].owner = newOwner;
            PolygonXGotchichainBridgeFacet(address(token)).setAavegotchiMetadata(tokenIds[i], aavegotchis[i]);
        }
    }
}
