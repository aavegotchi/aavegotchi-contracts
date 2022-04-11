// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {LibAppStorage, AppStorage, ERC721BuyOrder} from "./LibAppStorage.sol";
import {LibERC20} from "../../shared/libraries/LibERC20.sol";

import "../../shared/interfaces/IERC721.sol";

library LibBuyOrder {
    function cancelERC721BuyOrder(uint256 _buyOrderId) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();

        ERC721BuyOrder memory erc721BuyOrder = s.erc721BuyOrders[_buyOrderId];
        if (erc721BuyOrder.timeCreated == 0) {
            return;
        }
        if ((erc721BuyOrder.cancelled == true) || (erc721BuyOrder.timePurchased != 0)) {
            return;
        }

        removeERC721BuyOrder(_buyOrderId);
        s.erc721BuyOrders[_buyOrderId].cancelled = true;

        // refund GHST to buyer
        LibERC20.transfer(s.ghstContract, erc721BuyOrder.buyer, erc721BuyOrder.priceInWei);
    }

    function removeERC721BuyOrder(uint256 _buyOrderId) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();

        ERC721BuyOrder memory erc721BuyOrder = s.erc721BuyOrders[_buyOrderId];
        uint256 _tokenId = erc721BuyOrder.erc721TokenId;

        uint256 index = s.erc721TokenToBuyOrderIdIndexes[_tokenId][_buyOrderId];
        uint256 lastIndex = s.erc721TokenToBuyOrderIds[_tokenId].length - 1;
        if (index != lastIndex) {
            uint256 lastBuyOrderId = s.erc721TokenToBuyOrderIds[_tokenId][lastIndex];
            s.erc721TokenToBuyOrderIds[_tokenId][index] = lastBuyOrderId;
            s.erc721TokenToBuyOrderIdIndexes[_tokenId][lastBuyOrderId] = index;
        }
        s.erc721TokenToBuyOrderIds[_tokenId].pop();
        delete s.erc721TokenToBuyOrderIdIndexes[_tokenId][_buyOrderId];

        delete s.buyerToBuyOrderId[_tokenId][erc721BuyOrder.buyer];
    }
}
