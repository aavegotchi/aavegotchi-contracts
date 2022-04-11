// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {LibAavegotchi} from "../libraries/LibAavegotchi.sol";
import {LibBuyOrder} from "../libraries/LibBuyOrder.sol";
import {LibERC721Marketplace} from "../libraries/LibERC721Marketplace.sol";
import {LibERC20} from "../../shared/libraries/LibERC20.sol";
import {IERC20} from "../../shared/interfaces/IERC20.sol";
import {IERC721} from "../../shared/interfaces/IERC721.sol";
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

    event ERC721BuyOrderExecuted(
        uint256 indexed buyOrderId,
        address indexed buyer,
        address seller,
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

    function placeERC721BuyOrder(address _erc721TokenAddress, uint256 _erc721TokenId, uint256 _priceInWei) external {
        require(_priceInWei >= 1e18, "ERC721BuyOrder: price should be 1 GHST or larger");

        address sender = LibMeta.msgSender();
        uint256 ghstBalance = IERC20(s.ghstContract).balanceOf(sender);
        require(ghstBalance >= _priceInWei, "ERC721BuyOrder: Not enough GHST!");

        uint256 category = LibAavegotchi.getERC721Category(_erc721TokenAddress, _erc721TokenId);
        require(category != LibAavegotchi.STATUS_VRF_PENDING, "ERC721BuyOrder: Cannot buy a portal that is pending VRF");
        require(sender != s.aavegotchis[_erc721TokenId].owner, "ERC721BuyOrder: Owner can't be buyer");

        require(block.timestamp > s.erc721BuyOrderLocked[_erc721TokenId] + 10 minutes, "ERC721BuyOrder: Buy order locked for this Aavegotchi");

        uint256 oldBuyOrderId = s.erc721BuyOrderHead[_erc721TokenId];
        if (oldBuyOrderId != 0) {
            ERC721BuyOrder memory erc721BuyOrder = s.erc721BuyOrders[oldBuyOrderId];
            require((erc721BuyOrder.cancelled == true) || (erc721BuyOrder.priceInWei < _priceInWei), "ERC721BuyOrder: Higher price buy order already exist");
            require(erc721BuyOrder.timeCreated != 0, "ERC721BuyOrder: ERC721 buyOrder does not exist");
            require((erc721BuyOrder.cancelled == false) && (erc721BuyOrder.timePurchased == 0), "ERC721BuyOrder: Already processed");

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
        uint256 _buyOrderId = s.erc721BuyOrderHead[_erc721TokenId];
        ERC721BuyOrder memory erc721BuyOrder = s.erc721BuyOrders[_buyOrderId];
        require(erc721BuyOrder.timeCreated != 0, "ERC721BuyOrder: ERC721 buyOrder does not exist");
        require((erc721BuyOrder.cancelled == false) && (erc721BuyOrder.timePurchased == 0), "ERC721BuyOrder: Already processed");

        LibBuyOrder.cancelERC721BuyOrder(_buyOrderId);

        s.erc721BuyOrderLocked[_erc721TokenId] = block.timestamp;
    }

    function cancelERC721BuyOrder(uint256 _buyOrderId) external {
        address sender = LibMeta.msgSender();
        ERC721BuyOrder memory erc721BuyOrder = s.erc721BuyOrders[_buyOrderId];

        require(erc721BuyOrder.timeCreated != 0, "ERC721BuyOrder: ERC721 buyOrder does not exist");
        require((sender == s.aavegotchis[erc721BuyOrder.erc721TokenId].owner) || (sender == erc721BuyOrder.buyer), "ERC721BuyOrder: Only aavegotchi owner or buyer can call this function");
        require((erc721BuyOrder.cancelled == false) && (erc721BuyOrder.timePurchased == 0), "ERC721BuyOrder: Already processed");

        LibBuyOrder.cancelERC721BuyOrder(_buyOrderId);
    }

    function executeERC721BuyOrder(uint256 _buyOrderId) external {
        address sender = LibMeta.msgSender();
        ERC721BuyOrder memory erc721BuyOrder = s.erc721BuyOrders[_buyOrderId];

        require(erc721BuyOrder.timeCreated != 0, "ERC721BuyOrder: ERC721 buyOrder does not exist");
        require(sender == s.aavegotchis[erc721BuyOrder.erc721TokenId].owner, "ERC721BuyOrder: Only aavegotchi owner can call this function");
        require((erc721BuyOrder.cancelled == false) && (erc721BuyOrder.timePurchased == 0), "ERC721BuyOrder: Already processed");

        erc721BuyOrder.timePurchased = block.timestamp;

        uint256 _listingId = s.erc721TokenToListingId[erc721BuyOrder.erc721TokenAddress][erc721BuyOrder.erc721TokenId][sender];
        LibERC721Marketplace.removeERC721ListingItem(_listingId, sender);
        LibERC721Marketplace.addERC721ListingItem(sender, erc721BuyOrder.category, "purchased", _listingId);

        uint256 daoShare = erc721BuyOrder.priceInWei / 100;
        uint256 pixelCraftShare = (erc721BuyOrder.priceInWei * 2) / 100;
        //AGIP6 adds on 0.5%
        uint256 playerRewardsShare = erc721BuyOrder.priceInWei / 200;

        uint256 transferAmount = erc721BuyOrder.priceInWei - (daoShare + pixelCraftShare + playerRewardsShare);
        LibERC20.transfer(s.ghstContract, s.pixelCraft, pixelCraftShare);
        LibERC20.transfer(s.ghstContract, s.daoTreasury, daoShare);
        LibERC20.transfer(s.ghstContract, sender, transferAmount);
        //AGIP6 adds on 0.5%
        LibERC20.transfer((s.ghstContract), s.rarityFarming, playerRewardsShare);

        s.aavegotchis[erc721BuyOrder.erc721TokenId].locked = false;

        //To do (Nick) -- Explain why this is necessary
        if (erc721BuyOrder.erc721TokenAddress == address(this)) {
            LibAavegotchi.transfer(sender, erc721BuyOrder.buyer, erc721BuyOrder.erc721TokenId);
        } else {
            // GHSTStakingDiamond
            IERC721(erc721BuyOrder.erc721TokenAddress).safeTransferFrom(sender, erc721BuyOrder.buyer, erc721BuyOrder.erc721TokenId);
        }

        s.erc721BuyOrderHead[erc721BuyOrder.erc721TokenId] = 0;
        s.erc721BuyOrders[_buyOrderId].timePurchased = block.timestamp;

        emit ERC721BuyOrderExecuted(_buyOrderId, erc721BuyOrder.buyer, sender, erc721BuyOrder.erc721TokenAddress, erc721BuyOrder.erc721TokenId, erc721BuyOrder.category, erc721BuyOrder.priceInWei, block.timestamp);
    }
}
