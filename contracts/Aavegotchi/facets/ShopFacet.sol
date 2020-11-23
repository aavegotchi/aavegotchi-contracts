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

    address internal immutable im_vouchersContract;

    constructor(address _vouchersContract) {
        im_vouchersContract = _vouchersContract;
    }

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
        IERC1155(im_vouchersContract).safeBatchTransferFrom(msg.sender, address(this), _voucherIds, _quantities, "");
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

    /**
        @notice Handle the receipt of multiple ERC1155 token types.
        @dev An ERC1155-compliant smart contract MUST call this function on the token recipient contract, at the end of a `safeBatchTransferFrom` after the balances have been updated.        
        This function MUST return `bytes4(keccak256("onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)"))` (i.e. 0xbc197c81) if it accepts the transfer(s).
        This function MUST revert if it rejects the transfer(s).
        Return of any other value than the prescribed keccak256 generated value MUST result in the transaction being reverted by the caller.
        @param _operator  The address which initiated the batch transfer (i.e. msg.sender)
        @param _from      The address which previously owned the token
        @param _ids       An array containing ids of each token being transferred (order and length must match _values array)
        @param _values    An array containing amounts of each token being transferred (order and length must match _ids array)
        @param _data      Additional data with no specified format
        @return           `bytes4(keccak256("onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)"))`
    */
    function onERC1155BatchReceived(
        address _operator,
        address _from,
        uint256[] calldata _ids,
        uint256[] calldata _values,
        bytes calldata _data
    ) external view returns (bytes4) {
        // placed here to prevent argument not used errors
        _operator;
        _from;
        _ids;
        _values;
        _data;
        require(msg.sender == im_vouchersContract, "ShopFacet: Only accepts ERC1155 tokens from VoucherContract");
        return ERC1155_BATCH_ACCEPTED;
    }
}
