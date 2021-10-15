// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {LibAavegotchi} from "../libraries/LibAavegotchi.sol";
import {LibBuyOrder} from "../libraries/LibBuyOrder.sol";
import {LibERC20} from "../../shared/libraries/LibERC20.sol";
import {IERC20} from "../../shared/interfaces/IERC20.sol";
import {LibMeta} from "../../shared/libraries/LibMeta.sol";
import {Modifiers, ERC721BuyOrder} from "../libraries/LibAppStorage.sol";

contract ERC721BuyOrderFacet is Modifiers {
    event ERC721BuyOrderAdd(
        uint256 indexed buyOrderId,
        address indexed buyer,
        address erc721TokenAddress,
        uint256 erc721TokenId,
        uint256 indexed category,
        uint256 priceInWei,
        uint256 time
    );

    function getERC721BuyOrder(uint256 _buyOrderId) external view returns (ERC721BuyOrder memory buyOrder_) {
        buyOrder_ = s.erc721BuyOrders[_buyOrderId];
        require(buyOrder_.timeCreated != 0, "ERC721BuyOrder: ERC721 buyOrder does not exist");
    }

    function getERC721BuyOrderByTokenId(uint256 _erc721TokenId) external view returns (ERC721BuyOrder memory buyOrder_) {
        uint256 buyOrderId = s.erc721BuyOrderHead[_erc721TokenId];
        require(buyOrderId != 0, "ERC721BuyOrder: buyOrder doesn't exist");
        buyOrder_ = s.erc721BuyOrders[buyOrderId];
    }

    function placeERC721BuyOrder(address _erc721TokenAddress, uint256 _erc721TokenId, uint256 _priceInWei) external onlyLocked(_erc721TokenId) {
        require(_priceInWei >= 1e18, "ERC721BuyOrder: price should be 1 GHST or larger");

        address sender = LibMeta.msgSender();
        uint256 ghstBalance = IERC20(s.ghstContract).balanceOf(sender);
        require(ghstBalance >= _priceInWei, "ERC721BuyOrder: Not enough GHST!");

        uint256 category = LibAavegotchi.getERC721Category(_erc721TokenAddress, _erc721TokenId);
        require(category != LibAavegotchi.STATUS_VRF_PENDING, "ERC721BuyOrder: Cannot buy a portal that is pending VRF");

        require(block.timestamp > s.erc721BuyOrderLocked[_erc721TokenId] + 10 minutes, "ERC721BuyOrder: Buy order locked for this Aavegotchi");

        uint256 oldBuyOrderId = s.erc721BuyOrderHead[_erc721TokenId];
        if (oldBuyOrderId != 0) {
            ERC721BuyOrder memory erc721BuyOrder = s.erc721BuyOrders[oldBuyOrderId];
            require((erc721BuyOrder.cancelled == true) || (erc721BuyOrder.priceInWei < _priceInWei), "ERC721BuyOrder: Higher price buy order already exist");
            LibBuyOrder.cancelERC721BuyOrder(oldBuyOrderId);
        }

        // Transfer GHST
        LibERC20.transferFrom(s.ghstContract, sender, address(this), _priceInWei);

        // Place new buy order
        s.nextERC721BuyOrderId++;
        uint256 buyOrderId = s.nextERC721BuyOrderId;

        s.erc721BuyOrderHead[_erc721TokenId] = buyOrderId;
        s.erc721BuyOrders[buyOrderId] = ERC721BuyOrder({
            buyOrderId: buyOrderId,
            buyer: sender,
            erc721TokenAddress: _erc721TokenAddress,
            erc721TokenId: _erc721TokenId,
            category: category,
            priceInWei: _priceInWei,
            timeCreated: block.timestamp,
            timePurchased: 0,
            cancelled: false
        });
        emit ERC721BuyOrderAdd(buyOrderId, sender, _erc721TokenAddress, _erc721TokenId, category, _priceInWei, block.timestamp);
    }

    function cancelERC721BuyOrderByToken(uint256 _erc721TokenId) onlyAavegotchiOwner(_erc721TokenId) external {
        LibBuyOrder.cancelERC721BuyOrderByToken(_erc721TokenId);

        s.erc721BuyOrderLocked[_erc721TokenId] = block.timestamp;
    }

    function cancelERC721BuyOrder(uint256 _buyOrderId) external {
        address sender = LibMeta.msgSender();
        ERC721BuyOrder memory erc721BuyOrder = s.erc721BuyOrders[_buyOrderId];

        require(erc721BuyOrder.timeCreated != 0, "ERC721BuyOrder: ERC721 buyOrder does not exist");
        require((sender == s.aavegotchis[erc721BuyOrder.erc721TokenId].owner) || (sender == erc721BuyOrder.buyer), "ERC721BuyOrder: Only aavegotchi owner or buyer can call this function");

        LibBuyOrder.cancelERC721BuyOrder(_buyOrderId);
    }
}
