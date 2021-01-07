// SPDX-License-Identifier: MIT
pragma solidity 0.7.4;
pragma experimental ABIEncoderV2;

import "../libraries/LibAppStorage.sol";
import "../../shared/libraries/LibDiamond.sol";
import "hardhat/console.sol";
import "../../shared/libraries/LibERC20.sol";
import "../interfaces/IERC1155.sol";
import "../libraries/LibERC1155.sol";
import "../libraries/LibVrf.sol";

contract ShopFacet {
    AppStorage internal s;
    event TransferBatch(address indexed _operator, address indexed _from, address indexed _to, uint256[] _ids, uint256[] _values);
    bytes4 internal constant ERC1155_BATCH_ACCEPTED = 0xbc197c81; // Return value from `onERC1155BatchReceived` call if a contract accepts receipt (i.e `bytes4(keccak256("onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)"))`).

    /***********************************|
   |             Events         |
   |__________________________________*/

    event Transfer(address indexed _from, address indexed _to, uint256 indexed _tokenId);

    event BuyPortals(
        address indexed _from,
        address indexed _to,
        // uint256 indexed _batchId,
        uint256 _tokenId,
        uint256 _numAavegotchisToPurchase,
        uint256 _totalPrice
    );

    event PurchaseItemsWithGhst(address indexed _from, address indexed _to, uint256[] _itemIds, uint256[] _quantities, uint256 _totalPrice);

    event PurchaseItemsWithVouchers(address indexed _from, address indexed _to, uint256[] _itemIds, uint256[] _quantities);

    address internal immutable im_vouchersContract;

    constructor(address _vouchersContract) {
        im_vouchersContract = _vouchersContract;
    }

    /***********************************|
   |             Write Functions        |
   |__________________________________*/

    function buyPortals(address _to, uint256 _ghst) external {
        uint256 currentHauntId = s.currentHauntId;
        Haunt memory haunt = s.haunts[currentHauntId];
        require(_ghst >= haunt.portalPrice, "ShopFacet: Not enough GHST to buy portal");
        uint256 ghstBalance = IERC20(s.ghstContract).balanceOf(msg.sender);
        require(ghstBalance >= _ghst, "ShopFacet: Not enough GHST!");
        uint16 hauntId = s.currentHauntId;
        uint256 numAavegotchisToPurchase = _ghst / haunt.portalPrice;
        require(numAavegotchisToPurchase <= 50, "ShopFacet: Cannot buy more than 50 portals at a time");
        uint256 hauntCount = haunt.totalCount + numAavegotchisToPurchase;
        require(hauntCount <= haunt.hauntMaxSize, "ShopFacet: Exceeded max number of aavegotchis for this haunt");
        s.haunts[currentHauntId].totalCount = uint24(hauntCount);

        uint256 tokenId = s.totalSupply;
        uint256 totalPrice = _ghst - (_ghst % haunt.portalPrice);
        emit BuyPortals(msg.sender, _to, tokenId, numAavegotchisToPurchase, totalPrice);
        for (uint256 i; i < numAavegotchisToPurchase; i++) {
            s.aavegotchis[tokenId].owner = _to;
            s.aavegotchis[tokenId].hauntId = hauntId;
            emit Transfer(address(0), _to, tokenId);
            tokenId++;
        }

        s.aavegotchiBalance[_to] += numAavegotchisToPurchase;
        s.totalSupply = uint32(tokenId);
        LibAppStorage.purchase(totalPrice);
    }

    function purchaseItemsWithGhst(
        address _to,
        uint256[] calldata _itemIds,
        uint256[] calldata _quantities
    ) external {
        require(_itemIds.length == _quantities.length, "ShopFacet: _itemIds not same length as _quantities");
        uint256 totalPrice;
        for (uint256 i; i < _itemIds.length; i++) {
            uint256 itemId = _itemIds[i];
            uint256 quantity = _quantities[i];
            require(quantity < 1_000_000, "ShopFacet: Cannot purchase so many items at the same time");
            ItemType storage itemType = s.itemTypes[itemId];
            require(itemType.canPurchaseWithGhst, "ShopFacet: Can't purchase item type with GHST");
            uint256 totalQuantity = itemType.totalQuantity + quantity;
            require(totalQuantity <= itemType.maxQuantity, "ShopFacet: Total item type quantity exceeds max quantity");
            itemType.totalQuantity = uint32(totalQuantity);
            totalPrice += quantity * itemType.ghstPrice;
            s.items[_to][itemId] += quantity;
        }
        emit PurchaseItemsWithGhst(msg.sender, _to, _itemIds, _quantities, totalPrice);
        LibERC1155.onERC1155BatchReceived(msg.sender, _to, _itemIds, _quantities, "");
        uint256 ghstBalance = IERC20(s.ghstContract).balanceOf(msg.sender);
        require(ghstBalance >= totalPrice, "ShopFacet: Not enough GHST!");

        LibAppStorage.purchase(totalPrice);
    }

    function purchaseItemsWithVouchers(
        address _to,
        uint256[] calldata _voucherIds,
        uint256[] calldata _quantities
    ) external {
        require(_voucherIds.length == _quantities.length, "ShopFacet: _voucherIds not same length as _quantities");
        IERC1155(im_vouchersContract).safeBatchTransferFrom(msg.sender, address(this), _voucherIds, _quantities, "");
        for (uint256 i; i < _voucherIds.length; i++) {
            uint256 itemId = _voucherIds[i] + 1;
            uint256 quantity = _quantities[i];
            uint256 totalQuantity = s.itemTypes[itemId].totalQuantity + quantity;
            require(totalQuantity <= s.itemTypes[itemId].maxQuantity, "ShopFacet: Total item type quantity exceeds max quantity");
            s.items[_to][itemId] += quantity;
            s.itemTypes[itemId].totalQuantity = uint32(totalQuantity);
        }
        emit PurchaseItemsWithVouchers(msg.sender, _to, _voucherIds, _quantities);
        LibERC1155.onERC1155BatchReceived(msg.sender, _to, _voucherIds, _quantities, "");
    }

    function onERC1155BatchReceived(
        address _operator,
        address _from,
        uint256[] calldata _ids,
        uint256[] calldata _values,
        bytes calldata _data
    ) external view returns (bytes4) {
        _operator;
        _from;
        _ids;
        _values;
        _data;
        require(msg.sender == im_vouchersContract, "ShopFacet: Only accepts ERC1155 tokens from VoucherContract");
        require(_ids.length > 0, "ShopFacet: Can't receive 0 vouchers");
        return ERC1155_BATCH_ACCEPTED;
    }
}
