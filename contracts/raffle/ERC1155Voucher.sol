// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import "../shared/ERC1155Burnable.sol";

contract ERC1155Voucher is ERC1155Burnable {
    uint256 public constant PRIZE_ID = 0;

    constructor() ERC1155("https://aavegotchi.com/baazaar/raffle-prize-{id}") {
        _mint(msg.sender, PRIZE_ID, 10**18, ""); // TODO: Should be updated
    }
}