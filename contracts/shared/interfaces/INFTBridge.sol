// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

interface INFTBridge {
    function bridge(
        address receiver_,
        address tokenOwner_,
        uint256 tokenId_,
        uint256 amount_,
        uint256 msgGasLimit_,
        address connector_,
        bytes calldata extraData_,
        bytes calldata options_
    ) external payable;

    function receiveInbound(
        uint32 siblingChainSlug_,
        bytes memory payload_
    ) external payable;

    function retry(address connector_, bytes32 messageId_) external;
}
