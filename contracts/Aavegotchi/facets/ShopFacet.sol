// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {Modifiers, AppStorage, ItemType, Haunt} from "../libraries/LibAppStorage.sol";
import {LibAavegotchi} from "../libraries/LibAavegotchi.sol";
// import "hardhat/console.sol";
import {IERC20} from "../../shared/interfaces/IERC20.sol";
import {LibERC721} from "../../shared/libraries/LibERC721.sol";
import {LibERC1155} from "../../shared/libraries/LibERC1155.sol";
import {LibItems} from "../libraries/LibItems.sol";
import {LibMeta} from "../../shared/libraries/LibMeta.sol";
import {LibERC1155Marketplace} from "../libraries/LibERC1155Marketplace.sol";

import "../WearableDiamond/interfaces/IEventHandlerFacet.sol";

contract ShopFacet is Modifiers {
    event MintPortals(
        address indexed _from,
        address indexed _to,
        // uint256 indexed _batchId,
        uint256 _tokenId,
        uint256 _numAavegotchisToPurchase,
        uint256 _hauntId
    );

    event BuyPortals(
        address indexed _from,
        address indexed _to,
        // uint256 indexed _batchId,
        uint256 _tokenId,
        uint256 _numAavegotchisToPurchase,
        uint256 _totalPrice
    );

    event PurchaseItemsWithGhst(address indexed _buyer, address indexed _to, uint256[] _itemIds, uint256[] _quantities, uint256 _totalPrice);
    event PurchaseTransferItemsWithGhst(address indexed _buyer, address indexed _to, uint256[] _itemIds, uint256[] _quantities, uint256 _totalPrice);

    event PurchaseItemsWithVouchers(address indexed _buyer, address indexed _to, uint256[] _itemIds, uint256[] _quantities);

    ///@notice Allow an address to purchase a portal
    ///@dev Only portals from haunt 1 can be purchased via the contract
    ///@param _to Address to send the portal once purchased
    ///@param _ghst The amount of GHST the buyer is willing to pay //calculation will be done to know how much portal he recieves based on the haunt's portal price
    function buyPortals(address _to, uint256 _ghst) external {
        uint256 currentHauntId = s.currentHauntId;
        require(currentHauntId == 1, "ShopFacet: Can only purchase from Haunt 1");
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
        // LibAavegotchi.verify(tokenId);
        LibAavegotchi.purchase(sender, totalPrice);
    }

    ///@notice Allow an item manager to mint neew portals
    ///@dev Will throw if the max number of portals for the current haunt has been reached
    ///@param _to The destination of the minted portals
    ///@param _amount the amunt of portals to mint
    function mintPortals(address _to, uint256 _amount) external onlyItemManager {
        uint256 currentHauntId = s.currentHauntId;
        Haunt storage haunt = s.haunts[currentHauntId];
        address sender = LibMeta.msgSender();
        uint256 hauntCount = haunt.totalCount + _amount;
        require(hauntCount <= haunt.hauntMaxSize, "ShopFacet: Exceeded max number of aavegotchis for this haunt");
        s.haunts[currentHauntId].totalCount = uint24(hauntCount);
        uint32 tokenId = s.tokenIdCounter;
        emit MintPortals(sender, _to, tokenId, _amount, currentHauntId);
        for (uint256 i; i < _amount; i++) {
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
    }

    ///@notice Allow an address to purchase multiple items
    ///@dev Buying an item typically mints it, it will throw if an item has reached its maximum quantity
    ///@param _to Address to send the items once purchased
    ///@param _itemIds The identifiers of the items to be purchased
    ///@param _quantities The quantities of each item to be bought
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
            itemType.totalQuantity = totalQuantity;
            totalPrice += quantity * itemType.ghstPrice;
            LibItems.addToOwner(_to, itemId, quantity);
        }
        uint256 ghstBalance = IERC20(s.ghstContract).balanceOf(sender);
        require(ghstBalance >= totalPrice, "ShopFacet: Not enough GHST!");
        emit PurchaseItemsWithGhst(sender, _to, _itemIds, _quantities, totalPrice);
        IEventHandlerFacet(s.wearableDiamond).emitTransferBatchEvent(sender, address(0), _to, _itemIds, _quantities);
        LibAavegotchi.purchase(sender, totalPrice);
        LibERC1155.onERC1155BatchReceived(sender, address(0), _to, _itemIds, _quantities, "");
    }

    ///@notice Allow an address to purchase multiple items after they have been minted
    ///@dev Only one item per transaction can be purchased from the Diamond contract
    ///@param _to Address to send the items once purchased
    ///@param _itemIds The identifiers of the items to be purchased
    ///@param _quantities The quantities of each item to be bought

    function purchaseTransferItemsWithGhst(
        address _to,
        uint256[] calldata _itemIds,
        uint256[] calldata _quantities
    ) external {
        require(_to != address(0), "ShopFacet: Can't transfer to 0 address");
        require(_itemIds.length == _quantities.length, "ShopFacet: ids not same length as values");
        address sender = LibMeta.msgSender();
        address from = address(this);
        uint256 totalPrice;
        for (uint256 i; i < _itemIds.length; i++) {
            uint256 itemId = _itemIds[i];
            uint256 quantity = _quantities[i];
            require(quantity == 1, "ShopFacet: Can only purchase 1 of an item per transaction");
            ItemType storage itemType = s.itemTypes[itemId];
            require(itemType.canPurchaseWithGhst, "ShopFacet: Can't purchase item type with GHST");
            totalPrice += quantity * itemType.ghstPrice;
            LibItems.removeFromOwner(from, itemId, quantity);
            LibItems.addToOwner(_to, itemId, quantity);
            LibERC1155Marketplace.updateERC1155Listing(address(this), itemId, from);
        }
        uint256 ghstBalance = IERC20(s.ghstContract).balanceOf(sender);
        require(ghstBalance >= totalPrice, "ShopFacet: Not enough GHST!");
        IEventHandlerFacet(s.wearableDiamond).emitTransferBatchEvent(sender, from, _to, _itemIds, _quantities);
        emit PurchaseTransferItemsWithGhst(sender, _to, _itemIds, _quantities, totalPrice);
        LibAavegotchi.purchase(sender, totalPrice);
        LibERC1155.onERC1155BatchReceived(sender, from, _to, _itemIds, _quantities, "");
    }
}
