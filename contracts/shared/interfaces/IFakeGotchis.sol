// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.1;

interface IFakeGotchi {
    /**
     * @notice Transfers `_amounts` of `_ids` from the `_from` address to the `_to` address specified (with safety call).
     * @dev Caller must be approved to manage the tokens being transferred out of the `_from` account (see "Approval" section of the standard).
     * Must contain scenario of internal _safeBatchTransferFrom() function
     * @param _from    Source address
     * @param _to      Target address
     * @param _ids     IDs of each token type (order and length must match _amounts array)
     * @param _amounts Transfer amounts per token type (order and length must match _ids array)
     * @param _data    Additional data with no specified format, MUST be sent unaltered in call to the `ERC1155TokenReceiver` hook(s) on `_to`
     */
    function safeBatchTransferFrom(
        address _from,
        address _to,
        uint256[] calldata _ids,
        uint256[] calldata _amounts,
        bytes calldata _data
    ) external;

    /**
     * @notice Get the URI for a card type
     * @return URI for token type
     */
    function uri(uint256 _id) external view returns (string memory);
}
