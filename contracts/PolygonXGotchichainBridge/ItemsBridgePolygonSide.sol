// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import {Aavegotchi} from "../Aavegotchi/libraries/LibAppStorage.sol";
import "./ProxyONFT1155.sol";
import "../Aavegotchi/facets/AavegotchiFacet.sol";
import "../Aavegotchi/facets/PolygonXGotchichainBridgeFacet.sol";

contract ItemsBridgePolygonSide is ProxyONFT1155 {
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

    function _sendBatch(
        address _from,
        uint16 _dstChainId,
        bytes memory _toAddress,
        uint[] memory _tokenIds,
        uint[] memory _amounts,
        address payable _refundAddress,
        address _zroPaymentAddress,
        bytes memory _adapterParams
    ) internal override {
        _debitFrom(_from, _dstChainId, _toAddress, _tokenIds, _amounts);
        bytes memory payload = abi.encode(_toAddress, _tokenIds, _amounts);
        if (_tokenIds.length == 1) {
            if (useCustomAdapterParams) {
                _checkGasLimit(_dstChainId, FUNCTION_TYPE_SEND, _adapterParams, NO_EXTRA_GAS);
            } else {
                require(_adapterParams.length == 0, "LzApp: _adapterParams must be empty.");
            }
            _lzSend(_dstChainId, payload, _refundAddress, _zroPaymentAddress, _adapterParams, msg.value);
            emit SendToChain(_dstChainId, _from, _toAddress, _tokenIds[0], _amounts[0]);
        } else if (_tokenIds.length > 1) {
            if (useCustomAdapterParams) {
                _checkGasLimit(_dstChainId, FUNCTION_TYPE_SEND_BATCH, _adapterParams, NO_EXTRA_GAS);
            } else {
                require(_adapterParams.length == 0, "LzApp: _adapterParams must be empty.");
            }
            _lzSend(_dstChainId, payload, _refundAddress, _zroPaymentAddress, _adapterParams, msg.value);
            emit SendBatchToChain(_dstChainId, _from, _toAddress, _tokenIds, _amounts);
        }
    }

    function _nonblockingLzReceive(uint16 _srcChainId, bytes memory _srcAddress, uint64 /*_nonce*/, bytes memory _payload) internal override {
        // decode and load the toAddress
        (bytes memory toAddressBytes, uint[] memory tokenIds, uint[] memory amounts) = abi.decode(_payload, (bytes, uint[], uint[]));
        address toAddress;
        assembly {
            toAddress := mload(add(toAddressBytes, 20))
        }

        _creditTo(_srcChainId, toAddress, tokenIds, amounts);

        if (tokenIds.length == 1) {
            emit ReceiveFromChain(_srcChainId, _srcAddress, toAddress, tokenIds[0], amounts[0]);
        } else if (tokenIds.length > 1) {
            emit ReceiveBatchFromChain(_srcChainId, _srcAddress, toAddress, tokenIds, amounts);
        }
    }

    function _creditTo(uint16, address _toAddress, uint[] memory _tokenIds, uint[] memory _amounts) internal override {
        /**
            Two possible approachs:
            - Verify if there is already tokens locked in the contract and them transfer
                - We will need to loop through every token and verify if there is enough of that token to be transfered,
                if so we can transfer. If there is less then we need to mint the missing amount
                - This approach is more gas expensive
            - Create new tokens and transfer them
                - Implies that the _debitFrom will always be burning tokens
                - This approach is less gass expensive
         */
        
        token.safeBatchTransferFrom(address(this), _toAddress, _tokenIds, _amounts, "");

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
}
