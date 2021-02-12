// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import "./LibAppStorage.sol";

library LibERC721Marketplace {
    event ERC721ListingCancelled(bytes32 indexed listingId, uint256 category, uint256 time);
    event ERC721ListingRemoved(bytes32 indexed listingId, uint256 category, uint256 time);

    function toERC721ListingId(
        address _erc721TokenAddress,
        uint256 _erc721TokenId,
        address _user
    ) internal view returns (bytes32 listingId_) {
        listingId_ = keccak256(abi.encodePacked(_erc721TokenAddress, _erc721TokenId, _user, blockhash(block.number - 1)));
    }

    function cancelERC721Listing(bytes32 _listingId, address _owner) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();
        ListingListItem storage listingItem = s.erc721ListingListItem["listed"][_listingId];
        if (listingItem.listingId == 0) {
            return;
        }
        ERC721Listing storage listing = s.erc721Listings[_listingId];
        if (listing.cancelled == true || listing.sold == true) {
            return;
        }
        require(listing.seller == _owner, "Marketplace: owner not seller");
        listing.cancelled = true;
        s.aavegotchis[listing.erc721TokenId].locked = false;
        emit ERC721ListingCancelled(_listingId, listing.category, block.number);
        removeERC721ListingItem("listed", _listingId);
    }

    function removeERC721ListingItem(string memory _sort, bytes32 _listingId) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();
        ListingListItem storage listingItem = s.erc721ListingListItem[_sort][_listingId];
        if (listingItem.listingId == 0) {
            return;
        }
        bytes32 parentListingId = listingItem.parentListingId;
        if (parentListingId != 0) {
            ListingListItem storage parentListingItem = s.erc721ListingListItem[_sort][parentListingId];
            parentListingItem.childListingId = listingItem.childListingId;
        }
        bytes32 childListingId = listingItem.childListingId;
        if (childListingId != 0) {
            ListingListItem storage childListingItem = s.erc721ListingListItem[_sort][childListingId];
            childListingItem.parentListingId = listingItem.parentListingId;
        }
        ERC721Listing storage listing = s.erc721Listings[_listingId];
        if (s.erc721ListingHead[listing.category][_sort] == _listingId) {
            s.erc721ListingHead[listing.category][_sort] = listingItem.childListingId;
        }
        listingItem.listingId = 0;
        listingItem.parentListingId = 0;
        listingItem.childListingId = 0;
        emit ERC721ListingRemoved(_listingId, listing.category, block.timestamp);
    }
}
