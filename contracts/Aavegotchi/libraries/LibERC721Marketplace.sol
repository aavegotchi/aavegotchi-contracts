// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {LibAppStorage, AppStorage, ListingListItem, ERC721Listing} from "./LibAppStorage.sol";
import {LibMeta} from "../../shared/libraries/LibMeta.sol";

import "../../shared/interfaces/IERC721.sol";

// import "hardhat/console.sol";

library LibERC721Marketplace {
    event ERC721ListingCancelled(uint256 indexed listingId, uint256 category, uint256 time);
    event ERC721ListingRemoved(uint256 indexed listingId, uint256 category, uint256 time);
    event ERC721ListingPriceUpdate(uint256 indexed listingId, uint256 priceInWei, uint256 time);

    function cancelERC721Listing(uint256 _listingId, address _owner) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();
        ListingListItem storage listingItem = s.erc721ListingListItem[_listingId];
        if (listingItem.listingId == 0) {
            return;
        }
        ERC721Listing storage listing = s.erc721Listings[_listingId];
        if (listing.cancelled == true || listing.timePurchased != 0) {
            return;
        }
        require(listing.seller == _owner, "Marketplace: owner not seller");
        listing.cancelled = true;

        //Unlock Aavegotchis when listing is created
        if (listing.erc721TokenAddress == address(this)) {
            s.aavegotchis[listing.erc721TokenId].locked = false;
        }

        emit ERC721ListingCancelled(_listingId, listing.category, block.number);
        removeERC721ListingItem(_listingId, _owner);
    }

    function cancelERC721Listing(address _erc721TokenAddress, uint256 _erc721TokenId, address _owner) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();
        uint256 listingId = s.erc721TokenToListingId[_erc721TokenAddress][_erc721TokenId][_owner];
        if (listingId == 0) {
            return;
        }
        cancelERC721Listing(listingId, _owner);
    }

    function addERC721ListingItem(address _owner, uint256 _category, string memory _sort, uint256 _listingId) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();
        uint256 headListingId = s.erc721OwnerListingHead[_owner][_category][_sort];
        if (headListingId != 0) {
            ListingListItem storage headListingItem = s.erc721OwnerListingListItem[headListingId];
            headListingItem.parentListingId = _listingId;
        }
        ListingListItem storage listingItem = s.erc721OwnerListingListItem[_listingId];
        listingItem.childListingId = headListingId;
        s.erc721OwnerListingHead[_owner][_category][_sort] = _listingId;
        listingItem.listingId = _listingId;

        headListingId = s.erc721ListingHead[_category][_sort];
        if (headListingId != 0) {
            ListingListItem storage headListingItem = s.erc721ListingListItem[headListingId];
            headListingItem.parentListingId = _listingId;
        }
        listingItem = s.erc721ListingListItem[_listingId];
        listingItem.childListingId = headListingId;
        s.erc721ListingHead[_category][_sort] = _listingId;
        listingItem.listingId = _listingId;
    }

    function removeERC721ListingItem(uint256 _listingId, address _owner) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();
        ListingListItem storage listingItem = s.erc721ListingListItem[_listingId];
        if (listingItem.listingId == 0) {
            return;
        }
        uint256 parentListingId = listingItem.parentListingId;
        if (parentListingId != 0) {
            ListingListItem storage parentListingItem = s.erc721ListingListItem[parentListingId];
            parentListingItem.childListingId = listingItem.childListingId;
        }
        uint256 childListingId = listingItem.childListingId;
        if (childListingId != 0) {
            ListingListItem storage childListingItem = s.erc721ListingListItem[childListingId];
            childListingItem.parentListingId = listingItem.parentListingId;
        }
        ERC721Listing storage listing = s.erc721Listings[_listingId];
        if (s.erc721ListingHead[listing.category]["listed"] == _listingId) {
            s.erc721ListingHead[listing.category]["listed"] = listingItem.childListingId;
        }
        listingItem.listingId = 0;
        listingItem.parentListingId = 0;
        listingItem.childListingId = 0;

        listingItem = s.erc721OwnerListingListItem[_listingId];

        parentListingId = listingItem.parentListingId;
        if (parentListingId != 0) {
            ListingListItem storage parentListingItem = s.erc721OwnerListingListItem[parentListingId];
            parentListingItem.childListingId = listingItem.childListingId;
        }
        childListingId = listingItem.childListingId;
        if (childListingId != 0) {
            ListingListItem storage childListingItem = s.erc721OwnerListingListItem[childListingId];
            childListingItem.parentListingId = listingItem.parentListingId;
        }
        listing = s.erc721Listings[_listingId];
        if (s.erc721OwnerListingHead[_owner][listing.category]["listed"] == _listingId) {
            s.erc721OwnerListingHead[_owner][listing.category]["listed"] = listingItem.childListingId;
        }
        listingItem.listingId = 0;
        listingItem.parentListingId = 0;
        listingItem.childListingId = 0;

        emit ERC721ListingRemoved(_listingId, listing.category, block.timestamp);
    }

    function updateERC721Listing(address _erc721TokenAddress, uint256 _erc721TokenId, address _owner) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();
        uint256 listingId = s.erc721TokenToListingId[_erc721TokenAddress][_erc721TokenId][_owner];
        if (listingId == 0) {
            return;
        }
        ERC721Listing storage listing = s.erc721Listings[listingId];
        if (listing.timePurchased != 0 || listing.cancelled == true) {
            return;
        }
        address owner = IERC721(listing.erc721TokenAddress).ownerOf(listing.erc721TokenId);
        if (owner != listing.seller) {
            LibERC721Marketplace.cancelERC721Listing(listingId, listing.seller);
        }
    }

    function updateERC721ListingPrice(uint256 _listingId, uint256 _priceInWei) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();
        ERC721Listing storage listing = s.erc721Listings[_listingId];
        require(listing.timeCreated != 0, "ERC721Marketplace: listing not found");
        require(listing.timePurchased == 0, "ERC721Marketplace: listing already sold");
        require(listing.cancelled == false, "ERC721Marketplace: listing already cancelled");
        require(listing.seller == LibMeta.msgSender(), "ERC721Marketplace: Not seller of ERC721 listing");

        //comment out until graph event is added
        // s.erc721Listings[_listingId].priceInWei = _priceInWei;

        emit ERC721ListingPriceUpdate(_listingId, _priceInWei, block.timestamp);
    }
}
