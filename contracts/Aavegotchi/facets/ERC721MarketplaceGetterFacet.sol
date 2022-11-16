// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {LibAavegotchi, AavegotchiInfo} from "../libraries/LibAavegotchi.sol";
import {ERC721Listing} from "../libraries/LibERC721Marketplace.sol";
import {Modifiers, ListingListItem} from "../libraries/LibAppStorage.sol";

contract ERC721MarketplaceGetterFacet is Modifiers {

    ///@notice Get an aavegotchi listing details through an identifier
    ///@dev Will throw if the listing does not exist
    ///@param _listingId The identifier of the listing to query
    ///@return listing_ A struct containing certain details about the listing like timeCreated etc
    ///@return aavegotchiInfo_ A struct containing details about the aavegotchi
    function getAavegotchiListing(uint256 _listingId) external view returns (ERC721Listing memory listing_, AavegotchiInfo memory aavegotchiInfo_) {
        listing_ = s.erc721Listings[_listingId];
        require(listing_.timeCreated != 0, "ERC721Marketplace: ERC721 listing does not exist");
        aavegotchiInfo_ = LibAavegotchi.getAavegotchi(listing_.erc721TokenId);
    }

    ///@notice Get an ERC721 listing details through an identifier
    ///@dev Will throw if the listing does not exist
    ///@param _listingId The identifier of the ERC721 listing to query
    ///@return listing_ A struct containing certain details about the ERC721 listing like timeCreated etc

    function getERC721Listing(uint256 _listingId) external view returns (ERC721Listing memory listing_) {
        listing_ = s.erc721Listings[_listingId];
        require(listing_.timeCreated != 0, "ERC721Marketplace: ERC721 listing does not exist");
    }

    ///@notice Get an ERC721 listing details through an NFT
    ///@dev Will throw if the listing does not exist
    ///@param _erc721TokenAddress The address of the NFT associated with the listing
    ///@param _erc721TokenId The identifier of the NFT associated with the listing
    ///@param _owner The owner of the NFT associated with the listing
    ///@return listing_ A struct containing certain details about the ERC721 listing associated with an NFT of contract address `_erc721TokenAddress` and identifier `_erc721TokenId`
    function getERC721ListingFromToken(
        address _erc721TokenAddress,
        uint256 _erc721TokenId,
        address _owner
    ) external view returns (ERC721Listing memory listing_) {
        uint256 listingId = s.erc721TokenToListingId[_erc721TokenAddress][_erc721TokenId][_owner];
        require(listingId != 0, "ERC721Marketplace: listing doesn't exist");
        listing_ = s.erc721Listings[listingId];
    }

    ///@notice Query a certain amount of ERC721 listings created by an address based on their category and sortings
    ///@param _owner Creator of the listings to query
    ///@param _category Category of listings to query // 0 == portal, 1 == vrf pending, 1 == open portal, 2 == Aavegotchi.
    ///@param _sort Sortings of listings to query // "listed" or "purchased"
    ///@param _length How many ERC721 listings to return
    ///@return listings_ An array of structs, each struct containing details about each listing being returned
    function getOwnerERC721Listings(
        address _owner,
        uint256 _category,
        string memory _sort,
        uint256 _length // how many items to get back or the rest available
    ) external view returns (ERC721Listing[] memory listings_) {
        uint256 listingId = s.erc721OwnerListingHead[_owner][_category][_sort];
        listings_ = new ERC721Listing[](_length);
        uint256 listIndex;
        for (; listingId != 0 && listIndex < _length; listIndex++) {
            listings_[listIndex] = s.erc721Listings[listingId];
            listingId = s.erc721OwnerListingListItem[listingId].childListingId;
        }
        assembly {
            mstore(listings_, listIndex)
        }
    }

    struct AavegotchiListing {
        ERC721Listing listing_;
        AavegotchiInfo aavegotchiInfo_;
    }

    ///@notice Query a certain amount of aavegotchi listings created by an address based on their category and sortings
    ///@param _owner Creator of the listings to query
    ///@param _category Category of listings to query  // 0 == portal, 1 == vrf pending, 1 == open portal, 2 == Aavegotchi.
    ///@param _sort Sortings of listings to query // "listed" or "purchased"
    ///@param _length How many aavegotchi listings to return
    ///@return listings_ An array of structs, each struct containing details about each listing being returned
    function getOwnerAavegotchiListings(
        address _owner,
        uint256 _category,
        string memory _sort,
        uint256 _length // how many items to get back or the rest available
    ) external view returns (AavegotchiListing[] memory listings_) {
        uint256 listingId = s.erc721OwnerListingHead[_owner][_category][_sort];
        listings_ = new AavegotchiListing[](_length);
        uint256 listIndex;
        for (; listingId != 0 && listIndex < _length; listIndex++) {
            ERC721Listing memory listing = s.erc721Listings[listingId];
            listings_[listIndex].listing_ = listing;
            listings_[listIndex].aavegotchiInfo_ = LibAavegotchi.getAavegotchi(listing.erc721TokenId);
            listingId = s.erc721OwnerListingListItem[listingId].childListingId;
        }
        assembly {
            mstore(listings_, listIndex)
        }
    }

    ///@notice Query a certain amount of ERC721 listings
    ///@param _category Category of listings to query // 0 == portal, 1 == vrf pending, 1 == open portal, 2 == Aavegotchi.
    ///@param _sort Sortings of listings to query  // "listed" or "purchased"
    ///@param _length How many listings to return
    ///@return listings_ An array of structs, each struct containing details about each listing being returned
    function getERC721Listings(
        uint256 _category, // 0 == portal, 1 == vrf pending, 1 == open portal, 2 == Aavegotchi.
        string memory _sort, // "listed" or "purchased"
        uint256 _length // how many items to get back or the rest available
    ) external view returns (ERC721Listing[] memory listings_) {
        uint256 listingId = s.erc721ListingHead[_category][_sort];
        listings_ = new ERC721Listing[](_length);
        uint256 listIndex;
        for (; listingId != 0 && listIndex < _length; listIndex++) {
            listings_[listIndex] = s.erc721Listings[listingId];
            listingId = s.erc721ListingListItem[listingId].childListingId;
        }
        assembly {
            mstore(listings_, listIndex)
        }
    }

    ///@notice Query a certain amount of aavegotchi listings
    ///@param _category Category of listings to query // 0 == portal, 1 == vrf pending, 1 == open portal, 2 == Aavegotchi.
    ///@param _sort Sortings of listings to query
    ///@param _length How many listings to return
    ///@return listings_ An array of structs, each struct containing details about each listing being returned
    function getAavegotchiListings(
        uint256 _category, // 0 == portal, 1 == vrf pending, 1 == open portal, 2 == Aavegotchi
        string memory _sort, // "listed" or "purchased"
        uint256 _length // how many items to get back or the rest available
    ) external view returns (AavegotchiListing[] memory listings_) {
        uint256 listingId = s.erc721ListingHead[_category][_sort];
        listings_ = new AavegotchiListing[](_length);
        uint256 listIndex;
        for (; listingId != 0 && listIndex < _length; listIndex++) {
            ERC721Listing memory listing = s.erc721Listings[listingId];
            listings_[listIndex].listing_ = listing;
            listings_[listIndex].aavegotchiInfo_ = LibAavegotchi.getAavegotchi(listing.erc721TokenId);
            listingId = s.erc721ListingListItem[listingId].childListingId;
        }
        assembly {
            mstore(listings_, listIndex)
        }
    }
}
