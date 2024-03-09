// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "./oft/OFTAdapter.sol";

contract GHSTOFTAdapter is OFTAdapter {
    constructor(
        address _token, // a deployed, already existing ERC20 token address
        address _layerZeroEndpoint, // local endpoint address
        address _owner // token owner used as a delegate in LayerZero Endpoint
    ) OFTAdapter(_token, _layerZeroEndpoint, _owner) {}
}
