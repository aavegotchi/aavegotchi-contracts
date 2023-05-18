// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {LibAppStorage, AppStorage, GotchiLending, LendingListItem} from "./LibAppStorage.sol";
import "../../shared/interfaces/IERC721.sol";
import {LibERC20} from "../../shared/libraries/LibERC20.sol";
import {IERC20} from "../../shared/interfaces/IERC20.sol";
import {CollateralEscrow} from "../CollateralEscrow.sol";
import {LibAavegotchi} from "./LibAavegotchi.sol";
import {LibWhitelist} from "./LibWhitelist.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {IRealmDiamond} from "../../shared/interfaces/IRealmDiamond.sol";

import {LibMeta} from "../../shared/libraries/LibMeta.sol";

library LibEventStructContainers {
    struct GotchiLendingAdd {
        uint32 listingId;
        address lender;
        uint32 tokenId;
        uint96 initialCost;
        uint32 period;
        uint8[3] revenueSplit;
        address originalOwner;
        address thirdParty;
        uint32 whitelistId;
        address[] revenueTokens;
        uint256 timeCreated;
        uint256 permissions;
    }

    struct GotchiLendingExecution {
        uint32 listingId;
        address lender;
        address borrower;
        uint32 tokenId;
        uint96 initialCost;
        uint32 period;
        uint8[3] revenueSplit;
        address originalOwner;
        address thirdParty;
        uint32 whitelistId;
        address[] revenueTokens;
        uint256 timeAgreed;
        uint256 permissions;
    }

    struct GotchiLendingCancellation {
        uint32 listingId;
        address lender;
        uint32 tokenId;
        uint96 initialCost;
        uint32 period;
        uint8[3] revenueSplit;
        address originalOwner;
        address thirdParty;
        uint32 whitelistId;
        address[] revenueTokens;
        uint256 timeCancelled;
        uint256 permissions;
    }

    struct GotchiLendingClaim {
        uint32 listingId;
        address lender;
        address borrower;
        uint32 tokenId;
        uint96 initialCost;
        uint32 period;
        uint8[3] revenueSplit;
        address originalOwner;
        address thirdParty;
        uint32 whitelistId;
        address[] revenueTokens;
        uint256[] amounts;
        uint256 timeClaimed;
        uint256 permissions;
    }

    struct GotchiLendingEnd {
        uint32 listingId;
        address lender;
        address borrower;
        uint32 tokenId;
        uint96 initialCost;
        uint32 period;
        uint8[3] revenueSplit;
        address originalOwner;
        address thirdParty;
        uint32 whitelistId;
        address[] revenueTokens;
        uint256 timeEnded;
        uint256 permissions;
    }
}

