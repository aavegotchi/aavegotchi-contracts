// SPDX-License-Identifier: MIT
pragma solidity 0.7.4;
pragma experimental ABIEncoderV2;

import "../libraries/LibAppStorage.sol";
import "../../shared/libraries/LibDiamond.sol";
import "hardhat/console.sol";
import "../../shared/libraries/LibERC20.sol";

contract ShopFacet {
    AppStorage internal s;

    //To do: Allow users to purchase items from store using GHST
    //Purchasing items should distribute an amount of GHST to various addresses, while burning the rest

    //To do: Allow users to convert vouchers for same-Id wearables
    //Burn the voucher
    //Mint the wearable and transfer to user
}
