// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {LibAavegotchi} from "../libraries/LibAavegotchi.sol";
import {LibMeta} from "../../shared/libraries/LibMeta.sol";
import {LibGotchiLending} from "../libraries/LibGotchiLending.sol";
import {Modifiers, GotchiLending} from "../libraries/LibAppStorage.sol";

contract BatchGotchiLendingFacet is Modifiers {
    event GotchiLendingAdd(uint32 indexed listingId);

    struct LendingParams {
        uint32 _erc721TokenId;
        uint96 _initialCost;
        uint32 _period;
        uint8[3] _revenueSplit;
        address _originalOwner;
        address _thirdParty;
        uint32 whitelistId;
        address[] _revenueTokens;
    }

    function batchAddGotchiLending(LendingParams[] calldata _params) external {
        for(uint256 i = 0; i < _params.length; ) {
            addGotchiLendingInternal(
                _params[i]._erc721TokenId,
                _params[i]._initialCost,
                _params[i]._period,
                _params[i]._revenueSplit,
                _params[i]._originalOwner,
                _params[i]._thirdParty,
                _params[i].whitelistId,
                _params[i]._revenueTokens
            );
            unchecked {
                ++i;
            }
        }
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
    function addGotchiLendingInternal(
        uint32 _erc721TokenId,
        uint96 _initialCost,
        uint32 _period,
        uint8[3] calldata _revenueSplit,
        address _originalOwner,
        address _thirdParty,
        uint32 _whitelistId,
        address[] calldata _revenueTokens
    ) internal onlyAavegotchiOwner(_erc721TokenId) {
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
}