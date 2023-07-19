// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {LibAppStorage, AppStorage, ERC721BuyOrder} from "./LibAppStorage.sol";
import {LibERC20} from "../../shared/libraries/LibERC20.sol";
import {LibAavegotchi} from "./LibAavegotchi.sol";
import {LibSharedMarketplace} from "./LibSharedMarketplace.sol";
import {IERC20} from "../../shared/interfaces/IERC20.sol";

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
        address _tokenAddress = erc721BuyOrder.erc721TokenAddress;

        uint256 index = s.erc721TokenToBuyOrderIdIndexes[_tokenAddress][_tokenId][_buyOrderId];
        uint256 lastIndex = s.erc721TokenToBuyOrderIds[_tokenAddress][_tokenId].length - 1;
        if (index != lastIndex) {
            uint256 lastBuyOrderId = s.erc721TokenToBuyOrderIds[_tokenAddress][_tokenId][lastIndex];
            s.erc721TokenToBuyOrderIds[_tokenAddress][_tokenId][index] = lastBuyOrderId;
            s.erc721TokenToBuyOrderIdIndexes[_tokenAddress][_tokenId][lastBuyOrderId] = index;
        }
        s.erc721TokenToBuyOrderIds[_tokenAddress][_tokenId].pop();
        delete s.erc721TokenToBuyOrderIdIndexes[_tokenAddress][_tokenId][_buyOrderId];

        delete s.buyerToBuyOrderId[_tokenAddress][_tokenId][erc721BuyOrder.buyer];
    }

    function generateValidationHash(
        address _erc721TokenAddress,
        uint256 _erc721TokenId,
        bool[] memory _validationOptions
    ) internal view returns (bytes32) {
        AppStorage storage s = LibAppStorage.diamondStorage();

        //Category is always validated
        uint256 category = LibSharedMarketplace.getERC721Category(_erc721TokenAddress, _erc721TokenId);
        bytes memory _params = abi.encode(_erc721TokenId, category);
        if (category == LibAavegotchi.STATUS_AAVEGOTCHI) {
            // Aavegotchi
            _params = abi.encode(_params, s.aavegotchis[_erc721TokenId].equippedWearables);
            if (_validationOptions[0]) {
                // BRS
                _params = abi.encode(_params, LibAavegotchi.baseRarityScore(s.aavegotchis[_erc721TokenId].numericTraits));
            }
            if (_validationOptions[1]) {
                // GHST
                _params = abi.encode(_params, IERC20(s.ghstContract).balanceOf(s.aavegotchis[_erc721TokenId].escrow));
            }
            if (_validationOptions[2]) {
                // skill points
                _params = abi.encode(_params, s.aavegotchis[_erc721TokenId].usedSkillPoints);
            }
        }
        return keccak256(_params);
    }
}
