// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {LibBuyOrder} from "../libraries/LibBuyOrder.sol";
import {LibERC1155Marketplace} from "../libraries/LibERC1155Marketplace.sol";
import {LibERC20} from "../../shared/libraries/LibERC20.sol";
import {LibERC1155} from "../../shared/libraries/LibERC1155.sol";
import {LibItems} from "../libraries/LibItems.sol";
import {IERC20} from "../../shared/interfaces/IERC20.sol";
import {IERC1155} from "../../shared/interfaces/IERC1155.sol";
import {LibMeta} from "../../shared/libraries/LibMeta.sol";
import {Modifiers, ERC1155BuyOrder} from "../libraries/LibAppStorage.sol";
import {BaazaarSplit, LibSharedMarketplace, SplitAddresses} from "../libraries/LibSharedMarketplace.sol";
import "../WearableDiamond/interfaces/IEventHandlerFacet.sol";

contract ERC1155BuyOrderFacet is Modifiers {
    event ERC1155BuyOrderAdd(
        uint256 indexed buyOrderId,
        address indexed buyer,
        address erc1155TokenAddress,
        uint256 erc1155TokenId,
        uint256 indexed category,
        uint256 priceInWei,
        uint256 quantity,
        uint256 duration,
        uint256 time
    );
    event ERC1155BuyOrderCancel(uint256 indexed buyOrderId, uint256 time);
    event ERC1155BuyOrderExecute(
        uint256 indexed buyOrderId,
        address indexed buyer,
        address seller,
        address erc1155TokenAddress,
        uint256 erc1155TokenId,
        uint256 indexed category,
        uint256 priceInWei,
        uint256 quantity,
        uint256 time
    );

    function placeERC1155BuyOrder(
        address _erc1155TokenAddress,
        uint256 _erc1155TokenId,
        uint256 _priceInWei,
        uint256 _quantity,
        uint256 _duration
    ) external {
        uint256 cost = _quantity * _priceInWei;
        require(cost >= 1e15, "ERC1155BuyOrder: cost should be 0.001 GHST or larger");

        address sender = LibMeta.msgSender();
        uint256 category = LibSharedMarketplace.getERC1155Category(_erc1155TokenAddress, _erc1155TokenId);
        uint256 ghstBalance = IERC20(s.ghstContract).balanceOf(sender);

        //If an order exists from this user, first refund the GHST
        // New order
        // Transfer GHST
        require(ghstBalance >= cost, "ERC1155BuyOrder: Not enough GHST!");
        LibERC20.transferFrom(s.ghstContract, sender, address(this), cost);

        // Place new buy order
        s.nextERC1155BuyOrderId++;
        uint256 buyOrderId = s.nextERC1155BuyOrderId;

        s.erc1155BuyOrders[buyOrderId] = ERC1155BuyOrder({
            buyOrderId: buyOrderId,
            buyer: sender,
            erc1155TokenAddress: _erc1155TokenAddress,
            erc1155TokenId: _erc1155TokenId,
            priceInWei: _priceInWei,
            quantity: _quantity,
            timeCreated: block.timestamp,
            lastTimePurchased: 0,
            duration: _duration,
            completed: false,
            cancelled: false
        });
        emit ERC1155BuyOrderAdd(
            buyOrderId,
            sender,
            _erc1155TokenAddress,
            _erc1155TokenId,
            category,
            _priceInWei,
            _quantity,
            _duration,
            block.timestamp
        );
    }

    function cancelERC1155BuyOrder(uint256 _buyOrderId) external {
        address sender = LibMeta.msgSender();
        ERC1155BuyOrder memory erc1155BuyOrder = s.erc1155BuyOrders[_buyOrderId];
        require(erc1155BuyOrder.timeCreated != 0, "ERC1155BuyOrder: ERC1155 buyOrder does not exist");
        require((erc1155BuyOrder.cancelled == false) && (erc1155BuyOrder.completed == false), "ERC1155BuyOrder: Already processed");
        if (
            (erc1155BuyOrder.duration == 0) ||
            ((erc1155BuyOrder.duration > 0) && (erc1155BuyOrder.timeCreated + erc1155BuyOrder.duration > block.timestamp))
        ) {
            require(sender == erc1155BuyOrder.buyer, "ERC1155BuyOrder: Only buyer can call this function");
        }

        LibBuyOrder.cancelERC1155BuyOrder(_buyOrderId);
        emit ERC1155BuyOrderCancel(_buyOrderId, block.timestamp);
    }

    function executeERC1155BuyOrder(
        uint256 _buyOrderId,
        address _erc1155TokenAddress,
        uint256 _erc1155TokenId,
        uint256 _priceInWei,
        uint256 _quantity
    ) external {
        address sender = LibMeta.msgSender();
        ERC1155BuyOrder storage erc1155BuyOrder = s.erc1155BuyOrders[_buyOrderId];

        require(erc1155BuyOrder.timeCreated != 0, "ERC1155BuyOrder: ERC1155 buyOrder does not exist");
        require(erc1155BuyOrder.erc1155TokenAddress == _erc1155TokenAddress, "ERC1155BuyOrder: ERC1155 token address not matched");
        require(erc1155BuyOrder.erc1155TokenId == _erc1155TokenId, "ERC1155BuyOrder: ERC1155 token id not matched");
        require(erc1155BuyOrder.priceInWei == _priceInWei, "ERC1155BuyOrder: Price not matched");
        require(erc1155BuyOrder.buyer != sender, "ERC1155BuyOrder: Buyer can't be seller");
        require((erc1155BuyOrder.cancelled == false) && (erc1155BuyOrder.completed == false), "ERC1155BuyOrder: Already processed");
        if (erc1155BuyOrder.duration > 0) {
            require(erc1155BuyOrder.timeCreated + erc1155BuyOrder.duration >= block.timestamp, "ERC1155BuyOrder: Already expired");
        }
        require(erc1155BuyOrder.quantity >= _quantity, "ERC1155BuyOrder: Sell amount should not be larger than quantity of the buy order");

        uint256 cost = _quantity * erc1155BuyOrder.priceInWei;
        require(cost >= 1e15, "ERC1155BuyOrder: execution cost should be 0.001 GHST or larger");

        IERC1155 erc1155Token = IERC1155(erc1155BuyOrder.erc1155TokenAddress);
        require(erc1155Token.balanceOf(sender, erc1155BuyOrder.erc1155TokenId) >= _quantity, "ERC1155Marketplace: Not enough ERC1155 token");

        erc1155BuyOrder.quantity -= _quantity;
        erc1155BuyOrder.lastTimePurchased = block.timestamp;

        BaazaarSplit memory split = LibSharedMarketplace.getBaazaarSplit(cost, new uint256[](0), [10000, 0]);
        LibSharedMarketplace.transferSales(
            SplitAddresses({
                ghstContract: s.ghstContract,
                buyer: address(this),
                seller: sender,
                affiliate: address(0),
                royalties: new address[](0),
                daoTreasury: s.daoTreasury,
                pixelCraft: s.pixelCraft,
                rarityFarming: s.rarityFarming
            }),
            split
        );

        if (erc1155BuyOrder.quantity == 0) {
            erc1155BuyOrder.completed = true;
        }

        // ERC1155 transfer
        if (erc1155BuyOrder.erc1155TokenAddress == address(this)) {
            LibItems.removeFromOwner(sender, erc1155BuyOrder.erc1155TokenId, _quantity);
            LibItems.addToOwner(erc1155BuyOrder.buyer, erc1155BuyOrder.erc1155TokenId, _quantity);
            IEventHandlerFacet(s.wearableDiamond).emitTransferSingleEvent(
                address(this),
                sender,
                erc1155BuyOrder.buyer,
                erc1155BuyOrder.erc1155TokenId,
                _quantity
            );
            LibERC1155.onERC1155Received(address(this), sender, erc1155BuyOrder.buyer, erc1155BuyOrder.erc1155TokenId, _quantity, "");
        } else {
            IERC1155(erc1155BuyOrder.erc1155TokenAddress).safeTransferFrom(
                sender,
                erc1155BuyOrder.buyer,
                erc1155BuyOrder.erc1155TokenId,
                _quantity,
                new bytes(0)
            );
        }
        LibERC1155Marketplace.updateERC1155Listing(erc1155BuyOrder.erc1155TokenAddress, erc1155BuyOrder.erc1155TokenId, sender);

        emit ERC1155BuyOrderExecute(
            _buyOrderId,
            erc1155BuyOrder.buyer,
            sender,
            erc1155BuyOrder.erc1155TokenAddress,
            erc1155BuyOrder.erc1155TokenId,
            LibSharedMarketplace.getERC1155Category(erc1155BuyOrder.erc1155TokenAddress, erc1155BuyOrder.erc1155TokenId),
            erc1155BuyOrder.priceInWei,
            _quantity,
            block.timestamp
        );
    }
}
