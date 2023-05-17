// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {LibAavegotchi} from "../libraries/LibAavegotchi.sol";
import {LibBuyOrder} from "../libraries/LibBuyOrder.sol";
import {LibERC721Marketplace} from "../libraries/LibERC721Marketplace.sol";
import {LibERC20} from "../../shared/libraries/LibERC20.sol";
import {IERC20} from "../../shared/interfaces/IERC20.sol";
import {IERC721} from "../../shared/interfaces/IERC721.sol";
import {LibMeta} from "../../shared/libraries/LibMeta.sol";
import {LibGotchiLending} from "../libraries/LibGotchiLending.sol";
import {Modifiers, ERC721BuyOrder} from "../libraries/LibAppStorage.sol";
import {BaazaarSplit, LibSharedMarketplace, SplitAddresses} from "../libraries/LibSharedMarketplace.sol";

contract ERC721BuyOrderFacet is Modifiers {
    event ERC721BuyOrderAdd(
        uint256 indexed buyOrderId,
        address indexed buyer,
        address erc721TokenAddress,
        uint256 erc721TokenId,
        uint256 indexed category,
        uint256 priceInWei,
        bytes32 validationHash,
        uint256 time
    );

    event ERC721BuyOrderExecuted(
        uint256 indexed buyOrderId,
        address indexed buyer,
        address seller,
        address erc721TokenAddress,
        uint256 erc721TokenId,
        uint256 priceInWei,
        uint256 time
    );

    function getERC721BuyOrder(uint256 _buyOrderId) external view returns (ERC721BuyOrder memory buyOrder_) {
        buyOrder_ = s.erc721BuyOrders[_buyOrderId];
        require(buyOrder_.timeCreated != 0, "ERC721BuyOrder: ERC721 buyOrder does not exist");
    }

    function getERC721BuyOrderIdsByTokenId(
        address _erc721TokenAddress,
        uint256 _erc721TokenId
    ) external view returns (uint256[] memory buyOrderIds_) {
        buyOrderIds_ = s.erc721TokenToBuyOrderIds[_erc721TokenAddress][_erc721TokenId];
    }

    function getERC721BuyOrdersByTokenId(
        address _erc721TokenAddress,
        uint256 _erc721TokenId
    ) external view returns (ERC721BuyOrder[] memory buyOrders_) {
        uint256[] memory buyOrderIds = s.erc721TokenToBuyOrderIds[_erc721TokenAddress][_erc721TokenId];
        uint256 length = buyOrderIds.length;
        buyOrders_ = new ERC721BuyOrder[](length);
        for (uint256 i; i < length; i++) {
            buyOrders_[i] = s.erc721BuyOrders[buyOrderIds[i]];
        }
    }

    function placeERC721BuyOrder(
        address _erc721TokenAddress,
        uint256 _erc721TokenId,
        uint256 _priceInWei,
        bool[] calldata _validationOptions // 0: BRS, 1: GHST, 2: skill points
    ) external {
        require(_priceInWei >= 1e18, "ERC721BuyOrder: price should be 1 GHST or larger");

        address sender = LibMeta.msgSender();
        uint256 ghstBalance = IERC20(s.ghstContract).balanceOf(sender);
        require(ghstBalance >= _priceInWei, "ERC721BuyOrder: Not enough GHST!");

        uint256 category = LibAavegotchi.getERC721Category(_erc721TokenAddress, _erc721TokenId);
        require(category != LibAavegotchi.STATUS_VRF_PENDING, "ERC721BuyOrder: Cannot buy a portal that is pending VRF");
        require(sender != s.aavegotchis[_erc721TokenId].owner, "ERC721BuyOrder: Owner can't be buyer");
        if (category == LibAavegotchi.STATUS_AAVEGOTCHI) {
            require(_validationOptions.length == 3, "ERC721BuyOrder: Not enough validation options for aavegotchi");
        }

        uint256 oldBuyOrderId = s.buyerToBuyOrderId[_erc721TokenAddress][_erc721TokenId][sender];
        if (oldBuyOrderId != 0) {
            ERC721BuyOrder memory erc721BuyOrder = s.erc721BuyOrders[oldBuyOrderId];
            require(erc721BuyOrder.timeCreated != 0, "ERC721BuyOrder: ERC721 buyOrder does not exist");
            require((erc721BuyOrder.cancelled == false) && (erc721BuyOrder.timePurchased == 0), "ERC721BuyOrder: Already processed");

            LibBuyOrder.cancelERC721BuyOrder(oldBuyOrderId);
        }

        // Transfer GHST
        LibERC20.transferFrom(s.ghstContract, sender, address(this), _priceInWei);

        // Place new buy order
        s.nextERC721BuyOrderId++;
        uint256 buyOrderId = s.nextERC721BuyOrderId;

        s.erc721TokenToBuyOrderIdIndexes[_erc721TokenAddress][_erc721TokenId][buyOrderId] = s
        .erc721TokenToBuyOrderIds[_erc721TokenAddress][_erc721TokenId].length;
        s.erc721TokenToBuyOrderIds[_erc721TokenAddress][_erc721TokenId].push(buyOrderId);
        s.buyerToBuyOrderId[_erc721TokenAddress][_erc721TokenId][sender] = buyOrderId;

        bytes32 _validationHash = LibBuyOrder.generateValidationHash(_erc721TokenAddress, _erc721TokenId, _validationOptions);
        s.erc721BuyOrders[buyOrderId] = ERC721BuyOrder({
            buyOrderId: buyOrderId,
            buyer: sender,
            erc721TokenAddress: _erc721TokenAddress,
            erc721TokenId: _erc721TokenId,
            priceInWei: _priceInWei,
            validationHash: _validationHash,
            timeCreated: block.timestamp,
            timePurchased: 0,
            cancelled: false,
            validationOptions: _validationOptions
        });
        emit ERC721BuyOrderAdd(buyOrderId, sender, _erc721TokenAddress, _erc721TokenId, category, _priceInWei, _validationHash, block.timestamp);
    }

    function cancelERC721BuyOrder(uint256 _buyOrderId) external {
        address sender = LibMeta.msgSender();
        ERC721BuyOrder memory erc721BuyOrder = s.erc721BuyOrders[_buyOrderId];

        require(erc721BuyOrder.timeCreated != 0, "ERC721BuyOrder: ERC721 buyOrder does not exist");
        require(
            (sender == s.aavegotchis[erc721BuyOrder.erc721TokenId].owner) || (sender == erc721BuyOrder.buyer),
            "ERC721BuyOrder: Only aavegotchi owner or buyer can call this function"
        );
        require((erc721BuyOrder.cancelled == false) && (erc721BuyOrder.timePurchased == 0), "ERC721BuyOrder: Already processed");

        LibBuyOrder.cancelERC721BuyOrder(_buyOrderId);
    }

    function executeERC721BuyOrder(uint256 _buyOrderId) external {
        address sender = LibMeta.msgSender();
        ERC721BuyOrder memory erc721BuyOrder = s.erc721BuyOrders[_buyOrderId];

        require(erc721BuyOrder.timeCreated != 0, "ERC721BuyOrder: ERC721 buyOrder does not exist");
        require(sender == s.aavegotchis[erc721BuyOrder.erc721TokenId].owner, "ERC721BuyOrder: Only aavegotchi owner can call this function");
        require((erc721BuyOrder.cancelled == false) && (erc721BuyOrder.timePurchased == 0), "ERC721BuyOrder: Already processed");

        // disable for gotchi in lending
        uint256 category = LibAavegotchi.getERC721Category(erc721BuyOrder.erc721TokenAddress, erc721BuyOrder.erc721TokenId);
        if (category == LibAavegotchi.STATUS_AAVEGOTCHI) {
            require(
                !LibGotchiLending.isAavegotchiLent(uint32(erc721BuyOrder.erc721TokenId)),
                "ERC721BuyOrder: Not supported for aavegotchi in lending"
            );
        }

        // hash validation
        require(
            erc721BuyOrder.validationHash ==
                LibBuyOrder.generateValidationHash(erc721BuyOrder.erc721TokenAddress, erc721BuyOrder.erc721TokenId, erc721BuyOrder.validationOptions),
            "ERC721BuyOrder: Invalid buy order"
        );

        erc721BuyOrder.timePurchased = block.timestamp;

        BaazaarSplit memory split = LibSharedMarketplace.getBaazaarSplit(erc721BuyOrder.priceInWei, new uint256[](0), [10000, 0]);

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

        s.aavegotchis[erc721BuyOrder.erc721TokenId].locked = false;

        if (erc721BuyOrder.erc721TokenAddress == address(this)) {
            LibAavegotchi.transfer(sender, erc721BuyOrder.buyer, erc721BuyOrder.erc721TokenId);
            LibERC721Marketplace.updateERC721Listing(address(this), erc721BuyOrder.erc721TokenId, sender);
        } else {
            IERC721(erc721BuyOrder.erc721TokenAddress).safeTransferFrom(sender, erc721BuyOrder.buyer, erc721BuyOrder.erc721TokenId);
        }

        LibBuyOrder.removeERC721BuyOrder(_buyOrderId);
        s.erc721BuyOrders[_buyOrderId].timePurchased = block.timestamp;

        emit ERC721BuyOrderExecuted(
            _buyOrderId,
            erc721BuyOrder.buyer,
            sender,
            erc721BuyOrder.erc721TokenAddress,
            erc721BuyOrder.erc721TokenId,
            erc721BuyOrder.priceInWei,
            block.timestamp
        );
    }
}
