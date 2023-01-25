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

    function safeBatchTransferTo(
        address _from,
        address[] calldata _to,
        uint256[] calldata _ids,
        uint256[] calldata _amounts,
        bytes calldata _data
    ) external;

    /**
     * @notice Transfers `_amount` of an `_id` from the `_from` address to the `_to` address specified (with safety call).
     * @dev Caller must be approved to manage the tokens being transferred out of the `_from` account (see "Approval" section of the standard).
     * Must contain scenario of internal _safeTransferFrom() function
     * @param _from    Source address
     * @param _to      Target address
     * @param _id      ID of the token type
     * @param _amount  Transfer amount
     * @param _data    Additional data with no specified format, MUST be sent unaltered in call to `onERC1155Received` on `_to`
     */
    function safeTransferFrom(
        address _from,
        address _to,
        uint256 _id,
        uint256 _amount,
        bytes calldata _data
    ) external;

    /**
     * @notice Start new card series with minting ERC1155 Cards to this
     * @param _amount Amount to mint in this series
     */
    function startNewSeries(uint256 _amount) external;

    /**
     * @notice Get the URI for a card type
     * @return URI for token type
     */
    function uri(uint256 _id) external view returns (string memory);

    /**
     * @notice Get the balance of an account's tokens.
     * @param _owner  The address of the token holder
     * @param _id     ID of the token
     * @return bal_   The _owner's balance of the token type requested
     */
    function balanceOf(address _owner, uint256 _id) external view returns (uint256 bal_);
}
