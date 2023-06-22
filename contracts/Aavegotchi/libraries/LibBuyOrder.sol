// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {LibAppStorage, AppStorage, ERC1155BuyOrder} from "./LibAppStorage.sol";
import {LibERC20} from "../../shared/libraries/LibERC20.sol";

library LibBuyOrder {
    event ERC1155BuyOrderCanceled(uint256 indexed buyOrderId, uint256 time);

    function cancelERC1155BuyOrder(uint256 _buyOrderId) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();

        ERC1155BuyOrder memory erc1155BuyOrder = s.erc1155BuyOrders[_buyOrderId];
        if (erc1155BuyOrder.timeCreated == 0) {
            return;
        }
        if ((erc1155BuyOrder.cancelled == true) || (erc1155BuyOrder.completed == true)) {
            return;
        }

        removeERC1155BuyOrder(_buyOrderId);
        s.erc1155BuyOrders[_buyOrderId].cancelled = true;

        // refund GHST to buyer
        LibERC20.transfer(s.ghstContract, erc1155BuyOrder.buyer, erc1155BuyOrder.priceInWei * erc1155BuyOrder.quantity);

        emit ERC1155BuyOrderCanceled(_buyOrderId, block.timestamp);
    }

    function removeERC1155BuyOrder(uint256 _buyOrderId) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();

        ERC1155BuyOrder memory erc1155BuyOrder = s.erc1155BuyOrders[_buyOrderId];
        uint256 _tokenId = erc1155BuyOrder.erc1155TokenId;
        address _tokenAddress = erc1155BuyOrder.erc1155TokenAddress;

        uint256 index = s.erc1155TokenToBuyOrderIdIndexes[_tokenAddress][_tokenId][_buyOrderId];
        uint256 lastIndex = s.erc1155TokenToBuyOrderIds[_tokenAddress][_tokenId].length - 1;
        if (index != lastIndex) {
            uint256 lastBuyOrderId = s.erc1155TokenToBuyOrderIds[_tokenAddress][_tokenId][lastIndex];
            s.erc1155TokenToBuyOrderIds[_tokenAddress][_tokenId][index] = lastBuyOrderId;
            s.erc1155TokenToBuyOrderIdIndexes[_tokenAddress][_tokenId][lastBuyOrderId] = index;
        }
        s.erc1155TokenToBuyOrderIds[_tokenAddress][_tokenId].pop();
        delete s.erc1155TokenToBuyOrderIdIndexes[_tokenAddress][_tokenId][_buyOrderId];

        delete s.buyerToERC1155BuyOrderId[_tokenAddress][_tokenId][erc1155BuyOrder.buyer];
    }
}
