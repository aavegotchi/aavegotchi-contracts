// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import "../libraries/LibAppStorage.sol";
import "../../shared/libraries/LibDiamond.sol";
// import "hardhat/console.sol";
import "../../shared/libraries/LibERC20.sol";
import "../interfaces/IERC1155.sol";
import "../libraries/LibERC1155.sol";
import "../libraries/LibVrf.sol";
import "../../shared/libraries/LibMeta.sol";

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

    /***********************************|
   |             Write Functions        |
   |__________________________________*/

    function buyPortals(address _to, uint256 _ghst) external {
        uint256 currentHauntId = s.currentHauntId;
        Haunt memory haunt = s.haunts[currentHauntId];
        require(_ghst >= haunt.portalPrice, "ShopFacet: Not enough GHST to buy portal");
        uint256 ghstBalance = IERC20(s.ghstContract).balanceOf(LibMeta.msgSender());
        require(ghstBalance >= _ghst, "ShopFacet: Not enough GHST!");
        uint256 numAavegotchisToPurchase = _ghst / haunt.portalPrice;
        require(numAavegotchisToPurchase <= 50, "ShopFacet: Cannot buy more than 50 portals at a time");
        uint256 hauntCount = haunt.totalCount + numAavegotchisToPurchase;
        require(hauntCount <= haunt.hauntMaxSize, "ShopFacet: Exceeded max number of aavegotchis for this haunt");
        s.haunts[currentHauntId].totalCount = uint24(hauntCount);
        uint256 tokenId = s.totalSupply;
        uint256 totalPrice = _ghst - (_ghst % haunt.portalPrice);
        emit BuyPortals(LibMeta.msgSender(), _to, tokenId, numAavegotchisToPurchase, totalPrice);
        for (uint256 i; i < numAavegotchisToPurchase; i++) {
            s.aavegotchis[tokenId].owner = _to;
            s.aavegotchis[tokenId].hauntId = uint16(currentHauntId);
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
            ItemType storage itemType = s.itemTypes[itemId];
            require(itemType.canPurchaseWithGhst, "ShopFacet: Can't purchase item type with GHST");
            uint256 totalQuantity = itemType.totalQuantity + quantity;
            require(totalQuantity <= itemType.maxQuantity, "ShopFacet: Total item type quantity exceeds max quantity");
            itemType.totalQuantity = uint32(totalQuantity);
            totalPrice += quantity * itemType.ghstPrice;
            s.items[_to][itemId] += quantity;
        }
        emit PurchaseItemsWithGhst(LibMeta.msgSender(), _to, _itemIds, _quantities, totalPrice);
        LibERC1155.onERC1155BatchReceived(LibMeta.msgSender(), _to, _itemIds, _quantities, "");
        uint256 ghstBalance = IERC20(s.ghstContract).balanceOf(LibMeta.msgSender());
        require(ghstBalance >= totalPrice, "ShopFacet: Not enough GHST!");

        LibAppStorage.purchase(totalPrice);
    }
}
