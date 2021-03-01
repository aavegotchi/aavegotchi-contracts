// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {AppStorage, ItemType, Haunt} from "../libraries/LibAppStorage.sol";
import {LibAavegotchi} from "../libraries/LibAavegotchi.sol";
// import "hardhat/console.sol";
import {IERC20} from "../../shared/interfaces/IERC20.sol";
import {LibERC721} from "../../shared/libraries/LibERC721.sol";
import {LibERC1155} from "../../shared/libraries/LibERC1155.sol";
import {LibItems} from "../libraries/LibItems.sol";
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

    event PurchaseItemsWithGhst(address indexed _buyer, address indexed _to, uint256[] _itemIds, uint256[] _quantities, uint256 _totalPrice);

    event PurchaseItemsWithVouchers(address indexed _buyer, address indexed _to, uint256[] _itemIds, uint256[] _quantities);

    function buyPortals(address _to, uint256 _ghst) external {
        uint256 currentHauntId = s.currentHauntId;
        Haunt storage haunt = s.haunts[currentHauntId];
        uint256 price = haunt.portalPrice;
        require(_ghst >= price, "Not enough GHST to buy portals");
        uint256[3] memory tiers;
        tiers[0] = price * 5;
        tiers[1] = tiers[0] + (price * 2 * 10);
        tiers[2] = tiers[1] + (price * 3 * 10);
        require(_ghst <= tiers[2], "Can't buy more than 25");
        address sender = LibMeta.msgSender();
        uint256 numToPurchase;
        uint256 totalPrice;
        if (_ghst <= tiers[0]) {
            numToPurchase = _ghst / price;
            totalPrice = numToPurchase * price;
        } else {
            if (_ghst <= tiers[1]) {
                numToPurchase = (_ghst - tiers[0]) / (price * 2);
                totalPrice = tiers[0] + (numToPurchase * (price * 2));
                numToPurchase += 5;
            } else {
                numToPurchase = (_ghst - tiers[1]) / (price * 3);
                totalPrice = tiers[1] + (numToPurchase * (price * 3));
                numToPurchase += 15;
            }
        }
        uint256 hauntCount = haunt.totalCount + numToPurchase;
        require(hauntCount <= haunt.hauntMaxSize, "ShopFacet: Exceeded max number of aavegotchis for this haunt");
        s.haunts[currentHauntId].totalCount = uint24(hauntCount);
        uint32 tokenId = s.tokenIdCounter;
        emit BuyPortals(sender, _to, tokenId, numToPurchase, totalPrice);
        for (uint256 i; i < numToPurchase; i++) {
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
        address sender = LibMeta.msgSender();
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
            LibItems.addToOwner(_to, itemId, quantity);
        }
        uint256 ghstBalance = IERC20(s.ghstContract).balanceOf(sender);
        require(ghstBalance >= totalPrice, "ShopFacet: Not enough GHST!");
        emit PurchaseItemsWithGhst(sender, _to, _itemIds, _quantities, totalPrice);
        emit LibERC1155.TransferBatch(sender, address(0), _to, _itemIds, _quantities);
        LibAavegotchi.purchase(totalPrice);
        LibERC1155.onERC1155BatchReceived(sender, address(0), _to, _itemIds, _quantities, "");
    }
}
