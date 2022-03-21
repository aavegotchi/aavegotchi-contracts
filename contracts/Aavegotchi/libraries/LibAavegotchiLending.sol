// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {LibAppStorage, AppStorage, AavegotchiLending, LendingListItem} from "./LibAppStorage.sol";
import "../../shared/interfaces/IERC721.sol";
import {LibERC20} from "../../shared/libraries/LibERC20.sol";
import {IERC20} from "../../shared/interfaces/IERC20.sol";
import {CollateralEscrow} from "../CollateralEscrow.sol";

library LibAavegotchiLending {
    event AavegotchiLendingCancel(uint256 indexed lendingId, uint256 time);

    function cancelAavegotchiLending(uint256 _lendingId, address _lender) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();

        AavegotchiLending storage lending = s.aavegotchiLendings[_lendingId];
        require(lending.timeCreated != 0, "AavegotchiLending: lending not found");
        if (lending.canceled) {
            return;
        }
        require(lending.timeAgreed == 0, "AavegotchiLending: lending already agreed");
        require(lending.lender == _lender, "AavegotchiLending: not lender");
        lending.canceled = true;

        removeLendingListItem(_lender, _lendingId, "listed");

        //Unlock Aavegotchis when lending is created
        s.aavegotchis[lending.erc721TokenId].locked = false;
        s.aavegotchiToLendingId[lending.erc721TokenId] = 0;

        emit AavegotchiLendingCancel(_lendingId, block.number);
    }

    function cancelAavegotchiLendingFromToken(uint256 _erc721TokenId, address _lender) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();
        cancelAavegotchiLending(s.aavegotchiToLendingId[_erc721TokenId], _lender);
    }

    function removeLentAavegotchi(uint256 _tokenId, address _lender) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();

        // Remove indexed data for lender
        uint256 index = s.lentTokenIdIndexes[_lender][_tokenId];
        uint256 lastIndex = s.lentTokenIds[_lender].length - 1;
        if (index != lastIndex) {
            uint256 lastTokenId = s.lentTokenIds[_lender][lastIndex];
            s.lentTokenIds[_lender][index] = lastTokenId;
            s.lentTokenIdIndexes[_lender][lastTokenId] = index;
        }
        s.lentTokenIds[_lender].pop();
        delete s.lentTokenIdIndexes[_lender][_tokenId];
    }

    function claimAavegotchiLending(uint256 lendingId, address[] calldata _revenueTokens) internal returns (uint256[] memory) {
        AppStorage storage s = LibAppStorage.diamondStorage();
        AavegotchiLending storage lending = s.aavegotchiLendings[lendingId];

        uint256[] memory amounts = new uint256[](_revenueTokens.length);
        uint256 tokenId = lending.erc721TokenId;
        address escrow = s.aavegotchis[tokenId].escrow;
        if (escrow == address(0)) return amounts;
        address collateralType = s.aavegotchis[tokenId].collateralType;
        for (uint256 i; i < _revenueTokens.length; i++) {
            address revenueToken = _revenueTokens[i];
            if (collateralType == revenueToken) continue;

            bool isIncluded;
            for (uint256 j; j < lending.includeList.length; j++) {
                if (lending.includeList[j] == revenueToken) {
                    isIncluded = true;
                    break;
                }
            }
            if (!isIncluded) continue;

            uint256 balance = IERC20(revenueToken).balanceOf(escrow);
            if (balance == 0) continue;
            amounts[i] = balance;

            if (IERC20(revenueToken).allowance(escrow, address(this)) < balance) {
                CollateralEscrow(escrow).approveAavegotchiDiamond(revenueToken);
            }

            uint256 ownerAmount = (balance * lending.revenueSplit[0]) / 100;
            uint256 borrowerAmount = (balance * lending.revenueSplit[1]) / 100;
            address owner = lending.originalOwner == address(0) ? lending.lender : lending.originalOwner;
            LibERC20.transferFrom(revenueToken, escrow, owner, ownerAmount);
            LibERC20.transferFrom(revenueToken, escrow, lending.borrower, borrowerAmount);
            if (lending.thirdParty != address(0)) {
                uint256 thirdPartyAmount = (balance * lending.revenueSplit[2]) / 100;
                LibERC20.transferFrom(revenueToken, escrow, lending.thirdParty, thirdPartyAmount);
            }
        }

        lending.lastClaimed = block.timestamp;

        return amounts;
    }

    function enforceAavegotchiNotInLending(uint256 _tokenId, address _sender) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();
        uint256 _lendingId = s.aavegotchiToLendingId[_tokenId];
        if (_lendingId > 0) {
            AavegotchiLending storage _lending = s.aavegotchiLendings[_lendingId];
            require(_lending.lender == _sender, "AavegotchiLending: Aavegotchi is in lending");
            if (_lending.timeAgreed > 0) {
                // revert if agreed lending
                revert("AavegotchiLending: Aavegotchi is in lending");
            } else {
                // cancel if not agreed lending
                cancelAavegotchiLending(_lendingId, _sender);
            }
        }
    }

    function isAavegotchiLent(uint256 _tokenId) internal view returns (bool) {
        AppStorage storage s = LibAppStorage.diamondStorage();
        uint256 lendingId = s.aavegotchiToLendingId[_tokenId];
        if (lendingId == 0) return false;
        AavegotchiLending storage lending_ = s.aavegotchiLendings[lendingId];
        if (lending_.timeCreated == 0 || lending_.timeAgreed == 0) return false;
        return lending_.completed == false;
    }

    function addLendingListItem(
        address _lender,
        uint256 _lendingId,
        bytes32 _status
    ) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();

        uint256 headLendingId = s.aavegotchiLenderLendingHead[_lender][_status];
        if (headLendingId != 0) {
            LendingListItem storage headLendingItem = s.aavegotchiLenderLendingListItem[_status][headLendingId];
            headLendingItem.parentLendingId = _lendingId;
        }
        LendingListItem storage lendingItem = s.aavegotchiLenderLendingListItem[_status][_lendingId];
        lendingItem.childLendingId = headLendingId;
        s.aavegotchiLenderLendingHead[_lender][_status] = _lendingId;
        lendingItem.lendingId = _lendingId;

        headLendingId = s.aavegotchiLendingHead[_status];
        if (headLendingId != 0) {
            LendingListItem storage headLendingItem = s.aavegotchiLendingListItem[_status][headLendingId];
            headLendingItem.parentLendingId = _lendingId;
        }
        lendingItem = s.aavegotchiLendingListItem[_status][_lendingId];
        lendingItem.childLendingId = headLendingId;
        s.aavegotchiLendingHead[_status] = _lendingId;
        lendingItem.lendingId = _lendingId;
    }

    function removeLendingListItem(
        address _lender,
        uint256 _lendingId,
        bytes32 _status
    ) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();

        LendingListItem storage lendingItem = s.aavegotchiLendingListItem[_status][_lendingId];
        if (lendingItem.lendingId == 0) {
            return;
        }
        uint256 parentLendingId = lendingItem.parentLendingId;
        if (parentLendingId != 0) {
            LendingListItem storage parentLendingItem = s.aavegotchiLendingListItem[_status][parentLendingId];
            parentLendingItem.childLendingId = lendingItem.childLendingId;
        }
        uint256 childLendingId = lendingItem.childLendingId;
        if (childLendingId != 0) {
            LendingListItem storage childLendingItem = s.aavegotchiLendingListItem[_status][childLendingId];
            childLendingItem.parentLendingId = lendingItem.parentLendingId;
        }

        if (s.aavegotchiLendingHead[_status] == _lendingId) {
            s.aavegotchiLendingHead[_status] = lendingItem.childLendingId;
        }
        lendingItem.lendingId = 0;
        lendingItem.parentLendingId = 0;
        lendingItem.childLendingId = 0;

        lendingItem = s.aavegotchiLenderLendingListItem[_status][_lendingId];
        parentLendingId = lendingItem.parentLendingId;
        if (parentLendingId != 0) {
            LendingListItem storage parentLendingItem = s.aavegotchiLenderLendingListItem[_status][parentLendingId];
            parentLendingItem.childLendingId = lendingItem.childLendingId;
        }
        childLendingId = lendingItem.childLendingId;
        if (childLendingId != 0) {
            LendingListItem storage childLendingItem = s.aavegotchiLenderLendingListItem[_status][childLendingId];
            childLendingItem.parentLendingId = lendingItem.parentLendingId;
        }

        if (s.aavegotchiLenderLendingHead[_lender][_status] == _lendingId) {
            s.aavegotchiLenderLendingHead[_lender][_status] = lendingItem.childLendingId;
        }
        lendingItem.lendingId = 0;
        lendingItem.parentLendingId = 0;
        lendingItem.childLendingId = 0;
    }
}
