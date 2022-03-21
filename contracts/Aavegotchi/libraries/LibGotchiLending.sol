// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {LibAppStorage, AppStorage, GotchiLending, LendingListItem} from "./LibAppStorage.sol";
import "../../shared/interfaces/IERC721.sol";
import {LibERC20} from "../../shared/libraries/LibERC20.sol";
import {IERC20} from "../../shared/interfaces/IERC20.sol";
import {CollateralEscrow} from "../CollateralEscrow.sol";

library LibGotchiLending {
    event GotchiLendingCancel(uint256 indexed listingId, uint256 time);

    function cancelGotchiLending(uint256 _listingId, address _lender) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();

        GotchiLending storage lending = s.gotchiLendings[_listingId];
        require(lending.timeCreated != 0, "GotchiLending: lending not found");
        if (lending.canceled) {
            return;
        }
        require(lending.timeAgreed == 0, "GotchiLending: lending already agreed");
        require(lending.lender == _lender, "GotchiLending: not lender");
        lending.canceled = true;

        removeLendingListItem(_lender, _listingId, "listed");

        //Unlock Aavegotchis when lending is created
        s.aavegotchis[lending.erc721TokenId].locked = false;
        s.aavegotchiToListingId[lending.erc721TokenId] = 0;

        emit GotchiLendingCancel(_listingId, block.number);
    }

    function cancelGotchiLendingFromToken(uint256 _erc721TokenId, address _lender) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();
        cancelGotchiLending(s.aavegotchiToListingId[_erc721TokenId], _lender);
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

    function claimGotchiLending(uint256 listingId, address[] calldata _revenueTokens) internal returns (uint256[] memory) {
        AppStorage storage s = LibAppStorage.diamondStorage();
        GotchiLending storage lending = s.gotchiLendings[listingId];

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
        uint256 _listingId = s.aavegotchiToListingId[_tokenId];
        if (_listingId > 0) {
            GotchiLending storage _lending = s.gotchiLendings[_listingId];
            require(_lending.lender == _sender, "GotchiLending: Aavegotchi is in lending");
            if (_lending.timeAgreed > 0) {
                // revert if agreed lending
                revert("GotchiLending: Aavegotchi is in lending");
            } else {
                // cancel if not agreed lending
                cancelGotchiLending(_listingId, _sender);
            }
        }
    }

    function isAavegotchiLent(uint256 _tokenId) internal view returns (bool) {
        AppStorage storage s = LibAppStorage.diamondStorage();
        uint256 listingId = s.aavegotchiToListingId[_tokenId];
        if (listingId == 0) return false;
        GotchiLending storage listing_ = s.gotchiLendings[listingId];
        if (listing_.timeCreated == 0 || listing_.timeAgreed == 0) return false;
        return listing_.completed == false;
    }

    function addLendingListItem(
        address _lender,
        uint256 _listingId,
        bytes32 _status
    ) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();

        uint256 headListingId = s.aavegotchiLenderLendingHead[_lender][_status];
        if (headListingId != 0) {
            LendingListItem storage headLendingItem = s.aavegotchiLenderLendingListItem[_status][headListingId];
            headLendingItem.parentListingId = _listingId;
        }
        LendingListItem storage lendingItem = s.aavegotchiLenderLendingListItem[_status][_listingId];
        lendingItem.childListingId = headListingId;
        s.aavegotchiLenderLendingHead[_lender][_status] = _listingId;
        lendingItem.listingId = _listingId;

        headListingId = s.gotchiLendingHead[_status];
        if (headListingId != 0) {
            LendingListItem storage headLendingItem = s.gotchiLendingListItem[_status][headListingId];
            headLendingItem.parentListingId = _listingId;
        }
        lendingItem = s.gotchiLendingListItem[_status][_listingId];
        lendingItem.childListingId = headListingId;
        s.gotchiLendingHead[_status] = _listingId;
        lendingItem.listingId = _listingId;
    }

    function removeLendingListItem(
        address _lender,
        uint256 _listingId,
        bytes32 _status
    ) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();

        LendingListItem storage lendingItem = s.gotchiLendingListItem[_status][_listingId];
        if (lendingItem.listingId == 0) {
            return;
        }
        uint256 parentListingId = lendingItem.parentListingId;
        if (parentListingId != 0) {
            LendingListItem storage parentLendingItem = s.gotchiLendingListItem[_status][parentListingId];
            parentLendingItem.childListingId = lendingItem.childListingId;
        }
        uint256 childListingId = lendingItem.childListingId;
        if (childListingId != 0) {
            LendingListItem storage childLendingItem = s.gotchiLendingListItem[_status][childListingId];
            childLendingItem.parentListingId = lendingItem.parentListingId;
        }

        if (s.gotchiLendingHead[_status] == _listingId) {
            s.gotchiLendingHead[_status] = lendingItem.childListingId;
        }
        lendingItem.listingId = 0;
        lendingItem.parentListingId = 0;
        lendingItem.childListingId = 0;

        lendingItem = s.aavegotchiLenderLendingListItem[_status][_listingId];
        parentListingId = lendingItem.parentListingId;
        if (parentListingId != 0) {
            LendingListItem storage parentLendingItem = s.aavegotchiLenderLendingListItem[_status][parentListingId];
            parentLendingItem.childListingId = lendingItem.childListingId;
        }
        childListingId = lendingItem.childListingId;
        if (childListingId != 0) {
            LendingListItem storage childLendingItem = s.aavegotchiLenderLendingListItem[_status][childListingId];
            childLendingItem.parentListingId = lendingItem.parentListingId;
        }

        if (s.aavegotchiLenderLendingHead[_lender][_status] == _listingId) {
            s.aavegotchiLenderLendingHead[_lender][_status] = lendingItem.childListingId;
        }
        lendingItem.listingId = 0;
        lendingItem.parentListingId = 0;
        lendingItem.childListingId = 0;
    }
}