library LibGotchiLending {
    using EnumerableSet for EnumerableSet.UintSet;

    event GotchiLendingAdd(uint32 indexed listingId);
    event GotchiLendingExecute(uint32 indexed listingId);
    event GotchiLendingCancel(uint32 indexed listingId, uint256 time);
    event GotchiLendingClaim(uint32 indexed listingId, address[] tokenAddresses, uint256[] amounts);
    event GotchiLendingEnd(uint32 indexed listingId);

    event GotchiLendingAdded(LibEventStructContainers.GotchiLendingAdd);
    event GotchiLendingExecuted(LibEventStructContainers.GotchiLendingExecution);
    event GotchiLendingCancelled(LibEventStructContainers.GotchiLendingCancellation);
    event GotchiLendingClaimed(LibEventStructContainers.GotchiLendingClaim);
    event GotchiLendingEnded(LibEventStructContainers.GotchiLendingEnd);

    function getListing(uint32 _listingId) internal view returns (GotchiLending memory listing_) {
        AppStorage storage s = LibAppStorage.diamondStorage();
        listing_ = s.gotchiLendings[_listingId];
        require(listing_.timeCreated != 0, "LibGotchiLending: Listing does not exist");
    }

    function whitelistExists(uint32 _whitelistId) internal view returns (bool) {
        AppStorage storage s = LibAppStorage.diamondStorage();
        return s.whitelists.length >= _whitelistId;
    }

    function tokenIdToListingId(uint32 _tokenId) internal view returns (uint32 listingId) {
        AppStorage storage s = LibAppStorage.diamondStorage();
        listingId = s.aavegotchiToListingId[_tokenId];
        require(listingId != 0, "LibGotchiLending: Listing not found");
    }

    struct LibAddGotchiLending {
        address lender;
        uint32 tokenId;
        uint96 initialCost;
        uint32 period;
        uint8[3] revenueSplit;
        address originalOwner;
        address thirdParty;
        uint32 whitelistId;
        address[] revenueTokens;
        uint256 permissions; //0 = none, 1 = channelling allowed for borrower
    }

    function _addGotchiLending(LibAddGotchiLending memory _listing) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();
        uint32 oldListingId = s.aavegotchiToListingId[_listing.tokenId];
        if (oldListingId != 0) {
            cancelGotchiLending(oldListingId, _listing.lender);
        }
        verifyAddGotchiLendingParams(
            _listing.tokenId,
            _listing.period,
            _listing.revenueSplit,
            _listing.originalOwner,
            _listing.thirdParty,
            _listing.whitelistId,
            _listing.revenueTokens
        );
        uint32 listingId = ++s.nextGotchiListingId; //assigned value after incrementing

        s.aavegotchiToListingId[_listing.tokenId] = listingId;
        s.gotchiLendings[listingId] = GotchiLending({
            listingId: listingId,
            initialCost: _listing.initialCost,
            period: _listing.period,
            revenueSplit: _listing.revenueSplit,
            lender: _listing.lender,
            borrower: address(0),
            originalOwner: _listing.originalOwner,
            thirdParty: _listing.thirdParty,
            erc721TokenId: _listing.tokenId,
            whitelistId: _listing.whitelistId,
            revenueTokens: _listing.revenueTokens,
            timeCreated: uint40(block.timestamp),
            timeAgreed: 0,
            lastClaimed: 0,
            canceled: false,
            completed: false,
            permissions: _listing.permissions
        });

        addLendingListItem(_listing.lender, listingId, "listed");
        s.aavegotchis[_listing.tokenId].locked = true;

        emit GotchiLendingAdd(listingId);
        emit GotchiLendingAdded(
            LibEventStructContainers.GotchiLendingAdd(
                listingId,
                _listing.lender,
                _listing.tokenId,
                _listing.initialCost,
                _listing.period,
                _listing.revenueSplit,
                _listing.originalOwner,
                _listing.thirdParty,
                _listing.whitelistId,
                _listing.revenueTokens,
                block.timestamp,
                _listing.permissions
            )
        );
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

        verifyAgreeGotchiLendingParams(_borrower, _listingId, _erc721TokenId, _initialCost, _period, _revenueSplit);
        // gas savings
        address lender = lending.lender;

        if (lending.initialCost > 0) {
            LibERC20.transferFrom(s.ghstContract, _borrower, lender, _initialCost);
        }
        lending.borrower = _borrower;
        uint40 currentTime = uint40(block.timestamp);
        lending.timeAgreed = currentTime;

        removeLendingListItem(lender, _listingId, "listed");
        addLendingListItem(lender, _listingId, "agreed");

        s.lentTokenIdIndexes[lender][_erc721TokenId] = uint32(s.lentTokenIds[lender].length);
        s.lentTokenIds[lender].push(_erc721TokenId);

        LibAavegotchi.transfer(lender, _borrower, _erc721TokenId);

        // set lender as pet operator
        s.petOperators[_borrower][lender] = true;

        EnumerableSet.UintSet storage whitelistBorrowerGotchiSet = s.whitelistGotchiBorrows[lending.whitelistId][_borrower];
        uint256 borrowLimit = lending.whitelistId == 0
            ? IRealmDiamond(s.realmAddress).balanceOf(_borrower) + 1
            : LibWhitelist.borrowLimit(lending.whitelistId);

        // Check if the whitelist allows multiple borrows
        // If not, register the gotchi id to the whitelist to prevent more borrows
        // We do not need to check for whitelistId = 0 since this whitelistId's borrow limit will always be 0, thus passing this check
        // There is a possibility of setting this borrow limit in an init function in the future for whitelist id 0 if desired
        require(
            borrowLimit == 0 || borrowLimit > whitelistBorrowerGotchiSet.length(),
            "LibGotchiLending: Borrower is over borrow limit for the limit set by whitelist owner"
        );
        whitelistBorrowerGotchiSet.add(_erc721TokenId);

        emit GotchiLendingExecute(_listingId);
        emit GotchiLendingExecuted(
            LibEventStructContainers.GotchiLendingExecution(
                _listingId,
                lending.lender,
                _borrower,
                _erc721TokenId,
                lending.initialCost,
                lending.period,
                lending.revenueSplit,
                lending.originalOwner,
                lending.thirdParty,
                lending.whitelistId,
                lending.revenueTokens,
                currentTime,
                lending.permissions
            )
        );
    }

    function cancelGotchiLending(uint32 _listingId, address _lender) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();

        GotchiLending storage lending = s.gotchiLendings[_listingId];
        if (lending.canceled) {
            return;
        }
        require(lending.timeAgreed == 0, "LibGotchiLending: Listing already agreed");
        lending.canceled = true;

        removeLendingListItem(_lender, _listingId, "listed");

        //Unlock Aavegotchis when lending is created
        s.aavegotchis[lending.erc721TokenId].locked = false;
        s.aavegotchiToListingId[lending.erc721TokenId] = 0;

        emit GotchiLendingCancel(_listingId, block.timestamp);
        emit GotchiLendingCancelled(
            LibEventStructContainers.GotchiLendingCancellation(
                _listingId,
                lending.lender,
                lending.erc721TokenId,
                lending.initialCost,
                lending.period,
                lending.revenueSplit,
                lending.originalOwner,
                lending.thirdParty,
                lending.whitelistId,
                lending.revenueTokens,
                block.timestamp,
                lending.permissions
            )
        );
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
        for (uint256 i; i < lending.revenueTokens.length; ) {
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
                if (ownerAmount > 0) {
                    LibERC20.transferFrom(revenueToken, escrow, owner, ownerAmount);
                }
                if (borrowerAmount > 0) {
                    LibERC20.transferFrom(revenueToken, escrow, lending.borrower, borrowerAmount);
                }
                if (lending.thirdParty != address(0)) {
                    uint256 thirdPartyAmount = (balance * lending.revenueSplit[2]) / 100;
                    LibERC20.transferFrom(revenueToken, escrow, lending.thirdParty, thirdPartyAmount);
                }
            }
            unchecked {
                ++i;
            }
        }

        lending.lastClaimed = uint40(block.timestamp);

        emit GotchiLendingClaim(listingId, lending.revenueTokens, amounts);
        emit GotchiLendingClaimed(
            LibEventStructContainers.GotchiLendingClaim(
                listingId,
                lending.lender,
                lending.borrower,
                lending.erc721TokenId,
                lending.initialCost,
                lending.period,
                lending.revenueSplit,
                lending.originalOwner,
                lending.thirdParty,
                lending.whitelistId,
                lending.revenueTokens,
                amounts,
                block.timestamp,
                lending.permissions
            )
        );
    }

    /// @dev Checks should be done before calling this function
    function endGotchiLending(GotchiLending storage lending) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();

        // gas savings
        uint32 tokenId = lending.erc721TokenId;
        address lender = lending.lender;
        uint32 listingId = s.aavegotchiToListingId[tokenId];

        // STATE CHANGES
        s.aavegotchis[tokenId].locked = false;
        LibAavegotchi.transfer(lending.borrower, lender, tokenId);
        lending.completed = true;
        s.aavegotchiToListingId[tokenId] = 0;

        removeLentAavegotchi(tokenId, lender);
        removeLendingListItem(lender, lending.listingId, "agreed");
        // scope to avoid stack too deep
        {
            EnumerableSet.UintSet storage whitelistBorrowerGotchiSet = s.whitelistGotchiBorrows[lending.whitelistId][lending.borrower];
            // Remove token id from borrower's list of borrowed gotchis. Does not revert if it the element does not exist
            whitelistBorrowerGotchiSet.remove(lending.erc721TokenId);
        }
        emit GotchiLendingEnd(listingId);
        emit GotchiLendingEnded(
            LibEventStructContainers.GotchiLendingEnd(
                listingId,
                lending.lender,
                lending.borrower,
                lending.erc721TokenId,
                lending.initialCost,
                lending.period,
                lending.revenueSplit,
                lending.originalOwner,
                lending.thirdParty,
                lending.whitelistId,
                lending.revenueTokens,
                block.timestamp,
                lending.permissions
            )
        );
    }

    function verifyAddGotchiLendingParams(
        uint32 _erc721TokenId,
        uint32 _period,
        uint8[3] memory _revenueSplit,
        address _originalOwner,
        address _thirdParty,
        uint32 _whitelistId,
        address[] memory _revenueTokens
    ) internal view {
        AppStorage storage s = LibAppStorage.diamondStorage();
        require(_originalOwner != address(0), "LibGotchiLending: Original owner cannot be zero address");
        require(checkPeriod(_period), "LibGotchiLending: Period is not valid");
        require(checkRevenueParams(_revenueSplit, _revenueTokens, _thirdParty), "LibGotchiLending: Revenue parameters are not valid");
        require(whitelistExists(_whitelistId) || (_whitelistId == 0), "LibGotchiLending: Whitelist not found");
        require(s.aavegotchis[_erc721TokenId].status == LibAavegotchi.STATUS_AAVEGOTCHI, "LibGotchiLending: Can only lend Aavegotchi");
        require(!s.aavegotchis[_erc721TokenId].locked, "LibGotchiLending: Only callable on unlocked Aavegotchis");
    }

    function verifyAgreeGotchiLendingParams(
        address _borrower,
        uint32 _listingId,
        uint32 _erc721TokenId,
        uint96 _initialCost,
        uint32 _period,
        uint8[3] calldata _revenueSplit
    ) internal view {
        AppStorage storage s = LibAppStorage.diamondStorage();
        GotchiLending storage lending = s.gotchiLendings[_listingId];
        require(lending.timeCreated != 0, "LibGotchiLending: Listing not found");
        require(lending.timeAgreed == 0, "LibGotchiLending: Listing already agreed");
        require(lending.canceled == false, "LibGotchiLending: Listing canceled");
        require(lending.erc721TokenId == _erc721TokenId, "LibGotchiLending: Invalid token id");
        require(lending.initialCost == _initialCost, "LibGotchiLending: Invalid initial cost");
        require(lending.period == _period, "LibGotchiLending: Invalid lending period");
        for (uint256 i; i < 3; ) {
            require(lending.revenueSplit[i] == _revenueSplit[i], "LibGotchiLending: Invalid revenue split");
            unchecked {
                ++i;
            }
        }
        require(lending.lender != _borrower, "LibGotchiLending: Borrower can't be lender");
        if (lending.whitelistId > 0) {
            require(s.isWhitelisted[lending.whitelistId][_borrower] > 0, "LibGotchiLending: Not whitelisted address");
        }
        // Removed balance check for GHST since this will revert anyway if transferFrom is called
        //require(IERC20(s.ghstContract).balanceOf(_borrower) >= lending.initialCost, "GotchiLending: Not enough GHST");
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
            require(_lending.lender == _sender, "LibGotchiLending: Aavegotchi is in lending");
            if (_lending.timeAgreed > 0) {
                // revert if agreed lending
                revert("LibGotchiLending: Aavegotchi is in lending");
            } else {
                // cancel if not agreed lending
                cancelGotchiLending(_listingId, _sender);
            }
        }
    }

    function isAavegotchiListed(uint32 _tokenId) internal view returns (bool) {
        AppStorage storage s = LibAppStorage.diamondStorage();
        uint32 listingId = s.aavegotchiToListingId[_tokenId];
        GotchiLending memory lending = s.gotchiLendings[listingId];
        return listingId > 0 && lending.timeCreated > 0;
    }

    function isAavegotchiLent(uint32 _tokenId) internal view returns (bool) {
        AppStorage storage s = LibAppStorage.diamondStorage();
        if (!isAavegotchiListed(_tokenId)) return false;
        uint32 listingId = s.aavegotchiToListingId[_tokenId];
        GotchiLending storage listing_ = s.gotchiLendings[listingId];
        return (listing_.timeAgreed != 0 && !listing_.completed);
    }

    function checkPeriod(uint32 _period) internal pure returns (bool) {
        return _period > 0 && _period <= 2_592_000; //No reason to have a period longer than 30 days
    }

    function checkRevenueParams(uint8[3] memory _revenueSplit, address[] memory _revenueTokens, address _thirdParty) internal view returns (bool) {
        AppStorage storage s = LibAppStorage.diamondStorage();
        require(_revenueSplit[0] + _revenueSplit[1] + _revenueSplit[2] == 100, "LibGotchiLending: Sum of revenue splits not 100");
        for (uint256 i = 0; i < _revenueTokens.length; ) {
            require(s.revenueTokenAllowed[_revenueTokens[i]], "LibGotchiLending: Revenue token not allowed");
            unchecked {
                ++i;
            }
        }
        if (_thirdParty == address(0)) {
            require(_revenueSplit[2] == 0, "LibGotchiLending: Third party revenue split must be 0 without a third party");
        }
        require(_revenueTokens.length <= 10, "LibGotchiLending: Too many revenue tokens"); //Prevent claimAndEnd from reverting due to Out of Gas

        return true;
    }

    function addLendingListItem(address _lender, uint32 _listingId, bytes32 _status) internal {
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

    function removeLendingListItem(address _lender, uint32 _listingId, bytes32 _status) internal {
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
