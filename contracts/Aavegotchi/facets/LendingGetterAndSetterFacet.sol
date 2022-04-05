// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {LibAavegotchi, AavegotchiInfo} from "../libraries/LibAavegotchi.sol";
import {LibGotchiLending} from "../libraries/LibGotchiLending.sol";
import {Modifiers, GotchiLending} from "../libraries/LibAppStorage.sol";

contract LendingGetterAndSetterFacet is Modifiers {
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

    /// @dev Should be removed after all old listings are fixed
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
        listing_ = LibGotchiLending.getListing(_listingId);
        aavegotchiInfo_ = LibAavegotchi.getAavegotchi(listing_.erc721TokenId);
    }

    ///@notice Get an ERC721 lending details through an identifier
    ///@dev Will throw if the lending does not exist
    ///@param _listingId The identifier of the lending to query
    ///@return listing_ A struct containing certain details about the ERC721 lending like timeCreated etc
    function getLendingListingInfo(uint32 _listingId) external view returns (GotchiLending memory listing_) {
        listing_ = LibGotchiLending.getListing(_listingId);
    }

    ///@notice Get an aavegotchi lending details through an NFT
    ///@dev Will throw if the lending does not exist
    ///@param _erc721TokenId The identifier of the NFT associated with the lending
    ///@return listing_ A struct containing certain details about the lending associated with an NFT of contract identifier `_erc721TokenId`
    function getGotchiLendingFromToken(uint32 _erc721TokenId) external view returns (GotchiLending memory listing_) {
        listing_ = LibGotchiLending.getListing(s.aavegotchiToListingId[_erc721TokenId]);
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
            listings_[listIndex] = LibGotchiLending.getListing(listingId);
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
            listings_[listIndex] = LibGotchiLending.getListing(listingId);
            listingId = s.gotchiLendingListItem[_status][listingId].childListingId;
        }
        assembly {
            mstore(listings_, listIndex)
        }
    }

    function isAavegotchiLent(uint32 _erc721TokenId) external view returns (bool) {
        return LibGotchiLending.isAavegotchiLent(_erc721TokenId);
    }
}
