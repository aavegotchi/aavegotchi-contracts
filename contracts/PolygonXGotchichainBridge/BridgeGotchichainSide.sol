// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import {Aavegotchi} from "../Aavegotchi/libraries/LibAppStorage.sol";
import "@layerzerolabs/solidity-examples/contracts/token/onft/extension/ProxyONFT721.sol";
import "../Aavegotchi/facets/AavegotchiFacet.sol";
import "../Aavegotchi/facets/PolygonXGotchichainBridgeFacet.sol";

contract BridgeGotchichainSide is ProxyONFT721 {

    constructor(
        uint256 _minGasToTransfer,
        address _lzEndpoint,
        address _proxyToken
    ) ProxyONFT721(_minGasToTransfer, _lzEndpoint, _proxyToken) {} 

    function estimateSendBatchFee(uint16 _dstChainId, bytes memory _toAddress, uint[] memory _tokenIds, bool _useZro, bytes memory _adapterParams) public view override returns (uint nativeFee, uint zroFee) {
        Aavegotchi[] memory aavegotchis = new Aavegotchi[](_tokenIds.length);
        for (uint i = 0; i < _tokenIds.length; i++) {
            aavegotchis[i] = PolygonXGotchichainBridgeFacet(address(token)).getAavegotchiData(_tokenIds[i]);
        }
        bytes memory payload = abi.encode(_toAddress, _tokenIds, aavegotchis);
        return lzEndpoint.estimateFees(_dstChainId, address(this), payload, _useZro, _adapterParams);
    }

    function _send(address _from, uint16 _dstChainId, bytes memory _toAddress, uint[] memory _tokenIds, address payable _refundAddress, address _zroPaymentAddress, bytes memory _adapterParams) internal override {
        // allow 1 by default
        require(_tokenIds.length > 0, "LzApp: tokenIds[] is empty");
        require(_tokenIds.length == 1 || _tokenIds.length <= dstChainIdToBatchLimit[_dstChainId], "ONFT721: batch size exceeds dst batch limit");

        Aavegotchi[] memory aavegotchis = new Aavegotchi[](_tokenIds.length);
        for (uint i = 0; i < _tokenIds.length; i++) {
            _debitFrom(_from, _dstChainId, _toAddress, _tokenIds[i]);
            aavegotchis[i] = PolygonXGotchichainBridgeFacet(address(token)).getAavegotchiData(_tokenIds[i]);
        }

        bytes memory payload = abi.encode(_toAddress, _tokenIds, aavegotchis);

        _checkGasLimit(_dstChainId, FUNCTION_TYPE_SEND, _adapterParams, dstChainIdToTransferGas[_dstChainId] * _tokenIds.length);
        _lzSend(_dstChainId, payload, _refundAddress, _zroPaymentAddress, _adapterParams, msg.value);
        emit SendToChain(_dstChainId, _from, _toAddress, _tokenIds);
    }

    function _nonblockingLzReceive(
        uint16 _srcChainId,
        bytes memory _srcAddress,
        uint64 /*_nonce*/,
        bytes memory _payload
    ) internal virtual override {
        // decode and load the toAddress
        (bytes memory toAddressBytes, uint[] memory tokenIds, Aavegotchi[] memory aavegotchis) = abi.decode(_payload, (bytes, uint[], Aavegotchi[]));
        address toAddress;
        assembly {
            toAddress := mload(add(toAddressBytes, 20))
        }
        uint nextIndex = _creditTill(_srcChainId, toAddress, 0, tokenIds);
        if (nextIndex < tokenIds.length) {
            // not enough gas to complete transfers, store to be cleared in another tx
            bytes32 hashedPayload = keccak256(_payload);
            storedCredits[hashedPayload] = StoredCredit(_srcChainId, toAddress, nextIndex, true);
            emit CreditStored(hashedPayload, _payload);
        }

        _updateAavegotchiMetadata(toAddress, tokenIds, aavegotchis);

        emit ReceiveFromChain(_srcChainId, _srcAddress, toAddress, tokenIds);
    }

    function _creditTo(uint16, address _toAddress, uint _tokenId) internal override {
        try token.ownerOf(_tokenId) {
            token.safeTransferFrom(address(this), _toAddress, _tokenId);
        } catch Error(string memory reason) {
            if (_compare(reason, "AavegotchiFacet: invalid _tokenId")) {
                PolygonXGotchichainBridgeFacet(address(token)).mintWithId(_toAddress, _tokenId);
            }
            // @todo: what to do?
        }
    }

    function _updateAavegotchiMetadata(address newOwner, uint[] memory tokenIds, Aavegotchi[] memory aavegotchis) internal {
        for (uint i = 0; i < tokenIds.length; i++) {
            aavegotchis[i].owner = newOwner;
            PolygonXGotchichainBridgeFacet(address(token)).setAavegotchiMetadata(tokenIds[i], aavegotchis[i]);
        }
    }

    function _compare(string memory str1, string memory str2) internal pure returns (bool) {
        if (bytes(str1).length != bytes(str2).length) {
            return false;
        }
        return keccak256(abi.encodePacked(str1)) == keccak256(abi.encodePacked(str2));
    }
}
