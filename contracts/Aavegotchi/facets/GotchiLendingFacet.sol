// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {LibAavegotchi, AavegotchiInfo} from "../libraries/LibAavegotchi.sol";
import {IERC721} from "../../shared/interfaces/IERC721.sol";
import {LibERC20} from "../../shared/libraries/LibERC20.sol";
import {IERC20} from "../../shared/interfaces/IERC20.sol";
import {LibMeta} from "../../shared/libraries/LibMeta.sol";
import {LibGotchiLending} from "../libraries/LibGotchiLending.sol";
import {Modifiers, GotchiLending} from "../libraries/LibAppStorage.sol";

contract GotchiLendingFacet is Modifiers {
    event GotchiLendingAdd(uint32 indexed listingId);
    event GotchiLendingExecute(uint32 indexed listingId);
    event GotchiLendingEnd(uint32 indexed listingId);

    function allowRevenueTokens(address[] calldata tokens) external onlyOwner {
        for (uint256 i = 0; i < tokens.length; ) {
            s.revenueTokenAllowed[tokens[i]] = true;
            unchecked {
                ++i;
            }
        }
    }

    function disallowRevenueTokens(address[] calldata tokens) external onlyOwner {
        for (uint256 i = 0; i < tokens.length; ) {
            s.revenueTokenAllowed[tokens[i]] = false;
            unchecked {
                ++i;
            }
        }
    }

    function revenueTokenAllowed(address token) external view returns (bool) {
        return s.revenueTokenAllowed[token];
    }

    function emergencyChangeRevenueTokens(uint32[] calldata _listingIds, address[] calldata _revenueTokens) external onlyOwnerOrDaoOrGameManager {
        for (uint256 i = 0; i < _listingIds.length; ) {
            GotchiLending storage listing_ = s.gotchiLendings[_listingIds[i]];
            require(listing_.timeCreated != 0, "GotchiLending: Listing does not exist");
            listing_.revenueTokens = _revenueTokens;
            unchecked {
                ++i;
            }
        }
    }

    ///@notice Get an aavegotchi lending details through an identifier
    ///@dev Will throw if the lending does not exist
    ///@param _listingId The identifier of the lending to query
    ///@return listing_ A struct containing certain details about the lending like timeCreated etc
    ///@return aavegotchiInfo_ A struct containing details about the aavegotchi
    function getGotchiLendingListingInfo(uint32 _listingId)
        external
        view
        returns (GotchiLending memory listing_, AavegotchiInfo memory aavegotchiInfo_)
    {
        listing_ = s.gotchiLendings[_listingId];
        require(listing_.timeCreated != 0, "GotchiLending: Listing does not exist");
        aavegotchiInfo_ = LibAavegotchi.getAavegotchi(listing_.erc721TokenId);
    }

    ///@notice Get an ERC721 lending details through an identifier
    ///@dev Will throw if the lending does not exist
    ///@param _listingId The identifier of the lending to query
    ///@return listing_ A struct containing certain details about the ERC721 lending like timeCreated etc
    function getLendingListingInfo(uint32 _listingId) external view returns (GotchiLending memory listing_) {
        listing_ = s.gotchiLendings[_listingId];
        require(listing_.timeCreated != 0, "GotchiLending: Listing does not exist");
    }

    ///@notice Get an aavegotchi lending details through an NFT
    ///@dev Will throw if the lending does not exist
    ///@param _erc721TokenId The identifier of the NFT associated with the lending
    ///@return listing_ A struct containing certain details about the lending associated with an NFT of contract identifier `_erc721TokenId`
    function getGotchiLendingFromToken(uint32 _erc721TokenId) external view returns (GotchiLending memory listing_) {
        uint32 listingId = s.aavegotchiToListingId[_erc721TokenId];
        require(listingId != 0, "GotchiLending: Listing doesn't exist");
        listing_ = s.gotchiLendings[listingId];
    }

    function getGotchiLendingIdByToken(uint32 _erc721TokenId) external view returns (uint32) {
        return s.aavegotchiToListingId[_erc721TokenId];
    }

    ///@notice Query a certain amount of aavegotchi lending listings created by an address
    ///@param _lender Creator of the listings to query
    ///@param _status Status of the listings to query, "listed" or "agreed"
    ///@param _length How many aavegotchi listings to return
    ///@return listings_ An array of lending
    function getOwnerGotchiLendings(
        address _lender,
        bytes32 _status,
        uint256 _length
    ) external view returns (GotchiLending[] memory listings_) {
        uint32 listingId = s.aavegotchiLenderLendingHead[_lender][_status];
        listings_ = new GotchiLending[](_length);
        uint256 listIndex;
        for (; listingId != 0 && listIndex < _length; listIndex++) {
            listings_[listIndex] = s.gotchiLendings[listingId];
            listingId = s.aavegotchiLenderLendingListItem[_status][listingId].childListingId;
        }
        assembly {
            mstore(listings_, listIndex)
        }
    }

    ///@notice Query a certain amount of aavegotchi lending listings
    ///@param _status Status of the listings to query, "listed" or "agreed"
    ///@param _length How many listings to return
    ///@return listings_ An array of lending
    function getGotchiLendings(bytes32 _status, uint256 _length) external view returns (GotchiLending[] memory listings_) {
        uint32 listingId = s.gotchiLendingHead[_status];
        listings_ = new GotchiLending[](_length);
        uint256 listIndex;
        for (; listingId != 0 && listIndex < _length; listIndex++) {
            listings_[listIndex] = s.gotchiLendings[listingId];
            listingId = s.gotchiLendingListItem[_status][listingId].childListingId;
        }
        assembly {
            mstore(listings_, listIndex)
        }
    }

    function isAavegotchiLent(uint32 _erc721TokenId) external view returns (bool) {
        return LibGotchiLending.isAavegotchiLent(_erc721TokenId);
    }

    ///@notice Allow an aavegotchi lender to add request for lending
    ///@dev If the lending request exist, cancel it and replaces it with the new one
    ///@dev If the lending is active, unable to cancel
    ///@param _erc721TokenId The identifier of the NFT to lend
    ///@param _initialCost The lending fee of the aavegotchi in $GHST
    ///@param _period The lending period of the aavegotchi, unit: second
    ///@param _revenueSplit The revenue split of the lending, 3 values, sum of the should be 100
    ///@param _originalOwner The account for original owner, can be set to another address if the owner wishes to have profit split there.
    ///@param _thirdParty The 3rd account for receive revenue split, can be address(0)
    ///@param _whitelistId The identifier of whitelist for agree lending, if 0, allow everyone
    function addGotchiLending(
        uint32 _erc721TokenId,
        uint96 _initialCost,
        uint32 _period,
        uint8[3] calldata _revenueSplit,
        address _originalOwner,
        address _thirdParty,
        uint32 _whitelistId,
        address[] calldata _revenueTokens
    ) external onlyAavegotchiOwner(_erc721TokenId) {
        address sender = LibMeta.msgSender();
        require(_originalOwner != address(0), "GotchiLending: Original owner cannot be zero address");
        require(_period > 0, "GotchiLending: Period should be larger than 0");
        require(_period <= 2_592_000, "GotchiLending: Period too long"); //No reason to have a period longer than 30 days
        require(_revenueSplit[0] + _revenueSplit[1] + _revenueSplit[2] == 100, "GotchiLending: Sum of revenue split should be 100");
        if (_thirdParty == address(0)) {
            require(_revenueSplit[2] == 0, "GotchiLending: Revenue split for invalid thirdParty should be zero");
        }
        require((s.whitelists.length >= _whitelistId) || (_whitelistId == 0), "GotchiLending: Whitelist not found");

        require(s.aavegotchis[_erc721TokenId].status == LibAavegotchi.STATUS_AAVEGOTCHI, "GotchiLending: Can only lend Aavegotchi");

        require(_revenueTokens.length <= 10, "GotchiLending: Too many revenue tokens"); //Prevent claimAndEnd from reverting due to Out of Gas
        for (uint256 i = 0; i < _revenueTokens.length; ) {
            require(s.revenueTokenAllowed[_revenueTokens[i]], "GotchiLending: Invalid revenue token address");
            unchecked {
                ++i;
            }
        }

        uint32 oldListingId = s.aavegotchiToListingId[_erc721TokenId];
        if (oldListingId != 0) {
            //Cancel old listing
            LibGotchiLending.cancelGotchiLending(oldListingId, sender);
        } else {
            //Listings cannot be created if the Aavegotchi is listed in the Baazaar
            require(s.aavegotchis[_erc721TokenId].locked == false, "GotchiLending: Only callable on unlocked Aavegotchis");
        }

        //Listings will always start from 1
        s.nextGotchiListingId++;
        uint32 listingId = s.nextGotchiListingId;

        s.aavegotchiToListingId[_erc721TokenId] = listingId;
        s.gotchiLendings[listingId] = GotchiLending({
            listingId: listingId,
            initialCost: _initialCost,
            period: _period,
            revenueSplit: _revenueSplit,
            lender: sender,
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

        LibGotchiLending.addLendingListItem(sender, listingId, "listed");

        // Lock Aavegotchis when lending is created
        s.aavegotchis[_erc721TokenId].locked = true;

        emit GotchiLendingAdd(listingId);
    }

    ///@notice Allow an aavegotchi lender to cancel his NFT lending by providing the NFT contract address and identifier
    ///@param _erc721TokenId The identifier of the NFT to be delisted from lending
    function cancelGotchiLendingByToken(uint32 _erc721TokenId) external {
        LibGotchiLending.cancelGotchiLendingFromToken(_erc721TokenId, LibMeta.msgSender());
    }

    ///@notice Allow an aavegotchi lender to cancel his NFT lending through the listingId
    ///@param _listingId The identifier of the lending to be cancelled
    function cancelGotchiLending(uint32 _listingId) external {
        LibGotchiLending.cancelGotchiLending(_listingId, LibMeta.msgSender());
    }

    ///@notice Allow a borrower to agree an lending for the NFT
    ///@dev Will throw if the NFT has been lent or if the lending has been canceled already
    ///@param _listingId The identifier of the lending to agree
    function agreeGotchiLending(
        uint32 _listingId,
        uint32 _erc721TokenId,
        uint96 _initialCost,
        uint32 _period,
        uint8[3] calldata _revenueSplit
    ) external {
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
        address borrower = LibMeta.msgSender();
        address lender = lending.lender;
        require(lender != borrower, "GotchiLending: Borrower can't be lender");
        if (lending.whitelistId > 0) {
            require(s.isWhitelisted[lending.whitelistId][borrower] > 0, "GotchiLending: Not whitelisted address");
        }

        if (lending.initialCost > 0) {
            require(IERC20(s.ghstContract).balanceOf(borrower) >= lending.initialCost, "GotchiLending: Not enough GHST");
            LibERC20.transferFrom(s.ghstContract, borrower, lender, lending.initialCost);
        }

        lending.borrower = borrower;
        lending.timeAgreed = uint40(block.timestamp);

        LibGotchiLending.removeLendingListItem(lender, _listingId, "listed");
        LibGotchiLending.addLendingListItem(lender, _listingId, "agreed");

        uint32 tokenId = lending.erc721TokenId;
        s.lentTokenIdIndexes[lender][tokenId] = uint32(s.lentTokenIds[lender].length);
        s.lentTokenIds[lender].push(tokenId);

        LibAavegotchi.transfer(lender, borrower, tokenId);

        // set lender as pet operator
        s.petOperators[borrower][lender] = true;

        emit GotchiLendingExecute(_listingId);
    }

    ///@notice Allow to claim revenue from the lending
    ///@dev Will throw if the NFT has not been lent or if the lending has been canceled already
    ///@param _tokenId The identifier of the lent aavegotchi to claim

    function claimGotchiLending(uint32 _tokenId) external {
        uint32 listingId = s.aavegotchiToListingId[_tokenId];
        require(listingId != 0, "GotchiLending: Listing not found");
        GotchiLending storage lending = s.gotchiLendings[listingId];

        address sender = LibMeta.msgSender();
        require((lending.lender == sender) || (lending.borrower == sender), "GotchiLending: Only lender or borrower can claim");

        LibGotchiLending.claimGotchiLending(listingId);
    }

    ///@notice Allow a lender to claim revenue from the lending
    ///@dev Will throw if the NFT has not been lent or if the lending has been canceled already
    ///@param _tokenId The identifier of the lent aavegotchi to claim

    function claimAndEndGotchiLending(uint32 _tokenId) external {
        uint32 listingId = s.aavegotchiToListingId[_tokenId];
        require(listingId != 0, "GotchiLending: Listing not found");
        GotchiLending storage lending = s.gotchiLendings[listingId];

        address sender = LibMeta.msgSender();
        address lender = lending.lender;
        address borrower = lending.borrower;
        uint32 lendingPeriod = lending.period < 2_592_000 ? lending.period : 2_592_000;
        require((lender == sender) || (borrower == sender), "GotchiLending: Only lender or borrower can claim and end agreement");
        require(borrower == sender || lending.timeAgreed + lendingPeriod <= block.timestamp, "GotchiLending: Not allowed during agreement");

        LibGotchiLending.claimGotchiLending(listingId);

        // end lending agreement
        s.aavegotchis[_tokenId].locked = false;
        LibAavegotchi.transfer(borrower, lender, _tokenId);

        lending.completed = true;
        s.aavegotchiToListingId[_tokenId] = 0;

        LibGotchiLending.removeLentAavegotchi(_tokenId, lender);
        LibGotchiLending.removeLendingListItem(lender, listingId, "agreed");

        emit GotchiLendingEnd(listingId);
    }

    //To be added in a future update

    // struct AddGotchiLending {
    //     uint32[] _erc721TokenIds;
    //     uint96[] _initialCosts;
    //     uint32[] _periods;
    //     uint8[3][] _revenueSplits;
    //     address[] _originalOwners;
    //     address[] _thirdParties;
    //     uint32[] _whitelistIds;
    //     address[][] _revenueTokens;
    // }

    // function batchAddGotchiLending(AddGotchiLending calldata _add) external {
    //     require(
    //         _add._erc721TokenIds.length == _add._initialCosts.length &&
    //             _add._initialCosts.length == _add._periods.length &&
    //             _add._periods.length == _add._revenueSplits.length &&
    //             _add._revenueSplits.length == _add._originalOwners.length &&
    //             _add._originalOwners.length == _add._thirdParties.length &&
    //             _add._thirdParties.length == _add._whitelistIds.length &&
    //             _add._whitelistIds.length == _add._revenueTokens.length,
    //         "GotchiLending: Array lengths mismatch"
    //     );
    //     for (uint256 i = 0; i < _add._erc721TokenIds.length; i++) {
    //         addGotchiLending(
    //             _add._erc721TokenIds[i],
    //             _add._initialCosts[i],
    //             _add._periods[i],
    //             _add._revenueSplits[i],
    //             _add._originalOwners[i],
    //             _add._thirdParties[i],
    //             _add._whitelistIds[i],
    //             _add._revenueTokens[i]
    //         );
    //     }
    // }

    // function batchCancelGotchiLending(uint32[] calldata _listingIds) external {
    //     for (uint256 i = 0; i < _listingIds.length; i++) {
    //         LibGotchiLending.cancelGotchiLending(_listingIds[i], LibMeta.msgSender());
    //     }
    // }

    // function batchAgreeGotchiLending(
    //     uint32[] calldata _listingIds,
    //     uint32[] calldata _erc721TokenIds,
    //     uint96[] calldata _initialCosts,
    //     uint32[] calldata _periods,
    //     uint8[3][] calldata _revenueSplits
    // ) external {
    //     require(
    //         _listingIds.length == _erc721TokenIds.length &&
    //             _erc721TokenIds.length == _initialCosts.length &&
    //             _initialCosts.length == _periods.length &&
    //             _periods.length == _revenueSplits.length,
    //         "GotchiLending: Array length mismatch"
    //     );
    //     for (uint256 i = 0; i < _listingIds.length; i++) {
    //         agreeGotchiLending(_listingIds[i], _erc721TokenIds[i], _initialCosts[i], _periods[i], _revenueSplits[i]);
    //     }
    // }
}
