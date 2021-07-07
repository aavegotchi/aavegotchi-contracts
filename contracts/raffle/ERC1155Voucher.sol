// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import "../shared/ERC1155Burnable.sol";

contract ERC1155Voucher is ERC1155Burnable {
    //The contract address of the ERC721 that this voucher is redeemable for
    mapping(uint256 => address) redeemAddress;

    constructor(
        uint256 _tokenId,
        uint256 _mintQuantity,
        string memory uri,
        address _redeemAddress
    ) ERC1155(uri) {
        redeemAddress[_tokenId] = _redeemAddress;
        _mint(msg.sender, _tokenId, _mintQuantity, "");
    }

    //This method is meant to be called by the ERC721 contract that this voucher is redeemed for. After the voucher is redeemed and the NFT is minted/transferred to the voucher owner, the ERC721 method should call this function to burn the voucher.

    //Todo: Add
    function burnAfterRedeem(
        uint256 _tokenId,
        uint256 _quantity,
        address _redeemAddress
    ) public {
        //Question: Is there a way to only allow the ERC721 contract to call this function? Msg.sender will be the voucher owner, not the ERC721 contract
        require(_redeemAddress == redeemAddress[_tokenId], "Must be same redeem address");
        _burn(msg.sender, _tokenId, _quantity);
    }
}
