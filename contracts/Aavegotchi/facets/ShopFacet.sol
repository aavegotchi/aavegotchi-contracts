// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {AppStorage, ItemType, Haunt} from "../libraries/LibAppStorage.sol";
import {LibAavegotchi} from "../libraries/LibAavegotchi.sol";
// import "hardhat/console.sol";
import {IERC20} from "../../shared/interfaces/IERC20.sol";
import {LibERC721} from "../../shared/libraries/LibERC721.sol";
import {LibERC1155} from "../libraries/LibERC1155.sol";
import {LibMeta} from "../../shared/libraries/LibMeta.sol";

contract ShopFacet {
    AppStorage internal s;

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
        uint32 tokenId = s.tokenIdCounter;
        uint256 totalPrice = _ghst - (_ghst % haunt.portalPrice);
        emit BuyPortals(LibMeta.msgSender(), _to, tokenId, numAavegotchisToPurchase, totalPrice);
        for (uint256 i; i < numAavegotchisToPurchase; i++) {
            s.aavegotchis[tokenId].owner = _to;
            s.aavegotchis[tokenId].hauntId = uint16(currentHauntId);
            s.tokenIdIndexes[tokenId] = s.tokenIds.length;
            s.tokenIds.push(tokenId);
            s.ownerTokenIdIndexes[_to][tokenId] = s.ownerTokenIds[_to].length;
            s.ownerTokenIds[_to].push(tokenId);
            emit LibERC721.Transfer(address(0), _to, tokenId);
            tokenId++;
        }
        s.tokenIdCounter = tokenId;
        LibAavegotchi.purchase(totalPrice);
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

        LibAavegotchi.purchase(totalPrice);
    }
}
