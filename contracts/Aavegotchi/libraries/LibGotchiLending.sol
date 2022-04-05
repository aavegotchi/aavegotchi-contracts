// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {LibAppStorage, AppStorage, GotchiLending, LendingListItem} from "./LibAppStorage.sol";
import "../../shared/interfaces/IERC721.sol";
import {LibERC20} from "../../shared/libraries/LibERC20.sol";
import {IERC20} from "../../shared/interfaces/IERC20.sol";
import {CollateralEscrow} from "../CollateralEscrow.sol";
import {LibAavegotchi} from "./LibAavegotchi.sol";

library LibGotchiLending {
    event GotchiLendingAdd(uint32 indexed listingId);
    event GotchiLendingExecute(uint32 indexed listingId);
    event GotchiLendingCancel(uint32 indexed listingId, uint256 time);
    event GotchiLendingClaim(uint32 indexed listingId, address[] tokenAddresses, uint256[] amounts);
    event GotchiLendingEnd(uint32 indexed listingId);

    function getListing(uint32 _listingId) internal view returns (GotchiLending memory listing_) {
        AppStorage storage s = LibAppStorage.diamondStorage();
        listing_ = s.gotchiLendings[_listingId];
        require(listing_.timeCreated != 0, "GotchiLending: Listing does not exist");
    }

    function whitelistExists(uint32 _whitelistId) internal view returns (bool) {
        AppStorage storage s = LibAppStorage.diamondStorage();
        return s.whitelists.length >= _whitelistId;
    }

    function tokenIdToListingId(uint32 _tokenId) internal view returns (uint32 listingId) {
        AppStorage storage s = LibAppStorage.diamondStorage();
        listingId = s.aavegotchiToListingId[_tokenId];
        require(listingId != 0, "GotchiLending: Listing not found");
    }

    function verifyGotchiLendingParams(
        uint32 _erc721TokenId,
        uint32 _period,
        uint8[3] calldata _revenueSplit,
        address _originalOwner,
        address _thirdParty,
        uint32 _whitelistId,
        address[] calldata _revenueTokens
    ) internal view {
        AppStorage storage s = LibAppStorage.diamondStorage();
        require(_originalOwner != address(0), "GotchiLending: Original owner cannot be zero address");
        require(checkPeriod(_period), "GotchiLending: Period is not valid");
        require(checkRevenueParams(_revenueSplit, _revenueTokens, _thirdParty), "GotchiLending: Revenue parameters are not valid");
        require(whitelistExists(_whitelistId) || (_whitelistId == 0), "GotchiLending: Whitelist not found");
        require(s.aavegotchis[_erc721TokenId].status == LibAavegotchi.STATUS_AAVEGOTCHI, "GotchiLending: Can only lend Aavegotchi");
        require(!s.aavegotchis[_erc721TokenId].locked, "GotchiLending: Only callable on unlocked Aavegotchis");
    }

    function verifyGotchiLendingAgreeParams(
        address _borrower,
        uint32 _listingId,
        uint32 _erc721TokenId,
        uint96 _initialCost,
        uint32 _period,
        uint8[3] calldata _revenueSplit
    ) internal view {
        AppStorage storage s = LibAppStorage.diamondStorage();
        GotchiLending storage lending = s.gotchiLendings[_listingId];
        require(lending.timeCreated != 0, "GotchiLending: Listing not found");
        require(lending.timeAgreed == 0, "GotchiLending: Listing already agreed");
        require(lending.canceled == false, "GotchiLending: Listing canceled");
        require(lending.erc721TokenId == _erc721TokenId, "GotchiLending: Invalid token id");
        require(lending.initialCost == _initialCost, "GotchiLending: Invalid initial cost");
        require(lending.period == _period, "GotchiLending: Invalid lending period");
        for (uint256 i; i < 3; i++) {
            require(lending.revenueSplit[i] == _revenueSplit[i], "GotchiLending: Invalid revenue split");
        }
        require(lending.lender != _borrower, "GotchiLending: Borrower can't be lender");
        if (lending.whitelistId > 0) {
            require(s.isWhitelisted[lending.whitelistId][_borrower] > 0, "GotchiLending: Not whitelisted address");
        }
        // Removed balance check for GHST since this will revert anyway if transferFrom is called
        //require(IERC20(s.ghstContract).balanceOf(_borrower) >= lending.initialCost, "GotchiLending: Not enough GHST");
    }

    function _addGotchiLending(
        address _lender,
        uint32 _erc721TokenId,
        uint96 _initialCost,
        uint32 _period,
        uint8[3] calldata _revenueSplit,
        address _originalOwner,
        address _thirdParty,
        uint32 _whitelistId,
        address[] calldata _revenueTokens
    ) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();
        verifyGotchiLendingParams(_erc721TokenId, _period, _revenueSplit, _originalOwner, _thirdParty, _whitelistId, _revenueTokens);
        uint32 oldListingId = s.aavegotchiToListingId[_erc721TokenId];
        if (oldListingId != 0) {
            cancelGotchiLending(oldListingId, _lender);
        }
        uint32 listingId = ++s.nextGotchiListingId; //assigned value after incrementing

        s.aavegotchiToListingId[_erc721TokenId] = listingId;
        s.gotchiLendings[listingId] = GotchiLending({
            listingId: listingId,
            initialCost: _initialCost,
            period: _period,
            revenueSplit: _revenueSplit,
            lender: _lender,
            borrower: address(0),
            originalOwner: _originalOwner,
            thirdParty: _thirdParty,
            erc721TokenId: _erc721TokenId,
            whitelistId: _whitelistId,
            revenueTokens: _revenueTokens,
            timeCreated: uint40(block.timestamp),
            timeAgreed: 0,
            lastClaimed: 0,
            canceled: false,
            completed: false
        });
        addLendingListItem(_lender, listingId, "listed");
        s.aavegotchis[_erc721TokenId].locked = true;

        emit GotchiLendingAdd(listingId);
    }

    function _agreeGotchiLending(
        address _borrower,
        uint32 _listingId,
        uint32 _erc721TokenId,
        uint96 _initialCost,
        uint32 _period,
        uint8[3] calldata _revenueSplit
    ) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();
        GotchiLending storage lending = s.gotchiLendings[_listingId];
        verifyGotchiLendingAgreeParams(_borrower, _listingId, _erc721TokenId, _initialCost, _period, _revenueSplit);

        // gas savings
        address lender = lending.lender;

        if (lending.initialCost > 0) {
            LibERC20.transferFrom(s.ghstContract, _borrower, lender, _initialCost);
        }
        lending.borrower = _borrower;
        lending.timeAgreed = uint40(block.timestamp);

        removeLendingListItem(lender, _listingId, "listed");
        addLendingListItem(lender, _listingId, "agreed");

        s.lentTokenIdIndexes[lender][_erc721TokenId] = uint32(s.lentTokenIds[lender].length);
        s.lentTokenIds[lender].push(_erc721TokenId);

        LibAavegotchi.transfer(lender, _borrower, _erc721TokenId);

        // set lender as pet operator
        s.petOperators[_borrower][lender] = true;

        emit GotchiLendingExecute(_listingId);
    }

    function cancelGotchiLending(uint32 _listingId, address _lender) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();

        GotchiLending storage lending = s.gotchiLendings[_listingId];
        require(lending.timeCreated != 0, "GotchiLending: Listing not found");
        if (lending.canceled) {
            return;
        }
        require(lending.timeAgreed == 0, "GotchiLending: Listing already agreed");
        require(lending.lender == _lender, "GotchiLending: Not lender");
        lending.canceled = true;

        removeLendingListItem(_lender, _listingId, "listed");

        //Unlock Aavegotchis when lending is created
        s.aavegotchis[lending.erc721TokenId].locked = false;
        s.aavegotchiToListingId[lending.erc721TokenId] = 0;

        emit GotchiLendingCancel(_listingId, block.number);
    }

    function cancelGotchiLendingFromToken(uint32 _erc721TokenId, address _lender) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();
        cancelGotchiLending(s.aavegotchiToListingId[_erc721TokenId], _lender);
    }

    function claimGotchiLending(uint32 listingId) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();
        GotchiLending storage lending = s.gotchiLendings[listingId];

        uint256[] memory amounts = new uint256[](lending.revenueTokens.length);
        address escrow = s.aavegotchis[lending.erc721TokenId].escrow;

        require(escrow != address(0), "LibGotchiLending: Escrow is zero address");

        address collateralType = s.aavegotchis[lending.erc721TokenId].collateralType;
        for (uint256 i; i < lending.revenueTokens.length; i++) {
            address revenueToken = lending.revenueTokens[i];
            uint256 balance = IERC20(revenueToken).balanceOf(escrow);

            if (collateralType == revenueToken || balance == 0) {
                amounts[i] = 0; //gotchi collateral can never be a revenue token
            } else {
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
        }

        lending.lastClaimed = uint40(block.timestamp);

        emit GotchiLendingClaim(listingId, lending.revenueTokens, amounts);
    }

    /// @dev Checks should be done before calling this function
    function endGotchiLending(GotchiLending storage lending) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();

        uint32 tokenId = lending.erc721TokenId;
        address lender = lending.lender;
        address borrower = lending.borrower;

        s.aavegotchis[tokenId].locked = false;
        LibAavegotchi.transfer(borrower, lender, tokenId);
        lending.completed = true;
        s.aavegotchiToListingId[tokenId] = 0;

        removeLentAavegotchi(tokenId, lender);
        removeLendingListItem(lender, lending.listingId, "agreed");

        emit GotchiLendingEnd(tokenId);
    }

    function removeLentAavegotchi(uint32 _tokenId, address _lender) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();

        // Remove indexed data for lender
        uint32 index = s.lentTokenIdIndexes[_lender][_tokenId];
        uint32 lastIndex = uint32(s.lentTokenIds[_lender].length - 1);
        if (index != lastIndex) {
            uint32 lastTokenId = s.lentTokenIds[_lender][lastIndex];
            s.lentTokenIds[_lender][index] = lastTokenId;
            s.lentTokenIdIndexes[_lender][lastTokenId] = index;
        }
        s.lentTokenIds[_lender].pop();
        delete s.lentTokenIdIndexes[_lender][_tokenId];
    }

    function enforceAavegotchiNotInLending(uint32 _tokenId, address _sender) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();
        uint32 _listingId = s.aavegotchiToListingId[_tokenId];
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

    function isAavegotchiLent(uint32 _tokenId) internal view returns (bool) {
        AppStorage storage s = LibAppStorage.diamondStorage();
        uint32 listingId = s.aavegotchiToListingId[_tokenId];
        if (listingId == 0) return false;
        GotchiLending storage listing_ = s.gotchiLendings[listingId];
        if (listing_.timeCreated == 0 || listing_.timeAgreed == 0) return false;
        return listing_.completed == false;
    }

    function checkPeriod(uint32 _period) internal pure returns (bool) {
        return _period > 0 && _period <= 2_592_000; //No reason to have a period longer than 30 days
    }

    function checkRevenueParams(
        uint8[3] calldata _revenueSplit,
        address[] calldata _revenueTokens,
        address _thirdParty
    ) internal view returns (bool) {
        AppStorage storage s = LibAppStorage.diamondStorage();
        if (_revenueSplit[0] + _revenueSplit[1] + _revenueSplit[2] != 100) return false;
        for (uint256 i = 0; i < _revenueTokens.length; ) {
            if (!s.revenueTokenAllowed[_revenueTokens[i]]) return false;
            unchecked {
                ++i;
            }
        }
        if (_thirdParty == address(0)) {
            if (_revenueSplit[2] != 0) return false;
        }
        if (_revenueTokens.length > 10) return false; //Prevent claimAndEnd from reverting due to Out of Gas

        return true;
    }

    function addLendingListItem(
        address _lender,
        uint32 _listingId,
        bytes32 _status
    ) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();

        uint32 headListingId = s.aavegotchiLenderLendingHead[_lender][_status];
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
        uint32 _listingId,
        bytes32 _status
    ) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();

        LendingListItem storage lendingItem = s.gotchiLendingListItem[_status][_listingId];
        if (lendingItem.listingId == 0) {
            return;
        }
        uint32 parentListingId = lendingItem.parentListingId;
        if (parentListingId != 0) {
            LendingListItem storage parentLendingItem = s.gotchiLendingListItem[_status][parentListingId];
            parentLendingItem.childListingId = lendingItem.childListingId;
        }
        uint32 childListingId = lendingItem.childListingId;
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
