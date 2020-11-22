// SPDX-License-Identifier: MIT
pragma solidity 0.7.4;
pragma experimental ABIEncoderV2;

import "../libraries/LibAppStorage.sol";
import "../../shared/libraries/LibDiamond.sol";
import "hardhat/console.sol";
import "../../shared/libraries/LibERC20.sol";
import "../interfaces/IERC1155.sol";
import "../libraries/LibERC1155.sol";

contract ShopFacet {
    AppStorage internal s;
    event TransferBatch(address indexed _operator, address indexed _from, address indexed _to, uint256[] _ids, uint256[] _values);
    bytes4 internal constant ERC1155_BATCH_ACCEPTED = 0xbc197c81; // Return value from `onERC1155BatchReceived` call if a contract accepts receipt (i.e `bytes4(keccak256("onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)"))`).

    //To do: Allow users to purchase items from store using GHST
    //Purchasing items should distribute an amount of GHST to various addresses, while burning the rest
    /*
    function purchaseWearablesWithGhst(uint256[] calldata _wearableIds, uint256[] calldata _quantities) external {
        require(_wearableIds.length == _quantities.length, "ShopFacet: _wearableIds not same length as _quantities");
        for (uint256 i; i < _wearableIds.length; i++) {
            uint256 wearableId = _wearableIds[i];
            uint256 quantity = _quantities[i];
        }
    }
    */

    //To do: Allow users to convert vouchers for same-Id wearables
    //Burn the voucher
    //Mint the wearable and transfer to user
    function purchaseWearablesWithVouchers(
        address _to,
        uint256[] calldata _voucherIds,
        uint256[] calldata _quantities
    ) external {
        IERC1155(s.vouchersContract).safeBatchTransferFrom(msg.sender, address(this), _voucherIds, _quantities, "");
        require(_voucherIds.length == _quantities.length, "ShopFacet: _voucherIds not same length as _quantities");
        for (uint256 i; i < _voucherIds.length; i++) {
            uint256 wearableId = _voucherIds[i];
            uint256 quantity = _quantities[i];
            require(
                (s.wearableTypes[wearableId].totalQuantity += quantity) <= s.wearableTypes[wearableId].maxQuantity,
                "ShopFacet: Total quantity exceeds max quantity"
            );
            s.wearables[_to][wearableId] += quantity;
            s.wearableTypes[wearableId].totalQuantity += quantity;
        }
        LibERC1155.onERC1155BatchReceived(msg.sender, _to, _voucherIds, _quantities, "");
    }
}
